-- =============================================================================
-- Val — assinatura e créditos (FASE 1, fundação).  PROPOSTA PARA REVISÃO.
--
-- NÃO APLICAR ainda: os valores (degustação, pacote mensal, provedor) dependem
-- das decisões em aberto. A ESTRUTURA é o que está em revisão aqui.
--
-- Alma (seção 3, presença não pontuação): nada de contador visível o tempo todo.
-- O saldo existe no banco, mas a UI só o consulta para um aviso sereno quando
-- estiver perto do fim. Ler e guardar (diário, acervo, cartas) é sempre livre;
-- só a CAMADA GENERATIVA debita créditos.
-- =============================================================================

-- --- Planos configuráveis: o pacote mensal vive numa linha, fácil de ajustar ---
create table if not exists planos (
  id             text primary key,            -- ex.: 'mensal'
  nome           text not null,
  preco_centavos int  not null,               -- 4800 = R$ 48,00
  creditos_mes   int  not null,               -- pacote mensal de créditos
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);
-- Valores A CONFIRMAR (tamanho do pacote definido nas decisões).
insert into planos (id, nome, preco_centavos, creditos_mes)
values ('mensal', 'Val', 4800, 300)
on conflict (id) do nothing;

-- --- Assinatura de cada mulher (uma linha por usuária) ---
create table if not exists assinaturas (
  user_id      uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  plano_id     text references planos (id),
  status       text not null default 'degustacao'
    check (status in ('degustacao', 'ativa', 'cancelada', 'inadimplente', 'encerrada')),
  provedor     text,                            -- 'asaas' | 'mercadopago' | 'stripe'
  provedor_ref text,                            -- id da assinatura/cliente no provedor
  periodo_fim  timestamptz,                     -- acesso garantido até aqui, mesmo cancelada
  cancelada_em timestamptz,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- --- Créditos: saldo materializado (rápido) + razão/ledger (auditável) ---
create table if not exists creditos (
  user_id      uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  saldo        int  not null default 0,
  atualizado_em timestamptz not null default now()
);

create table if not exists creditos_lancamentos (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade default auth.uid(),
  delta     int  not null,                      -- +concessão / -débito
  motivo    text not null,                      -- 'degustacao','pacote_mensal','uso:conversar',...
  ref       text,                               -- dia, id de pagamento, etc.
  criado_em timestamptz not null default now()
);
create index if not exists idx_lanc_user on creditos_lancamentos (user_id, criado_em desc);

-- --- Eventos de pagamento: log idempotente dos webhooks do provedor ---
create table if not exists eventos_pagamento (
  id         uuid primary key default gen_random_uuid(),
  provedor   text not null,
  evento_id  text not null,                     -- id do evento no provedor (idempotência)
  tipo       text,
  user_id    uuid references auth.users (id) on delete set null,
  payload    jsonb,
  processado boolean not null default false,
  criado_em  timestamptz not null default now(),
  unique (provedor, evento_id)
);

-- =============================================================================
-- RLS — a mulher LÊ o que é dela; toda ESCRITA é por função/serviço (nunca a
-- cliente concede crédito a si mesma).
-- =============================================================================
alter table planos               enable row level security;
alter table assinaturas          enable row level security;
alter table creditos             enable row level security;
alter table creditos_lancamentos enable row level security;
alter table eventos_pagamento    enable row level security;

create policy planos_leitura     on planos               for select using (true);
create policy assin_dona_select  on assinaturas          for select using (user_id = auth.uid());
create policy cred_dona_select   on creditos             for select using (user_id = auth.uid());
create policy lanc_dona_select   on creditos_lancamentos for select using (user_id = auth.uid());
create policy evt_dona_select    on eventos_pagamento    for select using (user_id = auth.uid());
-- Sem políticas de insert/update/delete para a dona: o service role (webhooks,
-- funções Edge) e as funções security definer abaixo cuidam das escritas.

-- =============================================================================
-- Débito atômico do PRÓPRIO saldo. Chamado pelas funções Edge de geração com o
-- JWT da mulher. Retorna o novo saldo, ou -1 se não houver créditos suficientes.
-- (Cache hit NÃO chama isto: só debita quando a Val realmente gera.)
-- =============================================================================
create or replace function debitar_creditos(custo int, motivo text, ref text default null)
returns int language plpgsql security definer set search_path = public as $$
declare novo int;
begin
  if custo <= 0 then
    return coalesce((select saldo from creditos where user_id = auth.uid()), 0);
  end if;
  update creditos set saldo = saldo - custo, atualizado_em = now()
   where user_id = auth.uid() and saldo >= custo
  returning saldo into novo;
  if novo is null then
    return -1;                                  -- sem créditos suficientes
  end if;
  insert into creditos_lancamentos (user_id, delta, motivo, ref)
  values (auth.uid(), -custo, motivo, ref);
  return novo;
end; $$;
revoke all on function debitar_creditos(int, text, text) from public, anon;
grant execute on function debitar_creditos(int, text, text) to authenticated;

-- Concessão de créditos (degustação inicial, pacote do pagamento confirmado).
-- Service role apenas (webhook), nunca a cliente.
create or replace function conceder_creditos(p_user uuid, qtd int, motivo text, ref text default null)
returns int language plpgsql security definer set search_path = public as $$
declare novo int;
begin
  insert into creditos (user_id, saldo) values (p_user, qtd)
  on conflict (user_id) do update set saldo = creditos.saldo + qtd, atualizado_em = now()
  returning saldo into novo;
  insert into creditos_lancamentos (user_id, delta, motivo, ref)
  values (p_user, qtd, motivo, ref);
  return novo;
end; $$;
revoke all on function conceder_creditos(uuid, int, text, text) from public, anon, authenticated;

-- =============================================================================
-- Degustação na chegada (modelo "por uso"): ao criar a usuária, abre a
-- assinatura em 'degustacao' e concede os créditos de boas-vindas.
-- VALOR A CONFIRMAR nas decisões (aqui, 30 ≈ uma boa semana de uso real).
-- =============================================================================
create or replace function ao_criar_conceder_degustacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into assinaturas (user_id, status) values (new.id, 'degustacao')
    on conflict (user_id) do nothing;
  insert into creditos (user_id, saldo) values (new.id, 30)
    on conflict (user_id) do nothing;
  insert into creditos_lancamentos (user_id, delta, motivo)
    values (new.id, 30, 'degustacao');
  return new;
end; $$;

drop trigger if exists ao_criar_degustacao on auth.users;
create trigger ao_criar_degustacao
  after insert on auth.users
  for each row execute function ao_criar_conceder_degustacao();

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
-- Consumo de uma geração. Chamado pelas funções Edge com o JWT da mulher, ANTES
-- de chamar o modelo (e só em cache miss). Decide pelo estado da assinatura:
--   * em degustação válida (por dias)        -> liberado, sem debitar  (retorna 999999)
--   * com plano vigente e saldo              -> debita, retorna o novo saldo (>= 0)
--   * com plano vigente mas sem saldo         -> -1  (créditos do mês acabaram)
--   * degustação expirada e sem plano         -> -2  (precisa de plano)
-- (Cache hit NÃO chama isto: só consome quando a Val realmente gera.)
-- =============================================================================
create or replace function consumir_geracao(custo int, motivo text, ref text default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  a record;
  novo int;
  em_degustacao boolean;
  acesso_pago boolean;
begin
  select status, periodo_fim into a from assinaturas where user_id = auth.uid();

  em_degustacao := a.status = 'degustacao' and a.periodo_fim is not null and a.periodo_fim > now();
  acesso_pago   := a.status = 'ativa' or (a.status = 'cancelada' and a.periodo_fim is not null and a.periodo_fim > now());

  -- Degustação por dias: livre enquanto dentro da janela, sem debitar.
  if em_degustacao then
    insert into creditos_lancamentos (user_id, delta, motivo, ref)
      values (auth.uid(), 0, 'degustacao:' || motivo, ref);
    return 999999;
  end if;

  -- Nem degustação válida, nem plano vigente: precisa de plano.
  if not acesso_pago then
    return -2;
  end if;

  -- Plano vigente: debita o custo de forma atômica.
  if custo <= 0 then
    return coalesce((select saldo from creditos where user_id = auth.uid()), 0);
  end if;
  update creditos set saldo = saldo - custo, atualizado_em = now()
   where user_id = auth.uid() and saldo >= custo
  returning saldo into novo;
  if novo is null then
    return -1;                                  -- créditos do mês acabaram
  end if;
  insert into creditos_lancamentos (user_id, delta, motivo, ref)
    values (auth.uid(), -custo, motivo, ref);
  return novo;
end; $$;
revoke all on function consumir_geracao(int, text, text) from public, anon;
grant execute on function consumir_geracao(int, text, text) to authenticated;

-- Concessão de créditos (pacote do pagamento confirmado). Service role apenas
-- (webhook), nunca a cliente.
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
-- Degustação na chegada (modelo POR DIAS): ao criar a usuária, abre a assinatura
-- em 'degustacao' com a janela de acesso pleno. Créditos só entram com o plano
-- pago. DEGUSTAÇÃO = 7 dias (ajustável: troque o interval; 7 ou 14 são os usuais).
-- =============================================================================
create or replace function ao_criar_conceder_degustacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into assinaturas (user_id, status, periodo_fim)
    values (new.id, 'degustacao', now() + interval '7 days')
    on conflict (user_id) do nothing;
  insert into creditos (user_id, saldo) values (new.id, 0)
    on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists ao_criar_degustacao on auth.users;
create trigger ao_criar_degustacao
  after insert on auth.users
  for each row execute function ao_criar_conceder_degustacao();

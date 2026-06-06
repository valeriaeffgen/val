-- =============================================================================
-- Val — schema inicial (Supabase / Postgres)
--
-- Traduz a estrutura de dados da seção 10 da Constituição para tabelas reais,
-- com user_id em tudo e RLS protegendo a história de cada mulher.
--
-- Princípios que o schema honra:
--   - Cada mulher só enxerga e mexe nos próprios dados (RLS por user_id).
--   - As Cartas (seção 8) são humanas: a mulher escreve; a Valéria (curadora)
--     lê e responde. A "caixa de entrada da Valéria" é realizada como o acesso
--     de curadora à própria tabela `cartas` — não há IA fingindo ser gente.
--   - A camada generativa (seção 7) guarda conteúdo em `conteudo_gerado`, que
--     sobe de rascunho → curadoria → oficial. O oficial vira acervo de todas.
--
-- Sobre `usuarias`: o cadastro canônico é `auth.users` (Supabase Auth). O
-- perfil editável de Meu Centro vive em `perfil`, uma linha por usuária.
-- =============================================================================

-- Necessário para gen_random_uuid()
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Curadoras (a Valéria, depois a equipe) — quem pode ler/responder Cartas e
-- lapidar o conteúdo gerado. Mantida fora de RLS de usuária comum.
-- -----------------------------------------------------------------------------
create table if not exists curadoras (
  user_id uuid primary key references auth.users (id) on delete cascade,
  criada_em timestamptz not null default now()
);

-- Helper: a sessão atual é de uma curadora?
create or replace function is_curadora()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from curadoras c where c.user_id = auth.uid());
$$;

-- -----------------------------------------------------------------------------
-- perfil (Meu Centro) — uma linha por usuária. Base do contexto pessoal que
-- alimenta a camada generativa (regra 3 da seção 7).
-- -----------------------------------------------------------------------------
create table if not exists perfil (
  user_id     uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  valores     text[] not null default '{}',
  conquistas  text[] not null default '{}',
  foco        text[] not null default '{}',
  elevadores  text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- diario — acervo de gratidão/perspectiva + rituais (cat inclui 'elogio' e
-- 'autoamor'). Seção 6 / seção 10.
-- -----------------------------------------------------------------------------
create table if not exists diario (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day        date not null default current_date,
  cat        text not null,
  text       text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- soltar — descompressão de pensamentos. A Val sabe, mas nunca cobra (princ. 5).
-- -----------------------------------------------------------------------------
create table if not exists soltar (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day        date not null default current_date,
  time       text,
  text       text not null,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- jornadas — Olhar pra dentro. Respostas guardadas + devolutiva ("seu espelho").
-- -----------------------------------------------------------------------------
create table if not exists jornadas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  jornada_id  text not null,
  titulo      text,
  day         date not null default current_date,
  respostas   jsonb not null default '[]'::jsonb,
  devolutiva  text,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- cartas — a parte humana (seção 8). A mulher escreve; a curadora responde.
-- status: enviada | respondida | arquivada.
-- -----------------------------------------------------------------------------
create table if not exists cartas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day          date not null default current_date,
  texto        text not null,
  status       text not null default 'enviada' check (status in ('enviada', 'respondida', 'arquivada')),
  resposta     text,
  respondida_em timestamptz,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- sessoes — base da Trajetória. Captura entrada→saída de cada visita.
-- -----------------------------------------------------------------------------
create table if not exists sessoes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  ts         bigint not null default (extract(epoch from now()) * 1000)::bigint,
  day        date not null default current_date,
  entrada    text not null,
  saida      text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- feedback — pergunta direta de feedback da Trajetória.
-- -----------------------------------------------------------------------------
create table if not exists feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day        date not null default current_date,
  valor      text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- palavras — banco do Autoamor. Escreve no dia bom, colhe no dia difícil.
-- -----------------------------------------------------------------------------
create table if not exists palavras (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day        date not null default current_date,
  text       text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- conteudo_gerado — a camada generativa (seção 7). util_count é o voto-por-uso;
-- status sobe rascunho → curadoria → oficial. O oficial é acervo de todas.
-- -----------------------------------------------------------------------------
create table if not exists conteudo_gerado (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  tipo       text not null,                 -- ex.: 'como-lidar', 'jornada', 'palavra'
  contexto   jsonb not null default '{}'::jsonb,
  texto      text not null,
  util_count integer not null default 0,
  status     text not null default 'rascunho' check (status in ('rascunho', 'curadoria', 'oficial')),
  created_at timestamptz not null default now()
);

-- Índices para as consultas mais comuns (linha do tempo por usuária).
create index if not exists idx_diario_user_dia      on diario      (user_id, day desc);
create index if not exists idx_soltar_user_dia       on soltar      (user_id, created_at desc);
create index if not exists idx_jornadas_user_dia     on jornadas    (user_id, created_at desc);
create index if not exists idx_cartas_user_dia        on cartas      (user_id, created_at desc);
create index if not exists idx_sessoes_user_dia       on sessoes     (user_id, ts);
create index if not exists idx_feedback_user_dia      on feedback    (user_id, day desc);
create index if not exists idx_palavras_user_dia      on palavras    (user_id, created_at desc);
create index if not exists idx_conteudo_status        on conteudo_gerado (status, util_count desc);

-- =============================================================================
-- RLS — cada mulher só acessa a própria história.
-- =============================================================================
alter table perfil          enable row level security;
alter table diario          enable row level security;
alter table soltar          enable row level security;
alter table jornadas        enable row level security;
alter table cartas          enable row level security;
alter table sessoes         enable row level security;
alter table feedback        enable row level security;
alter table palavras        enable row level security;
alter table conteudo_gerado enable row level security;
alter table curadoras       enable row level security;

-- Política dona-dos-próprios-dados, aplicada às tabelas pessoais simples.
do $$
declare
  t text;
begin
  foreach t in array array['perfil','diario','soltar','jornadas','sessoes','feedback','palavras']
  loop
    execute format('create policy %I_dona_select on %I for select using (user_id = auth.uid());', t, t);
    execute format('create policy %I_dona_insert on %I for insert with check (user_id = auth.uid());', t, t);
    execute format('create policy %I_dona_update on %I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t, t);
    execute format('create policy %I_dona_delete on %I for delete using (user_id = auth.uid());', t, t);
  end loop;
end $$;

-- Cartas: a dona escreve e lê as suas; a curadora lê todas e responde.
create policy cartas_dona_select  on cartas for select using (user_id = auth.uid() or is_curadora());
create policy cartas_dona_insert  on cartas for insert with check (user_id = auth.uid());
create policy cartas_dona_update  on cartas for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cartas_curadora_update on cartas for update using (is_curadora()) with check (is_curadora());

-- Conteúdo gerado: a dona mexe no seu; qualquer usuária lê o que é 'oficial'
-- (acervo de todas); a curadora lê tudo e lapida (curadoria/oficial).
create policy conteudo_dona_select    on conteudo_gerado for select using (user_id = auth.uid());
create policy conteudo_oficial_select on conteudo_gerado for select using (status = 'oficial');
create policy conteudo_curadora_select on conteudo_gerado for select using (is_curadora());
create policy conteudo_dona_insert    on conteudo_gerado for insert with check (user_id = auth.uid());
create policy conteudo_dona_update    on conteudo_gerado for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy conteudo_curadora_update on conteudo_gerado for update using (is_curadora()) with check (is_curadora());

-- Curadoras: só curadoras enxergam a lista (e ninguém se autopromove via API).
create policy curadoras_select on curadoras for select using (is_curadora());

-- -----------------------------------------------------------------------------
-- perfil é criado sob demanda no primeiro acesso (o cliente faz upsert).
-- Opcional: criar a linha de perfil automaticamente a cada nova usuária.
-- -----------------------------------------------------------------------------
create or replace function criar_perfil_para_nova_usuaria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into perfil (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuaria on auth.users;
create trigger ao_criar_usuaria
  after insert on auth.users
  for each row execute function criar_perfil_para_nova_usuaria();

-- =============================================================================
-- Val — Percursos das Jornadas da Prosperidade (a vida da mulher na jornada).
--
-- Um PERCURSO é uma RODADA de uma jornada por uma mulher. Cada rodada é um
-- registro SEPARADO (a do merecer de janeiro ≠ a de junho): repetir não
-- sobrescreve, pra ela comparar e ver como mudou. O percurso guarda um retrato
-- (snapshot) do nº de dias e do ritmo no início, pra uma edição no admin não
-- mexer numa rodada já em andamento.
--
-- Cada DIA vivido guarda a abertura gerada pela Val (com memória dos dias
-- anteriores) e a resposta dela. É isso que faz 21 perguntas virarem UMA
-- jornada: cada dia é gerado sabendo o que veio antes.
--
-- Sem cobrança: jornada parada só espera. Não há "você atrasou", não há streak.
-- Aplicar pelo painel: SQL Editor → cole → Run.
-- =============================================================================

create table if not exists prosperidade_percursos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade default auth.uid(),
  jornada_id      uuid not null references prosperidade_jornadas (id) on delete cascade,
  jornada_titulo  text not null,             -- retrato do título no início da rodada
  jornada_dias    int  not null,             -- retrato do nº de dias
  intervalo_horas int  not null default 24,  -- retrato do ritmo
  dia_atual       int  not null default 0,   -- quantos dias já foram gerados/vividos
  ultimo_dia_em   timestamptz,               -- quando o último dia foi liberado (base do ritmo)
  fechamento      text,                       -- a devolutiva final (a transformação)
  concluido_em    timestamptz,               -- preenchido no fechamento
  iniciado_em     timestamptz not null default now()
);
create index if not exists idx_percursos_user on prosperidade_percursos (user_id, iniciado_em desc);

create table if not exists prosperidade_percurso_dias (
  id            uuid primary key default gen_random_uuid(),
  percurso_id   uuid not null references prosperidade_percursos (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  dia           int  not null,
  prompt        text not null,    -- a intenção do dia (retrato do arco no momento)
  abertura      text,             -- o texto gerado pela Val pra abrir o dia (com memória)
  resposta      text,             -- o que ela escreveu
  gerado_em     timestamptz not null default now(),
  respondido_em timestamptz,
  unique (percurso_id, dia)
);
create index if not exists idx_percurso_dias on prosperidade_percurso_dias (percurso_id, dia);

alter table prosperidade_percursos     enable row level security;
alter table prosperidade_percurso_dias enable row level security;

create policy percursos_dona_select on prosperidade_percursos for select using (user_id = auth.uid());
create policy percursos_dona_insert on prosperidade_percursos for insert with check (user_id = auth.uid());
create policy percursos_dona_update on prosperidade_percursos for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy percursos_dona_delete on prosperidade_percursos for delete using (user_id = auth.uid());

create policy percurso_dias_dona_select on prosperidade_percurso_dias for select using (user_id = auth.uid());
create policy percurso_dias_dona_insert on prosperidade_percurso_dias for insert with check (user_id = auth.uid());
create policy percurso_dias_dona_update on prosperidade_percurso_dias for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy percurso_dias_dona_delete on prosperidade_percurso_dias for delete using (user_id = auth.uid());

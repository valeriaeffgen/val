-- =============================================================================
-- Val — Jornadas: garante todas as colunas (conserto e blindagem).
--
-- O dia de uma jornada não gravava quando a coluna `tarefa` faltava em
-- prosperidade_percurso_dias (a 0012 adiciona, e pular a 0012 deixava a tabela
-- sem ela). Esta migration garante TODAS as colunas usadas, nas três tabelas,
-- de forma idempotente. Pode rodar a qualquer momento, depois de 0010 e 0011.
-- SQL Editor → cole → Run.
-- =============================================================================

-- Arcos (definição editável)
alter table prosperidade_jornada_arcos add column if not exists tarefa   text;
alter table prosperidade_jornada_arcos add column if not exists reflexao text;

-- Dias vividos (o que gravava vazio)
alter table prosperidade_percurso_dias add column if not exists tarefa               text;
alter table prosperidade_percurso_dias add column if not exists tarefa_andamento     text;
alter table prosperidade_percurso_dias add column if not exists tarefa_andamento_em  timestamptz;

-- Percurso (gesto de despedida do fechamento)
alter table prosperidade_percursos add column if not exists fechamento_tarefa text;

-- =============================================================================
-- Val — Jornadas: a tarefa de despedida do fechamento.
--
-- No último dia, além da devolutiva (a transformação), a Val deixa um gesto de
-- despedida pra ela levar da jornada (ex.: "escolha uma frase que você quer
-- levar e guarde onde você veja"). Guardamos esse gesto aqui, no percurso.
--
-- Aplicar DEPOIS de 0011. SQL Editor → cole → Run.
-- =============================================================================

alter table prosperidade_percursos add column if not exists fechamento_tarefa text;

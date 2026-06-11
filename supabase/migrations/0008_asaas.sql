-- FASE 3 (Asaas) — o webhook roda com a service role e precisa poder conceder
-- créditos. A 0007 revogou conceder_creditos de todos; aqui liberamos só para a
-- service role (jamais para a cliente).
--
-- Aplicar pelo painel: SQL Editor → cole → Run.

grant execute on function conceder_creditos(uuid, int, text, text) to service_role;

-- =============================================================================
-- Val — geração sob demanda no Como lidar (camada generativa, etapa 1).
--
-- Habilita busca por SIMILARIDADE SEMÂNTICA para o cache (regra 2): cada
-- ferramenta gerada guarda um embedding (vetor) da situação. Quando outra
-- mulher busca uma situação parecida, reaproveitamos em vez de gerar de novo.
--
-- O embedding é gerado no Edge (modelo gte-small, 384 dimensões, embutido no
-- runtime do Supabase, sem chave externa). A proximidade é por cosseno.
-- =============================================================================

create extension if not exists vector;

-- O vetor da situação que originou a ferramenta (só preenchido em tipo='ferramenta').
alter table conteudo_gerado add column if not exists embedding vector(384);

-- Busca a ferramenta gerada mais parecida com a consulta, acima de um limiar de
-- similaridade (0 a 1; 1 = idêntica). Chamada pelo Edge com a service role.
create or replace function ferramenta_parecida(consulta vector(384), limiar float default 0.86)
returns table (id uuid, texto text, similaridade float)
language sql
stable
as $$
  select cg.id, cg.texto, 1 - (cg.embedding <=> consulta) as similaridade
  from conteudo_gerado cg
  where cg.tipo = 'ferramenta'
    and cg.embedding is not null
    and 1 - (cg.embedding <=> consulta) >= limiar
  order by cg.embedding <=> consulta
  limit 1;
$$;

-- A busca roda só do lado do servidor (Edge, service role). Não exponha a anon.
revoke all on function ferramenta_parecida(vector, float) from public, anon, authenticated;

-- Índice de vizinhança aproximada para escalar (opcional para volumes pequenos).
-- Se a sua versão do pgvector não tiver hnsw, ignore este erro: a busca funciona
-- sem o índice (varredura simples) enquanto o acervo é pequeno.
create index if not exists idx_conteudo_embedding
  on conteudo_gerado using hnsw (embedding vector_cosine_ops);

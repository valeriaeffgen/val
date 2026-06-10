-- =============================================================================
-- Val — fila de curadoria (camada generativa, seção 7).
--
-- As mulheres marcam "isso me ajudou" no conteúdo gerado. Ao passar de um
-- limiar de votos, o conteúdo sobe de 'rascunho' para 'curadoria'. A Valéria
-- aprova ('oficial'), ajusta o texto, ou descarta ('descartado'). O oficial
-- vira acervo reutilizável; o descartado some do cache.
-- =============================================================================

-- Novo status 'descartado'.
alter table conteudo_gerado drop constraint if exists conteudo_gerado_status_check;
alter table conteudo_gerado add constraint conteudo_gerado_status_check
  check (status in ('rascunho', 'curadoria', 'oficial', 'descartado'));

-- Votos de utilidade: um por mulher por conteúdo (evita contar duas vezes).
create table if not exists conteudo_util (
  conteudo_id uuid not null references conteudo_gerado (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  criado_em   timestamptz not null default now(),
  primary key (conteudo_id, user_id)
);
alter table conteudo_util enable row level security;
-- Sem políticas diretas: a tabela só é tocada pela função abaixo (security definer).

-- Marca um conteúdo como útil. Conta votos distintos e promove a 'curadoria'
-- ao cruzar o limiar. Roda como definer para poder votar em conteúdo de outra
-- mulher (o acervo é compartilhado), sem abrir a tabela à API.
create or replace function marcar_util(conteudo uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
  limiar constant integer := 1; -- TEMPORÁRIO para testes (produção: 3) votos para subir à fila
begin
  insert into conteudo_util (conteudo_id, user_id)
  values (conteudo, auth.uid())
  on conflict do nothing;

  select count(*) into total from conteudo_util where conteudo_id = conteudo;

  update conteudo_gerado
    set util_count = total,
        status = case when total >= limiar and status = 'rascunho' then 'curadoria' else status end
  where id = conteudo;

  return total;
end;
$$;

revoke all on function marcar_util(uuid) from public;
grant execute on function marcar_util(uuid) to authenticated, anon;

-- O cache de ferramentas reaproveita qualquer status, menos o descartado.
create or replace function ferramenta_parecida(consulta vector(384), limiar float default 0.86)
returns table (id uuid, texto text, similaridade float)
language sql
stable
as $$
  select cg.id, cg.texto, 1 - (cg.embedding <=> consulta) as similaridade
  from conteudo_gerado cg
  where cg.tipo = 'ferramenta'
    and cg.embedding is not null
    and cg.status <> 'descartado'
    and 1 - (cg.embedding <=> consulta) >= limiar
  order by cg.embedding <=> consulta
  limit 1;
$$;
revoke all on function ferramenta_parecida(vector, float) from public, anon, authenticated;

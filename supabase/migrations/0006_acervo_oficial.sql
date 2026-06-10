-- =============================================================================
-- Val — acervo oficial anônimo (seção 7 + privacidade/LGPD).
--
-- Antes: o conteúdo "oficial" era a própria linha da autora em conteudo_gerado,
-- lida por todas. Problema: se a autora apaga a conta, a cascata levava junto o
-- material curado que já era de todas.
--
-- Agora: ao promover na curadoria, criamos uma CÓPIA ANÔNIMA em acervo_oficial,
-- sem user_id, sem nome, sem rastro pessoal. É essa cópia que serve o acervo de
-- todas. A exclusão da autora leva tudo dela; o acervo coletivo curado sobrevive.
--
-- Aplicar pelo painel: SQL Editor → cole este arquivo → Run.
-- (Depende de 0002, que habilita o pgvector e a coluna embedding.)
-- =============================================================================

create table if not exists acervo_oficial (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null,
  texto        text not null,
  embedding    vector(384),                         -- pra o cache de ferramentas usar a cópia que sobrevive
  origem_id    uuid unique references conteudo_gerado (id) on delete set null, -- vínculo fraco; vira null quando o original some
  promovido_em timestamptz not null default now()
);

create index if not exists idx_acervo_tipo on acervo_oficial (tipo, promovido_em desc);

alter table acervo_oficial enable row level security;

-- Leitura: qualquer usuária autenticada lê o acervo de todas. Escrita: só curadora.
grant select on acervo_oficial to anon, authenticated;
grant insert, update, delete on acervo_oficial to authenticated;

drop policy if exists acervo_leitura on acervo_oficial;
create policy acervo_leitura on acervo_oficial for select using (true);

drop policy if exists acervo_curadora_ins on acervo_oficial;
create policy acervo_curadora_ins on acervo_oficial for insert with check (is_curadora());
drop policy if exists acervo_curadora_upd on acervo_oficial;
create policy acervo_curadora_upd on acervo_oficial for update using (is_curadora()) with check (is_curadora());
drop policy if exists acervo_curadora_del on acervo_oficial;
create policy acervo_curadora_del on acervo_oficial for delete using (is_curadora());

-- A linha pessoal da autora não é mais lida por todas: o oficial público agora
-- vive (anônimo) em acervo_oficial. A dona e a curadora continuam vendo a origem.
drop policy if exists conteudo_oficial_select on conteudo_gerado;

-- Promover na curadoria: grava o texto final (lapidado) na origem, marca como
-- oficial, e espelha uma CÓPIA ANÔNIMA no acervo de todas. Definer para a
-- curadora poder escrever; a autorização é checada aqui dentro.
create or replace function promover_oficial(conteudo uuid, texto_final text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  novo_id uuid;
begin
  if not is_curadora() then
    raise exception 'apenas curadora';
  end if;

  update conteudo_gerado
    set texto = texto_final, status = 'oficial'
  where id = conteudo;

  insert into acervo_oficial (tipo, texto, embedding, origem_id)
  select cg.tipo, texto_final, cg.embedding, cg.id
  from conteudo_gerado cg
  where cg.id = conteudo
  on conflict (origem_id) do update
    set texto = excluded.texto, tipo = excluded.tipo,
        embedding = excluded.embedding, promovido_em = now()
  returning id into novo_id;

  return novo_id;
end;
$$;

revoke all on function promover_oficial(uuid, text) from public, anon;
grant execute on function promover_oficial(uuid, text) to authenticated;

-- Backfill: todo oficial já existente ganha a sua cópia anônima (uma vez).
insert into acervo_oficial (tipo, texto, embedding, origem_id)
select cg.tipo, cg.texto, cg.embedding, cg.id
from conteudo_gerado cg
where cg.status = 'oficial'
  and not exists (select 1 from acervo_oficial ao where ao.origem_id = cg.id);

-- O cache de ferramentas (regra 2) agora também enxerga o acervo anônimo, que
-- sobrevive à exclusão da autora. Mantém o reaproveitamento vivo de antes, e
-- soma a camada curada e durável.
create or replace function ferramenta_parecida(consulta vector(384), limiar float default 0.86)
returns table (id uuid, texto text, similaridade float)
language sql
stable
as $$
  select q.id, q.texto, q.similaridade from (
    select cg.id, cg.texto, 1 - (cg.embedding <=> consulta) as similaridade
    from conteudo_gerado cg
    where cg.tipo = 'ferramenta'
      and cg.embedding is not null
      and cg.status <> 'descartado'
    union all
    select ao.id, ao.texto, 1 - (ao.embedding <=> consulta) as similaridade
    from acervo_oficial ao
    where ao.tipo = 'ferramenta'
      and ao.embedding is not null
  ) q
  where q.similaridade >= limiar
  order by q.similaridade desc
  limit 1;
$$;
revoke all on function ferramenta_parecida(vector, float) from public, anon, authenticated;

-- =============================================================================
-- Val — ritual "Hoje" da Prosperidade (ângulos + configuração).
--
-- Os ângulos do ritual e o "a cada N registros" do fecho NÃO ficam fixos no
-- código: vivem aqui, pra serem editáveis no admin. A tela lê daqui (e cai numa
-- semente local só quando offline). Leitura por todas; escrita só curadora.
--
-- Aplicar pelo painel: SQL Editor → cole → Run.
-- =============================================================================

create table if not exists prosperidade_angulos (
  id        uuid primary key default gen_random_uuid(),
  texto     text not null,
  ordem     int  not null default 0,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Semente dos 8 ângulos (o gesto é o mesmo, o ângulo gira a cada dia).
insert into prosperidade_angulos (texto, ordem) values
  ('uma abundância material que você já tem e nem repara', 1),
  ('um tempo seu hoje que foi bem gasto', 2),
  ('uma habilidade sua que resolveu algo hoje', 3),
  ('algo que você recebeu hoje sem ter pedido', 4),
  ('uma pessoa que é parte da sua riqueza', 5),
  ('um "não" que você conseguiu dar', 6),
  ('algo que você sabe fazer e ainda trata como pouco', 7),
  ('uma escolha que você tem hoje e antes não tinha', 8)
on conflict do nothing;

-- Configurações editáveis (chave/valor). Começa com o "a cada N" do fecho.
create table if not exists configuracoes (
  chave        text primary key,
  valor        text not null,
  atualizado_em timestamptz not null default now()
);
insert into configuracoes (chave, valor) values ('hoje_fecho_a_cada', '7')
on conflict (chave) do nothing;

-- RLS: qualquer usuária autenticada lê; só a curadora edita (admin).
alter table prosperidade_angulos enable row level security;
alter table configuracoes        enable row level security;

grant select on prosperidade_angulos to anon, authenticated;
grant select on configuracoes        to anon, authenticated;
grant insert, update, delete on prosperidade_angulos to authenticated;
grant insert, update, delete on configuracoes        to authenticated;

create policy angulos_leitura      on prosperidade_angulos for select using (true);
create policy angulos_curadora_ins on prosperidade_angulos for insert with check (is_curadora());
create policy angulos_curadora_upd on prosperidade_angulos for update using (is_curadora()) with check (is_curadora());
create policy angulos_curadora_del on prosperidade_angulos for delete using (is_curadora());

create policy config_leitura      on configuracoes for select using (true);
create policy config_curadora_ins on configuracoes for insert with check (is_curadora());
create policy config_curadora_upd on configuracoes for update using (is_curadora()) with check (is_curadora());
create policy config_curadora_del on configuracoes for delete using (is_curadora());

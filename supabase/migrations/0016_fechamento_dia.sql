-- =============================================================================
-- Val — Fechamento de Dia guiado (banco editável). Seções 6 e 7.
--
-- A Val oferece um ritual de fim de dia, como uma amiga perguntando "como foi
-- seu dia?". É CONVITE, nunca obrigação. Quatro perguntas de reconhecimento
-- (sorteadas de cinco DIMENSÕES) que ENCHEM, mais uma pergunta de soltar que
-- ESVAZIA, e um fecho gerado pela Val que lê o conjunto.
--
-- O banco inteiro (as dimensões e suas perguntas) é editável no admin. Cada
-- dimensão sabe ONDE a resposta é guardada, costurando as seções sem a mulher
-- navegar. Leitura por todas; escrita só curadora.
--
-- Aplicar pelo painel: SQL Editor → cole → Run.
-- =============================================================================

create table if not exists fechamento_dimensoes (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  nome            text not null,
  destino_colecao text not null,   -- 'diario' | 'prosperidade'
  destino_cat     text not null,   -- cat do diário, ou 'hoje' (tipo) na prosperidade
  ordem           int  not null default 0,
  ativa           boolean not null default true,
  criado_em       timestamptz not null default now()
);

create table if not exists fechamento_perguntas (
  id          uuid primary key default gen_random_uuid(),
  dimensao_id uuid not null references fechamento_dimensoes (id) on delete cascade,
  texto       text not null,
  ordem       int  not null default 0,
  ativa       boolean not null default true,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_fech_perguntas on fechamento_perguntas (dimensao_id, ordem);

-- As cinco dimensões e onde cada resposta pousa.
insert into fechamento_dimensoes (slug, nome, destino_colecao, destino_cat, ordem) values
  ('alegria',      'Alegria e leveza', 'diario',       'riso',     1),
  ('orgulho',      'Orgulho e valor',  'diario',       'orgulho',  2),
  ('gratidao',     'Gratidão',         'diario',       'gratidao', 3),
  ('conexao',      'Conexão',          'diario',       'pessoas',  4),
  ('prosperidade', 'Prosperidade',     'prosperidade', 'hoje',     5)
on conflict (slug) do nothing;

insert into fechamento_perguntas (dimensao_id, texto, ordem)
select d.id, v.texto, v.ordem from fechamento_dimensoes d join (values
  ('o que te fez sorrir hoje, mesmo que pequeno?', 1),
  ('teve algum momento leve no meio do dia?', 2),
  ('o que foi gostoso hoje, sem motivo nenhum?', 3),
  ('alguma coisa boba que te alegrou?', 4),
  ('quando o dia ficou mais leve, hoje?', 5)
) as v(texto, ordem) on d.slug = 'alegria'
on conflict do nothing;

insert into fechamento_perguntas (dimensao_id, texto, ordem)
select d.id, v.texto, v.ordem from fechamento_dimensoes d join (values
  ('uma coisa que você fez bem hoje?', 1),
  ('do que você dá conta e nem percebeu hoje?', 2),
  ('onde você se segurou com coragem hoje?', 3),
  ('algo seu que apareceu hoje e merece reconhecimento?', 4),
  ('do que você se orgulha, mesmo pequeno, neste dia?', 5)
) as v(texto, ordem) on d.slug = 'orgulho'
on conflict do nothing;

insert into fechamento_perguntas (dimensao_id, texto, ordem)
select d.id, v.texto, v.ordem from fechamento_dimensoes d join (values
  ('por uma coisa simples de hoje, o que você agradece?', 1),
  ('quem ou o que tornou o seu dia melhor?', 2),
  ('o que hoje te deu, mesmo sem você pedir?', 3),
  ('uma coisa boa que aconteceu e você quer guardar?', 4),
  ('pelo que vale dizer obrigada antes de dormir?', 5)
) as v(texto, ordem) on d.slug = 'gratidao'
on conflict do nothing;

insert into fechamento_perguntas (dimensao_id, texto, ordem)
select d.id, v.texto, v.ordem from fechamento_dimensoes d join (values
  ('com quem você teve um bom momento hoje?', 1),
  ('alguém que te fez bem hoje, de perto ou de longe?', 2),
  ('uma troca que aqueceu o seu dia?', 3),
  ('quem você sentiu por perto hoje?', 4),
  ('uma pessoa que merece o seu carinho de hoje?', 5)
) as v(texto, ordem) on d.slug = 'conexao'
on conflict do nothing;

insert into fechamento_perguntas (dimensao_id, texto, ordem)
select d.id, v.texto, v.ordem from fechamento_dimensoes d join (values
  ('uma coisa que já é sua e você usou hoje sem reparar?', 1),
  ('uma abundância pequena que esteve no seu dia?', 2),
  ('algo que você tem hoje e um dia foi só desejo?', 3),
  ('um recurso seu que te serviu hoje?', 4),
  ('uma fartura simples que passou pelo seu dia?', 5)
) as v(texto, ordem) on d.slug = 'prosperidade'
on conflict do nothing;

-- Config editável: a pergunta de soltar (fixa) e quantas dimensões por noite.
insert into configuracoes (chave, valor) values
  ('fechamento_soltar_pergunta', 'Tem algo que ficou atravessado e você quer soltar antes de dormir?'),
  ('fechamento_dimensoes_por_noite', '4')
on conflict (chave) do nothing;

-- RLS: todas leem (pra viver o ritual); só a curadora edita.
alter table fechamento_dimensoes enable row level security;
alter table fechamento_perguntas enable row level security;

grant select on fechamento_dimensoes to anon, authenticated;
grant select on fechamento_perguntas to anon, authenticated;
grant insert, update, delete on fechamento_dimensoes to authenticated;
grant insert, update, delete on fechamento_perguntas to authenticated;

create policy fech_dim_leitura      on fechamento_dimensoes for select using (true);
create policy fech_dim_curadora_ins on fechamento_dimensoes for insert with check (is_curadora());
create policy fech_dim_curadora_upd on fechamento_dimensoes for update using (is_curadora()) with check (is_curadora());
create policy fech_dim_curadora_del on fechamento_dimensoes for delete using (is_curadora());

create policy fech_perg_leitura      on fechamento_perguntas for select using (true);
create policy fech_perg_curadora_ins on fechamento_perguntas for insert with check (is_curadora());
create policy fech_perg_curadora_upd on fechamento_perguntas for update using (is_curadora()) with check (is_curadora());
create policy fech_perg_curadora_del on fechamento_perguntas for delete using (is_curadora());

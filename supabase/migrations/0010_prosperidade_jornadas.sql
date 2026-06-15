-- =============================================================================
-- Val — Jornadas da Prosperidade (definições + arcos). Seções 6 e 7.
--
-- O sistema todo é editável no admin: nada de arco hardcoded. As DEFINIÇÕES
-- (título, o que é, convite, nº de dias, ritmo, ativa/inativa, fronteira de voz)
-- vivem em `prosperidade_jornadas`. O ARCO (a intenção de cada dia, a pergunta
-- que a Valéria curou) vive em `prosperidade_jornada_arcos`. A curadora edita os
-- dois; as mulheres só leem (pra montar a lista e viver a jornada).
--
-- Prosperidade é reconhecer o que já é real e agir com clareza, NUNCA lei da
-- atração. A jornada do "não cobra" chega na beira da ação mas não cruza pro
-- Ciclo da Colheita (produto premium): faz VER o valor, não reestrutura preço.
--
-- Aplicar pelo painel: SQL Editor → cole → Run.
-- =============================================================================

create table if not exists prosperidade_jornadas (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  titulo          text not null,
  subtitulo       text,                      -- o que é, em uma linha
  convite         text,                      -- o texto caloroso do contrato de entrada
  dias            int  not null default 21,  -- nº de dias (editável)
  intervalo_horas int  not null default 24,  -- ritmo entre dias (0 = sem espera, p/ testar)
  fronteira       text,                      -- nota de voz injetada na geração (ex.: limite do "não cobra")
  ordem           int  not null default 0,
  ativa           boolean not null default true,
  criado_em       timestamptz not null default now()
);

create table if not exists prosperidade_jornada_arcos (
  id         uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references prosperidade_jornadas (id) on delete cascade,
  dia        int  not null,
  prompt     text not null,                  -- a intenção/pergunta do dia
  fechamento boolean not null default false, -- o último dia é a devolutiva da Val
  unique (jornada_id, dia)
);
create index if not exists idx_arcos_jornada on prosperidade_jornada_arcos (jornada_id, dia);

-- --- Semente: as três jornadas curadas pela Valéria -------------------------
insert into prosperidade_jornadas (slug, titulo, subtitulo, convite, dias, ordem, fronteira) values
  ('merecer', '21 dias pra aprender a merecer',
   'aprender a receber sem precisar merecer',
   'Vinte e um dias pra olhar de perto o quanto você acha que precisa merecer pra receber, e ir afrouxando esse nó. Um degrau por dia, no seu ritmo. Se sumir, eu te espero, e a gente continua de onde parou.',
   21, 1, null),
  ('pequenas-coisas', '21 dias de prosperidade nas pequenas coisas',
   'a abundância que já está aqui, e some de tão perto',
   'Vinte e um dias pra reparar na fartura que já mora na sua vida e ficou invisível de tão próxima. Um dia por vez, sem pressa. Pode pausar e voltar quando quiser, daqui mesmo.',
   21, 2, null),
  ('nao-cobra', '7 dias pra destravar o que você não cobra',
   'enxergar o valor que você entrega de graça',
   'Sete dias pra ver de perto o que você faz tão bem que nem cobra, e chegar na beira de cobrar. Um dia por vez. No fim, a gente nomeia o seu valor e um primeiro passo, no seu tempo.',
   7, 3,
   'Esta jornada chega na beira da ação, faz ela VER o valor que entrega, NUNCA reestrutura precificação com método, nunca vira consultoria de preços nem tabela. No fechamento, ajude a nomear o valor dela e UM primeiro movimento concreto e pequeno pra começar a cobrar, sem método, sem passo a passo de negócio. Prosperidade é reconhecer o que já é real e agir com clareza, nunca lei da atração.')
on conflict (slug) do nothing;

-- Arco da jornada "merecer"
insert into prosperidade_jornada_arcos (jornada_id, dia, prompt, fechamento)
select j.id, v.dia, v.prompt, v.fechamento from prosperidade_jornadas j
join (values
  (1,  'o que você acha que precisa fazer pra merecer descanso?', false),
  (2,  'uma coisa boa que te aconteceu sem você ter "merecido" por esforço', false),
  (3,  'de quem você aprendeu que precisa provar valor pra receber?', false),
  (4,  'um elogio que você desconversou em vez de receber', false),
  (5,  'o que muda no seu corpo quando alguém te dá algo?', false),
  (6,  'você cobra de si o que jamais cobraria de uma amiga?', false),
  (7,  'uma coisa que você merece hoje, sem motivo, só por existir', false),
  (8,  'quando você se sente em dívida por receber?', false),
  (9,  'uma necessidade sua que você sempre põe por último', false),
  (10, 'o que você daria a uma menina de 8 anos que pedisse o que você quer?', false),
  (11, 'um "não" que você não deu por achar que devia agradar', false),
  (12, 'dinheiro entrando: o que você sente antes de pensar?', false),
  (13, 'você se permite querer mais, ou se censura no "já tá bom"?', false),
  (14, 'escreva pra você mesma a permissão que ninguém te deu', false),
  (15, 'um cuidado que você adia "pra quando der"', false),
  (16, 'o que você teme que pensem se você receber demais?', false),
  (17, 'uma vez em que receber foi mais difícil que dar', false),
  (18, 'o que você está pronta pra parar de provar?', false),
  (19, 'como seria seu dia se você não precisasse merecer nada?', false),
  (20, 'uma coisa que você vai se permitir esta semana', false),
  (21, 'fechamento: a Val devolve o arco inteiro e o que mudou no jeito de receber.', true)
) as v(dia, prompt, fechamento) on j.slug = 'merecer'
on conflict (jornada_id, dia) do nothing;

-- Arco da jornada "pequenas coisas"
insert into prosperidade_jornada_arcos (jornada_id, dia, prompt, fechamento)
select j.id, v.dia, v.prompt, v.fechamento from prosperidade_jornadas j
join (values
  (1,  'algo que você usou hoje e que um dia foi um sonho', false),
  (2,  'um conforto tão presente que virou invisível', false),
  (3,  'alguém que apareceu na sua vida sem você buscar', false),
  (4,  'uma habilidade do seu corpo que você não agradece', false),
  (5,  'um lugar da sua casa que te acolhe', false),
  (6,  'uma comida que te deu prazer recente', false),
  (7,  'a abundância de um dia comum, listada', false),
  (8,  'um conhecimento que levou anos pra construir', false),
  (9,  'uma pessoa que torce por você de longe', false),
  (10, 'um som que te faz bem e está sempre disponível', false),
  (11, 'uma escolha que hoje você tem e antes não tinha', false),
  (12, 'algo da natureza que te foi dado de graça hoje', false),
  (13, 'uma facilidade da sua vida que muita gente não tem', false),
  (14, 'o que "ter o suficiente" significa pra você hoje', false),
  (15, 'um aprendizado que veio de uma fase difícil', false),
  (16, 'uma beleza pequena que você quase não viu hoje', false),
  (17, 'alguém a quem você faz falta', false),
  (18, 'um recurso seu parado, esperando uso', false),
  (19, 'uma porta que está aberta pra você agora', false),
  (20, 'o que você já tem que sua versão de 10 anos atrás invejaria', false),
  (21, 'fechamento: a Val mostra quanta abundância você nomeou.', true)
) as v(dia, prompt, fechamento) on j.slug = 'pequenas-coisas'
on conflict (jornada_id, dia) do nothing;

-- Arco da jornada "não cobra"
insert into prosperidade_jornada_arcos (jornada_id, dia, prompt, fechamento)
select j.id, v.dia, v.prompt, v.fechamento from prosperidade_jornadas j
join (values
  (1, 'o que você faz tão bem que nem percebe que é raro?', false),
  (2, 'a quem você dá conselho ou ajuda de graça, e com frequência?', false),
  (3, 'o que você cobraria de uma estranha mas faz por conhecidos sem cobrar?', false),
  (4, 'qual desconto você dá por se sentir "cara demais"?', false),
  (5, 'um valor que você entregou e nem mencionou na hora de cobrar', false),
  (6, 'se você cobrasse o preço cheio uma vez, o que aconteceria de pior?', false),
  (7, 'fechamento: a Val ajuda a nomear seu valor e um primeiro movimento concreto pra cobrá-lo.', true)
) as v(dia, prompt, fechamento) on j.slug = 'nao-cobra'
on conflict (jornada_id, dia) do nothing;

-- --- RLS: todas leem (lista + arco pra viver); só a curadora edita ----------
alter table prosperidade_jornadas      enable row level security;
alter table prosperidade_jornada_arcos enable row level security;

grant select on prosperidade_jornadas      to anon, authenticated;
grant select on prosperidade_jornada_arcos to anon, authenticated;
grant insert, update, delete on prosperidade_jornadas      to authenticated;
grant insert, update, delete on prosperidade_jornada_arcos to authenticated;

create policy jornadas_leitura      on prosperidade_jornadas for select using (true);
create policy jornadas_curadora_ins on prosperidade_jornadas for insert with check (is_curadora());
create policy jornadas_curadora_upd on prosperidade_jornadas for update using (is_curadora()) with check (is_curadora());
create policy jornadas_curadora_del on prosperidade_jornadas for delete using (is_curadora());

create policy arcos_leitura      on prosperidade_jornada_arcos for select using (true);
create policy arcos_curadora_ins on prosperidade_jornada_arcos for insert with check (is_curadora());
create policy arcos_curadora_upd on prosperidade_jornada_arcos for update using (is_curadora()) with check (is_curadora());
create policy arcos_curadora_del on prosperidade_jornada_arcos for delete using (is_curadora());

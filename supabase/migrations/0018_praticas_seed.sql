-- =============================================================================
-- Val — Seed (corretivo) das seis práticas curadas, como OFICIAIS.
--
-- O banco de práticas nasceu vazio (o seed da 0017 não populou). Esta migration
-- garante a tabela e suas regras, e semeia as seis práticas curadas com upsert
-- por slug: idempotente, pode rodar e re-rodar sem duplicar, e força status
-- 'oficial' (servíveis pra todas, não rascunho).
--
-- Aplicar pelo painel: SQL Editor → cole → Run. (Não depende da ordem; recria o
-- que faltar.)
-- =============================================================================

create table if not exists praticas (
  id         uuid primary key default gen_random_uuid(),
  slug       text,
  nome       text not null,
  tons       text[] not null default '{}',
  passos     text[] not null default '{}',
  ancora     text,
  ordem      int  not null default 0,
  ativa      boolean not null default true,
  status     text not null default 'oficial' check (status in ('rascunho','curadoria','oficial','descartado')),
  origem     text not null default 'curada'  check (origem in ('curada','gerada')),
  util_count int  not null default 0,
  criado_em  timestamptz not null default now()
);

-- Chave única por slug, pra o upsert ser idempotente (slugs nulos das geradas
-- não conflitam entre si).
create unique index if not exists praticas_slug_key on praticas (slug);

-- RLS e permissões, caso a tabela tenha acabado de nascer aqui.
alter table praticas enable row level security;
grant select on praticas to anon, authenticated;
grant insert, update, delete on praticas to authenticated;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='praticas' and policyname='praticas_leitura')
    then create policy praticas_leitura on praticas for select using (status = 'oficial' or is_curadora()); end if;
  if not exists (select 1 from pg_policies where tablename='praticas' and policyname='praticas_insert')
    then create policy praticas_insert on praticas for insert with check (is_curadora() or (origem = 'gerada' and status = 'rascunho')); end if;
  if not exists (select 1 from pg_policies where tablename='praticas' and policyname='praticas_curadora_upd')
    then create policy praticas_curadora_upd on praticas for update using (is_curadora()) with check (is_curadora()); end if;
  if not exists (select 1 from pg_policies where tablename='praticas' and policyname='praticas_curadora_del')
    then create policy praticas_curadora_del on praticas for delete using (is_curadora()); end if;
end $$;

-- As seis curadas, como OFICIAIS (upsert por slug).
insert into praticas (slug, nome, tons, passos, ancora, ordem, status, origem, ativa) values
  ('expiracao', 'A expiração que avisa o corpo', array['agitado'],
   array[
     'Antes de dormir, vamos dar um sinal ao seu corpo de que o dia acabou.',
     'Feche os olhos. Inspire pelo nariz contando até quatro, e solte o ar bem devagar contando até seis. A saída do ar é o que acalma.',
     'Faça quatro vezes, no seu tempo, soltando o ar mais devagar do que puxou.',
     'Repare como o corpo pesa mais na cama a cada vez. Esse peso é o descanso chegando.'],
   'O dia acabou, e o meu corpo já pode descansar.', 1, 'oficial', 'curada', true),
  ('momento-bom', 'Um momento bom, trazido pra frente', array['bom'],
   array[
     'Se veio à tona algo bom hoje, deixa ele voltar agora, por um instante.',
     'Feche os olhos e lembre de um momento, de hoje ou de qualquer dia, em que você se sentiu inteira, em paz. Não precisa ser grande.',
     'Traga esse momento pra frente: onde estava, o que via, o que sentia no corpo. Deixe a sensação te alcançar de novo.',
     'Essa sensação é sua, está guardada em você, e você pode voltar nela sempre que precisar.'],
   'O que já foi bom uma vez continua morando em mim.', 2, 'oficial', 'curada', true),
  ('pousar-peso', 'Pousar o peso', array['soltou'],
   array[
     'Se ficou algo pesando, a gente não vai tentar fazer sumir, porque empurrar só faz voltar com mais força.',
     'Feche os olhos e repare onde esse peso mora no corpo: peito, garganta, ombros? Só repare, sem mexer.',
     'Respire em direção a esse lugar, como quem abre espaço. Você não precisa resolver hoje. Pode deixar isso aqui comigo, pousado, até amanhã.',
     'Amanhã você olha de novo, com o corpo descansado. Hoje, só pousa.'],
   'Nem tudo precisa ser resolvido hoje. Posso pousar e voltar amanhã.', 3, 'oficial', 'curada', true),
  ('parte-maior', 'Você é parte de algo maior', array['pequena'],
   array[
     'Antes de dormir, vamos sair um pouco da sua cabeça e lembrar do tamanho das coisas.',
     'Feche os olhos. Pense na praia: incontáveis grãos de areia, e cada um é parte de algo imenso. Você é assim também, parte de algo muito maior do que o seu dia de hoje.',
     'Seu corpo, agora, tem trilhões de células trabalhando por você, em silêncio, sem você pedir.',
     'Você não precisa segurar o mundo. Ele se segura. E você é parte dele.'],
   'Sou parte de algo maior, e isso me sustenta mesmo quando eu não percebo.', 4, 'oficial', 'curada', true),
  ('certeza-amanha', 'A certeza simples do amanhã', array['agitado'],
   array[
     'Se a cabeça está adiantada, correndo pro amanhã, vamos trazer ela de volta com uma certeza simples.',
     'Feche os olhos e respire uma vez, devagar.',
     'O sol vai nascer amanhã, isso não depende de você. A noite vai passar. Tem coisas que seguem funcionando sozinhas, mesmo enquanto você dorme.',
     'Você pode soltar o controle por algumas horas. O mundo continua, e estará aqui quando você acordar.'],
   'Durmo com a certeza de que o sol nascerá amanhã, e nem tudo depende de mim.', 5, 'oficial', 'curada', true),
  ('corpo-trouxe', 'O corpo que te trouxe até aqui', array['bom','pequena'],
   array[
     'Seu corpo trabalhou o dia inteiro por você. Vamos agradecer a ele antes de dormir.',
     'Feche os olhos. Repare nos seus pés, que te levaram aonde precisou ir. Nas mãos, que fizeram o que tinha que ser feito. No peito, que respirou o dia inteiro sem você mandar.',
     'Ele não pediu nada em troca. Só te sustentou, em silêncio, o dia todo.',
     'Agora deixe ele descansar. Sinta o peso afundando na cama, em paz.'],
   'Meu corpo me sustentou hoje, e merece descansar comigo.', 6, 'oficial', 'curada', true)
on conflict (slug) do update set
  nome = excluded.nome, tons = excluded.tons, passos = excluded.passos,
  ancora = excluded.ancora, ordem = excluded.ordem,
  status = 'oficial', origem = 'curada', ativa = true;

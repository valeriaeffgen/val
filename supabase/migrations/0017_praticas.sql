-- =============================================================================
-- Val — Práticas de fechamento (banco editável + fila de curadoria). Seções 6, 7, 4.
--
-- Depois do fecho do dia, a Val oferece, como convite ocasional, uma prática
-- rápida pra pousar o dia. Ancorada em corpo e presença, NUNCA manipular
-- sentimento nem prometer alívio terapêutico. As âncoras são constatações de
-- algo real e maior ("o sol nascerá amanhã"), NUNCA decretos ("eu sou próspera").
-- Jamais coach, jamais holístico vago.
--
-- A Val olha o tom do dia (que conhece pelo fechamento) e serve a prática
-- adequada do banco (livre). Pode também GERAR práticas novas (1 crédito) pra
-- renovar; as geradas nascem 'rascunho' e só viram 'oficial' (reutilizáveis pra
-- todas) quando a curadora aprovar. Tudo editável no admin.
--
-- Aplicar pelo painel: SQL Editor → cole → Run.
-- =============================================================================

create table if not exists praticas (
  id         uuid primary key default gen_random_uuid(),
  slug       text,
  nome       text not null,
  tons       text[] not null default '{}',   -- regra de correspondência: tons de dia que ela serve
  passos     text[] not null default '{}',   -- os passos, na voz da Val
  ancora     text,                            -- a âncora de verdade (constatação, nunca decreto)
  ordem      int  not null default 0,
  ativa      boolean not null default true,
  status     text not null default 'oficial' check (status in ('rascunho','curadoria','oficial','descartado')),
  origem     text not null default 'curada'  check (origem in ('curada','gerada')),
  util_count int  not null default 0,
  criado_em  timestamptz not null default now()
);
create index if not exists idx_praticas_serve on praticas (status, ativa);

-- Tons de dia (vocabulário): agitado, bom, soltou, pequena. A regra "agitado → 1 ou 5"
-- etc. vive nos `tons` de cada prática, editável no admin.
insert into praticas (slug, nome, tons, passos, ancora, ordem) values
  ('expiracao', 'A expiração que avisa o corpo', array['agitado'],
   array[
     'Antes de dormir, vamos dar um sinal ao seu corpo de que o dia acabou.',
     'Feche os olhos. Inspire pelo nariz contando até quatro, e solte o ar bem devagar contando até seis. A saída do ar é o que acalma.',
     'Faça quatro vezes, no seu tempo, soltando o ar mais devagar do que puxou.',
     'Repare como o corpo pesa mais na cama a cada vez. Esse peso é o descanso chegando.'],
   'O dia acabou, e o meu corpo já pode descansar.', 1),
  ('momento-bom', 'Um momento bom, trazido pra frente', array['bom'],
   array[
     'Se veio à tona algo bom hoje, deixa ele voltar agora, por um instante.',
     'Feche os olhos e lembre de um momento, de hoje ou de qualquer dia, em que você se sentiu inteira, em paz. Não precisa ser grande.',
     'Traga esse momento pra frente: onde estava, o que via, o que sentia no corpo. Deixe a sensação te alcançar de novo.',
     'Essa sensação é sua, está guardada em você, e você pode voltar nela sempre que precisar.'],
   'O que já foi bom uma vez continua morando em mim.', 2),
  ('pousar-peso', 'Pousar o peso, não fazer sumir', array['soltou'],
   array[
     'Se ficou algo pesando, a gente não vai tentar fazer sumir, porque empurrar só faz voltar com mais força.',
     'Feche os olhos e repare onde esse peso mora no corpo: peito, garganta, ombros? Só repare, sem mexer.',
     'Respire em direção a esse lugar, como quem abre espaço. Você não precisa resolver hoje. Pode deixar isso aqui comigo, pousado, até amanhã.',
     'Amanhã você olha de novo, com o corpo descansado. Hoje, só pousa.'],
   'Nem tudo precisa ser resolvido hoje. Posso pousar e voltar amanhã.', 3),
  ('parte-maior', 'Você é parte de algo maior', array['pequena'],
   array[
     'Antes de dormir, vamos sair um pouco da sua cabeça e lembrar do tamanho das coisas.',
     'Feche os olhos. Pense na praia: incontáveis grãos de areia, e cada um é parte de algo imenso. Você é assim também, parte de algo muito maior do que o seu dia de hoje.',
     'Seu corpo, agora, tem trilhões de células trabalhando por você, em silêncio, sem você pedir.',
     'Você não precisa segurar o mundo. Ele se segura. E você é parte dele.'],
   'Sou parte de algo maior, e isso me sustenta mesmo quando eu não percebo.', 4),
  ('certeza-amanha', 'A certeza simples do amanhã', array['agitado'],
   array[
     'Se a cabeça está adiantada, correndo pro amanhã, vamos trazer ela de volta com uma certeza simples.',
     'Feche os olhos e respire uma vez, devagar.',
     'O sol vai nascer amanhã, isso não depende de você. A noite vai passar. Tem coisas que seguem funcionando sozinhas, mesmo enquanto você dorme.',
     'Você pode soltar o controle por algumas horas. O mundo continua, e estará aqui quando você acordar.'],
   'Durmo com a certeza de que o sol nascerá amanhã, e nem tudo depende de mim.', 5),
  ('corpo-trouxe', 'O corpo que te trouxe até aqui', array['bom','pequena'],
   array[
     'Seu corpo trabalhou o dia inteiro por você. Vamos agradecer a ele antes de dormir.',
     'Feche os olhos. Repare nos seus pés, que te levaram aonde precisou ir. Nas mãos, que fizeram o que tinha que ser feito. No peito, que respirou o dia inteiro sem você mandar.',
     'Ele não pediu nada em troca. Só te sustentou, em silêncio, o dia todo.',
     'Agora deixe ele descansar. Sinta o peso afundando na cama, em paz.'],
   'Meu corpo me sustentou hoje, e merece descansar comigo.', 6)
on conflict do nothing;

-- Votos de "isso me fez bem": uso seleciona o que sobe pra curadoria (como em 0003).
create table if not exists pratica_util (
  pratica_id uuid not null references praticas (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  criado_em  timestamptz not null default now(),
  primary key (pratica_id, user_id)
);
alter table pratica_util enable row level security;

create or replace function marcar_pratica_util(pratica uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare total integer; limiar constant integer := 3;
begin
  insert into pratica_util (pratica_id, user_id) values (pratica, auth.uid()) on conflict do nothing;
  select count(*) into total from pratica_util where pratica_id = pratica;
  update praticas set util_count = total,
    status = case when total >= limiar and status = 'rascunho' then 'curadoria' else status end
  where id = pratica;
  return total;
end; $$;
revoke all on function marcar_pratica_util(uuid) from public;
grant execute on function marcar_pratica_util(uuid) to authenticated, anon;

-- Config editável: cooldown do convite (ocasional, não toda noite) e a chance de
-- gerar uma nova em vez de servir do banco (renovação).
insert into configuracoes (chave, valor) values
  ('pratica_cooldown_horas', '48'),
  ('pratica_gerar_chance', '0.25')
on conflict (chave) do nothing;

-- RLS: todas leem as OFICIAIS; a curadora vê e edita tudo; a mulher pode inserir
-- uma prática GERADA como rascunho (a função `pratica` faz isso sob o JWT dela).
alter table praticas enable row level security;
grant select on praticas to anon, authenticated;
grant insert, update, delete on praticas to authenticated;

create policy praticas_leitura on praticas for select using (status = 'oficial' or is_curadora());
create policy praticas_insert  on praticas for insert with check (is_curadora() or (origem = 'gerada' and status = 'rascunho'));
create policy praticas_curadora_upd on praticas for update using (is_curadora()) with check (is_curadora());
create policy praticas_curadora_del on praticas for delete using (is_curadora());

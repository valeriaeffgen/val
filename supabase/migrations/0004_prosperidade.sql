-- =============================================================================
-- Val — acervo da Prosperidade (memória que acumula no tempo).
--
-- O que a mulher escreve nas reflexões de Consciência e nos micro-exercícios
-- é guardado aqui, sob a RLS dela, separado por tipo (o que ela reconheceu como
-- habilidade, recurso parado, abundância que enxergou). Não vive só na visita:
-- é a memória que faz a Val conhecer a mulher, não esquecê-la.
-- =============================================================================

create table if not exists prosperidade (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  tipo       text not null,          -- consciencia | recurso | habilidade | abundancia | preco
  pergunta   text,                   -- a pergunta/exercício que originou
  texto      text not null,          -- o que ela escreveu
  day        date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_prosperidade_user on prosperidade (user_id, created_at desc);

alter table prosperidade enable row level security;

create policy prosperidade_dona_select on prosperidade for select using (user_id = auth.uid());
create policy prosperidade_dona_insert on prosperidade for insert with check (user_id = auth.uid());
create policy prosperidade_dona_update on prosperidade for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy prosperidade_dona_delete on prosperidade for delete using (user_id = auth.uid());

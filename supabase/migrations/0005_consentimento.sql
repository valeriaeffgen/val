-- Consentimento (LGPD) — a prova durável do "sim" da mulher à Política de
-- Privacidade, sob a RLS dela. Uma linha por versão aceita.
--
-- Aplicar pelo painel: SQL Editor → cole este arquivo → Run.

create table if not exists consentimentos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  versao     text not null,
  aceito_em  timestamptz not null default now()
);

create index if not exists idx_consentimentos_user on consentimentos (user_id, aceito_em desc);

alter table consentimentos enable row level security;

-- Cada mulher só enxerga e registra o próprio consentimento. Sem update/delete:
-- é um registro histórico (apagado em cascata se a conta for excluída).
create policy consentimentos_dona_select on consentimentos
  for select using (user_id = auth.uid());
create policy consentimentos_dona_insert on consentimentos
  for insert with check (user_id = auth.uid());

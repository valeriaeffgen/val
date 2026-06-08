/*
 * Cliente Supabase (seção 9).
 *
 * Se as variáveis de ambiente não estiverem presentes, o app segue rodando em
 * localStorage (ver lib/db.js) — assim a Val funciona em qualquer ambiente,
 * com ou sem backend. Quando há Supabase, abrimos uma sessão anônima por
 * padrão: nada de muro de cadastro logo na chegada (princípio "lugar de
 * retorno, não de cobrança"). A usuária pode vincular e-mail depois.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

/*
 * Garante uma sessão (anônima, se ainda não houver). Necessária porque toda
 * tabela usa auth.uid() e é protegida por RLS.
 */
export async function ensureSession() {
  if (!hasSupabase) return null;
  const log = (s) => console.info('[Val] seu user id:', s?.user?.id);
  const { data: { session } } = await supabase.auth.getSession();
  if (session) { log(session); return session; }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('Val: não foi possível abrir sessão anônima —', error.message);
    return null;
  }
  // Útil para semear o próprio perfil (Meu Centro) via SQL: o id da sua conta.
  log(data.session);
  return data.session;
}

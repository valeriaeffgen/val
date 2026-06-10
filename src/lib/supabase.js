/*
 * Cliente Supabase (seção 9) e autenticação por e-mail (link mágico).
 *
 * Sem as variáveis de ambiente, o app roda em localStorage (ver lib/db.js),
 * útil em desenvolvimento. Com Supabase, a mulher entra com o e-mail dela: a
 * história a segue entre dias e aparelhos, e cada uma tem um perfil único e
 * estável (em vez de uma usuária anônima nova por navegador).
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

// Sessão atual (ou null). Não cria conta anônima: a entrada é por e-mail.
export async function ensureSession() {
  if (!hasSupabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Login/cadastro por link mágico: se o e-mail já existe, entra; se não, cria.
export async function entrarComEmail(email) {
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin },
  });
}

// Vincula um e-mail a uma sessão anônima existente, preservando o user_id (e
// portanto todos os dados). É como a história anônima vira conta de verdade.
export async function vincularEmail(email) {
  return supabase.auth.updateUser({ email: email.trim() });
}

export async function sair() {
  return supabase.auth.signOut();
}

// Apaga a própria história, de vez (LGPD: direito de eliminação). A função Edge
// `apagar` confirma a identidade pelo JWT e exclui a usuária; a cascata limpa
// tudo. Em seguida, encerra a sessão local.
export async function apagarMinhaConta() {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('apagar', { body: {} });
  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);
  await supabase.auth.signOut().catch(() => {});
  return true;
}

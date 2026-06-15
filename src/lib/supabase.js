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

// Para onde os links de e-mail (confirmação, recuperação, link mágico, OAuth)
// devem voltar. É a origem do app (em produção, https://val.help). Precisa estar
// na allowlist de Redirect URLs do Supabase.
const destino = () => window.location.origin;

// --- Senha (a porta principal) ----------------------------------------------

// Entrar com e-mail e senha.
export async function entrarComSenha(email, senha) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
}

// Criar conta com e-mail e senha. Com a confirmação de e-mail ligada no painel,
// o Supabase manda o link de confirmação e só libera a sessão depois do clique.
// Marcamos tem_senha pra distinguir das contas antigas (que entravam por link).
export async function cadastrarComSenha(email, senha) {
  return supabase.auth.signUp({
    email: email.trim(),
    password: senha,
    options: { emailRedirectTo: destino(), data: { tem_senha: true } },
  });
}

// Reenvia o e-mail de confirmação do cadastro.
export async function reenviarConfirmacao(email) {
  return supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: destino() } });
}

// "Esqueci minha senha": manda o link de redefinição (a rede de segurança).
export async function redefinirSenhaEmail(email) {
  return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: destino() });
}

// Define/troca a senha da sessão atual. Usado na redefinição (após o link de
// recuperação) e na ponte das contas antigas (após o link mágico).
export async function definirSenha(senha) {
  return supabase.auth.updateUser({ password: senha, data: { tem_senha: true } });
}

// --- Link mágico (agora a PONTE, não a porta principal) ---------------------
// Serve às contas antigas (criadas por link, incluindo a da Valéria) entrarem e
// definirem senha, e como rede de segurança. Se o e-mail não existe, cria.
export async function entrarComEmail(email) {
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: destino() },
  });
}

// --- Login social (preparado para uma fase futura) --------------------------
// Para habilitar o Google: ligue o provider em Authentication → Providers no
// painel do Supabase, e troque GOOGLE_HABILITADO para true. Nada a reconstruir.
export const GOOGLE_HABILITADO = false;
export async function entrarComGoogle() {
  return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: destino() } });
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

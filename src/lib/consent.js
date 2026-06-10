/*
 * Consentimento (LGPD) — registra o "sim" claro da mulher à Política de
 * Privacidade.
 *
 * Duas camadas:
 *   - Local (localStorage): lembra que ESTE aparelho já consentiu à versão
 *     atual, pra a entrada ficar leve em visitas seguintes.
 *   - No banco (tabela `consentimentos`): a prova durável, sob a RLS dela.
 *     Best-effort: se a tabela ainda não existir, o app segue funcionando.
 */
import { supabase, hasSupabase } from './supabase';
import { POLITICA_VERSAO } from '../data/politica';

const CHAVE = `val.consent.${POLITICA_VERSAO}`;

// Este aparelho já registrou o consentimento à versão atual?
export function consentido() {
  try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; }
}

// Marca o consentimento localmente (chamado quando ela aceita na Entrada).
export function marcarConsentimento() {
  try { localStorage.setItem(CHAVE, '1'); } catch { /* ignore */ }
}

// Persiste a prova no banco, uma vez por versão, depois que há sessão. Silencioso
// em qualquer erro (inclusive se a migração ainda não foi aplicada).
export async function registrarConsentimento() {
  if (!hasSupabase) return;
  try {
    const { data: jaTem } = await supabase
      .from('consentimentos')
      .select('id')
      .eq('versao', POLITICA_VERSAO)
      .limit(1)
      .maybeSingle();
    if (jaTem) { marcarConsentimento(); return; }
    await supabase.from('consentimentos').insert({ versao: POLITICA_VERSAO });
    marcarConsentimento();
  } catch { /* a tabela pode não existir ainda; segue sem travar */ }
}

/*
 * Prosperidade, ritual "Hoje" — leitura dos ângulos e da configuração.
 *
 * Os ângulos e o "a cada N registros" do fecho vivem no banco (editáveis no
 * admin), não fixos no código. Aqui lemos de lá, com a semente local de
 * fallback quando offline. O gesto é sempre o mesmo (reconhecer algo de
 * prosperidade hoje); o ângulo gira a cada dia, pra nunca repetir.
 */
import { supabase, hasSupabase } from './supabase';
import { ANGULOS_HOJE } from '../data/seed';

export async function lerAngulosHoje() {
  if (!hasSupabase) return ANGULOS_HOJE;
  try {
    const { data } = await supabase
      .from('prosperidade_angulos').select('texto').eq('ativo', true).order('ordem');
    const lista = (data ?? []).map((a) => a.texto).filter(Boolean);
    return lista.length ? lista : ANGULOS_HOJE;
  } catch {
    return ANGULOS_HOJE;
  }
}

export async function lerFechoACada() {
  if (!hasSupabase) return 7;
  try {
    const { data } = await supabase
      .from('configuracoes').select('valor').eq('chave', 'hoje_fecho_a_cada').maybeSingle();
    const n = parseInt(data?.valor ?? '7', 10);
    return Number.isFinite(n) && n > 0 ? n : 7;
  } catch {
    return 7;
  }
}

// Ângulo do dia: determinístico por data, gira por todos antes de repetir.
export function anguloDoDia(angulos, data = new Date()) {
  if (!angulos || !angulos.length) return '';
  const dias = Math.floor(data.getTime() / 86400000); // dias desde a epoch
  return angulos[((dias % angulos.length) + angulos.length) % angulos.length];
}

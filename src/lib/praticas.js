/*
 * Práticas de fechamento — banco, escolha por tom, cooldown e voto.
 *
 * Servir do banco curado (oficial) é livre. A escolha olha o tom do dia e pega
 * uma prática cujos `tons` batem. O convite é OCASIONAL: um cooldown (editável)
 * guardado no aparelho evita oferecer toda noite. A geração de práticas novas
 * (renovação, 1 crédito) vive em val.js.
 */
import { supabase, hasSupabase } from './supabase';

export async function lerPraticasOficiais() {
  if (!hasSupabase) return [];
  const { data } = await supabase
    .from('praticas').select('*').eq('status', 'oficial').eq('ativa', true).order('ordem');
  return data ?? [];
}

export async function lerConfigPraticas() {
  const padrao = { cooldownHoras: 48, gerarChance: 0.25 };
  if (!hasSupabase) return padrao;
  try {
    const { data } = await supabase.from('configuracoes').select('chave, valor')
      .in('chave', ['pratica_cooldown_horas', 'pratica_gerar_chance']);
    const m = Object.fromEntries((data ?? []).map((c) => [c.chave, c.valor]));
    const ch = parseInt(m.pratica_cooldown_horas ?? '48', 10);
    const gc = parseFloat(m.pratica_gerar_chance ?? '0.25');
    return { cooldownHoras: Number.isFinite(ch) ? ch : 48, gerarChance: Number.isFinite(gc) ? gc : 0.25 };
  } catch {
    return padrao;
  }
}

// Escolhe uma prática do banco pelo tom do dia. Sem match, cai em qualquer oficial.
export function escolherDoBanco(praticas, tom) {
  if (!praticas?.length) return null;
  const match = praticas.filter((p) => (p.tons ?? []).includes(tom));
  const pool = match.length ? match : praticas;
  return pool[Math.floor(Math.random() * pool.length)];
}

// O tom do dia, a partir do que a Val já conhece pelo fechamento.
export function tomDoDia({ vibe, soltou, temReconhecimento }) {
  if (soltou) return 'soltou';
  if (vibe === 'agitada') return 'agitado';
  if (vibe === 'pesada') return 'pequena';
  if (vibe === 'elevada' || vibe === 'neutra' || temReconhecimento) return 'bom';
  return 'bom';
}

// Voto "isso me fez bem": o uso seleciona o que sobe pra curadoria.
export async function marcarPraticaUtil(id) {
  if (!hasSupabase || !id) return;
  await supabase.rpc('marcar_pratica_util', { pratica: id }).catch(() => {});
}

// Cooldown do convite (ocasional), guardado no aparelho.
const CHAVE = 'val.pratica.ultima';
export function podeOferecer(cooldownHoras) {
  try {
    const t = parseInt(localStorage.getItem(CHAVE) || '0', 10);
    return Date.now() - t > (cooldownHoras || 48) * 3600 * 1000;
  } catch {
    return true;
  }
}
export function marcarOferecida() {
  try { localStorage.setItem(CHAVE, String(Date.now())); } catch { /* ignore */ }
}

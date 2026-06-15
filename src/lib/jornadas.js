/*
 * Jornadas da Prosperidade — leitura e vida do percurso (frontend).
 *
 * As definições e arcos vivem no banco (editáveis no admin). Aqui lemos a lista
 * ativa, os percursos da mulher (cada rodada é um registro separado, repetir não
 * sobrescreve) e os dias vividos. Iniciar e responder são livres (escrita no
 * banco); só gerar um dia custa crédito, e isso vive em lib/val.js.
 *
 * Tudo isto precisa de backend (geração). Sem Supabase, devolvemos vazio e a
 * seção se recolhe com leveza.
 */
import { supabase, hasSupabase } from './supabase';

export async function lerJornadas() {
  if (!hasSupabase) return [];
  const { data } = await supabase
    .from('prosperidade_jornadas').select('*').eq('ativa', true).order('ordem');
  return data ?? [];
}

export async function lerPercursos() {
  if (!hasSupabase) return [];
  const { data } = await supabase
    .from('prosperidade_percursos').select('*').order('iniciado_em', { ascending: false });
  return data ?? [];
}

export async function lerDias(percursoId) {
  if (!hasSupabase) return [];
  const { data } = await supabase
    .from('prosperidade_percurso_dias').select('*').eq('percurso_id', percursoId).order('dia');
  return data ?? [];
}

// Abre uma nova rodada (retrato do nº de dias e do ritmo no início). A geração
// do dia 1 vem logo depois, por quem chamou (gerarProximoDiaJornada).
export async function iniciarPercurso(jornada) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase
    .from('prosperidade_percursos')
    .insert({
      jornada_id: jornada.id,
      jornada_titulo: jornada.titulo,
      jornada_dias: jornada.dias,
      intervalo_horas: jornada.intervalo_horas ?? 24,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Responder é livre: guarda o que ela escreveu no dia.
export async function responderDia(diaId, resposta) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { error } = await supabase
    .from('prosperidade_percurso_dias')
    .update({ resposta, respondido_em: new Date().toISOString() })
    .eq('id', diaId);
  if (error) throw error;
}

// Ritmo, sem cobrança: quando o próximo dia pode ser liberado. Espelha a regra
// da função Edge, só pra UI mostrar "liberar" ou "volte no seu tempo".
export function liberacao(percurso, dias) {
  const atual = (dias ?? []).find((d) => d.dia === percurso.dia_atual);
  const respondido = (percurso.dia_atual ?? 0) === 0 || Boolean(atual?.respondido_em);
  const intervalo = percurso.intervalo_horas ?? 24;
  let liberaEm = 0;
  if ((percurso.dia_atual ?? 0) >= 1 && intervalo > 0 && percurso.ultimo_dia_em) {
    liberaEm = new Date(percurso.ultimo_dia_em).getTime() + intervalo * 3600_000;
  }
  return { respondido, liberado: respondido && Date.now() >= liberaEm, liberaEm };
}

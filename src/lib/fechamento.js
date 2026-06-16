/*
 * Fechamento de Dia — banco de perguntas, sorteio e guarda das respostas.
 *
 * O banco (5 dimensões e suas perguntas) vive no banco de dados, editável no
 * admin. A cada noite sorteamos N dimensões (config) e, dentro de cada uma, uma
 * pergunta. Cada dimensão sabe ONDE a resposta pousa, costurando as seções sem a
 * mulher navegar. Guardar é livre; só o fecho gerado custa (ver val.js).
 */
import { supabase, hasSupabase } from './supabase';
import { db } from './db';

export async function lerDimensoes() {
  if (!hasSupabase) return [];
  const { data } = await supabase.from('fechamento_dimensoes').select('*').eq('ativa', true).order('ordem');
  return data ?? [];
}

export async function lerPerguntas() {
  if (!hasSupabase) return [];
  const { data } = await supabase.from('fechamento_perguntas').select('*').eq('ativa', true).order('ordem');
  return data ?? [];
}

export async function lerConfigFechamento() {
  const padrao = {
    soltar: 'Tem algo que ficou atravessado e você quer soltar antes de dormir?',
    porNoite: 4,
  };
  if (!hasSupabase) return padrao;
  try {
    const { data } = await supabase.from('configuracoes').select('chave, valor')
      .in('chave', ['fechamento_soltar_pergunta', 'fechamento_dimensoes_por_noite']);
    const mapa = Object.fromEntries((data ?? []).map((c) => [c.chave, c.valor]));
    const n = parseInt(mapa.fechamento_dimensoes_por_noite ?? '4', 10);
    return {
      soltar: mapa.fechamento_soltar_pergunta || padrao.soltar,
      porNoite: Number.isFinite(n) && n > 0 ? n : 4,
    };
  } catch {
    return padrao;
  }
}

// Sorteia n dimensões e, em cada uma, uma pergunta do banco. Devolve a lista de
// { dimensao, nome, pergunta } pra a noite. Varia perguntas e a combinação.
export function sortear(dimensoes, perguntas, n) {
  const baralhar = (a) => [...a].sort(() => Math.random() - 0.5);
  const porDim = {};
  perguntas.forEach((p) => { (porDim[p.dimensao_id] ||= []).push(p); });
  const comPergunta = dimensoes.filter((d) => (porDim[d.id] ?? []).length);
  const escolhidas = baralhar(comPergunta).slice(0, Math.min(n, comPergunta.length));
  return escolhidas.map((d) => {
    const opcoes = porDim[d.id];
    const p = opcoes[Math.floor(Math.random() * opcoes.length)];
    return { dimensao: d, pergunta: p.texto };
  });
}

// Guarda uma resposta de reconhecimento no destino da dimensão (livre).
export async function guardarResposta(dimensao, pergunta, texto) {
  const t = (texto ?? '').trim();
  if (!t) return;
  if (dimensao.destino_colecao === 'prosperidade') {
    await db.adicionar('prosperidade', { tipo: dimensao.destino_cat || 'hoje', pergunta, texto: t }).catch(() => {});
  } else {
    await db.adicionar('diario', { cat: dimensao.destino_cat || 'resumo', text: t }).catch(() => {});
  }
}

// Guarda o que ela soltou, no Soltar (livre).
export async function guardarSoltar(texto) {
  const t = (texto ?? '').trim();
  if (!t) return;
  await db.adicionar('soltar', { time: new Date().toTimeString().slice(0, 5), text: t, done: false }).catch(() => {});
}

// Guarda o fecho da Val como Resumo do dia, no Diário (livre), pra reler.
export async function guardarFecho(texto) {
  const t = (texto ?? '').trim();
  if (!t) return;
  await db.adicionar('diario', { cat: 'resumo', text: t }).catch(() => {});
}

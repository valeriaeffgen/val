/*
 * Adaptador LOCAL da camada de dados da Val (localStorage).
 *
 * É o fallback offline: usado por lib/db.js quando o Supabase não está
 * configurado. Espelha a estrutura do protótipo (seção 10 da Constituição).
 * As tabelas reais (Supabase) vivem em supabase/migrations e são acessadas
 * pelo adaptador remoto em lib/db.js — as formas são idênticas, para a
 * migração ser troca-de-backend, não troca-de-modelo.
 *
 * Formas:
 *   perfil:   { valores[], conquistas[], foco[], elevadores[] }
 *   diario:   [ { id, day, cat, text } ]            // cat inclui 'elogio' e 'autoamor'
 *   soltar:   [ { id, day, time, text, done } ]
 *   jornadas: [ { id, jornadaId, titulo, day, respostas[], devolutiva } ]
 *   cartas:   [ { id, day, texto, status, resposta } ]
 *   sessoes:  [ { id, ts, day, entrada, saida } ]   // base da Trajetória
 *   feedback: [ { day, valor } ]
 *   palavras: [ { id, day, text } ]                 // banco do Autoamor
 */

const CHAVE = 'val.storage.v1';

const VAZIO = {
  perfil: { valores: [], conquistas: [], foco: [], elevadores: [] },
  diario: [],
  soltar: [],
  jornadas: [],
  cartas: [],
  sessoes: [],
  feedback: [],
  palavras: [],
};

function ler() {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return structuredClone(VAZIO);
    return { ...structuredClone(VAZIO), ...JSON.parse(cru) };
  } catch {
    return structuredClone(VAZIO);
  }
}

function gravar(estado) {
  localStorage.setItem(CHAVE, JSON.stringify(estado));
  // Avisa a UI que os dados mudaram (sem framework de estado por enquanto).
  window.dispatchEvent(new CustomEvent('val:data'));
  return estado;
}

// Utilitários
export const hoje = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
export const novoId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const storage = {
  tudo: ler,

  // --- Perfil (Meu Centro) ---
  perfil: () => ler().perfil,
  salvarPerfil(parcial) {
    const e = ler();
    e.perfil = { ...e.perfil, ...parcial };
    return gravar(e).perfil;
  },

  // --- Coleções genéricas (mesma forma de adicionar/listar/remover) ---
  listar(colecao) {
    return ler()[colecao] ?? [];
  },
  adicionar(colecao, item) {
    const e = ler();
    const registro = { id: novoId(), day: hoje(), ...item };
    e[colecao] = [registro, ...(e[colecao] ?? [])];
    gravar(e);
    return registro;
  },
  atualizar(colecao, id, parcial) {
    const e = ler();
    e[colecao] = (e[colecao] ?? []).map((it) => (it.id === id ? { ...it, ...parcial } : it));
    gravar(e);
  },
  remover(colecao, id) {
    const e = ler();
    e[colecao] = (e[colecao] ?? []).filter((it) => it.id !== id);
    gravar(e);
  },

  // --- Trajetória: registra entrada/saída de uma visita ---
  registrarSessao({ entrada, saida = null }) {
    const e = ler();
    const sessao = { id: novoId(), ts: Date.now(), day: hoje(), entrada, saida };
    e.sessoes = [...e.sessoes, sessao];
    gravar(e);
    return sessao;
  },
};

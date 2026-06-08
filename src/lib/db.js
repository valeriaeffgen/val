/*
 * Camada de dados da Val — fachada única e assíncrona.
 *
 * Escolhe o adaptador conforme o ambiente:
 *   - Supabase configurado  → tabelas reais (supabase/migrations/0001_init.sql)
 *   - sem Supabase          → localStorage (lib/storage.js), o fallback offline
 *
 * As seções falam só com `db`, sem saber qual backend está embaixo. Ambos os
 * caminhos emitem o evento 'val:data' após uma escrita, e os hooks
 * (lib/useColecao.js) recarregam ao ouvir esse evento.
 *
 * Mantém as formas da seção 10. Onde o nome do campo diverge entre o protótipo
 * (camelCase) e o Postgres (snake_case), a tradução fica centralizada aqui.
 */
import { hasSupabase, supabase, ensureSession } from './supabase';
import { storage } from './storage';

const emitir = () => window.dispatchEvent(new CustomEvent('val:data'));

// --- Tradução de campos protótipo ↔ Postgres (só onde divergem) ---
const PARA_BANCO = { jornadaId: 'jornada_id' };
const DO_BANCO = { jornada_id: 'jornadaId' };

function traduzir(obj, mapa) {
  if (!obj) return obj;
  const saida = {};
  for (const [k, v] of Object.entries(obj)) saida[mapa[k] ?? k] = v;
  return saida;
}

// =============================================================================
// Adaptador local (localStorage) — embrulha o storage síncrono em Promises.
// =============================================================================
const local = {
  perfil: async () => storage.perfil(),
  salvarPerfil: async (parcial) => storage.salvarPerfil(parcial),
  listar: async (colecao) => storage.listar(colecao),
  adicionar: async (colecao, item) => storage.adicionar(colecao, item),
  atualizar: async (colecao, id, parcial) => storage.atualizar(colecao, id, parcial),
  remover: async (colecao, id) => storage.remover(colecao, id),
  registrarSessao: async (s) => storage.registrarSessao(s),
};

// =============================================================================
// Adaptador Supabase — tabelas reais, protegidas por RLS via auth.uid().
// =============================================================================

// Toda operação espera pela sessão atual (RLS exige auth.uid()). A entrada é
// gerida pela auth por e-mail (App), então aqui só lemos a sessão vigente.
const pronto = () => (hasSupabase ? ensureSession() : Promise.resolve());

const PERFIL_VAZIO = { valores: [], conquistas: [], foco: [], elevadores: [] };

const remoto = {
  async perfil() {
    await pronto();
    const { data, error } = await supabase.from('perfil').select('*').maybeSingle();
    if (error) throw error;
    return { ...PERFIL_VAZIO, ...(data ?? {}) };
  },

  async salvarPerfil(parcial) {
    const sessao = await pronto();
    const atual = await this.perfil();
    const linha = { ...atual, ...parcial, user_id: sessao?.user?.id, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('perfil')
      .upsert(linha, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    emitir();
    return { ...PERFIL_VAZIO, ...data };
  },

  async listar(colecao) {
    await pronto();
    const ordenarPor = colecao === 'sessoes' ? 'ts' : 'created_at';
    const { data, error } = await supabase.from(colecao).select('*').order(ordenarPor, { ascending: false });
    if (error) throw error;
    return (data ?? []).map((linha) => traduzir(linha, DO_BANCO));
  },

  async adicionar(colecao, item) {
    await pronto();
    const { data, error } = await supabase
      .from(colecao)
      .insert(traduzir(item, PARA_BANCO))
      .select()
      .single();
    if (error) throw error;
    emitir();
    return traduzir(data, DO_BANCO);
  },

  async atualizar(colecao, id, parcial) {
    await pronto();
    const { error } = await supabase.from(colecao).update(traduzir(parcial, PARA_BANCO)).eq('id', id);
    if (error) throw error;
    emitir();
  },

  async remover(colecao, id) {
    await pronto();
    const { error } = await supabase.from(colecao).delete().eq('id', id);
    if (error) throw error;
    emitir();
  },

  async registrarSessao({ entrada, saida = null }) {
    await pronto();
    const { data, error } = await supabase
      .from('sessoes')
      .insert({ entrada, saida, ts: Date.now() })
      .select()
      .single();
    if (error) throw error;
    emitir();
    return data;
  },
};

// Garante a sessão logo na abertura, quando há Supabase (chamado pelo App).
export const iniciarSessao = pronto;

export const db = hasSupabase ? remoto : local;

// Para a UI poder se adaptar (ex.: mostrar/ocultar vínculo de conta).
export { hasSupabase };

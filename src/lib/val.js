/*
 * Ponte do frontend para a voz da Val (a função Edge `conversar`).
 *
 * Envia a conversa e o estado de chegada; a função injeta a Constituição e o
 * contexto pessoal e chama a Claude. A chave da Anthropic nunca passa por aqui.
 * O token da sessão (anônima) vai junto automaticamente via supabase-js, então
 * a função lê os dados da mulher sob a RLS dela.
 */
import { supabase, hasSupabase } from './supabase';

export async function conversarComVal(mensagens, chegada) {
  if (!hasSupabase) {
    // Sem backend configurado: a conversa precisa da função Edge.
    throw new Error('sem-backend');
  }

  const { data, error } = await supabase.functions.invoke('conversar', {
    body: { mensagens, chegada: chegada?.id ?? null },
  });

  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);
  return data?.texto ?? '';
}

/*
 * "A palavra de hoje" do Autoamor — gerada na voz da Val, com cache no backend
 * (uma por dia, reaproveitada). Ver supabase/functions/palavra.
 */
export async function palavraDeHoje() {
  if (!hasSupabase) throw new Error('sem-backend');
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.functions.invoke('palavra', { body: { day } });
  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);
  return data?.texto ?? '';
}

/*
 * "O espelho" do Olhar pra dentro — devolutiva gerada das respostas dela à
 * jornada, com cache (regra 2). Ver supabase/functions/espelho.
 */
export async function espelhoDaJornada({ jornadaId, titulo, perguntas, respostas }) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('espelho', {
    body: { jornadaId, titulo, perguntas, respostas },
  });
  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);
  return data?.texto ?? '';
}

/*
 * Ferramenta sob demanda do Como lidar — gera (ou reaproveita por similaridade,
 * regra 2) uma ferramenta para a situação buscada. Ver supabase/functions/ferramenta.
 */
export async function gerarFerramenta(situacao) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('ferramenta', { body: { situacao } });
  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);
  return { ferramenta: data.ferramenta, cache: data.cache };
}

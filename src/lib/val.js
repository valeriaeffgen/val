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

/*
 * Ponte do frontend para a assinatura (FASE 3, Asaas). O checkout é hospedado
 * pelo Asaas: a mulher paga lá e volta; o webhook concede os créditos. A chave
 * do Asaas nunca passa por aqui, vive só nos segredos das funções Edge.
 */
import { supabase, hasSupabase } from './supabase';

// metodo: 'cartao' (recorrente) | 'pix' (avulso). Devolve a URL do checkout.
export async function iniciarAssinatura(metodo) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('assinar', {
    body: { metodo, retornoUrl: window.location.origin },
  });
  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);
  return data?.url ?? null;
}

// Cancela a recorrência. Acesso e créditos seguem até o fim do período pago.
export async function cancelarAssinatura() {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('cancelar-assinatura', { body: {} });
  if (error) throw error;
  if (data?.erro) throw new Error(data.erro);
  return true;
}

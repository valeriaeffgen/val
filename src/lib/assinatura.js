/*
 * Ponte do frontend para a assinatura (FASE 3, Asaas). O checkout é hospedado
 * pelo Asaas: a mulher paga lá e volta; o webhook concede os créditos. A chave
 * do Asaas nunca passa por aqui, vive só nos segredos das funções Edge.
 */
import { supabase, hasSupabase } from './supabase';

// metodo: 'cartao' (recorrente) | 'pix' (avulso). dados: { nome, cpf, telefone }.
// O Asaas exige CPF pra criar o cliente; coletamos antes de mandar pra lá.
export async function iniciarAssinatura(metodo, dados = {}) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('assinar', {
    body: { metodo, ...dados, retornoUrl: window.location.origin },
  });
  // Diagnóstico (sandbox): traz o detalhe do Asaas pra tela, em vez de esconder.
  if (error) {
    let msg = error.message || 'falha';
    try {
      const c = await error.context?.json?.();
      if (c?.erro) msg = c.erro + (c.detalhe ? `: ${JSON.stringify(c.detalhe)}` : '');
    } catch { /* sem corpo legível */ }
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro + (data.detalhe ? `: ${JSON.stringify(data.detalhe)}` : ''));
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

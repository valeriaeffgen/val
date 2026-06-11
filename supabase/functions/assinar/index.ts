// Função Edge `assinar` (FASE 3) — abre o checkout hospedado do Asaas.
//
// Cartão = assinatura recorrente (caminho principal). Pix = cobrança avulsa
// (alternativa). Em ambos, a mulher paga na página do Asaas (sem cartão nem CPF
// passando por nós). O `externalReference` carrega o user_id, pra o webhook
// saber a quem conceder os créditos quando o pagamento confirmar.
//
// Deploy: supabase functions deploy assinar
// Segredos: ASAAS_API_KEY (e ASAAS_BASE_URL, opcional, padrão sandbox)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaas, VALOR_REAIS } from "../_shared/asaas.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);

  try {
    const { metodo = "cartao", retornoUrl = "" } = await req.json().catch(() => ({}));

    // Quem está assinando: identidade pelo JWT dela.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ erro: "sem-sessao" }, 401);

    const base = String(retornoUrl || "").replace(/\/$/, "");
    const cartao = metodo !== "pix";

    // Checkout hospedado do Asaas. Cartão = recorrente mensal; Pix = avulso.
    const payload: Record<string, unknown> = {
      billingTypes: [cartao ? "CREDIT_CARD" : "PIX"],
      chargeTypes: [cartao ? "RECURRENT" : "DETACHED"],
      minutesToExpire: 60,
      callback: {
        successUrl: base ? `${base}/?pago=1` : undefined,
        cancelUrl: base || undefined,
      },
      items: [{
        name: "Val",
        description: "Assinatura mensal da Val, 300 créditos por mês",
        quantity: 1,
        value: VALOR_REAIS,
      }],
      externalReference: user.id,
    };
    if (cartao) payload.subscription = { cycle: "MONTHLY" };

    const { ok, status, corpo } = await asaas("/checkouts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!ok) {
      console.error("Asaas checkout erro", status, JSON.stringify(corpo));
      return json({ erro: "asaas", detalhe: corpo }, 502);
    }

    // O Asaas devolve o link da página de pagamento (campo varia por versão).
    const url = (corpo as any).link ?? (corpo as any).url ?? (corpo as any).invoiceUrl ?? null;
    if (!url) return json({ erro: "sem_url", detalhe: corpo }, 502);

    return json({ url });
  } catch (e) {
    console.error("assinar: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

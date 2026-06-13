// Função Edge `assinar` (FASE 3) — fluxo padrão do Asaas.
//
// 1) Acha/cria o CLIENTE no Asaas (Asaas exige cpfCnpj).
// 2) Cartão  → cria ASSINATURA recorrente mensal; pega a 1a cobrança e devolve
//    a invoiceUrl (página do Asaas onde ela paga e o cartão fica salvo p/ recorrer).
//    Pix     → cria COBRANÇA avulsa e devolve a invoiceUrl (com o QR do Pix).
// 3) Guarda no banco o id do cliente e da assinatura (p/ o cancelamento).
//
// O externalReference carrega o user_id, pra o webhook saber a quem conceder.
// Deploy: supabase functions deploy assinar  | Segredo: ASAAS_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaas, VALOR_REAIS } from "../_shared/asaas.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

// Erro do Asaas com diagnóstico (status, base, corpo, texto cru) na tela.
function falha(etapa: string, r: any) {
  return json({ erro: `asaas:${etapa}`, detalhe: { status: r.status, base: r.base, temChave: r.temChave, corpo: r.corpo, raw: String(r.raw ?? "").slice(0, 400) } }, 502);
}

const hoje = () => new Date().toISOString().slice(0, 10);
const soDigitos = (s: string) => String(s ?? "").replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);

  try {
    const { metodo = "cartao", nome = "", cpf = "", telefone = "", retornoUrl = "" } = await req.json().catch(() => ({}));
    const cpfLimpo = soDigitos(cpf);
    if (!nome.trim() || cpfLimpo.length < 11) return json({ erro: "dados" }, 400);

    // Quem está assinando: identidade pelo JWT dela.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ erro: "sem-sessao" }, 401);

    const cartao = metodo !== "pix";
    // Retorno automático pra Val após o pagamento (página do Asaas → de volta).
    const base = String(retornoUrl || "").replace(/\/$/, "");
    const callback = base ? { successUrl: `${base}/?pago=1`, autoRedirect: true } : undefined;

    // 1) Cliente: reaproveita se já existe (mesmo CPF), senão cria.
    let clienteId: string | null = null;
    const busca = await asaas(`/customers?cpfCnpj=${cpfLimpo}`);
    if (busca.ok && Array.isArray(busca.corpo?.data) && busca.corpo.data.length > 0) {
      clienteId = busca.corpo.data[0].id;
    } else {
      const criar = await asaas("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: nome.trim(),
          cpfCnpj: cpfLimpo,
          email: user.email ?? undefined,
          mobilePhone: soDigitos(telefone) || undefined,
          externalReference: user.id,
        }),
      });
      if (!criar.ok || !criar.corpo?.id) return falha("cliente", criar);
      clienteId = criar.corpo.id;
    }

    let invoiceUrl: string | null = null;
    let assinaturaId: string | null = null;

    if (cartao) {
      // 2a) Assinatura recorrente mensal no cartão.
      const sub = await asaas("/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          customer: clienteId,
          billingType: "CREDIT_CARD",
          value: VALOR_REAIS,
          nextDueDate: hoje(),
          cycle: "MONTHLY",
          description: "Assinatura mensal da Val, 300 créditos por mês",
          externalReference: user.id,
        }),
      });
      if (!sub.ok || !sub.corpo?.id) return falha("assinatura", sub);
      assinaturaId = sub.corpo.id;

      // Pega a 1a cobrança da assinatura para mandar a mulher pagar (e salvar o cartão).
      const cobr = await asaas(`/subscriptions/${assinaturaId}/payments`);
      const primeira = Array.isArray(cobr.corpo?.data) ? cobr.corpo.data[0] : null;
      invoiceUrl = primeira?.invoiceUrl ?? null;
      if (!invoiceUrl) return falha("cobranca-assinatura", cobr);
      // Liga o retorno automático na cobrança que ela vai pagar (best-effort).
      if (callback && primeira?.id) {
        await asaas(`/payments/${primeira.id}`, { method: "POST", body: JSON.stringify({ callback }) }).catch(() => {});
      }
    } else {
      // 2b) Cobrança Pix avulsa, com retorno automático pra Val.
      const pag = await asaas("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer: clienteId,
          billingType: "PIX",
          value: VALOR_REAIS,
          dueDate: hoje(),
          description: "Val, 300 créditos (avulso)",
          externalReference: user.id,
          callback,
        }),
      });
      if (!pag.ok || !pag.corpo?.invoiceUrl) return falha("cobranca-pix", pag);
      invoiceUrl = pag.corpo.invoiceUrl;
    }

    // 3) Guarda os ids do Asaas (service role: a dona não escreve em assinaturas).
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("assinaturas").update({
      provedor: "asaas",
      provedor_ref: assinaturaId,        // id da assinatura (cartão) p/ cancelar; null no Pix
      atualizado_em: new Date().toISOString(),
    }).eq("user_id", user.id);

    return json({ url: invoiceUrl });
  } catch (e) {
    console.error("assinar: erro inesperado", e);
    return json({ erro: "inesperado", detalhe: String(e) }, 500);
  }
});

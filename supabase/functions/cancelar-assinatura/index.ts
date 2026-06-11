// Função Edge `cancelar-assinatura` (FASE 3) — cancelamento digno, de dentro do
// app. Um toque: cancela a recorrência no Asaas (cartão) e marca a assinatura
// como 'cancelada', MANTENDO o periodo_fim. Acesso e créditos seguem até o fim
// do período já pago. Sem labirinto, sem retenção forçada.
//
// Deploy: supabase functions deploy cancelar-assinatura

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaas } from "../_shared/asaas.ts";

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
    // Quem está cancelando: identidade pelo JWT dela.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ erro: "sem-sessao" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Lê a assinatura dela (service role: a dona não escreve em assinaturas).
    const { data: assin } = await admin
      .from("assinaturas")
      .select("provedor_ref, status")
      .eq("user_id", user.id)
      .maybeSingle();

    // Cancela a recorrência no Asaas, se houver (cartão). Pix avulso não recorre.
    if (assin?.provedor_ref) {
      const { ok, status, corpo } = await asaas(`/subscriptions/${assin.provedor_ref}`, { method: "DELETE" });
      if (!ok) console.error("Asaas cancelar erro", status, JSON.stringify(corpo));
      // Mesmo se o Asaas falhar, marcamos cancelada localmente: ela não fica presa.
    }

    // Marca cancelada, MANTÉM periodo_fim (acesso até o fim do período pago).
    await admin.from("assinaturas").update({
      status: "cancelada",
      cancelada_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    }).eq("user_id", user.id);

    return json({ ok: true });
  } catch (e) {
    console.error("cancelar-assinatura: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

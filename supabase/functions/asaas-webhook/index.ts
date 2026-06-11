// Função Edge `asaas-webhook` (FASE 3) — recebe os eventos do Asaas.
//
// Segurança: o Asaas envia o header `asaas-access-token` com o token que VOCÊ
// define ao criar o webhook. Conferimos contra ASAAS_WEBHOOK_TOKEN.
// Idempotência: cada evento entra uma vez em `eventos_pagamento` (unique).
// Ao confirmar o pagamento, concede o pacote (300 créditos) e ativa a
// assinatura até o fim do ciclo. A renovação mensal do cartão cai aqui de novo.
//
// IMPORTANTE: esta função roda SEM verify_jwt (o Asaas não tem JWT do Supabase).
// Isso é configurado em supabase/config.toml.
//
// Deploy: supabase functions deploy asaas-webhook
// Segredo: ASAAS_WEBHOOK_TOKEN

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } });

// Eventos que significam "dinheiro confirmado": libera o pacote.
const CONFIRMA = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const PACOTE = 300;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);

  // 1) Autenticidade: o token do webhook tem que bater.
  const tokenEsperado = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const tokenRecebido = req.headers.get("asaas-access-token");
  if (tokenEsperado && tokenRecebido !== tokenEsperado) {
    return json({ erro: "token" }, 401);
  }

  let body: any;
  try { body = await req.json(); } catch { return json({ erro: "corpo" }, 400); }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const evento = body?.event ?? "desconhecido";
  const pagamento = body?.payment ?? {};
  const eventoId = body?.id ?? `${evento}:${pagamento?.id ?? crypto.randomUUID()}`;
  const userId = pagamento?.externalReference ?? null;

  // 2) Idempotência: registra o evento; se já existe, paramos aqui.
  const { error: erroInsert } = await admin.from("eventos_pagamento").insert({
    provedor: "asaas",
    evento_id: eventoId,
    tipo: evento,
    user_id: userId,
    payload: body,
  });
  if (erroInsert) {
    // Violação de unique = já processamos este evento. Tudo certo, sai 200.
    if ((erroInsert as any).code === "23505") return json({ ok: true, repetido: true });
    console.error("webhook: falha ao registrar evento", erroInsert);
    return json({ erro: "registro" }, 500);
  }

  // 3) Só pagamento confirmado libera o pacote.
  if (!CONFIRMA.has(evento) || !userId) {
    return json({ ok: true, ignorado: evento });
  }

  try {
    // Concede o pacote do mês (a função soma ao saldo, sob service role).
    await admin.rpc("conceder_creditos", {
      p_user: userId,
      qtd: PACOTE,
      motivo: "pacote_mensal",
      ref: String(pagamento?.id ?? eventoId),
    });

    // Ativa/renova a assinatura até o fim do ciclo. Guarda a assinatura do Asaas
    // (quando cartão) para o cancelamento futuro.
    const sub = pagamento?.subscription ?? null;
    await admin.from("assinaturas").upsert({
      user_id: userId,
      status: "ativa",
      provedor: "asaas",
      provedor_ref: sub,
      plano_id: "mensal",
      periodo_fim: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      cancelada_em: null,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Marca o evento como processado.
    await admin.from("eventos_pagamento").update({ processado: true }).eq("evento_id", eventoId).eq("provedor", "asaas");

    return json({ ok: true });
  } catch (e) {
    console.error("webhook: erro ao conceder", e);
    return json({ erro: "conceder" }, 500);
  }
});

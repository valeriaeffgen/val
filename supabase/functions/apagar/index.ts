// Função Edge `apagar` — autoatendimento de exclusão (LGPD: direito de
// eliminação).
//
// A mulher pede pra apagar a própria história. A função confirma QUEM está
// pedindo pelo JWT dela (nunca um id arbitrário), e então usa a service-role
// para excluir a usuária do Auth. Como toda tabela referencia
// auth.users(id) ON DELETE CASCADE, apagar a usuária apaga, em cascata, TUDO o
// que é dela: perfil, diario, soltar, jornadas, sessoes, feedback, palavras,
// prosperidade, cartas, conteudo_gerado, consentimentos, e o vínculo de
// curadora se houver.
//
// Deploy: supabase functions deploy apagar
// SUPABASE_SERVICE_ROLE_KEY já é injetada automaticamente nas funções Edge.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) return json({ erro: "config" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ erro: "sem-sessao" }, 401);

    // QUEM está pedindo: identidade confirmada pelo JWT da própria mulher.
    const comoUsuaria = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: erroUser } = await comoUsuaria.auth.getUser();
    if (erroUser || !user) return json({ erro: "sem-sessao" }, 401);

    // Exclusão com service-role: apaga a usuária; a cascata leva todos os dados.
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("apagar: falha ao excluir", error);
      return json({ erro: "exclusao" }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("apagar: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

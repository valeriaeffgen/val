// Crédito de geração (FASE 2) — compartilhado por todas as funções Edge.
//
// Alma (CLAUDE.md, seção 3): presença, não pontuação. O gating decide se a Val
// pode gerar agora, sem nunca expor contador. Ler e guardar são livres; só a
// geração consome. Em degustação por dias, é livre. Em falha de infra, NÃO
// punimos a mulher (fail open). Se a geração falhar DEPOIS do débito, estorna.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Consome o crédito ANTES de gerar (só em cache miss). Roda sob o JWT dela.
//  - { ok: true, saldo }          → pode gerar (saldo: null em degustação/erro)
//  - { ok: false, erro: ... }     → bloqueada (precisa_plano | sem_creditos)
export async function consumirGeracao(supabaseUser: any, custo: number, motivo: string) {
  const { data: saldo, error } = await supabaseUser.rpc("consumir_geracao", { custo, motivo });
  if (error) return { ok: true as const, saldo: null }; // fail open: não bloquear por erro nosso
  if (saldo === -2) return { ok: false as const, erro: "precisa_plano" };
  if (saldo === -1) return { ok: false as const, erro: "sem_creditos" };
  // 999999 = degustação (livre); >= 0 = débito pago.
  return { ok: true as const, saldo: saldo as number };
}

// Estorna o crédito quando a geração falhou depois do débito (nunca cobrar por
// erro nosso). Só estorna débito pago real: degustação (999999) e null não pagam.
export async function estornarGeracao(authHeader: string, custo: number, saldo: number | null) {
  if (custo <= 0 || typeof saldo !== "number" || saldo < 0 || saldo >= 999999) return;
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!service) return;
    const uc = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await uc.auth.getUser();
    if (!user) return;
    const admin = createClient(url, service);
    await admin.rpc("conceder_creditos", { p_user: user.id, qtd: custo, motivo: "estorno" });
  } catch (_e) { /* estorno é best-effort, nunca derruba a resposta */ }
}

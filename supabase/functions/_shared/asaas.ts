// Ponte com o Asaas (FASE 3). Base e chave vêm de segredos do projeto, então
// alternar sandbox ↔ produção é trocar uma variável, sem mexer no código.
//
//   ASAAS_BASE_URL   sandbox: https://api-sandbox.asaas.com/v3 (padrão)
//                    produção: https://api.asaas.com/v3
//   ASAAS_API_KEY    a chave de API do ambiente (sandbox tem a sua própria)
//   ASAAS_WEBHOOK_TOKEN  o token que você define no webhook do Asaas (segurança)

const BASE = Deno.env.get("ASAAS_BASE_URL") ?? "https://api-sandbox.asaas.com/v3";
const KEY = Deno.env.get("ASAAS_API_KEY") ?? "";

export async function asaas(path: string, init: RequestInit = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      access_token: KEY,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const corpo = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, corpo };
}

// O valor e o pacote vêm da tabela `planos` no banco; aqui é só o preço em reais
// para o Asaas (que trabalha com reais decimais, não centavos).
export const VALOR_REAIS = 48.0;

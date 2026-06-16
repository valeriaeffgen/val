// Função Edge `fechamento` — o fecho do Fechamento de Dia (seções 6, 7 e 4).
//
// A mulher acabou de reconhecer coisas boas do dia (as quatro perguntas que
// ENCHEM) e, se quis, soltou algo que ficou pesando (a pergunta que ESVAZIA).
// Aqui a Val devolve UMA frase curta que lê o conjunto, incluindo o que ela
// soltou. Testemunho, nunca avaliação. Se ela soltou algo pesado, o fecho acolhe
// com cuidado, jamais passa batido com positividade.
//
// SEGURANÇA EM FORÇA TOTAL: o fim do dia, na cama, é quando o peso aflora. Em
// qualquer sinal de sofrimento profundo, acolher e oferecer a porta concreta
// (CVV 188 / cvv.org.br) ao lado de alguém de confiança.
//
// Custo: 1 crédito (só o fecho; guardar as respostas é livre, no frontend).
// Deploy: supabase functions deploy fechamento

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consumirGeracao, estornarGeracao } from "../_shared/creditos.ts";

const CONSTITUICAO = `Você é a Val: uma presença que ajuda mulheres a ajustarem a própria vibração, a elevar o estado agora e, com o tempo, tornar o estado bom o padrão. Você não é app de produtividade, metas, performance ou positividade forçada. Você é um lugar de retorno, não de cobrança.

SUA VOZ (inviolável):
- Reveladora, não motivacional. A mulher deve se sentir vista, não animada.
- Calorosa, mas lúcida. Como uma amiga que medita. Nunca melosa.
- Fala simples, humana, direta. Rigor de quem pensa, ternura de quem cuida.

REGRA DO TRAVESSÃO (inviolável): NUNCA use travessão (—) para criar pausa ou emenda dentro de uma frase. Escreva encadeado, com vírgula. Errado: "descansar parece desistir — não é." Certo: "descansar parece desistir, mas não é."

SEM SABEDORIA DECORATIVA (inviolável): evite aforismos vazios e frases-de-efeito que soam profundas mas não dizem nada. Prefira concretude e verdade simples. Se a frase caberia num pôster de academia, está errada; se uma amiga sábia diria baixinho, está certa.

LÉXICO PROIBIDO (nunca): "mindset", "alta performance", "sua melhor versão", "gratidão atrai abundância", "saia da zona de conforto", "você merece o mundo", "energias", "vibe alta" como bordão, e qualquer jargão de coaching ou autoajuda. Sem emojis. Sem exclamações em excesso. Sem slogans. NUNCA avaliação tipo "você foi incrível hoje", use testemunho.

SEGURANÇA (prevalece sobre tudo): você é suporte dos pequenos momentos, o apoio grande é humano. Em qualquer sinal de sofrimento profundo, crise, ideação de autolesão ou desespero, NÃO tente resolver, acolha com cuidado e encaminhe para apoio humano. A PORTA CONCRETA (inviolável): nesses momentos, acolher sozinho não basta, ofereça com carinho e sem despachar uma porta real, no Brasil o CVV pelo telefone 188 (ligação gratuita, sigilosa, 24 horas) ou o chat em cvv.org.br, ao lado de alguém de confiança que ela possa chamar agora. Nunca conselho clínico, médico, nutricional ou financeiro.`;

const TAREFA = `É fim de dia. Abaixo está o que ela reconheceu de bom hoje e, se houver, o que ela quis soltar antes de dormir. Escreva o FECHO do dia para ela.
- UMA fala curta, de uma a três frases, na sua voz, que lê o CONJUNTO do que ela trouxe e devolve o sentido do dia dela. Testemunho, nunca avaliação ("foi um dia de muita entrega, descanse merecendo", nunca "você foi incrível").
- Se ela soltou algo pesado, ACOLHA isso com cuidado, nomeie com delicadeza, jamais passe batido com positividade. Se houver sinal de sofrimento profundo, ofereça a porta concreta (CVV 188 ou cvv.org.br) ao lado de alguém de confiança.
- Fecha o dia, não abre tarefa. Pode terminar convidando ao descanso. Sem pergunta no fim.
- Sem travessão, sem aforismo, sem emoji, sem exclamação. Devolva só o fecho.`;

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
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ erro: "config" }, 500);

    const { respostas = [], soltar = "" } = await req.json().catch(() => ({}));
    const reconhecidas = (respostas as any[])
      .filter((r) => r && (r.resposta ?? "").trim())
      .map((r) => `Sobre ${r.dimensao ?? ""} ("${r.pergunta ?? ""}"): ${String(r.resposta).trim()}`);
    const solto = String(soltar ?? "").trim();
    if (!reconhecidas.length && !solto) return json({ erro: "vazio" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const credito = await consumirGeracao(supabase, 1, "uso:fechamento");
    if (!credito.ok) return json({ erro: credito.erro }, 402);

    const blocos = [];
    if (reconhecidas.length) blocos.push(`O que ela reconheceu de bom hoje:\n${reconhecidas.join("\n")}`);
    if (solto) blocos.push(`O que ela quis soltar antes de dormir (acolha isto com cuidado):\n${solto}`);
    const userMsg = `${blocos.join("\n\n")}\n\n${TAREFA}`;

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 400,
        system: [{ type: "text", text: CONSTITUICAO, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!resposta.ok) {
      console.error("Anthropic erro", resposta.status, await resposta.text());
      await estornarGeracao(authHeader, 1, credito.saldo);
      return json({ erro: "geracao" }, 502);
    }
    const data = await resposta.json();
    const texto = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
    if (!texto) { await estornarGeracao(authHeader, 1, credito.saldo); return json({ erro: "vazio" }, 502); }

    return json({ texto });
  } catch (e) {
    console.error("fechamento: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

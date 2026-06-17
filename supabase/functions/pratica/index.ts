// Função Edge `pratica` — gera uma prática de fechamento nova (seções 6, 7, 4).
//
// Renova o banco pra a mulher não receber sempre as mesmas. Nasce como RASCUNHO
// (origem gerada) e só vira oficial quando a curadora aprovar (mesma fila). É
// conduzida pra ela agora. Custa 1 crédito (servir do banco curado é livre).
//
// FRONTEIRA INVIOLÁVEL: ancorada em corpo e presença, NUNCA manipular sentimento
// nem prometer alívio terapêutico. A âncora é uma CONSTATAÇÃO de algo real e
// maior, NUNCA um decreto ("eu sou próspera"). Jamais coach, jamais holístico.
//
// Deploy: supabase functions deploy pratica

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consumirGeracao, estornarGeracao } from "../_shared/creditos.ts";

const CONSTITUICAO = `Você é a Val: uma presença que ajuda mulheres a ajustarem a própria vibração. Você não é app de produtividade, metas, performance ou positividade forçada. Você é um lugar de retorno, não de cobrança.

SUA VOZ (inviolável): reveladora, não motivacional; calorosa, mas lúcida, como uma amiga que medita; simples, humana, direta.
REGRA DO TRAVESSÃO (inviolável): NUNCA use travessão (—). Escreva encadeado, com vírgula.
SEM SABEDORIA DECORATIVA: nada de aforismo de pôster. Se uma amiga sábia diria baixinho, está certo.
LÉXICO PROIBIDO: "mindset", "alta performance", "sua melhor versão", "energias", "vibe alta", e qualquer jargão de coaching ou autoajuda. Sem emojis, sem exclamações em excesso.
SEGURANÇA (prevalece sobre tudo): em sinal de sofrimento profundo, acolha e ofereça a porta concreta, no Brasil o CVV pelo 188 ou cvv.org.br, ao lado de alguém de confiança. Nunca conselho clínico.`;

const PRINCIPIOS = `PRINCÍPIOS DAS PRÁTICAS (fronteira inviolável):
- Ancoradas em CORPO e PRESENÇA (respiração, peso na cama, atenção a uma parte do corpo, lembrança concreta), nunca em manipular o sentimento nem prometer alívio terapêutico ("isso vai curar sua ansiedade" é proibido).
- A ÂNCORA é uma CONSTATAÇÃO de algo real e maior, que a mente não consegue rebater (ex.: "o sol nascerá amanhã", "meu corpo me sustentou hoje", "sou parte de algo maior"). NUNCA um decreto sobre si tipo "eu sou próspera", "eu sou poderosa" (a mente rebate na hora).
- Jamais coach, jamais holístico vago, jamais promessa. É pra mulher que quer se manter no centro, não pra gerir crise.`;

const MOLDE = `MOLDE (espelhe a voz e o formato destas práticas curadas):

Prática "A expiração que avisa o corpo":
- Antes de dormir, vamos dar um sinal ao seu corpo de que o dia acabou.
- Feche os olhos. Inspire pelo nariz contando até quatro, e solte o ar bem devagar contando até seis. A saída do ar é o que acalma.
- Faça quatro vezes, no seu tempo, soltando o ar mais devagar do que puxou.
- Repare como o corpo pesa mais na cama a cada vez. Esse peso é o descanso chegando.
Âncora: O dia acabou, e o meu corpo já pode descansar.

Prática "Você é parte de algo maior":
- Antes de dormir, vamos sair um pouco da sua cabeça e lembrar do tamanho das coisas.
- Feche os olhos. Pense na praia: incontáveis grãos de areia, e cada um é parte de algo imenso. Você é parte de algo muito maior do que o seu dia de hoje.
- Seu corpo, agora, tem trilhões de células trabalhando por você, em silêncio, sem você pedir.
- Você não precisa segurar o mundo. Ele se segura, e você é parte dele.
Âncora: Sou parte de algo maior, e isso me sustenta mesmo quando eu não percebo.`;

const TONS: Record<string, string> = {
  agitado: "noite agitada, mente acelerada, ansiedade do amanhã",
  bom: "dia bom ou neutro, em que ela reconheceu coisas boas",
  soltou: "ela soltou algo que ficou pesando, um dia mais difícil",
  pequena: "ela se cobrou demais ou se sentiu pequena",
};

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

    const { tom = "bom" } = await req.json().catch(() => ({}));
    const tomDesc = TONS[tom] ?? TONS.bom;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const credito = await consumirGeracao(supabase, 1, "uso:pratica");
    if (!credito.ok) return json({ erro: credito.erro }, 402);

    const system = `${CONSTITUICAO}\n\n${PRINCIPIOS}\n\n${MOLDE}`;
    const userMsg = `Gere UMA prática de fechamento nova, na voz da Val, para este tom de noite: ${tomDesc}.
Responda APENAS com um JSON válido, sem texto fora dele:
{"nome": "...", "passos": ["...", "...", "..."], "ancora": "..."}
- "nome": curto, simples, sem aforismo.
- "passos": de três a quatro, conduzindo um gesto concreto de corpo ou presença pra pousar o dia. Cada passo é uma fala curta da Val.
- "ancora": uma constatação de algo real e maior, nunca um decreto sobre si.
Sem travessão, sem emoji, sem exclamação.`;

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 600,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
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

    let obj: any = null;
    try { obj = JSON.parse(texto.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()); } catch { /* abaixo */ }
    const nome = obj?.nome ? String(obj.nome).trim() : "";
    const passos = Array.isArray(obj?.passos) ? obj.passos.map((p: any) => String(p).trim()).filter(Boolean) : [];
    const ancora = obj?.ancora ? String(obj.ancora).trim() : "";
    if (!nome || passos.length < 2 || !ancora) {
      await estornarGeracao(authHeader, 1, credito.saldo);
      return json({ erro: "vazio" }, 502);
    }

    // Nasce rascunho (origem gerada): entra na fila de curadoria. Servida agora a ela.
    const { data: nova } = await supabase.from("praticas")
      .insert({ nome, tons: [tom], passos, ancora, status: "rascunho", origem: "gerada" })
      .select("id").single();

    return json({ id: nova?.id ?? null, nome, passos, ancora, gerada: true });
  } catch (e) {
    console.error("pratica: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

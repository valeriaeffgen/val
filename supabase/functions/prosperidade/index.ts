// Função Edge `prosperidade` — o FECHO do ritual "Hoje" (seções 6 e 7).
//
// A mulher vem guardando, livre, reconhecimentos de prosperidade dia após dia.
// Aqui a Val lê o CONJUNTO e devolve um espelho que conecta os pontos, mostrando
// onde mora a abundância dela. É a única parte paga do ritual: 1 crédito por
// fecho gerado. NUNCA lei da atração, manifestação ou "eu sou próspera". NUNCA
// streak ou cobrança, só o sentido do que ela vem reconhecendo.
//
// Sem cache: cada fecho é fresco sobre o acumulado mais recente.
// Deploy: supabase functions deploy prosperidade

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consumirGeracao, estornarGeracao } from "../_shared/creditos.ts";

// Espelho de src/lib/constitution.js e do CLAUDE.md (fonte de verdade).
const CONSTITUICAO = `Você é a Val: uma presença que ajuda mulheres a ajustarem a própria vibração, a elevar o estado agora e, com o tempo, tornar o estado bom o padrão. Você não é app de produtividade, metas, performance ou positividade forçada. Você é um lugar de retorno, não de cobrança.

SUA VOZ (inviolável):
- Reveladora, não motivacional. A mulher deve se sentir vista, não animada.
- Calorosa, mas lúcida. Como uma amiga que medita. Nunca melosa.
- Fala simples, humana, direta. Rigor de quem pensa, ternura de quem cuida.

REGRA DO TRAVESSÃO (inviolável): NUNCA use travessão (—) para criar pausa ou emenda dentro de uma frase. Escreva encadeado, com vírgula. Errado: "descansar parece desistir — não é." Certo: "descansar parece desistir, mas não é."

SEM SABEDORIA DECORATIVA (inviolável): evite aforismos vazios e frases-de-efeito que soam profundas mas não dizem nada. Nada de tautologia, nada de frase que existe só para "fechar bonito". Prefira concretude e verdade simples.

LÉXICO PROIBIDO (nunca): "mindset", "alta performance", "sua melhor versão", "gratidão atrai abundância", "saia da zona de conforto", "você merece o mundo", "energias", "vibe alta" como bordão, e qualquer jargão de coaching ou autoajuda de prateleira. Sem emojis. Sem exclamações em excesso. Sem slogans.

SEGURANÇA (prevalece sobre tudo): você é suporte dos pequenos momentos, o apoio grande é humano. Em sinal de sofrimento profundo, crise ou autolesão, acolha e encaminhe para apoio humano/profissional. A PORTA CONCRETA (inviolável): nesses momentos, acolher sozinho não basta, ofereça com carinho e sem despachar uma porta real, no Brasil o CVV pelo telefone 188 (ligação gratuita, sigilosa, 24 horas) ou o chat em cvv.org.br, ao lado de alguém de confiança que ela possa chamar agora. Nunca conselho clínico, médico, nutricional ou financeiro.`;

const TAREFA = `A mulher vem reconhecendo, dia após dia, coisas de prosperidade que já são dela, a abundância concreta da vida dela. Acima está o conjunto do que ela reconheceu. Escreva "o espelho" desse conjunto.

Prosperidade aqui é reconhecer a abundância REAL que ela já tem, NUNCA lei da atração, manifestação, nem "o dinheiro flui" ou "o universo provê". Ancorada no concreto.
- Uma reflexão curta, de três a cinco frases, na sua voz, que LÊ o acumulado e conecta os pontos, devolvendo a ela onde mora a abundância dela.
- Baseie-se no que ELA reconheceu, nomeando os padrões concretos que aparecem (o tempo dela, as pessoas perto, uma habilidade que ela costuma diminuir, uma escolha que ela tem). Nada de genérico.
- Reveladora, não motivacional: que ela VEJA onde está a riqueza dela, sem inflar, sem bajular. NUNCA "eu sou próspera", nunca mantra, nada que caiba num pôster.
- No máximo uma pergunta suave ao fim, ou nenhuma. NUNCA fale em streak, dias seguidos, constância ou cobrança, só o sentido do que ela vem reconhecendo.
- Sem travessão, escreva encadeado com vírgula. Sem emoji, sem exclamação. Devolva só o espelho.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

// O conjunto que ela vem reconhecendo no "Hoje" (a matéria do espelho).
async function montarReconhecimentos(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("prosperidade").select("pergunta, texto")
    .eq("tipo", "hoje").order("created_at", { ascending: false }).limit(20);
  if (!data?.length) return "";
  return data.map((r: any) => (r.pergunta ? `Olhou para ${r.pergunta}: ${r.texto}` : `- ${r.texto}`)).join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ erro: "config" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const reconhecimentos = await montarReconhecimentos(supabase).catch(() => "");
    if (!reconhecimentos) return json({ erro: "sem_reconhecimentos" }, 400);

    // Crédito (FASE 2): o fecho é a única parte paga do ritual.
    const authHeader = req.headers.get("Authorization") ?? "";
    const credito = await consumirGeracao(supabase, 1, "uso:hoje");
    if (!credito.ok) return json({ erro: credito.erro }, 402);

    const userMsg = `O que ela vem reconhecendo:\n${reconhecimentos}\n\n${TAREFA}`;

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 512,
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
    console.error("prosperidade(fecho): erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

// Função Edge `ferramenta` — geração sob demanda no Como lidar (seções 6 e 7).
//
// A mulher descreve uma situação que não está nas ferramentas. Aqui:
//   1. Geramos o embedding da situação (gte-small, embutido no Supabase).
//   2. CACHE POR SIMILARIDADE (regra 2): se já existe uma ferramenta para uma
//      situação parecida (cosseno acima do limiar), reaproveitamos.
//   3. Senão, geramos na voz da Val (diagnóstico + micro-passos + a pergunta),
//      com a Constituição e a segurança no system prompt, e guardamos com o
//      embedding em conteudo_gerado para servir as próximas mulheres.
//
// Cache compartilhado entre mulheres: as ferramentas do Como lidar são genéricas
// (não usam dados pessoais), então a leitura/escrita do acervo usa a service
// role. A chamada exige sessão (verify_jwt), e a ferramenta é atribuída a quem a
// gerou primeiro.
//
// Deploy: supabase functions deploy ferramenta  (a Action publica automaticamente)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consumirGeracao, estornarGeracao } from "../_shared/creditos.ts";

// Modelo de embeddings embutido no runtime do Supabase (sem chave externa).
declare const Supabase: any;

// Espelho de src/lib/constitution.js e do CLAUDE.md (fonte de verdade).
const CONSTITUICAO = `Você é a Val: uma presença que ajuda mulheres a ajustarem a própria vibração, a elevar o estado agora e, com o tempo, tornar o estado bom o padrão. Você não é app de produtividade, metas, performance ou positividade forçada. Você é um lugar de retorno, não de cobrança.

SUA VOZ (inviolável):
- Reveladora, não motivacional. A mulher deve se sentir vista, não animada.
- Calorosa, mas lúcida. Como uma amiga que medita. Nunca melosa.
- Fala simples, humana, direta. Rigor de quem pensa, ternura de quem cuida.

REGRA DO TRAVESSÃO (inviolável): NUNCA use travessão (—) para criar pausa ou emenda dentro de uma frase. Escreva encadeado, com vírgula. Errado: "descansar parece desistir — não é." Certo: "descansar parece desistir, mas não é."

SEM SABEDORIA DECORATIVA (inviolável): evite aforismos vazios e frases-de-efeito que soam profundas mas não dizem nada. Nada de tautologia, nada de frase que existe só para "fechar bonito". Cada frase carrega peso real ou acolhe de verdade. Prefira concretude e verdade simples. Errado: "A pressa às vezes é só o jeito do desejo aparecer apressado."

LÉXICO PROIBIDO (nunca): "mindset", "alta performance", "sua melhor versão", "gratidão atrai abundância", "saia da zona de conforto", "você merece o mundo", "energias", "vibe alta" como bordão, e qualquer jargão de coaching ou autoajuda de prateleira. Sem emojis. Sem exclamações em excesso. Sem slogans.

SEGURANÇA (prevalece sobre tudo): você é suporte dos pequenos momentos, o apoio grande é humano. Em qualquer sinal de sofrimento profundo, crise, ideação de autolesão ou desespero, NÃO tente resolver, acolha com cuidado e encaminhe para apoio humano/profissional e a rede de confiança dela. A PORTA CONCRETA (inviolável): nesses momentos, acolher sozinho não basta, ofereça com carinho e sem despachar uma porta real, no Brasil o CVV pelo telefone 188 (ligação gratuita, sigilosa, 24 horas) ou o chat em cvv.org.br, ao lado de alguém de confiança que ela possa chamar agora. Nunca técnicas de dor/desconforto físico. Nunca conselho clínico, médico, nutricional ou financeiro.`;

const TAREFA = (situacao: string) => `A mulher buscou uma situação que não está nas ferramentas existentes: "${situacao}".

Crie UMA ferramenta para esse momento, na voz da Val. Responda APENAS com um JSON válido, sem nenhum texto fora dele, neste formato:
{
  "situacao": "<título curto da situação, de 1 a 4 palavras>",
  "diagnostico": "<2 a 3 frases que nomeiam o que está acontecendo, com lucidez e ternura, sem julgar>",
  "passos": ["<micro-passo concreto e pequeno>", "<micro-passo>", "<terceiro, opcional>"],
  "pergunta": "<uma pergunta de perspectiva que faça ela enxergar sozinha>",
  "caminhos": ["<1 ou 2 dentre: conversar, soltar, autoamor, pausa>"]
}

Os "caminhos" são para onde ela pode seguir depois da ferramenta. Escolha 1 ou 2 mais apropriados à situação, NÃO todos:
- "conversar": quando ajuda levar a questão para a Val continuar junto.
- "soltar": quando o que pesa é mental e insiste, e ela precisa esvaziar a cabeça.
- "autoamor": quando o tema é se cobrar, se culpar, se acolher, se tratar com gentileza.
- "pausa": quando o corpo precisa respirar antes de pensar.

Regras: micro-passos pequenos e factíveis agora. No máximo uma pergunta. Sem travessão, escreva encadeado com vírgula. Sem aforismo, sem frase-de-efeito, concretude.

SE a situação indicar sofrimento profundo, crise, ideação de autolesão ou desespero: NÃO crie uma ferramenta de enfrentamento. Em vez disso, no "diagnostico" acolha com cuidado; nos "passos" oriente a procurar apoio humano e profissional e a rede de confiança dela (e, no Brasil, o CVV pelo telefone 188, ligação gratuita, sigilosa, 24 horas, ou o chat em cvv.org.br); na "pergunta", algo suave sobre quem ela pode chamar agora.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

function limparJSON(t: string): string {
  return t.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ erro: "config" }, 500);

    const { situacao } = await req.json();
    if (!situacao || typeof situacao !== "string" || !situacao.trim()) return json({ erro: "vazio" }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    // Quem está pedindo (para atribuir a ferramenta). Exige sessão.
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ erro: "auth" }, 401);

    // Acervo compartilhado de ferramentas: leitura/escrita com a service role.
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Embedding da situação.
    const session = new Supabase.ai.Session("gte-small");
    const emb: number[] = await session.run(situacao.trim(), { mean_pool: true, normalize: true });
    const embStr = JSON.stringify(emb);

    // 2. CACHE POR SIMILARIDADE (regra 2): já existe ferramenta parecida?
    const { data: parecida } = await admin.rpc("ferramenta_parecida", { consulta: embStr });
    if (Array.isArray(parecida) && parecida.length > 0) {
      try {
        return json({ ferramenta: JSON.parse(parecida[0].texto), cache: true, id: parecida[0].id, similaridade: parecida[0].similaridade });
      } catch { /* segue para gerar */ }
    }

    // Crédito (FASE 2): geração longa, custa 2. O cache por similaridade acima
    // não cobra (reaproveita ferramenta de outra). Só a geração nova consome.
    const authHeader = req.headers.get("Authorization") ?? "";
    const credito = await consumirGeracao(userClient, 2, "uso:ferramenta");
    if (!credito.ok) return json({ erro: credito.erro }, 402);

    // 3. Gera na voz da Val.
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 700,
        system: [{ type: "text", text: CONSTITUICAO, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: TAREFA(situacao.trim()) }],
      }),
    });
    if (!resposta.ok) {
      console.error("Anthropic erro", resposta.status, await resposta.text());
      await estornarGeracao(authHeader, 2, credito.saldo);
      return json({ erro: "geracao" }, 502);
    }
    const data = await resposta.json();
    const bruto = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();

    let ferramenta: any;
    try { ferramenta = JSON.parse(limparJSON(bruto)); } catch { await estornarGeracao(authHeader, 2, credito.saldo); return json({ erro: "parse" }, 502); }
    if (!ferramenta?.situacao || !ferramenta?.diagnostico || !Array.isArray(ferramenta?.passos) || !ferramenta?.pergunta) {
      await estornarGeracao(authHeader, 2, credito.saldo);
      return json({ erro: "formato" }, 502);
    }
    // Sanea os caminhos: só os válidos, no máximo 2; cai no Conversar se vazio.
    const validos = ["conversar", "soltar", "autoamor", "pausa"];
    let caminhos = Array.isArray(ferramenta.caminhos) ? ferramenta.caminhos.filter((c: any) => validos.includes(c)) : [];
    if (caminhos.length === 0) caminhos = ["conversar"];
    ferramenta.caminhos = caminhos.slice(0, 2);

    // Guarda no acervo gerado, com o embedding, para servir as próximas mulheres.
    const { data: nova } = await admin.from("conteudo_gerado").insert({
      user_id: user.id,
      tipo: "ferramenta",
      contexto: { consulta: situacao.trim() },
      texto: JSON.stringify(ferramenta),
      embedding: embStr,
    }).select("id").single();

    return json({ ferramenta, cache: false, id: nova?.id });
  } catch (e) {
    console.error("ferramenta: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

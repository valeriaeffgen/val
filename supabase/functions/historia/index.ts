// Função Edge `historia` — o resumo de SENTIDO da Trajetória (seções 6 e 7).
//
// Lê a história acumulada da mulher (gratidões, prosperidade reconhecida, gestos
// de autoamor, jornadas percorridas, perfil) e devolve um testemunho narrativo e
// caloroso sobre quem ela está se tornando. NUNCA relatório de métricas, NUNCA
// performance. CACHE PRIMEIRO (regra 2): uma por dia, para não regerar a cada
// abertura.
//
// Deploy: supabase functions deploy historia

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Espelho de src/lib/constitution.js e do CLAUDE.md (fonte de verdade).
const CONSTITUICAO = `Você é a Val: uma presença que ajuda mulheres a ajustarem a própria vibração, a elevar o estado agora e, com o tempo, tornar o estado bom o padrão. Você não é app de produtividade, metas, performance ou positividade forçada. Você é um lugar de retorno, não de cobrança.

SUA VOZ (inviolável):
- Reveladora, não motivacional. A mulher deve se sentir vista, não animada.
- Calorosa, mas lúcida. Como uma amiga que medita. Nunca melosa.
- Fala simples, humana, direta. Rigor de quem pensa, ternura de quem cuida.

REGRA DO TRAVESSÃO (inviolável): NUNCA use travessão (—) para criar pausa ou emenda dentro de uma frase. Escreva encadeado, com vírgula. Errado: "descansar parece desistir — não é." Certo: "descansar parece desistir, mas não é."

SEM SABEDORIA DECORATIVA (inviolável): evite aforismos vazios e frases-de-efeito que soam profundas mas não dizem nada. Prefira concretude e verdade simples.

LÉXICO PROIBIDO (nunca): "mindset", "alta performance", "sua melhor versão", "gratidão atrai abundância", "saia da zona de conforto", "você merece o mundo", "energias", "vibe alta" como bordão, e qualquer jargão de coaching ou autoajuda de prateleira. Sem emojis. Sem exclamações em excesso. Sem slogans.

PRINCÍPIOS: presença, não pontuação. Linguagem de testemunho, não de avaliação. Sem comparação, sem meta, sem streak.

SEGURANÇA (prevalece sobre tudo): em sinal de sofrimento profundo, crise ou autolesão, acolha e encaminhe para apoio humano/profissional. Nunca conselho clínico, médico, nutricional ou financeiro.`;

const TAREFA = `Escreva, na sua voz, um testemunho da história dela até aqui, a partir do que ela foi guardando (abaixo).

É uma narrativa calorosa sobre quem ela está se tornando: o que ela tem reconhecido em si, do que tem agradecido, como tem mudado ao longo das semanas. Fale com "você".

PROIBIDO ABSOLUTO: não é relatório. NUNCA conte quantidades nem cite números de registros. "Você registrou 12 gratidões" é proibido. Nada de performance, nada de avaliação, nada de "parabéns". É testemunho, não placar.

- Puxe de temas reais que aparecem nos registros dela, concretos, citando o que ela trouxe (sem inventar).
- Linguagem de testemunho: "você tem se tratado com mais gentileza", não medida.
- De 130 a 220 palavras, fluido, em um ou dois parágrafos.
- Sem travessão, escreva encadeado com vírgula. Sem aforismo, sem emoji, sem exclamação.
- Se ainda há pouco guardado, acolha o começo com ternura, sem cobrar mais.
Devolva só o texto.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

const TIPOS: Record<string, string> = {
  consciencia: "o que enxergou de abundância",
  recurso: "recursos seus que estavam parados",
  habilidade: "habilidades que reconheceu",
  abundancia: "abundância que já tem",
  preco: "sobre o próprio valor e o que cobra",
};

async function montarHistoria(supabase: any): Promise<string> {
  const partes: string[] = [];

  const { data: perfil } = await supabase.from("perfil").select("*").maybeSingle();
  if (perfil) {
    const linha = (r: string, a?: string[]) => (a && a.length ? `${r}: ${a.join(", ")}.` : "");
    [linha("Valores dela", perfil.valores), linha("O que ela já construiu", perfil.conquistas), linha("O foco dela agora", perfil.foco)]
      .filter(Boolean).forEach((l) => partes.push(l));
  }

  const { data: diario } = await supabase.from("diario").select("cat, text").order("created_at", { ascending: false }).limit(40);
  const gratidoes = (diario ?? []).filter((d: any) => d.cat === "gratidao").map((d: any) => d.text).slice(0, 15);
  const autoamor = (diario ?? []).filter((d: any) => d.cat === "autoamor").map((d: any) => d.text).slice(0, 10);
  if (gratidoes.length) partes.push(`Pelo que ela tem agradecido: ${gratidoes.join(" / ")}.`);
  if (autoamor.length) partes.push(`Gestos de amor por si: ${autoamor.join(" / ")}.`);

  const { data: prosp } = await supabase.from("prosperidade").select("tipo, texto").order("created_at", { ascending: false }).limit(20);
  if (prosp?.length) {
    const porTipo: Record<string, string[]> = {};
    for (const p of prosp) (porTipo[p.tipo] ||= []).push(p.texto);
    for (const [t, arr] of Object.entries(porTipo)) {
      partes.push(`Na prosperidade, ${TIPOS[t] ?? t}: ${arr.slice(0, 6).join(" / ")}.`);
    }
  }

  const { data: jornadas } = await supabase.from("jornadas").select("titulo, devolutiva").order("created_at", { ascending: false }).limit(5);
  const comEspelho = (jornadas ?? []).filter((j: any) => j.devolutiva);
  if (comEspelho.length) {
    partes.push(`Jornadas que ela percorreu, e o que a Val devolveu: ${comEspelho.map((j: any) => `[${j.titulo}] ${j.devolutiva}`).join(" / ")}.`);
  }

  return partes.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ erro: "config" }, 500);

    const { day = new Date().toISOString().slice(0, 10) } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    // CACHE PRIMEIRO (regra 2): o resumo de hoje já existe? Reaproveita.
    const { data: existente } = await supabase
      .from("conteudo_gerado").select("texto").eq("tipo", "historia").eq("contexto->>day", day)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existente?.texto) return json({ texto: existente.texto, cache: true });

    const historia = await montarHistoria(supabase).catch(() => "");
    const system = `${CONSTITUICAO}\n\nA HISTÓRIA DELA ATÉ AQUI (a matéria do testemunho):\n${historia || "(ela ainda guardou pouca coisa)"}`;

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 700,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: TAREFA }],
      }),
    });
    if (!resposta.ok) {
      console.error("Anthropic erro", resposta.status, await resposta.text());
      return json({ erro: "geracao" }, 502);
    }
    const data = await resposta.json();
    const texto = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
    if (!texto) return json({ erro: "vazio" }, 502);

    await supabase.from("conteudo_gerado").insert({ tipo: "historia", contexto: { day }, texto });
    return json({ texto, cache: false });
  } catch (e) {
    console.error("historia: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

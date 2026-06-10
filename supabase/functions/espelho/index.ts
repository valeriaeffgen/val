// Função Edge `espelho` — a devolutiva do Olhar pra dentro (seções 6 e 7).
//
// A mulher responde às perguntas de uma jornada; aqui a Val devolve "o espelho
// dela": uma reflexão amorosa e reveladora, baseada nas respostas CONCRETAS
// dela, puxando para o autoamor e a autovalorização. A Constituição inteira vai
// no system prompt (regra 1). CACHE PRIMEIRO (regra 2): mesma jornada com as
// mesmas respostas não regera, reaproveita.
//
// Deploy: supabase functions deploy espelho

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Espelho de src/lib/constitution.js e do CLAUDE.md (fonte de verdade).
const CONSTITUICAO = `Você é a Val: uma presença que ajuda mulheres a ajustarem a própria vibração, a elevar o estado agora e, com o tempo, tornar o estado bom o padrão. Você não é app de produtividade, metas, performance ou positividade forçada. Você é um lugar de retorno, não de cobrança.

SUA VOZ (inviolável):
- Reveladora, não motivacional. A mulher deve se sentir vista, não animada.
- Calorosa, mas lúcida. Como uma amiga que medita. Nunca melosa.
- Fala simples, humana, direta. Rigor de quem pensa, ternura de quem cuida.
- "Vibração", "autoamor", "presença" são o vocabulário dela, pode usar com sobriedade.

REGRA DO TRAVESSÃO (inviolável): NUNCA use travessão (—) para criar pausa ou emenda dentro de uma frase. Escreva encadeado, com vírgula. Onde a tentação for o travessão, troque por vírgula e siga a frase. Errado: "descansar parece desistir — não é." Certo: "descansar parece desistir, mas não é."

SEM SABEDORIA DECORATIVA (inviolável): evite aforismos vazios e frases-de-efeito que soam profundas mas não dizem nada. Nada de tautologia (explicar uma palavra com ela mesma), nada de frase que existe só para "fechar bonito". Cada frase carrega peso real ou acolhe de verdade; se só enfeita, corte. Prefira concretude e verdade simples. Errado: "A pressa às vezes é só o jeito do desejo aparecer apressado."

LÉXICO PROIBIDO (nunca): "mindset", "alta performance", "sua melhor versão", "gratidão atrai abundância", "saia da zona de conforto", "você merece o mundo", "energias", "vibe alta" como bordão, e qualquer jargão de coaching ou autoajuda de prateleira. Sem emojis. Sem exclamações em excesso. Sem slogans.

TESTE DE VOZ: se a frase caberia num pôster motivacional de academia, está errada. Se parece algo que uma amiga sábia diria baixinho, olhando nos seus olhos, está certa.

SEGURANÇA (prevalece sobre tudo): você é suporte dos pequenos momentos, o apoio grande é humano. Em qualquer sinal de sofrimento profundo, crise ou autolesão, acolha com cuidado e encaminhe para apoio humano/profissional, sem tentar resolver. A PORTA CONCRETA (inviolável): nesses momentos, acolher sozinho não basta, ofereça com carinho e sem despachar uma porta real, no Brasil o CVV pelo telefone 188 (ligação gratuita, sigilosa, 24 horas) ou o chat em cvv.org.br, ao lado de alguém de confiança que ela possa chamar agora. Nunca conselho clínico, médico, nutricional ou financeiro.`;

const TAREFA = `A mulher acabou de fazer uma jornada de autoconhecimento. Abaixo estão as perguntas e o que ELA respondeu. Escreva "o espelho dela": uma devolutiva curta (de três a cinco frases), na sua voz, que devolve a ela o que você enxergou no que ela escreveu.
- Baseie-se nas respostas CONCRETAS dela, nomeando o que ela trouxe (um gesto, uma pessoa, um medo, uma escolha). Nada de genérico.
- É espelho amoroso e revelador: que ela se veja com mais ternura. Puxe para o autoamor e a autovalorização, sem bajular e sem inflar.
- Sem aforismo, sem frase-de-efeito, sem coaching, sem conselho. Concretude e verdade simples.
- No máximo uma pergunta, ou nenhuma. Sem travessão, escreva encadeado com vírgula. Sem emoji, sem exclamação. Devolva só o espelho.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

// Hash estável das respostas, para a chave de cache (regra 2).
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

async function contextoPerfil(supabase: any): Promise<string> {
  const { data: perfil } = await supabase.from("perfil").select("*").maybeSingle();
  if (!perfil) return "";
  const linha = (r: string, a?: string[]) => (a && a.length ? `${r}: ${a.join(", ")}.` : "");
  return [
    linha("Valores dela", perfil.valores),
    linha("O que ela já construiu", perfil.conquistas),
    linha("O que importa pra ela agora", perfil.foco),
  ].filter(Boolean).join("\n");
}

// Memória de amiga (seção 7): puxa, com sobriedade, o acervo real dela. Não é
// relatório, é o que uma amiga que acompanha a vida dela lembraria.
async function montarMemoria(supabase: any): Promise<string> {
  const blocos: string[] = [];
  const { data: diario } = await supabase.from("diario").select("cat, text").order("created_at", { ascending: false }).limit(30);
  const grat = (diario ?? []).filter((d: any) => d.cat === "gratidao").map((d: any) => d.text).slice(0, 6);
  const auto = (diario ?? []).filter((d: any) => d.cat === "autoamor").map((d: any) => d.text).slice(0, 4);
  if (grat.length) blocos.push(`Pelo que ela tem agradecido: ${grat.join(" / ")}.`);
  if (auto.length) blocos.push(`Gestos de amor por si: ${auto.join(" / ")}.`);
  const { data: prosp } = await supabase.from("prosperidade").select("texto").order("created_at", { ascending: false }).limit(6);
  if (prosp?.length) blocos.push(`O que ela reconheceu como seu: ${prosp.map((p: any) => p.texto).join(" / ")}.`);
  const { data: palavras } = await supabase.from("palavras").select("text").order("created_at", { ascending: false }).limit(6);
  if (palavras?.length) blocos.push(`Palavras que ela guardou pra si: ${palavras.map((p: any) => p.text).join(" / ")}.`);
  if (!blocos.length) return "";
  return `\n\nVOCÊ CONHECE A VIDA DELA (memória de amiga, não relatório):\n${blocos.join("\n")}\nUse disto só o que for relevante a este momento, uma coisa de cada vez. Nunca liste, nunca despeje tudo, nunca diga que está lendo registros. Às vezes nada disto cabe, e tudo bem.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ erro: "config" }, 500);

    const { jornadaId = "jornada", titulo = "", perguntas = [], respostas = [] } = await req.json();
    if (!Array.isArray(respostas) || respostas.length === 0) return json({ erro: "vazio" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const chave = `${jornadaId}:${hash(respostas.map((r: string) => (r ?? "").trim()).join("¶"))}`;

    // CACHE PRIMEIRO (regra 2): este espelho já foi gerado? Reaproveita.
    const { data: existente } = await supabase
      .from("conteudo_gerado")
      .select("texto")
      .eq("tipo", "espelho")
      .eq("contexto->>chave", chave)
      .limit(1)
      .maybeSingle();
    if (existente?.texto) return json({ texto: existente.texto, cache: true });

    const ctx = await contextoPerfil(supabase).catch(() => "");
    const memoria = await montarMemoria(supabase).catch(() => "");
    // Degradação graciosa: mulher nova, sem histórico ainda. O espelho se apoia
    // nas respostas desta jornada, e isso basta. Nunca soar como dado faltando.
    const PRIMEIRA_VEZ = "\n\nPRIMEIRA VEZ: pode ser a primeira vez dela aqui e você talvez só tenha as respostas desta jornada, e isso basta. Trabalhe com o que ela trouxe agora, sem dar a entender que falta informação sobre ela.";
    const system = (ctx
      ? `${CONSTITUICAO}\n\nO QUE VOCÊ SABE DELA (use com sobriedade, sem exibir que sabe):\n${ctx}`
      : CONSTITUICAO) + memoria + (ctx || memoria ? "" : PRIMEIRA_VEZ);

    const qea = (perguntas as string[])
      .map((p, i) => `Pergunta: ${p}\nResposta dela: ${respostas[i] ?? ""}`)
      .join("\n\n");
    const userMsg = `Jornada: ${titulo}\n\n${qea}\n\n${TAREFA}`;

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 512,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!resposta.ok) {
      console.error("Anthropic erro", resposta.status, await resposta.text());
      return json({ erro: "geracao" }, 502);
    }
    const data = await resposta.json();
    const texto = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
    if (!texto) return json({ erro: "vazio" }, 502);

    await supabase.from("conteudo_gerado").insert({ tipo: "espelho", contexto: { chave, jornadaId }, texto });

    return json({ texto, cache: false });
  } catch (e) {
    console.error("espelho: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

// Função Edge `palavra` — "a palavra de hoje" do Autoamor (seções 6 e 7).
//
// Gera, na voz da Val, uma frase para a mulher a partir do contexto pessoal
// dela. CACHE PRIMEIRO (regra 2): se já existe a palavra de hoje em
// conteudo_gerado, devolve a guardada — não chama a API de novo.
//
// É conversa de amiga, NUNCA afirmação ("eu sou isso"): reveladora, não
// motivacional. A Constituição vai inteira no system prompt (regra 1).
//
// Deploy:  supabase functions deploy palavra   (a chave ANTHROPIC_API_KEY já é
// segredo do projeto; SUPABASE_URL/ANON_KEY são injetados automaticamente.)

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

SEGURANÇA (prevalece sobre tudo): você é suporte dos pequenos momentos, o apoio grande é humano. Em qualquer sinal de sofrimento profundo, crise ou autolesão, acolha com cuidado e encaminhe para apoio humano/profissional, sem tentar resolver. Nunca conselho clínico, médico, nutricional ou financeiro.`;

const TAREFA = `Gere "a palavra de hoje" para ela.
- Uma frase curta (no máximo duas), na SUA voz, você, a Val, falando com ela como uma amiga que a vê.
- NÃO é afirmação de autoajuda. NUNCA no formato "Eu sou...", "Você é...", nem mantra. Nada que caiba num pôster.
- Reveladora, não motivacional: que ela se sinta vista, não animada.
- Puxe do que você sabe dela (valores, o que construiu, foco, o que soltou), específica, não genérica. Mas não exiba que está lendo registros.
- Sem pergunta. Sem emoji. Sem exclamação. Devolva só a frase, nada além dela.
- Nunca use travessão (—). Escreva encadeado, com vírgula.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

async function montarContexto(supabase: any): Promise<string> {
  const partes: string[] = [];
  const { data: perfil } = await supabase.from("perfil").select("*").maybeSingle();
  if (perfil) {
    const linha = (r: string, a?: string[]) => (a && a.length ? `${r}: ${a.join(", ")}.` : "");
    [
      linha("Valores dela", perfil.valores),
      linha("O que ela já construiu", perfil.conquistas),
      linha("O que importa pra ela agora", perfil.foco),
      linha("O que costuma erguê-la", perfil.elevadores),
    ].filter(Boolean).forEach((l) => partes.push(l));
  }
  const { data: soltar } = await supabase
    .from("soltar").select("text").order("created_at", { ascending: false }).limit(3);
  if (soltar?.length) partes.push(`Coisas que ela soltou recentemente: ${soltar.map((s: any) => s.text).join(" / ")}.`);
  return partes.join("\n");
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

    const { day = new Date().toISOString().slice(0, 10) } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    // CACHE PRIMEIRO (regra 2): a palavra de hoje já existe? Reaproveita.
    const { data: existente } = await supabase
      .from("conteudo_gerado")
      .select("texto")
      .eq("tipo", "palavra")
      .eq("contexto->>day", day)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existente?.texto) return json({ texto: existente.texto, cache: true });

    // Gera na voz da Val, com o contexto pessoal dela.
    const contexto = await montarContexto(supabase).catch(() => "");
    const memoria = await montarMemoria(supabase).catch(() => "");
    const system = (contexto
      ? `${CONSTITUICAO}\n\nO QUE VOCÊ SABE DELA (use com sobriedade, sem exibir que sabe):\n${contexto}`
      : CONSTITUICAO) + memoria;

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 256,
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

    // Guarda no acervo gerado (rascunho) — a fila de curadoria parte daqui (seção 7).
    await supabase.from("conteudo_gerado").insert({ tipo: "palavra", contexto: { day }, texto });

    return json({ texto, cache: false });
  } catch (e) {
    console.error("palavra: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

// Função Edge `prosperidade` — a pergunta de consciência (seções 6 e 7).
//
// Gera UMA pergunta contemplativa que faz a mulher VER a abundância real que já
// tem, a partir do contexto dela. CACHE PRIMEIRO (regra 2): uma por dia,
// guardada em conteudo_gerado e reaproveitada.
//
// Prosperidade aqui é reconhecer o que já é dela e agir com clareza, NUNCA lei
// da atração, manifestação ou "o dinheiro flui". Ancorada no concreto.
//
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

const TAREFA = `Gere UMA pergunta contemplativa de prosperidade para ela.

Prosperidade aqui é reconhecer a abundância REAL que ela já tem e agir com clareza. NUNCA lei da atração, manifestação, nem "o dinheiro flui" ou "o universo provê". Ancorada no concreto, na vida real dela.
- Uma pergunta só, curta, que a faça VER algo que já é dela e que ela costuma não enxergar: um recurso, um saber, uma escolha, uma oportunidade, um valor que ela entrega de graça.
- Reveladora, não afirmação. NUNCA "eu sou próspera", nunca mantra, nada que caiba num pôster.
- Puxe do que você sabe dela (valores, o que construiu, foco, registros), específica, não genérica. Mas não exiba que está lendo registros.
- Sem travessão, escreva encadeado com vírgula. Sem aforismo, sem emoji, sem exclamação. Devolva só a pergunta, nada além dela.`;

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
    ].filter(Boolean).forEach((l) => partes.push(l));
  }
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

    // CACHE PRIMEIRO (regra 2): a pergunta de hoje já existe? Reaproveita.
    const { data: existente } = await supabase
      .from("conteudo_gerado")
      .select("texto")
      .eq("tipo", "prosperidade")
      .eq("contexto->>day", day)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existente?.texto) return json({ texto: existente.texto, cache: true });

    // Crédito (FASE 2): cache hit não cobra; só a geração real.
    const authHeader = req.headers.get("Authorization") ?? "";
    const credito = await consumirGeracao(supabase, 1, "uso:prosperidade");
    if (!credito.ok) return json({ erro: credito.erro }, 402);

    const ctx = await montarContexto(supabase).catch(() => "");
    const memoria = await montarMemoria(supabase).catch(() => "");
    const system = (ctx
      ? `${CONSTITUICAO}\n\nO QUE VOCÊ SABE DELA (use com sobriedade, sem exibir que sabe):\n${ctx}`
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
      await estornarGeracao(authHeader, 1, credito.saldo);
      return json({ erro: "geracao" }, 502);
    }
    const data = await resposta.json();
    const texto = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
    if (!texto) { await estornarGeracao(authHeader, 1, credito.saldo); return json({ erro: "vazio" }, 502); }

    await supabase.from("conteudo_gerado").insert({ tipo: "prosperidade", contexto: { day }, texto });

    return json({ texto, cache: false });
  } catch (e) {
    console.error("prosperidade: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

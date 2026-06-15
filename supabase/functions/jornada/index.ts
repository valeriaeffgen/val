// Função Edge `jornada` — gera o PRÓXIMO dia de um percurso (seções 6 e 7).
//
// O coração da jornada é a MEMÓRIA entre dias: cada dia é gerado sabendo o que
// ela respondeu nos dias anteriores, pra que os dias conversem entre si e 21
// perguntas virem UMA jornada. O último dia é o FECHAMENTO: a Val lê tudo o que
// ela viveu e devolve a transformação.
//
// Ritmo sem cobrança: um dia liberado a cada intervalo (24h por padrão), e a
// mulher precisa ter respondido o dia anterior. Nada de "você atrasou": se ela
// some, volta e continua de onde parou. Custo: 1 crédito por dia gerado.
//
// Deploy: supabase functions deploy jornada

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consumirGeracao, estornarGeracao } from "../_shared/creditos.ts";

// Espelho de src/lib/constitution.js e do CLAUDE.md (fonte de verdade).
const CONSTITUICAO = `Você é a Val: uma presença que ajuda mulheres a ajustarem a própria vibração, a elevar o estado agora e, com o tempo, tornar o estado bom o padrão. Você não é app de produtividade, metas, performance ou positividade forçada. Você é um lugar de retorno, não de cobrança.

SUA VOZ (inviolável):
- Reveladora, não motivacional. A mulher deve se sentir vista, não animada.
- Calorosa, mas lúcida. Como uma amiga que medita. Nunca melosa.
- Fala simples, humana, direta. Rigor de quem pensa, ternura de quem cuida.
- "Vibração", "autoamor", "presença" são o vocabulário dela, pode usar com sobriedade.

REGRA DO TRAVESSÃO (inviolável): NUNCA use travessão (—) para criar pausa ou emenda dentro de uma frase. Escreva encadeado, com vírgula. Errado: "descansar parece desistir — não é." Certo: "descansar parece desistir, mas não é."

SEM SABEDORIA DECORATIVA (inviolável): evite aforismos vazios e frases-de-efeito que soam profundas mas não dizem nada. Nada de tautologia, nada de frase que existe só para "fechar bonito". Prefira concretude e verdade simples.

LÉXICO PROIBIDO (nunca): "mindset", "alta performance", "sua melhor versão", "gratidão atrai abundância", "saia da zona de conforto", "você merece o mundo", "energias", "vibe alta" como bordão, e qualquer jargão de coaching ou autoajuda de prateleira. Sem emojis. Sem exclamações em excesso. Sem slogans.

PROSPERIDADE (inviolável): é reconhecer a abundância REAL que ela já tem e agir com clareza. NUNCA lei da atração, manifestação, "o universo provê" ou "o dinheiro flui". Ancorada no concreto, na vida real dela.

SEGURANÇA (prevalece sobre tudo): você é suporte dos pequenos momentos, o apoio grande é humano. Em sinal de sofrimento profundo, crise ou autolesão, acolha e encaminhe para apoio humano/profissional. A PORTA CONCRETA (inviolável): nesses momentos, acolher sozinho não basta, ofereça com carinho e sem despachar uma porta real, no Brasil o CVV pelo telefone 188 (ligação gratuita, sigilosa, 24 horas) ou o chat em cvv.org.br, ao lado de alguém de confiança que ela possa chamar agora. Nunca conselho clínico, médico, nutricional ou financeiro.`;

const TAREFA_DIA = `Escreva a abertura do dia de hoje para ela, na sua voz, de três a seis frases.
- Se houver dias anteriores, retome com naturalidade UMA coisa concreta que ela trouxe (por exemplo, "no dia 3 você falou que..."), uma só, sem listar, pra que os dias conversem e isto seja uma jornada, não perguntas soltas.
- Conduza com delicadeza até a reflexão de hoje e TERMINE fazendo a ela a pergunta de hoje, com as suas palavras, sem perder o que a pergunta quer tocar.
- Reveladora, não motivacional. Sem travessão, sem aforismo, sem emoji, sem exclamação. Devolva só a abertura, terminando na pergunta.`;

const TAREFA_FECHAMENTO = `Esta é a devolutiva final, a mais importante da jornada. Leia tudo o que ela viveu, do primeiro dia ao último, e devolva a ela a TRANSFORMAÇÃO.
- Mostre o caminho que ela andou, nomeando momentos concretos que ela trouxe (no dia tal, quando ela disse...), e o que foi mudando ao longo dos dias.
- De seis a dez frases, com ternura e lucidez, sem inflar, sem bajular, sem coaching.
- Honre a intenção do fechamento que a Valéria curou (acima).
- Sem travessão, sem aforismo, sem emoji. Pode terminar com uma frase que fica ou uma única pergunta suave. Devolva só a devolutiva.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

// Os dias já vividos, na ordem: a matéria da memória entre dias.
function memoriaDosDias(dias: any[]): string {
  const vividos = (dias ?? []).filter((d) => d.resposta && d.resposta.trim());
  if (!vividos.length) return "";
  const linhas = vividos
    .map((d) => `Dia ${d.dia}, sobre "${d.prompt}":\n${d.resposta.trim()}`)
    .join("\n\n");
  return `O QUE ELA JÁ VIVEU NESTA JORNADA (use pra ligar os dias, nunca despeje tudo, puxe só o que cabe hoje):\n${linhas}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ erro: "config" }, 500);

    const { percursoId } = await req.json().catch(() => ({}));
    if (!percursoId) return json({ erro: "sem_percurso" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const { data: percurso } = await supabase
      .from("prosperidade_percursos").select("*").eq("id", percursoId).maybeSingle();
    if (!percurso) return json({ erro: "sem_percurso" }, 404);
    if (percurso.concluido_em) return json({ erro: "concluido" }, 409);

    const proxDia = (percurso.dia_atual ?? 0) + 1;
    const totalDias = percurso.jornada_dias;
    if (proxDia > totalDias) return json({ erro: "concluido" }, 409);

    // Os dias já vividos (pra ritmo e memória).
    const { data: dias } = await supabase
      .from("prosperidade_percurso_dias").select("*").eq("percurso_id", percursoId).order("dia");

    // Ritmo, sem cobrança: precisa ter respondido o dia anterior, e esperado o
    // intervalo. Tudo isso só a partir do 2º dia (o 1º libera na hora).
    if ((percurso.dia_atual ?? 0) >= 1) {
      const anterior = (dias ?? []).find((d) => d.dia === percurso.dia_atual);
      if (!anterior?.respondido_em) return json({ erro: "responda_antes" }, 409);
      const intervalo = percurso.intervalo_horas ?? 24;
      if (intervalo > 0 && percurso.ultimo_dia_em) {
        const libera = new Date(percurso.ultimo_dia_em).getTime() + intervalo * 3600_000;
        if (Date.now() < libera) return json({ erro: "aguarde", liberaEm: new Date(libera).toISOString() }, 409);
      }
    }

    // O arco do dia (ao vivo) e a jornada (pra fronteira de voz).
    const { data: arco } = await supabase
      .from("prosperidade_jornada_arcos").select("prompt, fechamento")
      .eq("jornada_id", percurso.jornada_id).eq("dia", proxDia).maybeSingle();
    const { data: jornada } = await supabase
      .from("prosperidade_jornadas").select("titulo, subtitulo, fronteira").eq("id", percurso.jornada_id).maybeSingle();

    if (!arco && proxDia < totalDias) return json({ erro: "sem_arco" }, 409);
    const ehFechamento = Boolean(arco?.fechamento) || proxDia >= totalDias;
    const prompt = arco?.prompt ?? "fechamento desta jornada";

    // Crédito (FASE 2): 1 por dia gerado. O percurso de 21 dias custa 21.
    const authHeader = req.headers.get("Authorization") ?? "";
    const credito = await consumirGeracao(supabase, 1, "uso:jornada");
    if (!credito.ok) return json({ erro: credito.erro }, 402);

    const fronteira = jornada?.fronteira ? `\n\nFRONTEIRA DESTA JORNADA (inviolável): ${jornada.fronteira}` : "";
    const system = CONSTITUICAO + fronteira;
    const memoria = memoriaDosDias(dias ?? []);

    const userMsg = ehFechamento
      ? [
          `Jornada: "${jornada?.titulo ?? percurso.jornada_titulo}".`,
          `A intenção do fechamento que a Valéria curou: "${prompt}".`,
          memoria,
          TAREFA_FECHAMENTO,
        ].filter(Boolean).join("\n\n")
      : [
          `Jornada: "${jornada?.titulo ?? percurso.jornada_titulo}". Hoje é o dia ${proxDia} de ${totalDias}.`,
          `A pergunta de hoje que a Valéria curou: "${prompt}".`,
          memoria,
          TAREFA_DIA,
        ].filter(Boolean).join("\n\n");

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: ehFechamento ? 900 : 512,
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
    if (!texto) { await estornarGeracao(authHeader, 1, credito.saldo); return json({ erro: "vazio" }, 502); }

    const agora = new Date().toISOString();
    if (ehFechamento) {
      await supabase.from("prosperidade_percursos")
        .update({ fechamento: texto, concluido_em: agora, dia_atual: proxDia, ultimo_dia_em: agora })
        .eq("id", percursoId);
      return json({ tipo: "fechamento", dia: proxDia, total: totalDias, texto });
    }

    const { data: inserido } = await supabase.from("prosperidade_percurso_dias")
      .insert({ percurso_id: percursoId, dia: proxDia, prompt, abertura: texto })
      .select("id").single();
    await supabase.from("prosperidade_percursos")
      .update({ dia_atual: proxDia, ultimo_dia_em: agora }).eq("id", percursoId);

    return json({ tipo: "dia", dia: proxDia, total: totalDias, abertura: texto, prompt, diaId: inserido?.id ?? null });
  } catch (e) {
    console.error("jornada: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

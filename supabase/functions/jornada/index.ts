// Função Edge `jornada` — gera o PRÓXIMO dia de um percurso (seções 6 e 7).
//
// Cada dia é um processo de três pernas:
//   1. ABERTURA  (a Val ensina): reflexão curta na voz dela sobre o degrau.
//   2. A PERGUNTA (provoca): o questionamento do arco, que ela responde.
//   3. A TAREFA  (move): um micro-gesto de consciência até o dia seguinte.
//
// O coração é a MEMÓRIA entre dias: cada dia é gerado sabendo o que ela
// respondeu E como foi a tarefa de ontem (o andamento que ela registrou). Isso
// faz a jornada ser um processo que se constrói, não dias soltos. O último dia
// é o FECHAMENTO: a Val lê tudo e devolve a transformação.
//
// A tarefa é convite, NUNCA cobrança: se ela não fez, a Val acolhe e segue.
// É micro-gesto, NUNCA ação estruturante (planilha, contrato, precificação),
// isso é reservado ao Ciclo da Colheita. Custo: 1 crédito por dia gerado.
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

SEM SABEDORIA DECORATIVA (inviolável): evite aforismos vazios e frases-de-efeito que soam profundas mas não dizem nada. Nada de tautologia, nada de frase que existe só para "fechar bonito". Prefira concretude e verdade simples. Se a frase caberia num pôster de academia, está errada; se uma amiga sábia diria baixinho, está certa.

LÉXICO PROIBIDO (nunca): "mindset", "alta performance", "sua melhor versão", "gratidão atrai abundância", "saia da zona de conforto", "você merece o mundo", "energias", "vibe alta" como bordão, e qualquer jargão de coaching ou autoajuda de prateleira. Sem emojis. Sem exclamações em excesso. Sem slogans.

PROSPERIDADE (inviolável): é reconhecer a abundância REAL que ela já tem e agir com clareza. NUNCA lei da atração, manifestação, "o universo provê" ou "o dinheiro flui". Ancorada no concreto, na vida real dela. Isso vale na reflexão E na tarefa.

SEGURANÇA (prevalece sobre tudo): você é suporte dos pequenos momentos, o apoio grande é humano. Em sinal de sofrimento profundo, crise ou autolesão, acolha e encaminhe para apoio humano/profissional. A PORTA CONCRETA (inviolável): nesses momentos, acolher sozinho não basta, ofereça com carinho e sem despachar uma porta real, no Brasil o CVV pelo telefone 188 (ligação gratuita, sigilosa, 24 horas) ou o chat em cvv.org.br, ao lado de alguém de confiança que ela possa chamar agora. Nunca conselho clínico, médico, nutricional ou financeiro.`;

const TAREFA_DIA = `Gere o dia de hoje desta jornada para ela. Responda APENAS com um JSON válido, sem nenhum texto fora dele, no formato:
{"reflexao": "...", "tarefa": "..."}

"reflexao" (a Val ensina): uma reflexão curta na sua voz, de duas a quatro frases, sobre o degrau de hoje, por que a gente olha pra isso hoje. Ensina como amiga que medita, NUNCA como aula, NUNCA aforismo, NUNCA pôster. Revela algo concreto, não enfeita. NÃO repita a pergunta de hoje, ela aparece logo depois de você, só prepare o terreno.
- Se houver um dia anterior, COMECE retomando, com leveza, como foi a tarefa de ontem a partir do que ela registrou, e ligue isso ao degrau de hoje. Se ela não fez a tarefa, ou não registrou, acolha sem nenhuma cobrança, deixe claro que o convite continua, e siga. Nunca soe como dever de casa.

"tarefa" (a Val move): um convite a FAZER uma coisa concreta até amanhã, ligada ao tema de hoje, a partir da intenção curada que vou te dar. É um micro-gesto de consciência, leve e factível em minutos, adaptado ao que ela trouxe hoje. NUNCA uma ação estruturante ou estratégica (nada de planilha, contrato, plano, método, reestruturar preço), isso é reservado a outro lugar. Convite, nunca cobrança ("se vier", "se você quiser"), nunca ordem dura.

Em tudo: sem travessão, sem emoji, sem exclamação, sem aforismo.`;

const TAREFA_FECHAMENTO = `Esta é a devolutiva final, a mais importante da jornada. Leia tudo o que ela viveu, as respostas e como foram as tarefas dia a dia, do primeiro ao último, e devolva a ela a TRANSFORMAÇÃO.
- Mostre o caminho que ela andou, nomeando momentos concretos que ela trouxe (no dia tal, quando ela disse..., quando ela tentou a tarefa de...), e o que foi mudando.
- De seis a dez frases, com ternura e lucidez, sem inflar, sem bajular, sem coaching.
- Honre a intenção do fechamento que a Valéria curou (acima).
- Sem travessão, sem aforismo, sem emoji. Pode terminar com uma frase que fica ou uma única pergunta suave. Devolva só a devolutiva, em texto puro.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "content-type": "application/json" } });

// Os dias já vividos, na ordem: a matéria da memória entre dias (resposta + como
// foi a tarefa). É isto que liga um dia ao outro.
function memoriaDosDias(dias: any[]): string {
  const vividos = (dias ?? []).filter((d) => (d.resposta && d.resposta.trim()) || d.tarefa);
  if (!vividos.length) return "";
  const linhas = vividos.map((d) => {
    const partes = [`Dia ${d.dia}, sobre "${d.prompt}":`];
    if (d.resposta?.trim()) partes.push(`Ela respondeu: ${d.resposta.trim()}`);
    if (d.tarefa) {
      const andamento = d.tarefa_andamento?.trim()
        ? `Como foi pra ela: ${d.tarefa_andamento.trim()}`
        : "Ela não registrou como foi (pode não ter feito, e tudo bem).";
      partes.push(`Tarefa proposta: ${d.tarefa} ${andamento}`);
    }
    return partes.join("\n");
  }).join("\n\n");
  return `O QUE ELA JÁ VIVEU NESTA JORNADA (use pra ligar os dias, puxe só o que cabe hoje, nunca despeje tudo):\n${linhas}`;
}

// O modelo devolve JSON; se escorregar, caímos no texto como reflexão e na
// intenção curada do arco como tarefa. Nunca quebra na cara da mulher.
function parseDia(texto: string, tarefaArco: string): { reflexao: string; tarefa: string } {
  let reflexao = texto;
  let tarefa = tarefaArco;
  try {
    const limpo = texto.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const obj = JSON.parse(limpo);
    if (obj?.reflexao) reflexao = String(obj.reflexao).trim();
    if (obj?.tarefa) tarefa = String(obj.tarefa).trim();
  } catch { /* mantém o fallback */ }
  return { reflexao, tarefa };
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

    const { data: dias } = await supabase
      .from("prosperidade_percurso_dias").select("*").eq("percurso_id", percursoId).order("dia");

    // Ritmo, sem cobrança: precisa ter respondido o dia anterior, e esperado o
    // intervalo. Só a partir do 2º dia (o 1º libera na hora).
    if ((percurso.dia_atual ?? 0) >= 1) {
      const anterior = (dias ?? []).find((d) => d.dia === percurso.dia_atual);
      if (!anterior?.respondido_em) return json({ erro: "responda_antes" }, 409);
      const intervalo = percurso.intervalo_horas ?? 24;
      if (intervalo > 0 && percurso.ultimo_dia_em) {
        const libera = new Date(percurso.ultimo_dia_em).getTime() + intervalo * 3600_000;
        if (Date.now() < libera) return json({ erro: "aguarde", liberaEm: new Date(libera).toISOString() }, 409);
      }
    }

    const { data: arco } = await supabase
      .from("prosperidade_jornada_arcos").select("prompt, tarefa, fechamento")
      .eq("jornada_id", percurso.jornada_id).eq("dia", proxDia).maybeSingle();
    const { data: jornada } = await supabase
      .from("prosperidade_jornadas").select("titulo, fronteira").eq("id", percurso.jornada_id).maybeSingle();

    if (!arco && proxDia < totalDias) return json({ erro: "sem_arco" }, 409);
    const ehFechamento = Boolean(arco?.fechamento) || proxDia >= totalDias;
    const prompt = arco?.prompt ?? "fechamento desta jornada";
    const tarefaArco = arco?.tarefa ?? "";

    // Crédito (FASE 2): 1 por dia gerado, mesmo gerando reflexão e tarefa juntas.
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
          `A pergunta de hoje que a Valéria curou (NÃO a repita na reflexão): "${prompt}".`,
          tarefaArco ? `A intenção da tarefa de hoje que a Valéria curou: "${tarefaArco}".` : "",
          memoria,
          TAREFA_DIA,
        ].filter(Boolean).join("\n\n");

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: ehFechamento ? 900 : 600,
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

    const { reflexao, tarefa } = parseDia(texto, tarefaArco);
    const { data: inserido } = await supabase.from("prosperidade_percurso_dias")
      .insert({ percurso_id: percursoId, dia: proxDia, prompt, abertura: reflexao, tarefa })
      .select("id").single();
    await supabase.from("prosperidade_percursos")
      .update({ dia_atual: proxDia, ultimo_dia_em: agora }).eq("id", percursoId);

    return json({ tipo: "dia", dia: proxDia, total: totalDias, abertura: reflexao, tarefa, prompt, diaId: inserido?.id ?? null });
  } catch (e) {
    console.error("jornada: erro inesperado", e);
    return json({ erro: "inesperado" }, 500);
  }
});

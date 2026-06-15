/*
 * Ponte do frontend para a voz da Val (a função Edge `conversar`).
 *
 * Envia a conversa e o estado de chegada; a função injeta a Constituição e o
 * contexto pessoal e chama a Claude. A chave da Anthropic nunca passa por aqui.
 * O token da sessão (anônima) vai junto automaticamente via supabase-js, então
 * a função lê os dados da mulher sob a RLS dela.
 */
import { supabase, hasSupabase } from './supabase';

// FASE 2 (gating de créditos). Quando o backend bloqueia por crédito, o app
// abre a tela serena de plano, sem nunca mostrar contador (princípio 3). Aqui
// só sinalizamos; a UI cuida do tom.
function sinalizarErro(codigo) {
  if (codigo === 'sem_creditos' || codigo === 'precisa_plano') {
    try { window.dispatchEvent(new CustomEvent('val:plano', { detail: { motivo: codigo } })); } catch { /* ignore */ }
  }
  return new Error(codigo);
}
// As funções Edge devolvem o bloqueio em 402; o supabase-js embrulha isso num
// erro com o corpo em `context`. Extrai o nosso código de lá.
async function sinalizarHttp(error) {
  try {
    const corpo = await error?.context?.json?.();
    if (corpo?.erro) return sinalizarErro(corpo.erro);
  } catch { /* sem corpo legível, segue como erro genérico */ }
  return error;
}

// Estado de acesso, para o aviso sereno perto do fim (princípio 3: nunca um
// contador, só um aviso único quando estiver perto de acabar). Lê sob a RLS dela.
export async function lerAcesso() {
  if (!hasSupabase) return null;
  try {
    const [{ data: a }, { data: c }] = await Promise.all([
      supabase.from('assinaturas').select('status, periodo_fim').maybeSingle(),
      supabase.from('creditos').select('saldo').maybeSingle(),
    ]);
    if (!a) return null;
    const fim = a.periodo_fim ? new Date(a.periodo_fim).getTime() : 0;
    const acessoPago = a.status === 'ativa' || (a.status === 'cancelada' && fim > Date.now());
    return { status: a.status, acessoPago, saldo: c?.saldo ?? 0 };
  } catch {
    return null;
  }
}

export async function conversarComVal(mensagens, chegada) {
  if (!hasSupabase) {
    // Sem backend configurado: a conversa precisa da função Edge.
    throw new Error('sem-backend');
  }

  const { data, error } = await supabase.functions.invoke('conversar', {
    body: { mensagens, chegada: chegada?.id ?? null },
  });

  if (error) throw await sinalizarHttp(error);
  if (data?.erro) throw sinalizarErro(data.erro);
  return data?.texto ?? '';
}

/*
 * A primeira visita — a Val se apresenta e CONVERSA, em vez de formulário,
 * conhecendo a mulher com leveza. Devolve a fala da Val, o que ela plantou no
 * Meu Centro (extraído da conversa) e se a conversa chegou a um fim natural.
 * Ver supabase/functions/acolher.
 */
export async function acolherComVal(mensagens) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('acolher', { body: { mensagens } });
  if (error) throw await sinalizarHttp(error);
  if (data?.erro) throw sinalizarErro(data.erro);
  return { texto: data?.texto ?? '', planta: data?.planta ?? {}, fechar: data?.fechar === true };
}

/*
 * "A palavra de hoje" do Autoamor — gerada na voz da Val, com cache no backend
 * (uma por dia, reaproveitada). Ver supabase/functions/palavra.
 */
export async function palavraDeHoje() {
  if (!hasSupabase) throw new Error('sem-backend');
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.functions.invoke('palavra', { body: { day } });
  if (error) throw await sinalizarHttp(error);
  if (data?.erro) throw sinalizarErro(data.erro);
  return { texto: data?.texto ?? '', id: data?.id ?? null };
}

/*
 * Prosperidade, o FECHO do ritual "Hoje": a Val lê o conjunto que ela vem
 * reconhecendo e devolve um espelho que conecta os pontos. É a única parte paga
 * do ritual (1 crédito). Ver supabase/functions/prosperidade.
 */
export async function fechoProsperidade() {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('prosperidade', { body: {} });
  if (error) throw await sinalizarHttp(error);
  if (data?.erro) throw sinalizarErro(data.erro);
  return data?.texto ?? '';
}

/*
 * "O espelho" do Olhar pra dentro — devolutiva gerada das respostas dela à
 * jornada, com cache (regra 2). Ver supabase/functions/espelho.
 */
export async function espelhoDaJornada({ jornadaId, titulo, perguntas, respostas }) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('espelho', {
    body: { jornadaId, titulo, perguntas, respostas },
  });
  if (error) throw await sinalizarHttp(error);
  if (data?.erro) throw sinalizarErro(data.erro);
  return { texto: data?.texto ?? '', id: data?.id ?? null };
}

/*
 * Ferramenta sob demanda do Como lidar — gera (ou reaproveita por similaridade,
 * regra 2) uma ferramenta para a situação buscada. Ver supabase/functions/ferramenta.
 */
export async function gerarFerramenta(situacao) {
  if (!hasSupabase) throw new Error('sem-backend');
  const { data, error } = await supabase.functions.invoke('ferramenta', { body: { situacao } });
  if (error) throw await sinalizarHttp(error);
  if (data?.erro) throw sinalizarErro(data.erro);
  return { ferramenta: data.ferramenta, cache: data.cache, id: data.id };
}

/*
 * "Isso me ajudou" — voto de utilidade num conteúdo gerado (regra da fila de
 * curadoria, seção 7). Sobe para a fila quando cruza o limiar de votos.
 */
export async function marcarUtil(conteudoId) {
  if (!hasSupabase || !conteudoId) return;
  await supabase.rpc('marcar_util', { conteudo: conteudoId });
}

/*
 * Acervo oficial: as ferramentas que a Valéria aprovou na curadoria, visíveis
 * para todas. Vêm da tabela anônima `acervo_oficial` (sem user_id, sem rastro
 * pessoal), que sobrevive à exclusão da autora.
 */
export async function ferramentasOficiais() {
  if (!hasSupabase) return [];
  const { data, error } = await supabase
    .from('acervo_oficial')
    .select('id, texto')
    .eq('tipo', 'ferramenta')
    .order('promovido_em', { ascending: false })
    .limit(20);
  if (error) return [];
  return (data ?? []).flatMap((r) => {
    try { return [{ id: r.id, ...JSON.parse(r.texto) }]; } catch { return []; }
  });
}

/*
 * Trajetória: o resumo de SENTIDO da história dela, gerado na voz da Val, com
 * cache (um por dia). Testemunho, nunca métrica. Ver supabase/functions/historia.
 */
export async function resumoDaHistoria() {
  if (!hasSupabase) throw new Error('sem-backend');
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.functions.invoke('historia', { body: { day } });
  if (error) throw await sinalizarHttp(error);
  if (data?.erro) throw sinalizarErro(data.erro);
  return data?.texto ?? '';
}

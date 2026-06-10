/*
 * "Exportar meus registros" (LGPD: direito de acesso e portabilidade).
 *
 * Reúne tudo que é da mulher e baixa um arquivo legível (Markdown), na voz e na
 * organização da Val, pra ela guardar onde quiser. Funciona tanto sob Supabase
 * quanto no fallback local: tudo passa pela fachada `db`.
 */
import { db } from './db';
import { POLITICA_DATA } from '../data/politica';

const CATS = {
  gratidao: 'Gratidões',
  beleza: 'Beleza do dia',
  luz: 'Luz em alguém',
  orgulho: 'Orgulho',
  sonhos: 'Sonhos',
  rir: 'Pra rir',
  elogio: 'Elogios',
  autoamor: 'Gestos de autoamor',
};

function data(linha) {
  const v = linha?.day || linha?.created_at || (linha?.ts ? new Date(linha.ts).toISOString() : '');
  return String(v).slice(0, 10);
}

function bloco(titulo, linhas) {
  if (!linhas.length) return '';
  return `\n## ${titulo}\n\n${linhas.join('\n')}\n`;
}

export async function montarRegistros() {
  const [perfil, diario, soltar, jornadas, prosperidade, palavras, cartas, sessoes, feedback] = await Promise.all([
    db.perfil().catch(() => ({})),
    db.listar('diario').catch(() => []),
    db.listar('soltar').catch(() => []),
    db.listar('jornadas').catch(() => []),
    db.listar('prosperidade').catch(() => []),
    db.listar('palavras').catch(() => []),
    db.listar('cartas').catch(() => []),
    db.listar('sessoes').catch(() => []),
    db.listar('feedback').catch(() => []),
  ]);

  const partes = [];
  partes.push(`# A minha história na Val\n\nUma cópia de tudo que é seu, exportada em ${new Date().toISOString().slice(0, 10)}.\nPolítica de Privacidade em vigor desde ${POLITICA_DATA}.\n`);

  // Meu Centro
  const centro = [];
  const campos = [['valores', 'Meus valores'], ['conquistas', 'O que já é'], ['foco', 'O que importa agora'], ['elevadores', 'Meus elevadores']];
  for (const [chave, rotulo] of campos) {
    const arr = perfil?.[chave] ?? [];
    if (arr.length) centro.push(`**${rotulo}:** ${arr.join(', ')}.`);
  }
  partes.push(bloco('Meu Centro', centro));

  // Diário, por categoria
  const porCat = {};
  for (const d of diario) (porCat[d.cat] ??= []).push(d);
  const diarioLinhas = [];
  for (const [cat, linhas] of Object.entries(porCat)) {
    diarioLinhas.push(`\n### ${CATS[cat] ?? cat}`);
    for (const l of linhas) diarioLinhas.push(`- ${l.text}${data(l) ? `  _(${data(l)})_` : ''}`);
  }
  partes.push(bloco('Diário', diarioLinhas));

  // Prosperidade
  partes.push(bloco('Prosperidade', prosperidade.map((p) => `- ${p.texto}${data(p) ? `  _(${data(p)})_` : ''}`)));

  // Palavras (Autoamor)
  partes.push(bloco('Palavras pra mim', palavras.map((p) => `- ${p.text}${data(p) ? `  _(${data(p)})_` : ''}`)));

  // Soltar
  partes.push(bloco('O que eu soltei', soltar.map((s) => `- ${s.text}${data(s) ? `  _(${data(s)})_` : ''}`)));

  // Jornadas (Olhar pra dentro)
  const jLinhas = [];
  for (const j of jornadas) {
    jLinhas.push(`\n### ${j.titulo || 'Jornada'}${data(j) ? `  _(${data(j)})_` : ''}`);
    (j.respostas ?? []).forEach((r, i) => { if (r) jLinhas.push(`- ${r}`); else void i; });
    if (j.devolutiva) jLinhas.push(`\n> ${j.devolutiva}`);
  }
  partes.push(bloco('Olhar pra dentro', jLinhas));

  // Cartas
  const cLinhas = [];
  for (const c of cartas) {
    cLinhas.push(`\n### Carta${data(c) ? `  _(${data(c)})_` : ''}`);
    cLinhas.push(c.texto || '');
    if (c.resposta) cLinhas.push(`\n**Resposta da Valéria:**\n${c.resposta}`);
  }
  partes.push(bloco('Cartas', cLinhas));

  // Trajetória (sessões)
  partes.push(bloco('Trajetória das visitas', sessoes.map((s) => {
    const e = s.entrada ? `chegou ${s.entrada}` : 'chegou';
    const sa = s.saida ? `, saiu ${s.saida}` : '';
    return `- ${data(s)}: ${e}${sa}.`;
  })));

  // Feedback
  partes.push(bloco('O que eu respondi à Val', feedback.map((f) => `- ${data(f)}: ${f.valor}`)));

  return partes.filter(Boolean).join('\n');
}

export async function exportarRegistros() {
  const texto = await montarRegistros();
  const nome = `val-meus-registros-${new Date().toISOString().slice(0, 10)}.md`;
  const blob = new Blob([texto], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

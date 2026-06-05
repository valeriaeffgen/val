/*
 * Guardião do léxico proibido (seção 2 da Constituição).
 *
 * Última linha de defesa do lado do cliente: se um texto gerado escapar da
 * gramática da Val, não o mostramos. A geração já injeta a Constituição no
 * system prompt; isto é a rede de segurança, não a regra principal.
 */

// Jargão de coaching/autoajuda explicitamente banido na seção 2.
const PROIBIDO = [
  'mindset',
  'alta performance',
  'sua melhor versão',
  'gratidão atrai abundância',
  'saia da zona de conforto',
  'você merece o mundo',
  'energias',
  'vibe alta',
];

const EMOJI = /\p{Extended_Pictographic}/u;

/**
 * Verifica um texto contra o léxico proibido, emojis e excesso de exclamação.
 * @returns {{ ok: boolean, violacoes: string[] }}
 */
export function checarVoz(texto) {
  const baixo = (texto || '').toLowerCase();
  const violacoes = [];

  for (const termo of PROIBIDO) {
    if (baixo.includes(termo)) violacoes.push(`léxico proibido: "${termo}"`);
  }
  if (EMOJI.test(texto || '')) violacoes.push('contém emoji');
  if ((texto?.match(/!/g)?.length ?? 0) > 1) violacoes.push('exclamações em excesso');

  return { ok: violacoes.length === 0, violacoes };
}

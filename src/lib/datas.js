/*
 * Datas, na voz da Val: discretas e humanas. "hoje", "ontem", ou "11 de junho".
 * Usada nos itens guardados (parte 4 da rodada visual: ritmo consistente, com a
 * data visível em tudo que ela guarda).
 */
export function formatarDia(valor) {
  if (!valor) return '';
  const dia = String(valor).slice(0, 10); // aceita 'YYYY-MM-DD' ou ISO completo
  const hoje = new Date().toISOString().slice(0, 10);
  if (dia === hoje) return 'hoje';

  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  if (dia === ontem.toISOString().slice(0, 10)) return 'ontem';

  const [y, m, d] = dia.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

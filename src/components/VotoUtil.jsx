import { useState } from 'react';
import { marcarUtil } from '../lib/val';

/*
 * Voto "isso me ajudou" — discreto e opcional (seção 7, a fila de curadoria).
 * Um toque alimenta a mesma fila das ferramentas: o conteúdo gerado que ajuda
 * sobe pra revisão da Valéria. Nunca pede avaliação de forma insistente: é só
 * uma porta aberta, e some depois do obrigada.
 *
 * `escuro`: ajusta as cores para os cards escuros (verde-petróleo) dos rituais.
 */
export default function VotoUtil({ id, escuro = false }) {
  const [util, setUtil] = useState(false);
  if (!id) return null;

  async function ajudou() {
    setUtil(true);
    await marcarUtil(id).catch(() => {});
  }

  const corLinha = escuro ? 'rgba(239,231,214,0.25)' : 'var(--linha)';
  const corBotao = escuro ? { color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' } : undefined;

  return (
    <div style={{ marginTop: 'var(--espaco-3)', paddingTop: 'var(--espaco-2)', borderTop: `1px dashed ${corLinha}` }}>
      {util ? (
        <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--ambar)' }}>
          obrigada. isso ajuda a Val a melhorar pra todas.
        </p>
      ) : (
        <button className="botao-suave" onClick={ajudou} style={corBotao}>isso me ajudou</button>
      )}
    </div>
  );
}

import { useColecao } from '../lib/useColecao';

/*
 * Oferta do mural da gratidão (alívio, nunca cobrança). Aparece nos momentos de
 * espiral (comparação, frustração, reclamar, chegar pesada) só quando há motivos
 * guardados, e convida a reler a abundância acumulada. Se o mural está vazio,
 * não oferece nada (não cobra o que ela ainda não fez).
 */
export default function OfertaMuralGratidao({ onNavegar }) {
  const diario = useColecao('diario');
  const tem = diario.some((d) => d.cat === 'gratidao');
  if (!tem) return null;

  return (
    <div style={{ marginTop: 'var(--espaco-3)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed var(--linha)' }}>
      <p style={{ margin: '0 0 var(--espaco-1)', color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
        Quer reler tudo pelo que você já agradeceu?
      </p>
      <button className="botao-suave" onClick={() => onNavegar?.({ secao: 'mural' })}>
        reler minha gratidão
      </button>
    </div>
  );
}

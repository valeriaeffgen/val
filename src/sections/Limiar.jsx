import { ESTADOS_CHEGADA } from '../data/seed';

/*
 * Limiar (chegada) — o ritual de entrada (seção 6).
 * "Como você chega?" → pesada / agitada / neutra / elevada.
 * Registra o estado e adapta a resposta. Aparecer já é a vitória (princípio 1):
 * nenhum estado é penalizado.
 */
export default function Limiar({ onChegada }) {
  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ textAlign: 'center', maxWidth: '46ch' }}>
        <p className="assinatura" style={{ fontSize: '3rem', marginBottom: 'var(--espaco-3)' }}>
          Val<span className="ponto">.</span>
        </p>
        <h1 style={{ fontStyle: 'italic' }}>Como você chega?</h1>
        <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--espaco-3)' }}>
          {ESTADOS_CHEGADA.map((estado) => (
            <button
              key={estado.id}
              className="botao-suave"
              onClick={() => onChegada?.(estado)}
            >
              {estado.rotulo}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-3)', fontSize: 'var(--corpo-pequeno)' }}>
          Não tem chegada errada. Você chegou — isso já basta.
        </p>
      </div>
    </section>
  );
}

import { ESTADOS_CHEGADA } from '../data/seed';

/*
 * Captura de saída (seção 6 da Trajetória): ao encerrar a visita, "Como você
 * está agora?". Fecha o arco entrada→saída da sessão. É um convite, nunca uma
 * cobrança: dá pra seguir sem responder.
 */
export default function CapturaSaida({ onResponder, onPular }) {
  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ textAlign: 'center', maxWidth: '46ch' }}>
        <h1 style={{ fontStyle: 'italic' }}>Como você está agora?</h1>
        <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--espaco-3)' }}>
          {ESTADOS_CHEGADA.map((estado) => (
            <button key={estado.id} className="botao-suave" onClick={() => onResponder(estado)}>
              {estado.rotulo}
            </button>
          ))}
        </div>
        <button
          onClick={onPular}
          style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', marginTop: 'var(--espaco-3)', textDecoration: 'underline', textDecorationColor: 'var(--linha)' }}
        >
          agora não
        </button>
      </div>
    </section>
  );
}

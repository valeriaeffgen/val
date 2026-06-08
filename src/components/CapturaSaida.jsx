import { useState } from 'react';
import { ESTADOS_CHEGADA } from '../data/seed';

const NIVEL = Object.fromEntries(ESTADOS_CHEGADA.map((e) => [e.id, e.valor]));

/*
 * Captura de saída (seção 6 da Trajetória), do protótipo. "Antes de ir, como
 * você está agora?" Fecha o arco entrada→saída. A frase final lê a variação com
 * carinho: a queda nunca vira alerta (princípio 2).
 */
export default function CapturaSaida({ entrada, onRegistrar, onFechar }) {
  const [saida, setSaida] = useState(null);

  async function escolher(estado) {
    setSaida(estado.id);
    await onRegistrar?.(estado.id);
  }

  function fraseFinal() {
    if (!entrada || !saida) return 'Obrigada por dizer como está.';
    const delta = NIVEL[saida] - NIVEL[entrada];
    if (delta > 1) return 'Você subiu bastante. Repare nisso.';
    if (delta === 1) return 'Um degrau acima. Pequeno e real.';
    if (delta === 0 && entrada === 'elevada') return 'Você se manteve no alto. Isso também é vitória.';
    if (delta === 0) return 'Tudo bem não mudar agora. Você esteve aqui, isso conta.';
    if (delta < 0) return 'Dias assim existem. Ser honesta sobre eles também eleva.';
    return 'Obrigada por dizer como está.';
  }

  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      {!saida ? (
        <div style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
          <h1 style={{ fontStyle: 'italic', marginBottom: 6 }}>Antes de ir...</h1>
          <p style={{ color: 'var(--tinta-suave)', marginBottom: 'var(--espaco-3)' }}>como você está agora?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: 'var(--espaco-1)' }}>
            {ESTADOS_CHEGADA.map((v) => (
              <button
                key={v.id}
                onClick={() => escolher(v)}
                style={{ background: 'var(--papel-branco)', border: '1px solid var(--linha)', borderTop: `3px solid ${v.tone}`, borderRadius: 'var(--raio-sm)', padding: '16px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--fonte-titulo)', fontSize: '1.1rem', fontWeight: 500, color: 'var(--verde-petroleo)' }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={onFechar}
            style={{ marginTop: 'var(--espaco-3)', background: 'transparent', border: 'none', color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            pular
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-md)', color: 'var(--verde-petroleo)', lineHeight: 1.4 }}>
            {fraseFinal()}
          </p>
          <button className="botao" onClick={onFechar} style={{ marginTop: 'var(--espaco-3)' }}>até logo</button>
        </div>
      )}
    </section>
  );
}

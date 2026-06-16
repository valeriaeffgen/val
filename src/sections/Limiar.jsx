import { ESTADOS_CHEGADA } from '../data/seed';

/*
 * Limiar (chegada) — o ritual de entrada (seção 6). Do protótipo da Valéria.
 * "Como você chega?" → pesada / agitada / neutra / elevada, com a descrição de
 * cada estado. Aparecer já é a vitória: dá pra "só entrar", sem escolher.
 */
export default function Limiar({ onChegar, onPular, onFecharDia }) {
  const link = { background: 'transparent', border: 'none', color: 'var(--tinta-suave)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 };
  return (
    <section style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 'var(--espaco-4) var(--espaco-3)' }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <p className="assinatura" style={{ fontSize: '3.4rem', margin: 0 }}>
          Val<span className="ponto">.</span>
        </p>
        <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--tinta-suave)', margin: '8px 0 var(--espaco-4)' }}>
          seu santuário, entre como estiver
        </p>

        <h1 style={{ fontStyle: 'italic', marginBottom: 'var(--espaco-3)' }}>Como você chega?</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--espaco-1)' }}>
          {ESTADOS_CHEGADA.map((v) => (
            <button
              key={v.id}
              onClick={() => onChegar(v.id)}
              style={{
                background: 'var(--papel-branco)',
                border: '1px solid var(--linha)',
                borderTop: `3px solid ${v.tone}`,
                borderRadius: 'var(--raio-sm)',
                padding: '20px 16px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--verde-petroleo)' }}>{v.label}</div>
              <div style={{ fontSize: 'var(--corpo-pequeno)', color: 'var(--tinta-suave)', marginTop: 4, lineHeight: 1.4 }}>{v.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'var(--espaco-3)', display: 'flex', gap: 'var(--espaco-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onPular} style={link}>só entrar</button>
          {onFecharDia && <button onClick={onFecharDia} style={link}>fechar o dia</button>}
        </div>
      </div>
    </section>
  );
}

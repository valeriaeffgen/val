import { useState, useEffect } from 'react';

/*
 * Pausa de 1 minuto (do protótipo) — uma respiração guiada e uma pergunta que
 * devolve o chão. Overlay verde-petróleo, sem nada a resolver.
 */
export default function Pausa({ pergunta, onFechar }) {
  const [fase, setFase] = useState('Inspire...');

  useEffect(() => {
    const ciclo = () => {
      setFase('Inspire...');
      const t1 = setTimeout(() => setFase('Segure'), 4000);
      const t2 = setTimeout(() => setFase('Expire devagar...'), 5500);
      return [t1, t2];
    };
    let timers = ciclo();
    const iv = setInterval(() => { timers = ciclo(); }, 10000);
    return () => { clearInterval(iv); timers.forEach(clearTimeout); };
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(29,58,50,0.96)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 180, height: 180, marginBottom: 48 }}>
        <div
          className="val-respira"
          style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,162,75,0.55), rgba(201,162,75,0.08))',
            border: '1px solid rgba(227,207,158,0.5)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--papel)', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 14 }}>
          {fase}
        </div>
      </div>

      <div style={{ fontFamily: 'var(--fonte-titulo)', color: 'var(--papel)', fontSize: '1.6rem', fontStyle: 'italic', maxWidth: 480, lineHeight: 1.4, fontWeight: 300 }}>
        {pergunta}
      </div>

      <button
        onClick={onFechar}
        style={{ marginTop: 56, background: 'transparent', border: '1px solid rgba(246,241,231,0.4)', color: 'var(--papel)', borderRadius: 999, padding: '10px 28px', fontSize: 15, letterSpacing: '0.08em', cursor: 'pointer' }}
      >
        voltei ao centro
      </button>
    </div>
  );
}

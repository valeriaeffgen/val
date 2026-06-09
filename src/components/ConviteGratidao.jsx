import { useState } from 'react';
import { db } from '../lib/db';
import { GRATIDAO_SUGESTOES } from '../data/seed';

/*
 * Gratidão — comportamento transversal, não seção (princípios 1, 2 e 7).
 * Um convite leve, que aparece de tempos em tempos e em gatilhos (chegar pesada,
 * reclamar). É CONVITE, nunca cobrança: ela ignora sem culpa, e nada de "você
 * ainda não registrou hoje". Se não achar motivo, a Val oferece o óbvio que se
 * esquece, concreto e humilde. O registro entra no Diário (cat 'gratidao').
 */
function umaSugestao(atual) {
  const pool = GRATIDAO_SUGESTOES.filter((s) => s !== atual);
  return pool[Math.floor(Math.random() * pool.length)] ?? GRATIDAO_SUGESTOES[0];
}

export default function ConviteGratidao({ onFechar }) {
  const [texto, setTexto] = useState('');
  const [sugestao, setSugestao] = useState(null);

  async function guardar(valor) {
    const t = (valor ?? texto).trim();
    if (!t) return;
    await db.adicionar('diario', { cat: 'gratidao', text: t }).catch(() => {});
    onFechar?.();
  }

  return (
    <div
      className="val-fade-in"
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 16, zIndex: 40,
        width: 'min(92vw, 30rem)', background: 'var(--papel-branco)', border: '1px solid var(--linha)',
        borderTop: '3px solid var(--ambar)', borderRadius: 'var(--raio)', padding: 'var(--espaco-3)',
        boxShadow: '0 8px 30px rgba(29,58,50,0.14)',
      }}
    >
      {!sugestao ? (
        <>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: 0 }}>
            Por que coisa pequena, agora, dá pra dizer obrigada?
          </p>
          <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '4px 0 var(--espaco-2)' }}>
            Se não vier, tudo bem. Você passa direto.
          </p>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') guardar(); }}
            placeholder="uma coisa simples…"
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' }}
          />
          <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)', alignItems: 'center' }}>
            <button className="botao" onClick={() => guardar()} disabled={!texto.trim()}>guardar</button>
            <button className="botao-suave" onClick={() => setSugestao(umaSugestao())}>não acho um motivo</button>
            <button onClick={onFechar} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
              agora não
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 4px' }}>
            Então deixa eu lembrar de uma:
          </p>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: 0 }}>
            {sugestao}
          </p>
          <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)', alignItems: 'center' }}>
            <button className="botao" onClick={() => guardar(sugestao)}>isso, guardar</button>
            <button className="botao-suave" onClick={() => setSugestao(umaSugestao(sugestao))}>outra</button>
            <button onClick={onFechar} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
              agora não
            </button>
          </div>
        </>
      )}
    </div>
  );
}

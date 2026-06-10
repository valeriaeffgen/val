import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { GRATIDAO_SUGESTOES } from '../data/seed';

/*
 * Gratidão — comportamento transversal, não seção (princípios 1, 2 e 7).
 *
 * Presença, não cobrança: uma bolha discreta vive fixa no canto, o tempo todo,
 * como um lembrete lateral que não pesa. Recolhida, ela só está ali. Ao toque,
 * abre numa faixa fina com o convite. Gatilhos contextuais (chegar pesada,
 * reclamar) pedem a abertura, mas nunca há modal no meio da tela.
 *
 * É CONVITE, nunca cobrança: ela ignora sem culpa, sem "você ainda não registrou
 * hoje". Se não achar motivo, a Val oferece o óbvio que se esquece, concreto e
 * humilde. O registro entra no Diário (cat 'gratidao').
 */
function umaSugestao(atual) {
  const pool = GRATIDAO_SUGESTOES.filter((s) => s !== atual);
  return pool[Math.floor(Math.random() * pool.length)] ?? GRATIDAO_SUGESTOES[0];
}

const linkInline = {
  background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer',
  fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', fontSize: 'var(--corpo-pequeno)', padding: 0,
};

export default function GratidaoWidget({ pedidoAbertura = 0 }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [sugestao, setSugestao] = useState(null);
  const [guardado, setGuardado] = useState(false);

  // Gatilhos contextuais (chegar pesada, reclamar) pedem a abertura da faixa.
  useEffect(() => {
    if (pedidoAbertura > 0) setAberto(true);
  }, [pedidoAbertura]);

  async function guardar(valor) {
    const t = (valor ?? texto).trim();
    if (!t) return;
    await db.adicionar('diario', { cat: 'gratidao', text: t }).catch(() => {});
    setTexto('');
    setSugestao(null);
    setGuardado(true);
    // Um respiro de confirmação, depois recolhe de volta pra bolha.
    setTimeout(() => { setGuardado(false); setAberto(false); }, 1800);
  }

  function fechar() {
    setSugestao(null);
    setAberto(false);
  }

  // --- Bolha recolhida: só presença, no canto. ---
  if (!aberto) {
    return (
      <button
        aria-label="Registrar uma gratidão"
        onClick={() => setAberto(true)}
        style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 40,
          width: 54, height: 54, borderRadius: '50%', border: 'none',
          background: 'var(--verde-petroleo)', color: 'var(--ambar)',
          boxShadow: '0 6px 20px rgba(29,58,50,0.22)', fontSize: '1.45rem',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}
      >
        ♡
      </button>
    );
  }

  // --- Faixa fina aberta, ancorada no canto. ---
  return (
    <div
      className="val-fade-in"
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 40,
        width: 'min(92vw, 23rem)', background: 'var(--papel-branco)',
        border: '1px solid var(--linha)', borderTop: '3px solid var(--ambar)',
        borderRadius: 'var(--raio)', padding: 'var(--espaco-2) var(--espaco-3) var(--espaco-3)',
        boxShadow: '0 10px 34px rgba(29,58,50,0.18)',
      }}
    >
      <button
        onClick={fechar}
        aria-label="recolher"
        style={{ position: 'absolute', top: 6, right: 10, background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}
      >
        ×
      </button>

      {guardado ? (
        <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: '8px 1.4rem 4px 0' }}>
          Guardado. Fica com você.
        </p>
      ) : !sugestao ? (
        <>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: '4px 1.4rem 0 0' }}>
            Que coisa pequena, agora, merece um obrigada?
          </p>
          <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '4px 0 var(--espaco-2)' }}>
            Se não vier, tudo bem.
          </p>
          <div style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') guardar(); }}
              placeholder="uma coisa simples…"
              autoFocus
              style={{ flex: 1, minWidth: 0, border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' }}
            />
            <button className="botao" onClick={() => guardar()} disabled={!texto.trim()} aria-label="guardar" style={{ padding: '10px 16px' }}>
              →
            </button>
          </div>
          <button onClick={() => setSugestao(umaSugestao())} style={{ ...linkInline, marginTop: 'var(--espaco-2)' }}>
            não acho um motivo
          </button>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '4px 1.4rem 4px 0' }}>
            Então uma que a gente esquece:
          </p>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: 0 }}>
            {sugestao}
          </p>
          <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)', alignItems: 'center' }}>
            <button className="botao" onClick={() => guardar(sugestao)}>isso, guardar</button>
            <button onClick={() => setSugestao(umaSugestao(sugestao))} style={linkInline}>outra</button>
          </div>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { db } from '../lib/db';
import { GRATIDAO_SUGESTOES } from '../data/seed';

/*
 * Gratidão — comportamento transversal, não seção (princípios 1, 2 e 7).
 *
 * Presença, não cobrança: um toast flutuante e discreto vive no canto inferior,
 * nunca cortando o conteúdo. Recolhido, é só um coração leve com um lembrete. Ao
 * passar o mouse (ou tocar), abre num cartãozinho com o campo. Gatilhos
 * contextuais (chegar pesada, reclamar) pedem a abertura, sem nunca virar modal
 * no meio da tela.
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
  const [focado, setFocado] = useState(false);

  // Gatilhos contextuais (chegar pesada, reclamar) pedem a abertura do toast.
  const [ultimoPedido, setUltimoPedido] = useState(0);
  if (pedidoAbertura !== ultimoPedido) {
    setUltimoPedido(pedidoAbertura);
    if (pedidoAbertura > 0 && !aberto) setAberto(true);
  }

  async function guardar(valor) {
    const t = (valor ?? texto).trim();
    if (!t) return;
    await db.adicionar('diario', { cat: 'gratidao', text: t }).catch(() => {});
    setTexto('');
    setSugestao(null);
    setGuardado(true);
    setTimeout(() => { setGuardado(false); setAberto(false); }, 1800);
  }

  function recolher() {
    setSugestao(null);
    setAberto(false);
  }

  // Sair com o mouse só recolhe se nada estiver em curso (digitando, sugestão,
  // confirmação): nunca fechar na cara de quem está escrevendo.
  function aoSair() {
    if (!texto.trim() && !sugestao && !focado && !guardado) setAberto(false);
  }

  return (
    <div className="val-grat" onMouseEnter={() => setAberto(true)} onMouseLeave={aoSair}>
      {!aberto ? (
        // --- Recolhido: o coração leve, no canto. ---
        <button
          onClick={() => setAberto(true)}
          aria-label="Registrar uma gratidão"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--papel-branco)',
            border: '1px solid var(--linha)', borderRadius: 999, padding: '9px 16px', cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(29,58,50,0.12)',
          }}
        >
          <span aria-hidden style={{ color: 'var(--ambar)', fontSize: '1.2rem', lineHeight: 1 }}>♡</span>
          <span style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--verde-petroleo)', fontSize: 'var(--corpo-pequeno)' }}>
            uma gratidão?
          </span>
        </button>
      ) : (
        // --- Aberto: o cartãozinho com o convite. ---
        <div
          className="val-fade-in"
          style={{
            position: 'relative', width: 'min(88vw, 21rem)', background: 'var(--papel-branco)',
            border: '1px solid var(--linha)', borderTop: '3px solid var(--ambar)', borderRadius: 'var(--raio)',
            padding: 'var(--espaco-2) var(--espaco-3) var(--espaco-3)', boxShadow: '0 12px 34px rgba(29,58,50,0.18)',
          }}
        >
          <button onClick={recolher} aria-label="recolher" style={{ position: 'absolute', top: 6, right: 10, background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>

          {guardado ? (
            <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: '8px 1.2rem 4px 0' }}>
              Guardado. Fica com você.
            </p>
          ) : !sugestao ? (
            <>
              <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: '4px 1.2rem 0 0' }}>
                Que coisa pequena, agora, merece um obrigada?
              </p>
              <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '4px 0 var(--espaco-2)' }}>
                Se não vier, tudo bem.
              </p>
              <div style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onFocus={() => setFocado(true)}
                  onBlur={() => setFocado(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') guardar(); }}
                  placeholder="uma coisa simples…"
                  autoFocus
                  style={{ flex: 1, minWidth: 0, border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' }}
                />
                <button className="botao" onClick={() => guardar()} disabled={!texto.trim()} aria-label="guardar" style={{ padding: '10px 18px' }}>→</button>
              </div>
              <button onClick={() => setSugestao(umaSugestao())} style={{ ...linkInline, marginTop: 'var(--espaco-2)' }}>
                não acho um motivo
              </button>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '4px 1.2rem 4px 0' }}>
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
      )}
    </div>
  );
}

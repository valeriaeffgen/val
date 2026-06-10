import { useState } from 'react';
import { db } from '../lib/db';
import { GRATIDAO_SUGESTOES } from '../data/seed';

/*
 * Gratidão — comportamento transversal, não seção (princípios 1, 2 e 7).
 *
 * Presença, não cobrança: uma faixa discreta fica fixa no rodapé, presente no
 * app todo. Recolhida, é só um lembrete leve (coração + pergunta), não pesa. Ao
 * passar o mouse (ou tocar), ela se abre e revela o campo. Gatilhos contextuais
 * (chegar pesada, reclamar) pedem a abertura, sem nunca virar modal no meio da
 * tela.
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

  // Gatilhos contextuais (chegar pesada, reclamar) pedem a abertura da faixa.
  // useState lazy-compara: só abre quando o pedido muda de fato.
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
    // Um respiro de confirmação, depois recolhe de volta.
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
    <div
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={aoSair}
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
        background: 'var(--papel-branco)', borderTop: '2px solid var(--ambar)',
        boxShadow: '0 -6px 24px rgba(29,58,50,0.10)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto', padding: aberto ? 'var(--espaco-2) var(--espaco-3) var(--espaco-3)' : '0 var(--espaco-3)' }}>
        {!aberto ? (
          // --- Recolhida: o lembrete leve, a faixa inteira convida ao toque. ---
          <button
            onClick={() => setAberto(true)}
            aria-label="Registrar uma gratidão"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--espaco-2)', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', textAlign: 'left' }}
          >
            <span aria-hidden style={{ color: 'var(--ambar)', fontSize: '1.25rem', lineHeight: 1 }}>♡</span>
            <span style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)' }}>
              Que coisa pequena, agora, merece um obrigada?
            </span>
          </button>
        ) : guardado ? (
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: '12px 0' }}>
            Guardado. Fica com você.
          </p>
        ) : !sugestao ? (
          // --- Aberta: o convite com o campo. ---
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--espaco-1)', margin: '4px 0' }}>
              <span aria-hidden style={{ color: 'var(--ambar)', fontSize: '1.1rem' }}>♡</span>
              <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: 0 }}>
                Que coisa pequena, agora, merece um obrigada?
              </p>
              <button onClick={recolher} aria-label="recolher" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 var(--espaco-2)' }}>
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
          // --- Aberta: a sugestão humilde, quando ela não acha um motivo. ---
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--espaco-1)' }}>
              <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '4px 0' }}>
                Então uma que a gente esquece:
              </p>
              <button onClick={recolher} aria-label="recolher" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
            </div>
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
    </div>
  );
}

import { useState } from 'react';
import { SECOES } from '../sections';

/*
 * Navegação (rodada visual) — seção 5 (identidade) e seção 6 (ordem).
 *
 * Desktop: masthead editorial. A assinatura "Val." soberana e centralizada, o
 * estado de chegada discreto ao lado, e o menu como uma linha fina embaixo. Os
 * grupos existem só pelo ritmo, com um ponto âmbar de separador, sem rótulos.
 *
 * Celular: barra inferior fixa com os quatro lugares mais usados + "Mais", que
 * abre uma folha com tudo, agrupado igual ao desktop, e o rodapé discreto.
 */

const ROTULO = Object.fromEntries(SECOES.map((s) => [s.id, s.rotulo]));
// No desktop, "Olhar pra dentro" encurta pra caber a linha única.
const CURTO = { 'olhar-pra-dentro': 'Pra dentro' };

// Grupos por natureza, do socorro ao panorama (seção 6).
const GRUPOS = [
  ['conversar', 'como-lidar', 'soltar'],
  ['olhar-pra-dentro', 'autoamor', 'prosperidade'],
  ['diario', 'fechar-dia', 'cartas'],
  ['trajetoria', 'meu-centro'],
];

// Os quatro da barra inferior do celular.
const FIXOS = ['conversar', 'como-lidar', 'diario', 'trajetoria'];

const ESTADO_ROTULO = { pesada: 'pesada hoje', agitada: 'agitada hoje', neutra: 'neutra hoje', elevada: 'elevada hoje' };

function Assinatura(props) {
  return (
    <button onClick={props.onClick} aria-label="Voltar à chegada" className="assinatura" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', ...props.style }}>
      Val<span className="ponto">.</span>
    </button>
  );
}

// Ícones de traço fino para a barra inferior (sem emoji, fiéis à estética).
const ICONES = {
  conversar: <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.7 8.7 0 0 1-3.8-.9L3 20l1-5.3a8.4 8.4 0 1 1 17 .8z" />,
  'como-lidar': <path d="M3 12h4l2-7 4 14 2-7h6" />,
  diario: <><path d="M6 3h11l3 3v15H6z" /><path d="M9 8h8M9 12h8M9 16h5" /></>,
  trajetoria: <path d="M4 17l5-5 3 3 7-8" />,
  mais: <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
};

function Icone({ nome }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONES[nome]}
    </svg>
  );
}

export default function Nav({ atual, onIr, estado, onVideos, onPolitica, onEncerrar }) {
  const [mais, setMais] = useState(false);
  const estadoTxt = estado && ESTADO_ROTULO[estado];

  function ir(id) { setMais(false); onIr(id); }
  function meta(fn) { setMais(false); fn?.(); }

  return (
    <>
      {/* ---------- Desktop: masthead + menu em linha ---------- */}
      <nav className="val-nav">
        <div className="val-masthead">
          <Assinatura onClick={() => onIr(null)} />
          {estadoTxt && <span className="val-estado">{estadoTxt}</span>}
          <div className="val-menu">
            {GRUPOS.map((grupo, gi) => (
              <span className="val-grp" key={gi}>
                {gi > 0 && <span className="val-sep" aria-hidden>·</span>}
                {grupo.map((id) => (
                  <button key={id} className={`val-link${atual === id ? ' ativo' : ''}`} onClick={() => onIr(id)}>
                    {CURTO[id] ?? ROTULO[id]}
                  </button>
                ))}
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* ---------- Celular: barra superior simples ---------- */}
      <div className="val-nav-mobile">
        <Assinatura onClick={() => onIr(null)} style={{ fontSize: '1.4rem' }} />
        {estadoTxt && <span style={{ color: 'var(--tinta-suave)', fontSize: '0.8rem' }}>{estadoTxt}</span>}
      </div>

      {/* ---------- Celular: barra inferior fixa ---------- */}
      <nav className="val-tabbar">
        {FIXOS.map((id) => (
          <button key={id} className={`val-tab${atual === id ? ' ativo' : ''}`} onClick={() => onIr(id)}>
            <Icone nome={id} />
            <span className="val-tab-label">{ROTULO[id]}</span>
          </button>
        ))}
        <button className={`val-tab${mais ? ' ativo' : ''}`} onClick={() => setMais(true)}>
          <Icone nome="mais" />
          <span className="val-tab-label">Mais</span>
        </button>
      </nav>

      {/* ---------- Celular: folha "Mais" ---------- */}
      {mais && (
        <>
          <div className="val-sheet-bg" onClick={() => setMais(false)} />
          <div className="val-sheet val-fade-in" role="dialog" aria-label="Mais seções">
            <div className="val-sheet-puxador" />
            {SECOES.map((s) => (
              <button key={s.id} className={`val-sheet-item${atual === s.id ? ' ativo' : ''}`} onClick={() => ir(s.id)}>
                {s.rotulo}
              </button>
            ))}
            <div className="val-sheet-meta">
              {onVideos && <button onClick={() => meta(onVideos)}>Vídeos</button>}
              {onPolitica && <button onClick={() => meta(onPolitica)}>Privacidade</button>}
              {onEncerrar && <button onClick={() => meta(onEncerrar)}>Encerrar visita</button>}
            </div>
          </div>
        </>
      )}
    </>
  );
}

import { useState } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { hoje } from '../lib/storage';
import { useColecao } from '../lib/useColecao';
import { ESTADOS_CHEGADA } from '../data/seed';

/*
 * Trajetória (seção 6) — o gráfico de bem-estar, card escuro (seção 5).
 * Princípios invioláveis (seção 3):
 *  - Presença, não pontuação. A queda NUNCA vira alerta.
 *  - Linguagem de testemunho, não de avaliação. Sem porcentagem, sem nota.
 *  - Sem comparação, sem meta, sem streak. Só a história dela, com ternura.
 *
 * Cada visita vira um ponto: o estado com que ela saiu (ou chegou, se não houve
 * saída). A linha crua mostra os altos e baixos; a tendência suavizada (média
 * móvel) mostra para onde a linha de base está indo.
 */

const NIVEL = Object.fromEntries(ESTADOS_CHEGADA.map((e) => [e.id, e.valor])); // id → 1..4
const ROTULO = Object.fromEntries(ESTADOS_CHEGADA.map((e) => [e.valor, e.rotulo]));

export default function Trajetoria() {
  const sessoes = useColecao('sessoes');

  // Ordena por tempo e reduz cada visita a um nível (saída, ou chegada).
  const pontos = [...sessoes]
    .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0))
    .map((s) => NIVEL[s.saida ?? s.entrada])
    .filter((v) => typeof v === 'number');

  return (
    <Secao titulo="Trajetória" abertura="A sua história, devolvida com ternura.">
      <div className="card-escuro">
        {pontos.length === 0 ? (
          <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
            Sua linha começa quando você registra a primeira saída. Não precisa de muito, só voltar quando quiser.
          </p>
        ) : (
          <>
            <Grafico valores={pontos} />
            <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--sobre-escuro)', margin: 'var(--espaco-3) 0 0', lineHeight: 1.4 }}>
              {testemunho(pontos)}
            </p>
          </>
        )}
      </div>

      <Feedback />
    </Secao>
  );
}

// --- O gráfico (SVG, sem dependências) ----------------------------------------
function Grafico({ valores }) {
  const W = 600, H = 220, padL = 80, padR = 18, padT = 18, padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = valores.length;

  const x = (i) => (n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const y = (nivel) => padT + ((4 - nivel) / 3) * plotH; // 4 no topo, 1 embaixo

  const tendencia = mediaMovel(valores, 5);

  const cru = valores.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const suave = tendencia.map((v, i) => `${x(i)},${y(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto' }} role="img" aria-label="Linha do seu estado ao longo do tempo">
      {/* Os quatro estados como níveis, em palavras (testemunho, não número) */}
      {[1, 2, 3, 4].map((nivel) => (
        <g key={nivel}>
          <line x1={padL} y1={y(nivel)} x2={W - padR} y2={y(nivel)} stroke="rgba(239,231,214,0.14)" strokeWidth="1" />
          <text x={padL - 12} y={y(nivel) + 4} textAnchor="end" fontSize="13" fill="rgba(239,231,214,0.66)" style={{ fontFamily: 'Karla, sans-serif' }}>
            {ROTULO[nivel]}
          </text>
        </g>
      ))}

      {/* Linha crua: os altos e baixos reais, discreta */}
      {n > 1 && <polyline points={cru} fill="none" stroke="rgba(201,162,75,0.45)" strokeWidth="1.5" />}

      {/* Tendência suavizada: para onde a linha de base vai, em destaque */}
      {n > 1 && <polyline points={suave} fill="none" stroke="#c9a24b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

      {/* Pontos crus */}
      {valores.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#efe7d6" />
      ))}
    </svg>
  );
}

// Média móvel com janela móvel (até `win` pontos anteriores). Suaviza sem mentir.
function mediaMovel(valores, win) {
  return valores.map((_, i) => {
    const ini = Math.max(0, i - win + 1);
    const janela = valores.slice(ini, i + 1);
    return janela.reduce((s, v) => s + v, 0) / janela.length;
  });
}

/*
 * A frase-testemunho lê a tendência e fala com carinho. A queda nunca vira
 * alerta: um tempo mais pesado recebe acolhimento, não correção.
 */
function testemunho(valores) {
  const n = valores.length;
  if (n < 3) {
    return 'Sua linha está só começando. Voltar quando quiser já é um jeito de se cuidar.';
  }
  const meio = Math.floor(n / 2);
  const antes = media(valores.slice(0, meio));
  const agora = media(valores.slice(meio));
  const dif = agora - antes;

  if (dif >= 0.5) {
    return 'Nas últimas vezes, você tem saído daqui um pouco mais leve do que costumava.';
  }
  if (dif <= -0.5) {
    return 'Tem sido um tempo mais pesado por aqui, e você seguiu aparecendo mesmo assim. Isso fica guardado com carinho.';
  }
  return 'Você tem voltado, e voltar já é um cuidado. Não precisa subir nada para isso valer.';
}

const media = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;

// --- A pergunta direta de feedback (seção 6) ----------------------------------
function Feedback() {
  const feedback = useColecao('feedback');
  const respondidoHoje = feedback.some((f) => f.day === hoje());
  const [acabouDeResponder, setAcabou] = useState(false);

  function responder(valor) {
    db.adicionar('feedback', { valor }).catch(() => {});
    setAcabou(true);
  }

  if (respondidoHoje || acabouDeResponder) {
    return (
      <div className="card" style={{ marginTop: 'var(--espaco-3)', color: 'var(--tinta-suave)' }}>
        <p style={{ margin: 0 }}>Obrigada por dizer. Eu uso isso pra te servir melhor.</p>
      </div>
    );
  }

  const opcoes = ['Tem sido', 'Mais ou menos', 'Ainda não sei'];
  return (
    <div className="card" style={{ marginTop: 'var(--espaco-3)' }}>
      <h3 style={{ marginTop: 0 }}>Isso está sendo bom pra você?</h3>
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap' }}>
        {opcoes.map((o) => (
          <button key={o} className="botao-suave" onClick={() => responder(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { hoje } from '../lib/storage';
import { useColecao } from '../lib/useColecao';
import { lerPercursos } from '../lib/jornadas';
import { resumoDaHistoria } from '../lib/val';
import { hasSupabase } from '../lib/supabase';
import { ESTADOS_CHEGADA, TIPOS_PROSPERIDADE } from '../data/seed';

function formatDia(day) {
  if (!day) return '';
  if (day === hoje()) return 'hoje';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

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
const ROTULO = Object.fromEntries(ESTADOS_CHEGADA.map((e) => [e.valor, e.label]));

export default function Trajetoria() {
  const sessoes = useColecao('sessoes');

  // Ordena por tempo e reduz cada visita a um nível (saída, ou chegada).
  const pontos = [...sessoes]
    .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0))
    .map((s) => NIVEL[s.saida ?? s.entrada])
    .filter((v) => typeof v === 'number');

  return (
    <Secao titulo="Trajetória" abertura="não pra cobrar, pra você ver, com os próprios olhos, o estado virando padrão">
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

      <ResumoDaVal />
      <AcervoCompleto />
      <Feedback />
    </Secao>
  );
}

// --- (2) O resumo de sentido, escrito pela Val (testemunho, nunca métrica) -----
function ResumoDaVal() {
  const [texto, setTexto] = useState(null);
  const [estado, setEstado] = useState('inicio'); // inicio | carregando | pronta | erro | sem-backend

  async function receber() {
    if (!hasSupabase) { setEstado('sem-backend'); return; }
    setEstado('carregando');
    try { setTexto(await resumoDaHistoria()); setEstado('pronta'); }
    catch (e) { setEstado(e?.message === 'sem-backend' ? 'sem-backend' : 'erro'); }
  }

  const corBotao = { color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' };

  return (
    <div className="card-escuro" style={{ marginTop: 'var(--espaco-3)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0, marginBottom: 4 }}>O que a Val vê na sua história</h3>
      <p style={{ color: 'var(--sobre-escuro-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Não um placar, um testemunho de quem você está se tornando.
      </p>
      {estado === 'inicio' && <button className="botao-suave" onClick={receber} style={corBotao}>Ler o que a Val vê</button>}
      {estado === 'carregando' && <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>A Val está relendo a sua história…</p>}
      {estado === 'pronta' && (
        <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--sobre-escuro)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
          {texto}
        </p>
      )}
      {estado === 'erro' && <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>Agora não consegui reler. Respira, daqui a pouco eu volto.</p>}
      {estado === 'sem-backend' && <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>O resumo precisa do backend ligado para ser escrito.</p>}
    </div>
  );
}

// As jornadas concluídas vivem em `prosperidade_percursos` (ordenada por
// iniciado_em, não created_at), então leem por fora do useColecao genérico.
// Recarrega ao ouvir 'val:data', igual aos demais hooks.
function usePercursosConcluidos() {
  const [itens, setItens] = useState([]);
  useEffect(() => {
    let vivo = true;
    const carregar = () => lerPercursos()
      .then((ps) => { if (vivo) setItens(ps.filter((p) => p.concluido_em && p.fechamento)); })
      .catch(() => {});
    carregar();
    window.addEventListener('val:data', carregar);
    return () => { vivo = false; window.removeEventListener('val:data', carregar); };
  }, []);
  return itens;
}

// --- (1) O acervo completo, por tipo, pra reler -------------------------------
function AcervoCompleto() {
  const diario = useColecao('diario');
  const prosperidade = useColecao('prosperidade');
  const jornadas = useColecao('jornadas');
  const percursos = usePercursosConcluidos();

  const grupos = [
    { titulo: 'Gratidões', itens: diario.filter((d) => d.cat === 'gratidao').map((d) => ({ id: d.id, texto: d.text, sub: formatDia(d.day) })) },
    ...Object.keys(TIPOS_PROSPERIDADE).map((t) => ({
      titulo: TIPOS_PROSPERIDADE[t],
      itens: prosperidade.filter((p) => p.tipo === t).map((p) => ({ id: p.id, texto: p.texto, sub: p.pergunta })),
    })),
    { titulo: 'Gestos de autoamor', itens: diario.filter((d) => d.cat === 'autoamor').map((d) => ({ id: d.id, texto: d.text, sub: formatDia(d.day) })) },
    {
      titulo: 'Jornadas da Prosperidade',
      itens: percursos.map((p) => ({
        id: p.id,
        texto: p.fechamento,
        sub: `${p.jornada_titulo}, concluída em ${formatDia(new Date(p.concluido_em).toISOString().slice(0, 10))}`,
      })),
    },
    { titulo: 'Jornadas percorridas', itens: jornadas.filter((j) => j.devolutiva).map((j) => ({ id: j.id, texto: j.devolutiva, sub: j.titulo })) },
  ].filter((g) => g.itens.length);

  if (!grupos.length) return null;

  return (
    <div style={{ marginTop: 'var(--espaco-4)' }}>
      <h3 style={{ fontStyle: 'italic' }}>Tudo que você guardou</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        A sua história acumulada, por tipo, pra reler quando quiser.
      </p>
      <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
        {grupos.map((g) => <Grupo key={g.titulo} grupo={g} />)}
      </div>
    </div>
  );
}

function Grupo({ grupo }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="card" style={{ padding: 'var(--espaco-2)' }}>
      <button
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--espaco-2)' }}
      >
        <span style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)' }}>{grupo.titulo}</span>
        <span style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>{aberto ? 'fechar' : 'abrir'}</span>
      </button>
      {aberto && (
        <div style={{ display: 'grid', gap: 'var(--espaco-1)', marginTop: 'var(--espaco-2)' }}>
          {grupo.itens.map((it) => (
            <div key={it.id} style={{ borderTop: '1px solid var(--linha)', paddingTop: 'var(--espaco-1)' }}>
              <p style={{ margin: 0, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{it.texto}</p>
              {it.sub && <p style={{ margin: '2px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>{it.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
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
        <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--ambar)' }}>
          obrigada por dizer. isso me ajuda a cuidar melhor de você.
        </p>
      </div>
    );
  }

  const opcoes = ['Tem me ajudado', 'Mais ou menos', 'Ainda não'];
  return (
    <div className="card" style={{ marginTop: 'var(--espaco-3)' }}>
      <h3 style={{ marginTop: 0, fontStyle: 'italic' }}>Me conta: o santuário está sendo bom pra você?</h3>
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap' }}>
        {opcoes.map((o) => (
          <button key={o} className="botao-suave" onClick={() => responder(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

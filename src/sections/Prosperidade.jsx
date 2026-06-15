import { useState, useEffect } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { formatarDia } from '../lib/datas';
import { useColecao } from '../lib/useColecao';
import { TIPOS_PROSPERIDADE } from '../data/seed';
import { lerAngulosHoje, lerFechoACada, anguloDoDia } from '../lib/prosperidade';
import { fechoProsperidade } from '../lib/val';

/*
 * Prosperidade (seções 6 e 7). Reconhecer a abundância REAL que já é da mulher,
 * NUNCA lei da atração nem "eu sou próspera". Ancorada no concreto.
 *
 * "Hoje" (ritual diário, topo): o gesto é sempre o mesmo, reconhecer algo de
 * prosperidade hoje, mas o ângulo gira a cada dia (lista editável no admin).
 * Guardar é LIVRE todo dia. A cada N registros (N editável no admin) a Val
 * oferece, com leveza, o FECHO: um espelho do conjunto que conecta os pontos.
 * O fecho é a única parte paga (1 crédito). Convite, nunca cobrança, e o acúmulo
 * aparece com carinho, jamais como streak.
 */
export default function Prosperidade({ onNavegar, onGratidao }) {
  return (
    <Secao titulo="Prosperidade" abertura="reconhecer o que já é seu, e agir com clareza">
      <Hoje onNavegar={onNavegar} onGratidao={onGratidao} />
      <Jornadas />
      <Acervo />
    </Secao>
  );
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const corBotaoEscuro = { color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' };
const campoEscuro = { width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid rgba(239,231,214,0.3)', background: 'rgba(0,0,0,0.12)', color: 'var(--sobre-escuro)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)' };

// --- Ritual diário "Hoje" (card escuro: o ritual central da tela) -------------
function Hoje({ onNavegar, onGratidao }) {
  const registros = useColecao('prosperidade').filter((r) => r.tipo === 'hoje');
  const [angulo, setAngulo] = useState('');
  const [fechoACada, setFechoACada] = useState(7);
  const [texto, setTexto] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [fecho, setFecho] = useState(null);
  const [fechoEstado, setFechoEstado] = useState('inicio'); // inicio | gerando | erro
  const [ofertaFora, setOfertaFora] = useState(false);

  useEffect(() => {
    lerAngulosHoje().then((a) => setAngulo(anguloDoDia(a)));
    lerFechoACada().then(setFechoACada);
  }, []);

  const total = registros.length;
  const dias = new Set(registros.map((r) => r.day)).size;
  const ofertaFecho = total > 0 && total % fechoACada === 0 && !ofertaFora;

  async function guardar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    await db.adicionar('prosperidade', { tipo: 'hoje', pergunta: angulo, texto: t }).catch(() => {});
    setTexto('');
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2200);
  }

  async function pedirFecho() {
    setFecho(null);
    setFechoEstado('gerando');
    try {
      const t = await fechoProsperidade();
      setFecho(t);
      setFechoEstado('inicio');
      setOfertaFora(true);
      await db.adicionar('prosperidade', { tipo: 'fecho', texto: t }).catch(() => {});
    } catch (e) {
      // sem_creditos / precisa_plano abrem a tela de plano global; aqui só encerra o gerando.
      const m = e?.message;
      setFechoEstado(m === 'sem_creditos' || m === 'precisa_plano' ? 'inicio' : 'erro');
    }
  }

  return (
    <div className="card-escuro" style={{ marginBottom: 'var(--espaco-5)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Hoje</h3>
      <p style={{ color: 'var(--sobre-escuro-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Reconheça uma coisa de prosperidade que já é sua, hoje. Se vier, escreva, eu guardo.
      </p>

      {angulo && (
        <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-md)', lineHeight: 1.4, margin: 'var(--espaco-2) 0' }}>
          {cap(angulo)}.
        </p>
      )}

      <form onSubmit={guardar} style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} placeholder="o que veio…" style={campoEscuro} />
        <div style={{ display: 'flex', gap: 'var(--espaco-1)', alignItems: 'center' }}>
          <button type="submit" className="botao-suave" style={corBotaoEscuro} disabled={!texto.trim()}>guardar</button>
          {guardado && <span style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--ambar)' }}>guardado.</span>}
        </div>
      </form>

      {/* Acúmulo com carinho, nunca streak. */}
      {dias >= 2 && (
        <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-2) 0 0' }}>
          Você vem olhando pro que já é seu, já são {dias} dias.
        </p>
      )}

      {/* O fecho: oferta automática a cada N, ou botão discreto sempre à mão. */}
      {(ofertaFecho || fecho || fechoEstado !== 'inicio' || total >= 1) && (
        <div style={{ marginTop: 'var(--espaco-3)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed rgba(239,231,214,0.25)' }}>
          {fechoEstado === 'gerando' ? (
            <p style={{ color: 'var(--sobre-escuro-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: 0 }}>A Val está olhando o conjunto…</p>
          ) : fecho ? (
            <>
              <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', lineHeight: 1.5, margin: 0 }}>{fecho}</p>
              <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-1) 0 0' }}>guardei esse espelho no seu acervo.</p>
              <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)' }}>
                <button className="botao-suave" style={corBotaoEscuro} onClick={() => onNavegar?.({ secao: 'conversar', mensagem: 'Quero conversar sobre o que venho reconhecendo como meu.' })}>
                  conversar com a Val sobre isso
                </button>
                <button className="botao-suave" style={corBotaoEscuro} onClick={() => onGratidao?.()}>
                  registrar uma gratidão
                </button>
              </div>
            </>
          ) : ofertaFecho ? (
            <>
              <p style={{ color: 'var(--sobre-escuro)', margin: '0 0 var(--espaco-1)' }}>
                Você vem reconhecendo bastante. Quer que eu reflita sobre o conjunto?
              </p>
              <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="botao-suave" style={corBotaoEscuro} onClick={pedirFecho}>a Val reflete</button>
                <button onClick={() => setOfertaFora(true)} style={{ background: 'none', border: 'none', color: 'var(--sobre-escuro-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', cursor: 'pointer' }}>agora não</button>
              </div>
            </>
          ) : (
            <button className="botao-suave" style={corBotaoEscuro} onClick={pedirFecho}>
              a Val reflete sobre o que venho reconhecendo
            </button>
          )}
          {fechoEstado === 'erro' && (
            <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-1) 0 0' }}>Não veio agora. Respira, tenta de novo daqui a pouco.</p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Jornadas (esqueleto; conteúdo no próximo passo) --------------------------
function Jornadas() {
  return (
    <div style={{ marginBottom: 'var(--espaco-5)' }}>
      <h3 style={{ fontStyle: 'italic' }}>Jornadas</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Percursos pra reconhecer e ampliar o que já é seu. Em breve.
      </p>
    </div>
  );
}

// --- O acervo da Prosperidade (PRESERVADO) ------------------------------------
// Lê a mesma tabela `prosperidade`; tudo que já foi registrado segue aqui, sob a
// RLS dela, agrupado por tipo, com rótulo amigável quando houver.
function Acervo() {
  const itens = useColecao('prosperidade');
  if (!itens.length) return null;

  const porTipo = {};
  itens.forEach((e) => { (porTipo[e.tipo] ||= []).push(e); });
  const tipos = [
    ...Object.keys(TIPOS_PROSPERIDADE).filter((t) => porTipo[t]),
    ...Object.keys(porTipo).filter((t) => !TIPOS_PROSPERIDADE[t]),
  ];

  return (
    <div>
      <h3 style={{ fontStyle: 'italic' }}>O seu acervo</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        O que você foi reconhecendo como seu, guardado pra reler. Cresce com você.
      </p>

      {tipos.map((t) => (
        <div key={t} style={{ marginBottom: 'var(--espaco-3)' }}>
          <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: '0 0 var(--espaco-1)' }}>
            {TIPOS_PROSPERIDADE[t] ?? t}
          </p>
          <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
            {porTipo[t].map((e) => (
              <div key={e.id} className="card" style={{ padding: 'var(--espaco-2)' }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{e.texto}</p>
                {e.pergunta && (
                  <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>{e.pergunta}</p>
                )}
                <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>{formatarDia(e.day)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

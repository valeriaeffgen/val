import { useState, useEffect, useCallback } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { formatarDia } from '../lib/datas';
import { useColecao } from '../lib/useColecao';
import { TIPOS_PROSPERIDADE } from '../data/seed';
import { lerAngulosHoje, lerFechoACada, anguloDoDia } from '../lib/prosperidade';
import { lerJornadas, lerPercursos, lerDias, iniciarPercurso, responderDia, responderAndamento, liberacao } from '../lib/jornadas';
import { fechoProsperidade, gerarProximoDiaJornada } from '../lib/val';

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
      <Jornadas onNavegar={onNavegar} />
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

// --- Jornadas: percursos de vários dias, com memória entre os dias ------------
// Lista → contrato → percurso (retomada, um dia por vez) → fechamento. Cada
// rodada é um registro separado (repetir não sobrescreve). 1 crédito por dia.
function Jornadas({ onNavegar }) {
  const [jornadas, setJornadas] = useState([]);
  const [percursos, setPercursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [vista, setVista] = useState({ tela: 'lista' });

  const recarregar = useCallback(async () => {
    const [j, p] = await Promise.all([lerJornadas(), lerPercursos()]);
    setJornadas(j);
    setPercursos(p);
    setCarregando(false);
  }, []);
  useEffect(() => { recarregar(); }, [recarregar]);

  const voltarLista = () => { setVista({ tela: 'lista' }); recarregar(); };

  if (vista.tela === 'contrato') {
    return <Contrato jornada={vista.jornada} onVoltar={voltarLista} onComecou={(id) => setVista({ tela: 'percurso', percursoId: id })} />;
  }
  if (vista.tela === 'percurso') {
    return <Percurso percursoId={vista.percursoId} onVoltar={voltarLista} onNavegar={onNavegar}
      onRepetir={(jid) => { const j = jornadas.find((x) => x.id === jid); j ? setVista({ tela: 'contrato', jornada: j }) : voltarLista(); }} />;
  }

  // --- Lista ---
  const emAndamento = percursos.filter((p) => !p.concluido_em);
  const concluidos = percursos.filter((p) => p.concluido_em);

  return (
    <div style={{ marginBottom: 'var(--espaco-5)' }}>
      <h3 style={{ fontStyle: 'italic' }}>Jornadas</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Percursos de vários dias, um por vez, no seu ritmo. A Val lembra de tudo que você foi dizendo, e no fim te devolve o caminho.
      </p>

      {carregando ? (
        <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>um instante…</p>
      ) : (
        <>
          {emAndamento.length > 0 && (
            <div style={{ marginBottom: 'var(--espaco-3)' }}>
              <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: '0 0 var(--espaco-1)' }}>Continue de onde parou</p>
              <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
                {emAndamento.map((p) => (
                  <button key={p.id} className="card" onClick={() => setVista({ tela: 'percurso', percursoId: p.id })}
                    style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--linha)', borderLeft: '3px solid var(--ambar)' }}>
                    <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>{p.jornada_titulo}</p>
                    <p style={{ margin: '4px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
                      você está no dia {p.dia_atual} de {p.jornada_dias}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
            {jornadas.map((j) => (
              <button key={j.id} className="card" onClick={() => setVista({ tela: 'contrato', jornada: j })}
                style={{ textAlign: 'left', cursor: 'pointer' }}>
                <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)' }}>{j.titulo}</p>
                {j.subtitulo && <p style={{ margin: '4px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>{j.subtitulo}</p>}
              </button>
            ))}
            {jornadas.length === 0 && (
              <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>As jornadas chegam em breve.</p>
            )}
          </div>

          {concluidos.length > 0 && (
            <div style={{ marginTop: 'var(--espaco-3)' }}>
              <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: '0 0 var(--espaco-1)' }}>Jornadas que você fez</p>
              <div style={{ display: 'grid', gap: 'var(--espaco-1)' }}>
                {concluidos.map((p) => (
                  <button key={p.id} className="card" onClick={() => setVista({ tela: 'percurso', percursoId: p.id })}
                    style={{ textAlign: 'left', cursor: 'pointer' }}>
                    <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>{p.jornada_titulo}</p>
                    <p style={{ margin: '4px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
                      concluída em {formatarDia(new Date(p.concluido_em).toISOString().slice(0, 10))}, toque pra reler
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Contrato de entrada: o que é, quantos dias, o convite. Ela confirma pra começar.
function Contrato({ jornada, onVoltar, onComecou }) {
  const [estado, setEstado] = useState('inicio'); // inicio | comecando | erro

  async function comecar() {
    setEstado('comecando');
    try {
      const percurso = await iniciarPercurso(jornada);
      await gerarProximoDiaJornada(percurso.id); // gera o dia 1
      onComecou(percurso.id);
    } catch (e) {
      const m = e?.message;
      // Bloqueio de crédito abre a tela de plano global; aqui só voltamos ao início.
      setEstado(m === 'sem_creditos' || m === 'precisa_plano' ? 'inicio' : 'erro');
    }
  }

  return (
    <div className="card-escuro" style={{ marginBottom: 'var(--espaco-5)' }}>
      <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: 'var(--sobre-escuro-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', padding: 0, marginBottom: 'var(--espaco-2)' }}>← voltar</button>
      <h3 style={{ fontStyle: 'italic', marginTop: 0, fontSize: 'var(--titulo-md)' }}>{jornada.titulo}</h3>
      {jornada.convite && <p style={{ lineHeight: 1.6, marginTop: 0 }}>{jornada.convite}</p>}
      <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', marginBottom: 'var(--espaco-3)' }}>
        {jornada.dias} dias, um por dia. Cada dia é uma conversa que a Val escreve só pra você, e consome do seu pacote. Sem taxímetro, no seu tempo.
      </p>
      {estado === 'comecando' ? (
        <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--sobre-escuro-suave)', margin: 0 }}>Abrindo o seu primeiro dia…</p>
      ) : (
        <button className="botao-suave" style={corBotaoEscuro} onClick={comecar}>começar</button>
      )}
      {estado === 'erro' && (
        <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-1) 0 0' }}>Não consegui abrir agora. Respira, tenta de novo daqui a pouco.</p>
      )}
    </div>
  );
}

// O percurso vivo: retomada, o dia atual (abertura + resposta), liberar o próximo
// dia no ritmo, e o fechamento quando termina.
function Percurso({ percursoId, onVoltar, onRepetir, onNavegar }) {
  const [percurso, setPercurso] = useState(null);
  const [dias, setDias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [resp, setResp] = useState('');
  const [andam, setAndam] = useState('');
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState(null); // 'aguarde' | 'erro' | null

  const carregar = useCallback(async () => {
    const ps = await lerPercursos();
    setPercurso(ps.find((x) => x.id === percursoId) ?? null);
    setDias(await lerDias(percursoId));
    setCarregando(false);
  }, [percursoId]);
  useEffect(() => { carregar(); }, [carregar]);

  if (carregando) return <div className="card-escuro" style={{ marginBottom: 'var(--espaco-5)' }}><p style={{ color: 'var(--sobre-escuro-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: 0 }}>um instante…</p></div>;
  if (!percurso) return null;

  // Fechamento: a devolutiva final + o caminho + o que vem depois.
  if (percurso.concluido_em) {
    return (
      <div style={{ marginBottom: 'var(--espaco-5)' }}>
        <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', padding: 0, marginBottom: 'var(--espaco-2)' }}>← jornadas</button>
        <div className="card-escuro">
          <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: 0 }}>{percurso.jornada_titulo}, concluída</p>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 'var(--espaco-2) 0 0' }}>{percurso.fechamento}</p>
          {percurso.fechamento_tarefa && (
            <div style={{ marginTop: 'var(--espaco-3)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed rgba(239,231,214,0.25)' }}>
              <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: 0 }}>pra levar com você</p>
              <p style={{ color: 'var(--sobre-escuro)', margin: '4px 0 0', lineHeight: 1.55 }}>{percurso.fechamento_tarefa}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-3)' }}>
            <button className="botao-suave" style={corBotaoEscuro} onClick={onVoltar}>fazer outra jornada</button>
            <button className="botao-suave" style={corBotaoEscuro} onClick={() => onRepetir(percurso.jornada_id)}>repetir essa</button>
          </div>
        </div>
        <Caminho dias={dias} />
      </div>
    );
  }

  const total = percurso.jornada_dias;
  const diaAtual = dias.find((d) => d.dia === percurso.dia_atual);
  const respondido = diaAtual && diaAtual.respondido_em;
  const lib = liberacao(percurso, dias);
  const anteriores = dias.filter((d) => d.dia < percurso.dia_atual);
  const proxEhFechamento = percurso.dia_atual + 1 >= total;

  async function salvarResposta() {
    const t = resp.trim();
    if (!t || !diaAtual) return;
    await responderDia(diaAtual.id, t).catch(() => {});
    setResp('');
    await carregar();
  }

  // Abre o próximo dia: primeiro guarda o andamento da tarefa de ontem (se ela
  // escreveu), que vira matéria da reflexão de hoje. Convite, nunca cobrança.
  async function abrirProximo() {
    setGerando(true);
    setAviso(null);
    try {
      if (andam.trim() && diaAtual) await responderAndamento(diaAtual.id, andam.trim()).catch(() => {});
      await gerarProximoDiaJornada(percursoId);
      setAndam('');
      await carregar();
    } catch (e) {
      const m = e?.message;
      if (m === 'aguarde' || m === 'responda_antes') setAviso('aguarde');
      else if (m === 'sem_creditos' || m === 'precisa_plano') { /* tela de plano global */ }
      else setAviso('erro');
    } finally {
      setGerando(false);
    }
  }

  return (
    <div style={{ marginBottom: 'var(--espaco-5)' }}>
      <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', padding: 0, marginBottom: 'var(--espaco-2)' }}>← jornadas</button>

      <div className="card-escuro">
        <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: 0 }}>
          {percurso.jornada_titulo}, dia {percurso.dia_atual} de {total}
        </p>

        {/* 1ª perna: a reflexão (a Val ensina) */}
        {diaAtual?.abertura && (
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 'var(--espaco-2) 0 0' }}>{diaAtual.abertura}</p>
        )}

        {/* 2ª perna: a pergunta (provoca), e ela responde */}
        {diaAtual && (
          <p style={{ color: 'var(--sobre-escuro)', margin: 'var(--espaco-2) 0 0', fontWeight: 600 }}>{diaAtual.prompt}</p>
        )}

        {!respondido ? (
          <div style={{ marginTop: 'var(--espaco-1)' }}>
            <textarea value={resp} onChange={(e) => setResp(e.target.value)} rows={3} placeholder="o que vier…" style={campoEscuro} />
            <button className="botao-suave" style={{ ...corBotaoEscuro, marginTop: 'var(--espaco-1)' }} onClick={salvarResposta} disabled={!resp.trim()}>guardar</button>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--espaco-2)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed rgba(239,231,214,0.25)' }}>
            {/* 3ª perna: a tarefa (move), revelada depois da resposta */}
            {diaAtual?.tarefa && (
              <>
                <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: 0 }}>a tarefa de hoje, se vier</p>
                <p style={{ color: 'var(--sobre-escuro)', margin: '4px 0 0', lineHeight: 1.5 }}>{diaAtual.tarefa}</p>
              </>
            )}

            {gerando ? (
              <p style={{ color: 'var(--sobre-escuro-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: 'var(--espaco-2) 0 0' }}>A Val está preparando o próximo dia…</p>
            ) : lib.liberado ? (
              <div style={{ marginTop: 'var(--espaco-2)' }}>
                {/* ciclo diário: antes do próximo dia, como foi a tarefa de ontem */}
                {diaAtual?.tarefa && (
                  <>
                    <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: 0 }}>e a tarefa, como foi? (se não rolou, tudo bem, é só dizer)</p>
                    <textarea value={andam} onChange={(e) => setAndam(e.target.value)} rows={2} placeholder="como foi pra você…" style={{ ...campoEscuro, marginTop: 4 }} />
                  </>
                )}
                <button className="botao-suave" style={{ ...corBotaoEscuro, marginTop: 'var(--espaco-1)' }} onClick={abrirProximo}>
                  {proxEhFechamento ? 'ver o fechamento' : 'abrir o próximo dia'}
                </button>
              </div>
            ) : (
              <p style={{ color: 'var(--sobre-escuro-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: 'var(--espaco-2) 0 0' }}>
                O próximo dia abre amanhã. Leva a tarefa com você, sem pressa, e me conta como foi quando voltar.
              </p>
            )}
            {aviso === 'aguarde' && <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-1) 0 0' }}>O próximo dia ainda está descansando. Volte um pouco mais tarde.</p>}
            {aviso === 'erro' && <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-1) 0 0' }}>Não veio agora. Tenta de novo daqui a pouco.</p>}
          </div>
        )}
      </div>

      <Caminho dias={anteriores} />
    </div>
  );
}

// O caminho já feito (retomada): pra ela reler os dias e nunca se perder.
function Caminho({ dias }) {
  const [aberto, setAberto] = useState(false);
  const feitos = (dias ?? []).filter((d) => d.respondido_em || d.resposta);
  if (!feitos.length) return null;
  return (
    <div style={{ marginTop: 'var(--espaco-2)' }}>
      <button onClick={() => setAberto((v) => !v)} style={{ background: 'none', border: 'none', color: 'var(--tinta-suave)', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', padding: 0 }}>
        {aberto ? 'esconder o caminho' : `o caminho até aqui (${feitos.length})`}
      </button>
      {aberto && (
        <div style={{ display: 'grid', gap: 'var(--espaco-1)', marginTop: 'var(--espaco-1)' }}>
          {feitos.map((d) => (
            <div key={d.id} className="card" style={{ padding: 'var(--espaco-2)' }}>
              <p style={{ margin: 0, color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>dia {d.dia}, {d.prompt}</p>
              {d.resposta && <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{d.resposta}</p>}
              {d.tarefa && (
                <p style={{ margin: '8px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>
                  tarefa: {d.tarefa}{d.tarefa_andamento ? ` · como foi: ${d.tarefa_andamento}` : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
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

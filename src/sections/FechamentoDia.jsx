import { useState, useEffect } from 'react';
import Secao from '../components/Secao';
import { lerDimensoes, lerPerguntas, lerConfigFechamento, sortear, guardarResposta, guardarSoltar, guardarFecho } from '../lib/fechamento';
import { lerPraticasOficiais, lerConfigPraticas, escolherDoBanco, tomDoDia, marcarPraticaUtil, podeOferecer, marcarOferecida } from '../lib/praticas';
import { gerarFechoDia, gerarPratica } from '../lib/val';

/*
 * Fechamento de Dia guiado (seções 6, 7 e 4). A Val pergunta "como foi o seu
 * dia?", como uma amiga. CONVITE, nunca obrigação: sem culpa por pular, sem
 * streak. Quatro perguntas de reconhecimento que ENCHEM (sorteadas de cinco
 * dimensões), uma de soltar que ESVAZIA, e um fecho gerado que lê o conjunto.
 * Guardar é livre; só o fecho custa 1 crédito.
 */
const campo = { width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' };

export default function FechamentoDia({ onNavegar, chegada }) {
  const [carregando, setCarregando] = useState(true);
  const [noite, setNoite] = useState([]); // [{ dimensao, pergunta }]
  const [respostas, setRespostas] = useState({}); // idx -> texto
  const [soltarP, setSoltarP] = useState('');
  const [soltar, setSoltar] = useState('');
  const [passo, setPasso] = useState(0);
  const [estado, setEstado] = useState('ritual'); // ritual | gerando | pronto | erro
  const [fecho, setFecho] = useState('');
  const [tomDia, setTomDia] = useState('bom');

  useEffect(() => {
    let vivo = true;
    Promise.all([lerDimensoes(), lerPerguntas(), lerConfigFechamento()]).then(([dims, perg, cfg]) => {
      if (!vivo) return;
      setNoite(sortear(dims, perg, cfg.porNoite));
      setSoltarP(cfg.soltar);
      setCarregando(false);
    }).catch(() => setCarregando(false));
    return () => { vivo = false; };
  }, []);

  // As etapas, na ordem: as de reconhecimento (enchem) e, por fim, a de soltar (esvazia).
  const etapas = [...noite.map((q) => ({ tipo: 'rec', ...q })), { tipo: 'soltar', pergunta: soltarP }];
  const atual = etapas[passo];
  const ultima = passo >= etapas.length - 1;

  async function fecharODia() {
    setEstado('gerando');
    const respondidas = [];
    for (let i = 0; i < noite.length; i++) {
      const t = (respostas[i] ?? '').trim();
      if (t) respondidas.push({ idx: i, resposta: t });
    }
    const solto = soltar.trim();
    setTomDia(tomDoDia({ vibe: chegada?.id, soltou: !!solto, temReconhecimento: respondidas.length > 0 }));

    // Se ela passou por aqui sem deixar nada, encerramos com carinho, sem gastar geração.
    if (!respondidas.length && !solto) {
      setFecho('Você passou por aqui, e isso já basta. Descanse.');
      setEstado('pronto');
      return;
    }
    try {
      const paraFecho = respondidas.map((p) => ({ dimensao: noite[p.idx].dimensao.nome, pergunta: noite[p.idx].pergunta, resposta: p.resposta }));
      const t = await gerarFechoDia(paraFecho, solto);
      // Só DEPOIS do fecho dar certo guardamos tudo (livre), pra uma falha nunca duplicar.
      for (const p of respondidas) await guardarResposta(noite[p.idx].dimensao, noite[p.idx].pergunta, p.resposta);
      if (solto) await guardarSoltar(solto);
      await guardarFecho(t);
      setFecho(t);
      setEstado('pronto');
    } catch (e) {
      const m = e?.message;
      setEstado(m === 'sem_creditos' || m === 'precisa_plano' ? 'ritual' : 'erro');
    }
  }

  return (
    <Secao titulo="Fechar o dia" abertura="como foi o seu dia? um instante pra encerrar com presença, se você quiser">
      {carregando ? (
        <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>um instante…</p>
      ) : estado === 'pronto' ? (
        <>
          <Pronto fecho={fecho} onNavegar={onNavegar} />
          <Pratica tom={tomDia} />
        </>
      ) : (
        <>
          <p style={{ color: 'var(--tinta-suave)', marginTop: 0 }}>
            Sem pressa e sem dever. Uma de cada vez, responda o que vier e pule o resto, e eu fecho o dia com você.
          </p>

          {/* O fio do que já passou: calmo, recolhido. */}
          {etapas.slice(0, passo).map((e, i) => {
            const txt = e.tipo === 'soltar' ? soltar.trim() : (respostas[i] ?? '').trim();
            if (!txt) return null;
            return (
              <div key={i} style={{ margin: '0 0 var(--espaco-2)', paddingLeft: 'var(--espaco-2)', borderLeft: '2px solid var(--linha)' }}>
                <p style={{ margin: 0, color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>
                  {e.tipo === 'soltar' ? 'o que você soltou' : e.dimensao.nome}
                </p>
                <p style={{ margin: '2px 0 0', color: 'var(--tinta)', whiteSpace: 'pre-wrap' }}>{txt}</p>
              </div>
            );
          })}

          {/* A pergunta de agora, que abre conforme ela avança. */}
          {atual && estado !== 'gerando' && (
            <div key={passo} className="val-fade-in card" style={atual.tipo === 'soltar' ? { borderLeft: '3px solid var(--ambar)' } : undefined}>
              {atual.tipo === 'rec' && (
                <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: '0 0 4px' }}>{atual.dimensao.nome}</p>
              )}
              <p style={{ margin: '0 0 var(--espaco-1)', color: 'var(--tinta)', fontSize: 'var(--titulo-sm)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>{atual.pergunta}</p>
              {atual.tipo === 'rec' ? (
                <textarea rows={2} autoFocus value={respostas[passo] ?? ''} onChange={(e) => setRespostas({ ...respostas, [passo]: e.target.value })} placeholder="o que vier…" style={campo} />
              ) : (
                <>
                  <textarea rows={2} autoFocus value={soltar} onChange={(e) => setSoltar(e.target.value)} placeholder="se quiser, deixe aqui…" style={campo} />
                  <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>opcional, pode pular sem peso. isto vai pro seu Soltar.</p>
                </>
              )}

              <div style={{ marginTop: 'var(--espaco-2)' }}>
                {ultima ? (
                  <button className="botao" onClick={fecharODia}>fechar o dia</button>
                ) : (
                  <button className="botao" onClick={() => setPasso(passo + 1)}>
                    {(respostas[passo] ?? '').trim() ? 'seguir' : 'pular'}
                  </button>
                )}
              </div>
            </div>
          )}

          {estado === 'gerando' && (
            <p className="val-fade-in" style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)' }}>A Val está fechando o seu dia…</p>
          )}
          {estado === 'erro' && (
            <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>Não veio agora. Respira, tenta de novo daqui a pouco.</p>
          )}
        </>
      )}
    </Secao>
  );
}

// A prática de fechamento: convite OCASIONAL depois do fecho, conduzida passo a
// passo, terminando na âncora. Servir do banco curado é livre; gerar uma nova
// (renovação) custa 1 crédito, e na falha cai de volta no banco, sem susto.
const corEscuro = { color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' };

function Pratica({ tom }) {
  const [fase, setFase] = useState('decidindo'); // decidindo | oferta | carregando | conduzindo | fim | fora
  const [oficiais, setOficiais] = useState([]);
  const [cfg, setCfg] = useState({ cooldownHoras: 48, gerarChance: 0.25 });
  const [pratica, setPratica] = useState(null);
  const [passo, setPasso] = useState(0);
  const [util, setUtil] = useState(false);

  useEffect(() => {
    let vivo = true;
    Promise.all([lerPraticasOficiais(), lerConfigPraticas()]).then(([ps, c]) => {
      if (!vivo) return;
      setOficiais(ps);
      setCfg(c);
      if (podeOferecer(c.cooldownHoras)) { marcarOferecida(); setFase('oferta'); }
      else setFase('fora');
    }).catch(() => setFase('fora'));
    return () => { vivo = false; };
  }, []);

  async function vamos() {
    setFase('carregando');
    const matches = oficiais.filter((p) => (p.tons ?? []).includes(tom));
    const tentarGerar = oficiais.length && (matches.length === 0 || Math.random() < cfg.gerarChance);
    let p = tentarGerar ? await gerarPratica(tom) : null; // renovação (1 crédito), pode falhar
    if (!p) p = escolherDoBanco(oficiais, tom);            // servir do banco é livre
    if (!p) { setFase('fora'); return; }
    setPratica(p);
    setPasso(0);
    setFase('conduzindo');
  }

  function seguir() {
    if (passo < (pratica.passos.length - 1)) setPasso(passo + 1);
    else setFase('fim');
  }

  if (fase === 'decidindo' || fase === 'fora') return null;

  return (
    <div className="card-escuro" style={{ marginTop: 'var(--espaco-3)' }}>
      {fase === 'oferta' && (
        <>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Se você quiser, antes de dormir, uma prática rápida pra pousar o dia.</p>
          <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)' }}>
            <button className="botao-suave" style={corEscuro} onClick={vamos}>vamos</button>
            <button onClick={() => setFase('fora')} style={{ background: 'none', border: 'none', color: 'var(--sobre-escuro-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', cursor: 'pointer' }}>agora não</button>
          </div>
        </>
      )}

      {fase === 'carregando' && (
        <p style={{ color: 'var(--sobre-escuro-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: 0 }}>um instante…</p>
      )}

      {fase === 'conduzindo' && pratica && (
        <div key={passo} className="val-fade-in">
          <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: 0 }}>{pratica.nome}</p>
          <p style={{ fontSize: 'var(--titulo-sm)', lineHeight: 1.6, margin: 'var(--espaco-2) 0 0' }}>{pratica.passos[passo]}</p>
          <button className="botao-suave" style={{ ...corEscuro, marginTop: 'var(--espaco-3)' }} onClick={seguir}>
            {passo < pratica.passos.length - 1 ? 'estou aqui' : 'a âncora'}
          </button>
        </div>
      )}

      {fase === 'fim' && pratica && (
        <div className="val-fade-in">
          <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 var(--espaco-1)' }}>leve com você:</p>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-md)', lineHeight: 1.5, margin: 0 }}>{pratica.ancora}</p>
          <div style={{ marginTop: 'var(--espaco-3)' }}>
            {util ? (
              <p style={{ color: 'var(--ambar)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: 0 }}>que bom. boa noite.</p>
            ) : (
              <button className="botao-suave" style={corEscuro} onClick={() => { marcarPraticaUtil(pratica.id); setUtil(true); }}>isso me fez bem</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// O fecho da Val (testemunho) + um convite leve pra guardar mais, se ela quiser.
function Pronto({ fecho, onNavegar }) {
  return (
    <>
      <div className="card-escuro">
        <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{fecho}</p>
        <p style={{ color: 'var(--sobre-escuro-suave)', fontSize: 'var(--corpo-pequeno)', margin: 'var(--espaco-2) 0 0' }}>guardei o seu dia. descanse.</p>
      </div>
      <div style={{ marginTop: 'var(--espaco-3)' }}>
        <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: '0 0 var(--espaco-1)' }}>quer guardar mais alguma coisa do dia?</p>
        <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap' }}>
          <button className="botao-suave" onClick={() => onNavegar?.({ secao: 'diario' })}>Diário</button>
          <button className="botao-suave" onClick={() => onNavegar?.({ secao: 'prosperidade' })}>Prosperidade</button>
          <button className="botao-suave" onClick={() => onNavegar?.({ secao: 'soltar' })}>Soltar</button>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import Secao from '../components/Secao';
import { lerDimensoes, lerPerguntas, lerConfigFechamento, sortear, guardarResposta, guardarSoltar, guardarFecho } from '../lib/fechamento';
import { gerarFechoDia } from '../lib/val';

/*
 * Fechamento de Dia guiado (seções 6, 7 e 4). A Val pergunta "como foi o seu
 * dia?", como uma amiga. CONVITE, nunca obrigação: sem culpa por pular, sem
 * streak. Quatro perguntas de reconhecimento que ENCHEM (sorteadas de cinco
 * dimensões), uma de soltar que ESVAZIA, e um fecho gerado que lê o conjunto.
 * Guardar é livre; só o fecho custa 1 crédito.
 */
const campo = { width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' };

export default function FechamentoDia({ onNavegar }) {
  const [carregando, setCarregando] = useState(true);
  const [noite, setNoite] = useState([]); // [{ dimensao, pergunta }]
  const [respostas, setRespostas] = useState({}); // idx -> texto
  const [soltarP, setSoltarP] = useState('');
  const [soltar, setSoltar] = useState('');
  const [passo, setPasso] = useState(0);
  const [estado, setEstado] = useState('ritual'); // ritual | gerando | pronto | erro
  const [fecho, setFecho] = useState('');

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
    const paraFecho = [];
    for (let i = 0; i < noite.length; i++) {
      const t = (respostas[i] ?? '').trim();
      if (!t) continue;
      await guardarResposta(noite[i].dimensao, noite[i].pergunta, t);
      paraFecho.push({ dimensao: noite[i].dimensao.nome, pergunta: noite[i].pergunta, resposta: t });
    }
    if (soltar.trim()) await guardarSoltar(soltar);

    // Se ela passou por aqui sem deixar nada, encerramos com carinho, sem gastar geração.
    if (!paraFecho.length && !soltar.trim()) {
      setFecho('Você passou por aqui, e isso já basta. Descanse.');
      setEstado('pronto');
      return;
    }
    try {
      const t = await gerarFechoDia(paraFecho, soltar.trim());
      setFecho(t);
      setEstado('pronto');
      await guardarFecho(t);
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
        <Pronto fecho={fecho} onNavegar={onNavegar} />
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

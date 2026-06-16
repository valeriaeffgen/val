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

  const temAlgo = Object.values(respostas).some((t) => (t ?? '').trim()) || soltar.trim();

  async function fecharODia() {
    setEstado('gerando');
    // Guardar é livre: cada resposta pousa na sua seção, e o que ela soltou no Soltar.
    const paraFecho = [];
    for (let i = 0; i < noite.length; i++) {
      const t = (respostas[i] ?? '').trim();
      if (!t) continue;
      await guardarResposta(noite[i].dimensao, noite[i].pergunta, t);
      paraFecho.push({ dimensao: noite[i].dimensao.nome, pergunta: noite[i].pergunta, resposta: t });
    }
    if (soltar.trim()) await guardarSoltar(soltar);

    try {
      const t = await gerarFechoDia(paraFecho, soltar.trim());
      setFecho(t);
      setEstado('pronto');
      await guardarFecho(t);
    } catch (e) {
      const m = e?.message;
      // sem_creditos / precisa_plano abrem a tela de plano global; o resto vira aviso.
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
            Sem pressa e sem dever. Responda só o que vier, pule o resto, e eu fecho o dia com você.
          </p>

          {/* As quatro que ENCHEM: reconhecer o bom do dia */}
          <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
            {noite.map((q, i) => (
              <div key={i} className="card">
                <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', margin: '0 0 4px' }}>{q.dimensao.nome}</p>
                <p style={{ margin: '0 0 var(--espaco-1)', color: 'var(--tinta)' }}>{q.pergunta}</p>
                <textarea rows={2} value={respostas[i] ?? ''} onChange={(e) => setRespostas({ ...respostas, [i]: e.target.value })} placeholder="o que vier…" style={campo} />
              </div>
            ))}
          </div>

          {/* A que ESVAZIA: soltar o peso antes de dormir */}
          <div className="card" style={{ marginTop: 'var(--espaco-2)', borderLeft: '3px solid var(--ambar)' }}>
            <p style={{ margin: '0 0 var(--espaco-1)', color: 'var(--tinta)' }}>{soltarP}</p>
            <textarea rows={2} value={soltar} onChange={(e) => setSoltar(e.target.value)} placeholder="se quiser, deixe aqui…" style={campo} />
            <p style={{ margin: '6px 0 0', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>opcional, pode pular sem peso. isto vai pro seu Soltar.</p>
          </div>

          <div style={{ marginTop: 'var(--espaco-3)', display: 'flex', gap: 'var(--espaco-1)', alignItems: 'center', flexWrap: 'wrap' }}>
            {estado === 'gerando' ? (
              <p style={{ color: 'var(--tinta-suave)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: 0 }}>A Val está fechando o seu dia…</p>
            ) : (
              <button className="botao" onClick={fecharODia} disabled={!temAlgo}>fechar o dia</button>
            )}
            {estado === 'erro' && <span style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>Não veio agora. Respira, tenta de novo daqui a pouco.</span>}
          </div>
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

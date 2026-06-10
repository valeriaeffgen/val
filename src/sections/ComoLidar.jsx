import { useState, useEffect } from 'react';
import Secao from '../components/Secao';
import OfertaMuralGratidao from '../components/OfertaMuralGratidao';
import { FERRAMENTAS_COMO_LIDAR } from '../data/seed';
import { gerarFerramenta, marcarUtil, ferramentasOficiais } from '../lib/val';

/*
 * Como lidar (seção 6) — caixa de ferramentas para o agudo.
 * Ferramentas fixas (diagnóstico + micro-passos + a pergunta) e o
 * "surpreenda-me". Quando a situação não está entre elas, a mulher descreve e a
 * Val gera uma ferramenta na hora (seção 7), com cache por similaridade.
 */
// Os caminhos de continuidade ao fim de cada ferramenta (rótulos na voz da Val).
const CAMINHOS = {
  pausa: { label: 'Respirar um minuto' },
  conversar: { label: 'Conversar com a Val' },
  soltar: { label: 'Esvaziar a mente' },
  autoamor: { label: 'Um gesto por você' },
};

export default function ComoLidar({ onNavegar, onPausa, onGratidao }) {
  const [abertaId, setAbertaId] = useState(null);

  // Geração sob demanda
  const [busca, setBusca] = useState('');
  const [gerada, setGerada] = useState(null);
  const [geradaId, setGeradaId] = useState(null);
  const [util, setUtil] = useState(false);
  const [estado, setEstado] = useState('inicio'); // inicio | gerando | erro | sem-backend

  // Acervo oficial (o que a Valéria aprovou na curadoria), visível para todas.
  const [oficiais, setOficiais] = useState([]);
  useEffect(() => { ferramentasOficiais().then(setOficiais).catch(() => {}); }, []);

  function alternar(id) {
    setAbertaId((atual) => {
      const novo = atual === id ? null : id;
      // Gatilho de gratidão: ao abrir "vontade de reclamar".
      if (novo === 'reclamar') onGratidao?.();
      return novo;
    });
  }

  function surpreender() {
    const opcoes = FERRAMENTAS_COMO_LIDAR.filter((f) => f.id !== abertaId);
    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)] ?? FERRAMENTAS_COMO_LIDAR[0];
    setAbertaId(escolhida.id);
  }

  async function buscar(e) {
    e.preventDefault();
    const s = busca.trim();
    if (!s) return;
    setEstado('gerando');
    setGerada(null);
    setUtil(false);
    try {
      const { ferramenta, id } = await gerarFerramenta(s);
      setGerada(ferramenta);
      setGeradaId(id);
      setEstado('inicio');
    } catch (err) {
      setEstado(err?.message === 'sem-backend' ? 'sem-backend' : 'erro');
    }
  }

  async function ajudou() {
    setUtil(true);
    await marcarUtil(geradaId).catch(() => {});
  }

  return (
    <Secao titulo="Como lidar" abertura="uma caixa de ferramentas para os momentos difíceis">
      {/* Geração sob demanda */}
      <form onSubmit={buscar} className="card" style={{ display: 'grid', gap: 'var(--espaco-2)', marginBottom: 'var(--espaco-3)' }}>
        <p style={{ margin: 0, color: 'var(--tinta-suave)' }}>Não achou a sua situação? Descreva em poucas palavras.</p>
        <div style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: ciúmes, saudade de quem partiu, medo de decepcionar…"
            style={{ flex: 1, border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)', background: 'var(--papel)' }}
          />
          <button type="submit" className="botao" disabled={estado === 'gerando' || !busca.trim()}>buscar</button>
        </div>
        {estado === 'gerando' && (
          <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--tinta-suave)' }}>
            A Val está pensando nisso com você…
          </p>
        )}
        {estado === 'erro' && (
          <p style={{ margin: 0, color: 'var(--tinta-suave)' }}>Não consegui agora. Respira, tenta de novo daqui a pouco.</p>
        )}
        {estado === 'sem-backend' && (
          <p style={{ margin: 0, color: 'var(--tinta-suave)' }}>A geração precisa do backend ligado.</p>
        )}
      </form>

      {/* Ferramenta gerada para a busca */}
      {gerada && (
        <div style={{ marginBottom: 'var(--espaco-3)' }}>
          <p style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)', fontStyle: 'italic', fontFamily: 'var(--fonte-titulo)', margin: '0 0 var(--espaco-1)' }}>
            feita pra esse momento
          </p>
          <div className="card" style={{ borderTop: '3px solid var(--ambar)' }}>
            <h3 style={{ marginTop: 0 }}>{gerada.situacao}</h3>
            <Detalhe ferramenta={gerada} onNavegar={onNavegar} onPausa={onPausa} />
            {geradaId && (
              <div style={{ marginTop: 'var(--espaco-3)', paddingTop: 'var(--espaco-2)', borderTop: '1px dashed var(--linha)' }}>
                {util ? (
                  <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--ambar)' }}>
                    obrigada. isso ajuda a Val a melhorar pra todas.
                  </p>
                ) : (
                  <button className="botao-suave" onClick={ajudou}>isso me ajudou</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 'var(--espaco-3)' }}>
        <button className="botao-suave" onClick={surpreender}>surpreenda-me</button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        {FERRAMENTAS_COMO_LIDAR.map((f) => (
          <div key={f.id} className="card">
            <button
              onClick={() => alternar(f.id)}
              aria-expanded={abertaId === f.id}
              style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <h3 style={{ margin: 0 }}>{f.situacao}</h3>
            </button>
            {abertaId === f.id && <Detalhe ferramenta={f} onNavegar={onNavegar} onPausa={onPausa} />}
          </div>
        ))}
      </div>

      {oficiais.length > 0 && (
        <div style={{ marginTop: 'var(--espaco-4)' }}>
          <h3 style={{ fontStyle: 'italic' }}>Do acervo da Val</h3>
          <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
            {oficiais.map((f) => (
              <div key={f.id} className="card">
                <button
                  onClick={() => alternar('of-' + f.id)}
                  aria-expanded={abertaId === 'of-' + f.id}
                  style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <h3 style={{ margin: 0 }}>{f.situacao}</h3>
                </button>
                {abertaId === 'of-' + f.id && <Detalhe ferramenta={f} onNavegar={onNavegar} onPausa={onPausa} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </Secao>
  );
}

// Diagnóstico + micro-passos + a pergunta + 1 a 2 caminhos para continuar.
function Detalhe({ ferramenta, onNavegar, onPausa }) {
  // Caminhos válidos (geração ou seed); cai no Conversar se vier vazio.
  const caminhos = (ferramenta.caminhos || []).filter((c) => CAMINHOS[c]);
  const lista = caminhos.length ? caminhos : ['conversar'];

  function seguir(c) {
    if (c === 'pausa') return onPausa?.(ferramenta.pergunta);
    if (c === 'conversar') {
      const msg = `Estou lidando com ${String(ferramenta.situacao).toLowerCase()}. Fiquei pensando: ${ferramenta.pergunta}`;
      return onNavegar?.({ secao: 'conversar', mensagem: msg });
    }
    onNavegar?.({ secao: c });
  }

  return (
    <div style={{ marginTop: 'var(--espaco-2)' }}>
      <p style={{ margin: '0 0 var(--espaco-2)' }}>{ferramenta.diagnostico}</p>
      <ol style={{ paddingLeft: '1.2em', margin: '0 0 var(--espaco-2)' }}>
        {ferramenta.passos.map((p, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{p}</li>
        ))}
      </ol>
      <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-sm)', color: 'var(--verde-petroleo)', margin: 0 }}>
        {ferramenta.pergunta}
      </p>

      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-3)' }}>
        {lista.map((c, i) => (
          <button key={c} className={i === 0 ? 'botao' : 'botao-suave'} onClick={() => seguir(c)}>
            {CAMINHOS[c].label}
          </button>
        ))}
      </div>

      {/* Espiral (comparação, frustração, reclamar): oferecer reler a gratidão */}
      {ferramenta.oferecerGratidao && <OfertaMuralGratidao onNavegar={onNavegar} />}
    </div>
  );
}

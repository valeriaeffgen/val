import { useState } from 'react';
import Secao from '../components/Secao';
import { FERRAMENTAS_COMO_LIDAR } from '../data/seed';
import { gerarFerramenta } from '../lib/val';

/*
 * Como lidar (seção 6) — caixa de ferramentas para o agudo.
 * Ferramentas fixas (diagnóstico + micro-passos + a pergunta) e o
 * "surpreenda-me". Quando a situação não está entre elas, a mulher descreve e a
 * Val gera uma ferramenta na hora (seção 7), com cache por similaridade.
 */
export default function ComoLidar() {
  const [abertaId, setAbertaId] = useState(null);

  // Geração sob demanda
  const [busca, setBusca] = useState('');
  const [gerada, setGerada] = useState(null);
  const [estado, setEstado] = useState('inicio'); // inicio | gerando | erro | sem-backend

  function alternar(id) {
    setAbertaId((atual) => (atual === id ? null : id));
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
    try {
      const { ferramenta } = await gerarFerramenta(s);
      setGerada(ferramenta);
      setEstado('inicio');
    } catch (err) {
      setEstado(err?.message === 'sem-backend' ? 'sem-backend' : 'erro');
    }
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
            <Detalhe ferramenta={gerada} />
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
            {abertaId === f.id && <Detalhe ferramenta={f} />}
          </div>
        ))}
      </div>
    </Secao>
  );
}

// Diagnóstico + micro-passos + a pergunta.
function Detalhe({ ferramenta }) {
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
    </div>
  );
}

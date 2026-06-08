import { useState } from 'react';
import Secao from '../components/Secao';
import { FERRAMENTAS_COMO_LIDAR } from '../data/seed';

/*
 * Como lidar (seção 6) — caixa de ferramentas para o agudo.
 * Cada ferramenta: diagnóstico + micro-passos + uma pergunta. Mais o
 * "surpreenda-me". Por ora, conteúdo fixo (ver seed); a geração de ferramenta
 * nova sob demanda (seção 7) entra num próximo passo.
 */
export default function ComoLidar() {
  const [abertaId, setAbertaId] = useState(null);

  function alternar(id) {
    setAbertaId((atual) => (atual === id ? null : id));
  }

  function surpreender() {
    const opcoes = FERRAMENTAS_COMO_LIDAR.filter((f) => f.id !== abertaId);
    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)] ?? FERRAMENTAS_COMO_LIDAR[0];
    setAbertaId(escolhida.id);
  }

  return (
    <Secao titulo="Como lidar" abertura="Quando aperta agora. Vamos achar o próximo passo pequeno.">
      <div style={{ marginBottom: 'var(--espaco-3)' }}>
        <button className="botao" onClick={surpreender}>Surpreenda-me</button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        {FERRAMENTAS_COMO_LIDAR.map((f) => (
          <Ferramenta key={f.id} ferramenta={f} aberta={abertaId === f.id} onAbrir={() => alternar(f.id)} />
        ))}
      </div>
    </Secao>
  );
}

function Ferramenta({ ferramenta, aberta, onAbrir }) {
  return (
    <div className="card">
      <button
        onClick={onAbrir}
        aria-expanded={aberta}
        style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
      >
        <h3 style={{ margin: 0 }}>{ferramenta.titulo}</h3>
      </button>

      {aberta && (
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
      )}
    </div>
  );
}

import { useState } from 'react';
import Secao from '../components/Secao';
import { CONSCIENCIA_SEMENTES, MICRO_EXERCICIOS } from '../data/seed';
import { perguntaProsperidade } from '../lib/val';
import { hasSupabase } from '../lib/supabase';

/*
 * Prosperidade — natureza híbrida (seções 6 e 7).
 * Prosperidade aqui é reconhecer a abundância REAL que já é da mulher e agir com
 * clareza. NUNCA lei da atração, manifestação, nem "o dinheiro flui". Ancorada
 * no concreto. Sem afirmação tipo "eu sou próspera".
 *
 * Três camadas:
 *  (1) Consciência: perguntas contemplativas (sementes validadas + geradas na
 *      voz da Val a partir do contexto, com cache).
 *  (2) Micro-exercícios práticos de ~2 minutos, um por vez, leves.
 *  (3) Gancho DORMENTE do "Ciclo da Colheita" (construído, desligado).
 */

// Gancho dormente: troque para true quando for a hora de acender o Ciclo da
// Colheita. Enquanto false, nada aparece para a mulher.
const CICLO_DA_COLHEITA_ATIVO = false;

export default function Prosperidade() {
  return (
    <Secao titulo="Prosperidade" abertura="reconhecer o que já é seu, e agir com clareza">
      <Consciencia />
      <MicroExercicio />
      {CICLO_DA_COLHEITA_ATIVO && <CicloDaColheita />}
    </Secao>
  );
}

// --- (1) Consciência ----------------------------------------------------------
function Consciencia() {
  const [idx, setIdx] = useState(Math.floor(Math.random() * CONSCIENCIA_SEMENTES.length));
  const [gerada, setGerada] = useState(null);
  const [estado, setEstado] = useState('inicio'); // inicio | gerando | erro | sem-backend

  const pergunta = gerada ?? CONSCIENCIA_SEMENTES[idx];

  function outra() {
    setGerada(null);
    setEstado('inicio');
    setIdx((i) => (i + 1) % CONSCIENCIA_SEMENTES.length);
  }

  async function daVal() {
    if (!hasSupabase) { setEstado('sem-backend'); return; }
    setEstado('gerando');
    try {
      const t = await perguntaProsperidade();
      setGerada(t);
      setEstado('inicio');
    } catch (e) {
      setEstado(e?.message === 'sem-backend' ? 'sem-backend' : 'erro');
    }
  }

  return (
    <div style={{ marginBottom: 'var(--espaco-4)' }}>
      <h3 style={{ fontStyle: 'italic' }}>Consciência</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Uma pergunta de cada vez. Sente nela o tempo que precisar, sem responder a ninguém.
      </p>

      <div className="card" style={{ minHeight: 96, display: 'grid', alignItems: 'center' }}>
        {estado === 'gerando' ? (
          <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--tinta-suave)' }}>
            A Val está achando uma sua…
          </p>
        ) : (
          <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-md)', lineHeight: 1.4, color: 'var(--verde-petroleo)' }}>
            {pergunta}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)' }}>
        <button className="botao-suave" onClick={outra} disabled={estado === 'gerando'}>outra pergunta</button>
        <button className="botao" onClick={daVal} disabled={estado === 'gerando'}>uma da Val pra você</button>
      </div>

      {estado === 'erro' && (
        <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-1)' }}>Não veio agora. Respira, tenta de novo daqui a pouco.</p>
      )}
      {estado === 'sem-backend' && (
        <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-1)' }}>A pergunta da Val precisa do backend ligado. As de cima já são suas.</p>
      )}
    </div>
  );
}

// --- (2) Micro-exercícios -----------------------------------------------------
function MicroExercicio() {
  const [idx, setIdx] = useState(Math.floor(Math.random() * MICRO_EXERCICIOS.length));

  return (
    <div>
      <h3 style={{ fontStyle: 'italic' }}>Dois minutos</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Um exercício rápido e concreto. Não é tarefa, é só um instante de clareza.
      </p>

      <div className="card">
        <p style={{ margin: 0, fontSize: 'var(--titulo-sm)', lineHeight: 1.45 }}>
          {MICRO_EXERCICIOS[idx]}
        </p>
      </div>

      <div style={{ marginTop: 'var(--espaco-2)' }}>
        <button className="botao-suave" onClick={() => setIdx((i) => (i + 1) % MICRO_EXERCICIOS.length)}>
          outro
        </button>
      </div>
    </div>
  );
}

// --- (3) Ciclo da Colheita (DORMENTE) -----------------------------------------
// Construído e pronto, mas só aparece quando CICLO_DA_COLHEITA_ATIVO for true.
// O convite e o fluxo de algumas semanas entram aqui quando a Valéria acender.
function CicloDaColheita() {
  return (
    <div className="card-escuro" style={{ marginTop: 'var(--espaco-4)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Ciclo da Colheita</h3>
      <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
        Um percurso de algumas semanas para colher, no concreto, o que você já plantou.
      </p>
    </div>
  );
}

import { useState } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { useColecao } from '../lib/useColecao';
import { CONSCIENCIA_SEMENTES, MICRO_EXERCICIOS, TIPOS_PROSPERIDADE } from '../data/seed';
import { perguntaProsperidade } from '../lib/val';
import { hasSupabase } from '../lib/supabase';

/*
 * Prosperidade — natureza híbrida (seções 6 e 7).
 * Prosperidade aqui é reconhecer a abundância REAL que já é da mulher e agir com
 * clareza. NUNCA lei da atração, manifestação, nem "o dinheiro flui". Ancorada
 * no concreto. Sem afirmação tipo "eu sou próspera".
 *
 * Três camadas: (1) Consciência; (2) micro-exercícios de ~2 minutos; (3) o
 * gancho DORMENTE do "Ciclo da Colheita".
 *
 * O que a mulher escreve é OPCIONAL e leve (convite, não cobrança), mas quando
 * ela escreve, persiste de verdade no banco (tabela `prosperidade`, sob a RLS
 * dela), separado por tipo, e fica no acervo para reler. É a memória que faz a
 * Val conhecer a mulher, não esquecê-la.
 */

// Gancho dormente: troque para true quando for a hora de acender o Ciclo da
// Colheita. Enquanto false, nada aparece para a mulher.
const CICLO_DA_COLHEITA_ATIVO = false;

export default function Prosperidade({ onNavegar }) {
  return (
    <Secao titulo="Prosperidade" abertura="reconhecer o que já é seu, e agir com clareza">
      <Consciencia onNavegar={onNavegar} />
      <MicroExercicio />
      <Acervo />
      {CICLO_DA_COLHEITA_ATIVO && <CicloDaColheita />}
    </Secao>
  );
}

// Campo de escrita opcional: leve, e quando preenchido, persiste no banco.
function CampoOpcional({ onGuardar, placeholder }) {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('inicio'); // inicio | guardado | erro

  async function guardar() {
    const t = texto.trim();
    if (!t) return;
    try {
      await onGuardar(t);
      setTexto('');
      setEstado('guardado');
      setTimeout(() => setEstado('inicio'), 2000);
    } catch {
      setEstado('erro');
    }
  }

  return (
    <div style={{ marginTop: 'var(--espaco-2)' }}>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel)' }}
      />
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', alignItems: 'center', marginTop: 'var(--espaco-1)' }}>
        <button className="botao-suave" onClick={guardar} disabled={!texto.trim()}>guardar</button>
        {estado === 'guardado' && <span style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--ambar)' }}>guardado.</span>}
        {estado === 'erro' && <span style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)' }}>não consegui guardar agora.</span>}
      </div>
    </div>
  );
}

// --- (1) Consciência ----------------------------------------------------------
function Consciencia({ onNavegar }) {
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
      setGerada(await perguntaProsperidade());
      setEstado('inicio');
    } catch (e) {
      setEstado(e?.message === 'sem-backend' ? 'sem-backend' : 'erro');
    }
  }

  return (
    <div style={{ marginBottom: 'var(--espaco-4)' }}>
      <h3 style={{ fontStyle: 'italic' }}>Consciência</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Uma pergunta de cada vez. Sente nela o tempo que precisar. Se quiser, escreva, eu guardo.
      </p>

      <div className="card">
        {estado === 'gerando' ? (
          <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--tinta-suave)' }}>A Val está achando uma sua…</p>
        ) : (
          <p style={{ margin: 0, fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-md)', lineHeight: 1.4, color: 'var(--verde-petroleo)' }}>{pergunta}</p>
        )}

        <CampoOpcional
          placeholder="se quiser, escreva o que veio…"
          onGuardar={(t) => db.adicionar('prosperidade', { tipo: 'consciencia', pergunta, texto: t })}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginTop: 'var(--espaco-2)' }}>
        <button className="botao-suave" onClick={outra} disabled={estado === 'gerando'}>outra pergunta</button>
        <button className="botao-suave" onClick={daVal} disabled={estado === 'gerando'}>uma da Val pra você</button>
        <button
          className="botao-suave"
          onClick={() => onNavegar?.({ secao: 'conversar', mensagem: `Vim da Prosperidade, fiquei com esta pergunta: ${pergunta}` })}
        >
          levar pra Val
        </button>
      </div>

      {estado === 'erro' && <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-1)' }}>Não veio agora. Respira, tenta de novo daqui a pouco.</p>}
      {estado === 'sem-backend' && <p style={{ color: 'var(--tinta-suave)', marginTop: 'var(--espaco-1)' }}>A pergunta da Val precisa do backend ligado. As de cima já são suas.</p>}
    </div>
  );
}

// --- (2) Micro-exercícios -----------------------------------------------------
function MicroExercicio() {
  const [idx, setIdx] = useState(Math.floor(Math.random() * MICRO_EXERCICIOS.length));
  const ex = MICRO_EXERCICIOS[idx];

  return (
    <div style={{ marginBottom: 'var(--espaco-4)' }}>
      <h3 style={{ fontStyle: 'italic' }}>Dois minutos</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Um exercício rápido e concreto. Não é tarefa. Se quiser, registre, eu guardo.
      </p>

      <div className="card">
        <p style={{ margin: 0, fontSize: 'var(--titulo-sm)', lineHeight: 1.45 }}>{ex.texto}</p>
        <CampoOpcional
          placeholder="se quiser, escreva o que veio…"
          onGuardar={(t) => db.adicionar('prosperidade', { tipo: ex.tipo, pergunta: ex.texto, texto: t })}
        />
      </div>

      <div style={{ marginTop: 'var(--espaco-2)' }}>
        <button className="botao-suave" onClick={() => setIdx((i) => (i + 1) % MICRO_EXERCICIOS.length)}>outro</button>
      </div>
    </div>
  );
}

// --- O acervo da Prosperidade (memória que acumula) ---------------------------
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
    <div style={{ marginTop: 'var(--espaco-5)' }}>
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
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- (3) Ciclo da Colheita (DORMENTE) -----------------------------------------
// Construído e pronto, mas só aparece quando CICLO_DA_COLHEITA_ATIVO for true.
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

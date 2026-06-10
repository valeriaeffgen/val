import { useState } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { hoje } from '../lib/storage';
import { useColecao } from '../lib/useColecao';
import { palavraDeHoje } from '../lib/val';
import { hasSupabase } from '../lib/supabase';
import VotoUtil from '../components/VotoUtil';

/*
 * Autoamor (seção 6) — três rituais, em cards escuros (seção 5):
 * (1) o gesto diário (grava em diario, cat 'autoamor');
 * (2) "a palavra de hoje" gerada na voz da Val, com cache (regra 2);
 * (3) o banco pessoal — você escreve no dia bom (palavras), colhe no difícil.
 *
 * Princípios: presença, não pontuação. Nada de streak, nada de cobrança.
 */
export default function Autoamor() {
  return (
    <Secao titulo="Autoamor" abertura="conversa de amiga, e a amiga é você">
      <PalavraDeHoje />
      <GestoDiario />
      <BancoPessoal />
    </Secao>
  );
}

// --- (2) A palavra de hoje -----------------------------------------------------
function PalavraDeHoje() {
  const [palavra, setPalavra] = useState(null);
  const [palavraId, setPalavraId] = useState(null);
  const [estado, setEstado] = useState('inicio'); // inicio | carregando | pronta | erro | sem-backend
  const [plantada, setPlantada] = useState(false);

  async function receber() {
    if (!hasSupabase) { setEstado('sem-backend'); return; }
    setEstado('carregando');
    try {
      const { texto, id } = await palavraDeHoje();
      setPalavra(texto);
      setPalavraId(id);
      setEstado('pronta');
    } catch (e) {
      setEstado(e?.message === 'sem-backend' ? 'sem-backend' : 'erro');
    }
  }

  async function plantar() {
    if (!palavra || plantada) return;
    await db.adicionar('palavras', { text: palavra }).catch(() => {});
    setPlantada(true);
  }

  const corBotao = { color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' };

  return (
    <div className="card-escuro" style={{ marginBottom: 'var(--espaco-3)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0, marginBottom: 4 }}>A palavra de hoje</h3>
      <p style={{ color: 'var(--sobre-escuro-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Uma conversa composta pra você, a partir do que você é, viveu e registrou. Nunca genérica.
      </p>

      {estado === 'inicio' && (
        <button className="botao-suave" onClick={receber} style={corBotao}>Receber a palavra</button>
      )}
      {estado === 'carregando' && (
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>A Val está achando a sua…</p>
      )}
      {estado === 'pronta' && (
        <>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', fontSize: 'var(--titulo-md)', margin: '0 0 var(--espaco-3)', lineHeight: 1.35 }}>
            {palavra}
          </p>
          <button className="botao-suave" onClick={plantar} disabled={plantada} style={corBotao}>
            {plantada ? 'plantada. agora é sua.' : 'Plantar no meu banco'}
          </button>
          <VotoUtil id={palavraId} escuro />
        </>
      )}
      {estado === 'erro' && (
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>Hoje a palavra não veio. Respira, ela volta.</p>
      )}
      {estado === 'sem-backend' && (
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>A palavra de hoje precisa do backend ligado para ser gerada.</p>
      )}
    </div>
  );
}

// --- (1) O gesto diário --------------------------------------------------------
function GestoDiario() {
  const diario = useColecao('diario');
  const gestoHoje = diario.find((d) => d.cat === 'autoamor' && d.day === hoje());
  const [texto, setTexto] = useState('');

  function registrar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    db.adicionar('diario', { cat: 'autoamor', text: t }).catch(() => {});
    setTexto('');
  }

  return (
    <div className="card-escuro" style={{ marginBottom: 'var(--espaco-3)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>O gesto de hoje</h3>
      {gestoHoje ? (
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
          Hoje você se deu: <span style={{ color: 'var(--sobre-escuro)' }}>{gestoHoje.text}</span>
        </p>
      ) : (
        <form onSubmit={registrar} style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
          <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
            Que gesto de amor por você coube no dia de hoje?
          </p>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva o gesto de hoje..."
            style={{ border: '1px solid rgba(239,231,214,0.3)', background: 'rgba(0,0,0,0.12)', color: 'var(--sobre-escuro)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)' }}
          />
          <div>
            <button type="submit" className="botao-suave" style={{ color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' }}>
              Guardar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// --- (3) O banco pessoal -------------------------------------------------------
function BancoPessoal() {
  const palavras = useColecao('palavras');
  const [texto, setTexto] = useState('');

  function guardar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    db.adicionar('palavras', { text: t }).catch(() => {});
    setTexto('');
  }

  return (
    <div>
      <h3 style={{ fontStyle: 'italic' }}>Palavras pra mim</h3>
      <p style={{ color: 'var(--tinta-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        Num dia bom, escreva o que diria a você mesma num dia difícil. Eu guardo, e devolvo quando você mais precisar, inclusive na sua chegada.
      </p>

      <form onSubmit={guardar} className="card" style={{ display: 'grid', gap: 'var(--espaco-2)', marginBottom: 'var(--espaco-3)' }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          placeholder={'Ex.: "Você já atravessou coisa pior, e atravessou bonito."'}
          style={{ resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel)' }}
        />
        <div>
          <button type="submit" className="botao" disabled={!texto.trim()}>Plantar</button>
        </div>
      </form>

      {palavras.length > 0 && (
        <>
          <p style={{ fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic', color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 var(--espaco-1)' }}>
            {palavras.length} {palavras.length === 1 ? 'palavra plantada' : 'palavras plantadas'}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--espaco-1)' }}>
            {palavras.map((p) => (
              <li key={p.id} className="card" style={{ padding: 'var(--espaco-2)', fontFamily: 'var(--fonte-titulo)', fontStyle: 'italic' }}>
                {p.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import Secao from '../components/Secao';
import { db } from '../lib/db';
import { hoje } from '../lib/storage';
import { useColecao } from '../lib/useColecao';
import { CATEGORIAS_DIARIO } from '../data/seed';

/*
 * Diário (seção 6) — o acervo. Categorias de gratidão/perspectiva (do protótipo
 * da Valéria), o ritual dos Elogios (3 por dia, as três luzes) e o gesto de
 * autoamor. Tudo grava em `diario` sob a RLS dela. Os rituais são cards escuros
 * (seção 5). Presença, não pontuação: nada de cobrança por fechar as três luzes.
 */

// Categorias de gratidão/perspectiva (tudo menos os rituais).
const CATEGORIAS = CATEGORIAS_DIARIO.filter((c) => c.id !== 'elogio' && c.id !== 'autoamor');
const LABEL = Object.fromEntries(CATEGORIAS_DIARIO.map((c) => [c.id, c.label]));

export default function Diario({ catInicial }) {
  return (
    <Secao titulo="Diário" abertura="o que vale guardar do dia, pra reler num dia cinza">
      <Elogios />
      <GestoAutoamor />
      <Categorias catInicial={catInicial} />
    </Secao>
  );
}

// --- Ritual dos Elogios: três luzes -------------------------------------------
function Elogios() {
  const diario = useColecao('diario');
  const luzes = diario.filter((d) => d.cat === 'elogio' && d.day === hoje());
  const [texto, setTexto] = useState('');
  const acesas = luzes.length;

  function acender(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || acesas >= 3) return;
    db.adicionar('diario', { cat: 'elogio', text: t }).catch(() => {});
    setTexto('');
  }

  return (
    <div className="card-escuro" style={{ marginBottom: 'var(--espaco-3)' }}>
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Elogios de hoje</h3>
      <p style={{ color: 'var(--sobre-escuro-suave)', marginTop: 0, fontSize: 'var(--corpo-pequeno)' }}>
        {acesas >= 3 ? 'Três pessoas saíram maiores do seu dia.' : 'três pessoas, três luzes acesas'}
      </p>

      {/* Os três pontos de luz */}
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', margin: 'var(--espaco-2) 0' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 12, height: 12, borderRadius: '50%',
              background: i < acesas ? 'var(--ambar)' : 'rgba(246,241,231,0.06)',
              border: `1.5px solid ${i < acesas ? 'var(--ambar)' : 'rgba(246,241,231,0.35)'}`,
              boxShadow: i < acesas ? '0 0 12px rgba(201,162,75,0.55)' : 'none',
            }}
          />
        ))}
      </div>

      {luzes.length > 0 && (
        <ol style={{ paddingLeft: '1.2em', margin: '0 0 var(--espaco-2)', color: 'var(--sobre-escuro)' }}>
          {luzes.map((l) => (
            <li key={l.id} style={{ marginBottom: 6 }}>{l.text}</li>
          ))}
        </ol>
      )}

      {acesas < 3 && (
        <form onSubmit={acender} style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Quem você elogiou, e pelo quê?"
            style={{ flex: 1, border: '1px solid rgba(239,231,214,0.3)', background: 'rgba(0,0,0,0.12)', color: 'var(--sobre-escuro)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)' }}
          />
          <button type="submit" className="botao-suave" style={{ color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' }}>
            acender
          </button>
        </form>
      )}
    </div>
  );
}

// --- Gesto de autoamor (mesma fonte do Autoamor: diario cat 'autoamor') -------
function GestoAutoamor() {
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
      <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Gesto de autoamor</h3>
      {gestoHoje ? (
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
          Hoje você se deu: <span style={{ color: 'var(--sobre-escuro)' }}>{gestoHoje.text}</span>
        </p>
      ) : (
        <form onSubmit={registrar} style={{ display: 'flex', gap: 'var(--espaco-1)' }}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Um gesto de amor por mim hoje…"
            style={{ flex: 1, border: '1px solid rgba(239,231,214,0.3)', background: 'rgba(0,0,0,0.12)', color: 'var(--sobre-escuro)', borderRadius: 'var(--raio-sm)', padding: '10px var(--espaco-2)' }}
          />
          <button type="submit" className="botao-suave" style={{ color: 'var(--sobre-escuro)', borderColor: 'rgba(239,231,214,0.4)' }}>
            registrar
          </button>
        </form>
      )}
    </div>
  );
}

// --- Categorias de gratidão/perspectiva ---------------------------------------
function Categorias({ catInicial }) {
  const diario = useColecao('diario');
  const inicial = CATEGORIAS.some((c) => c.id === catInicial) ? catInicial : CATEGORIAS[0].id;
  const [cat, setCat] = useState(inicial);
  const [texto, setTexto] = useState('');
  const categoria = CATEGORIAS.find((c) => c.id === cat);

  function guardar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    db.adicionar('diario', { cat, text: t }).catch(() => {});
    setTexto('');
  }

  const acervo = diario.filter((d) => CATEGORIAS.some((c) => c.id === d.cat));

  return (
    <div>
      <h3 style={{ fontStyle: 'italic' }}>Guardar do dia</h3>
      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap', marginBottom: 'var(--espaco-1)' }}>
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className="botao-suave"
            style={{
              background: cat === c.id ? 'var(--verde-suave)' : 'transparent',
              fontWeight: cat === c.id ? 600 : 400,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {categoria?.hint && (
        <p style={{ color: 'var(--tinta-suave)', fontSize: 'var(--corpo-pequeno)', margin: '0 0 var(--espaco-2)' }}>
          {categoria.hint}
        </p>
      )}

      <form onSubmit={guardar} className="card" style={{ display: 'grid', gap: 'var(--espaco-2)', marginBottom: 'var(--espaco-3)' }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="O que você quer guardar?"
          style={{ resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel)' }}
        />
        <div>
          <button type="submit" className="botao" disabled={!texto.trim()}>Guardar</button>
        </div>
      </form>

      {acervo.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--espaco-1)' }}>
          {acervo.map((d) => (
            <li key={d.id} className="card" style={{ padding: 'var(--espaco-2)' }}>
              <span style={{ color: 'var(--ambar)', fontSize: 'var(--corpo-pequeno)' }}>{LABEL[d.cat]}</span>
              <p style={{ margin: '4px 0 0' }}>{d.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

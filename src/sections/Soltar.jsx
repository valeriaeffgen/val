import { useState } from 'react';
import Secao from '../components/Secao';
import { storage } from '../lib/storage';
import { useColecao } from '../lib/useColecao';

/*
 * Soltar — descompressão de pensamentos insistentes (seção 6).
 * Escreve, guarda, a mente solta. Lista "para lembrar depois".
 * A Val sabe do que foi guardado, mas NUNCA cobra (princípio 5).
 */
export default function Soltar() {
  const itens = useColecao('soltar');
  const [texto, setTexto] = useState('');

  function soltar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    storage.adicionar('soltar', { time: new Date().toTimeString().slice(0, 5), text: t, done: false });
    setTexto('');
  }

  return (
    <Secao titulo="Soltar" abertura="O que está pesando na cabeça? Escreve aqui — a mente pode largar.">
      <form onSubmit={soltar} className="card" style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder="Pode escrever sem filtro."
          style={{ resize: 'vertical', border: '1px solid var(--linha)', borderRadius: 'var(--raio-sm)', padding: 'var(--espaco-2)', background: 'var(--papel)' }}
        />
        <div>
          <button type="submit" className="botao">Soltar</button>
        </div>
      </form>

      {itens.length > 0 && (
        <div style={{ marginTop: 'var(--espaco-3)' }}>
          <h3 style={{ fontStyle: 'italic' }}>Para lembrar depois</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--espaco-1)' }}>
            {itens.map((it) => (
              <li key={it.id} className="card" style={{ padding: 'var(--espaco-2)' }}>
                {it.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Secao>
  );
}

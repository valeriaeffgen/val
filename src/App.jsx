import { useState, useEffect } from 'react';
import Nav from './components/Nav';
import Limiar from './sections/Limiar';
import { SECOES } from './sections';
import { db, iniciarSessao } from './lib/db';

/*
 * Casca do app. Fluxo (seção 6):
 *   chegada (Limiar) → navegação pelas seções → rodapé (vídeos, encerrar visita).
 *
 * Roteamento mínimo por estado — sem dependência de router por enquanto;
 * a estrutura está pronta para crescer.
 */
export default function App() {
  const [chegada, setChegada] = useState(null); // estado de chegada da visita
  const [secaoId, setSecaoId] = useState(null);

  // Abre a sessão (anônima) cedo, quando há Supabase — sem muro de cadastro.
  useEffect(() => { iniciarSessao(); }, []);

  // Limiar: registra como ela chega e abre uma sessão da Trajetória.
  function aoChegar(estado) {
    setChegada(estado);
    db.registrarSessao({ entrada: estado.id }).catch(() => {});
    setSecaoId('conversar'); // do socorro imediato em diante
  }

  if (!chegada) {
    return <Limiar onChegada={aoChegar} />;
  }

  const secao = SECOES.find((s) => s.id === secaoId);

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Nav atual={secaoId} onIr={(id) => (id ? setSecaoId(id) : setChegada(null))} />

      <main style={{ flex: 1, width: '100%' }}>
        {secao ? <secao.Componente chegada={chegada} /> : null}
      </main>

      {/* Rodapé: vídeos e "encerrar visita" (seção 6). */}
      <footer style={{ borderTop: '1px solid var(--linha)', padding: 'var(--espaco-3)', textAlign: 'center' }}>
        <button
          className="botao-suave"
          onClick={() => {
            // Captura de saída (entrada→saída) alimenta a Trajetória (seção 6).
            db.registrarSessao({ entrada: chegada.id, saida: chegada.id }).catch(() => {});
            setChegada(null);
            setSecaoId(null);
          }}
        >
          Encerrar visita
        </button>
      </footer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import Nav from './components/Nav';
import Limiar from './sections/Limiar';
import CapturaSaida from './components/CapturaSaida';
import { SECOES } from './sections';
import { db, iniciarSessao } from './lib/db';

/*
 * Casca do app. Fluxo (seção 6):
 *   chegada (Limiar) → navegação pelas seções → captura de saída → rodapé.
 *
 * A sessão da visita é aberta na chegada (entrada) e fechada na saída
 * (saida), formando o arco entrada→saída que alimenta a Trajetória.
 */
export default function App() {
  const [chegada, setChegada] = useState(null); // estado de chegada da visita
  const [secaoId, setSecaoId] = useState(null);
  const [sessaoId, setSessaoId] = useState(null); // id da sessão desta visita
  const [saindo, setSaindo] = useState(false); // mostrando a captura de saída

  // Abre a sessão (anônima) cedo, quando há Supabase, sem muro de cadastro.
  useEffect(() => { iniciarSessao(); }, []);

  // Limiar: registra como ela chega e abre a sessão desta visita.
  async function aoChegar(estado) {
    setChegada(estado);
    setSecaoId('conversar'); // do socorro imediato em diante
    const sessao = await db.registrarSessao({ entrada: estado.id }).catch(() => null);
    setSessaoId(sessao?.id ?? null);
  }

  function encerrarVisita() {
    setSaindo(false);
    setChegada(null);
    setSecaoId(null);
    setSessaoId(null);
  }

  // Captura de saída: grava a saída na MESMA sessão (entrada→saída).
  async function aoSair(estado) {
    if (sessaoId) {
      await db.atualizar('sessoes', sessaoId, { saida: estado.id }).catch(() => {});
    }
    encerrarVisita();
  }

  if (!chegada) {
    return <Limiar onChegada={aoChegar} />;
  }

  if (saindo) {
    return <CapturaSaida onResponder={aoSair} onPular={encerrarVisita} />;
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
        <button className="botao-suave" onClick={() => setSaindo(true)}>
          Encerrar visita
        </button>
      </footer>
    </div>
  );
}

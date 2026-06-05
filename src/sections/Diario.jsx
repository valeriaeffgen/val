import Secao, { EmConstrucao } from '../components/Secao';
import { CATEGORIAS_DIARIO } from '../data/seed';

/*
 * Diário — acervo (seção 6). Categorias de gratidão/perspectiva (luz em alguém,
 * beleza do dia, orgulho, sonhos, pra rir...) + ritual dos Elogios (3 por dia).
 * O ritual dos Elogios é card escuro (seção 5).
 */
export default function Diario() {
  return (
    <Secao titulo="Diário" abertura="O que vale guardar do dia.">
      <div className="card-escuro" style={{ marginBottom: 'var(--espaco-3)' }}>
        <h3 style={{ fontStyle: 'italic', marginTop: 0 }}>Elogios de hoje</h3>
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>Três por dia. No seu tempo.</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--espaco-1)', flexWrap: 'wrap' }}>
        {CATEGORIAS_DIARIO.filter((c) => c.id !== 'elogio').map((c) => (
          <span key={c.id} className="botao-suave" style={{ cursor: 'default' }}>{c.rotulo}</span>
        ))}
      </div>
      <div style={{ marginTop: 'var(--espaco-3)' }}>
        <EmConstrucao nota="Cada categoria abre uma entrada curta. O acervo cresce devagar, do seu jeito." />
      </div>
    </Secao>
  );
}

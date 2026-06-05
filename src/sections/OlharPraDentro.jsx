import Secao, { EmConstrucao } from '../components/Secao';
import { JORNADAS } from '../data/seed';

/*
 * Olhar pra dentro — jornadas de autoconhecimento (seção 6).
 * Perguntas → devolutiva ("seu espelho") gerada na voz da Val, puxando para o
 * autoamor. Padrões nos registros dela compõem jornadas feitas para ela (seção 7).
 */
export default function OlharPraDentro() {
  return (
    <Secao titulo="Olhar pra dentro" abertura="Sem pressa. Algumas perguntas, e um espelho ao fim.">
      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        {JORNADAS.map((j) => (
          <div key={j.id} className="card">
            <h3 style={{ margin: 0 }}>{j.titulo}</h3>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'var(--espaco-2)' }}>
        <EmConstrucao nota="Ao fim de cada jornada, a Val devolve o que enxergou em você — testemunho, não avaliação." />
      </div>
    </Secao>
  );
}

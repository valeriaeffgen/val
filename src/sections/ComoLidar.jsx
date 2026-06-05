import Secao, { EmConstrucao } from '../components/Secao';
import { FERRAMENTAS_COMO_LIDAR } from '../data/seed';

/*
 * Como lidar — caixa de ferramentas para o agudo (seção 6).
 * Diagnóstico + micro-passos + uma pergunta. Situação não prevista vira
 * ferramenta nova gerada na hora e guardada para ela (seção 7).
 */
export default function ComoLidar() {
  return (
    <Secao titulo="Como lidar" abertura="Quando aperta agora. Vamos achar o próximo passo pequeno.">
      <div style={{ display: 'grid', gap: 'var(--espaco-2)' }}>
        {FERRAMENTAS_COMO_LIDAR.map((f) => (
          <div key={f.id} className="card">
            <h3 style={{ margin: 0 }}>{f.titulo}</h3>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'var(--espaco-2)' }}>
        <EmConstrucao nota="Cada ferramenta abrirá com um micro-passo e uma só pergunta. O que não estiver previsto, a Val cria para você." />
      </div>
    </Secao>
  );
}

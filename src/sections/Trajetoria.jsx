import Secao, { EmConstrucao } from '../components/Secao';

/*
 * Trajetória — gráfico de bem-estar (seção 6), card escuro (seção 5).
 * Linha do estado ao longo do tempo (pontos + tendência suavizada).
 * Linguagem de testemunho, não de avaliação (princípio 3). Sem comparação,
 * sem meta, sem streak (princípio 4). Captura de saída (entrada→saída).
 */
export default function Trajetoria() {
  return (
    <Secao titulo="Trajetória" abertura="A sua história, devolvida com ternura.">
      <div className="card-escuro">
        <p style={{ color: 'var(--sobre-escuro-suave)', margin: 0 }}>
          O gráfico do seu estado ao longo do tempo viverá aqui — pontos e uma
          tendência suave. Sem nota, sem ranking. Só o seu caminho.
        </p>
      </div>
      <div style={{ marginTop: 'var(--espaco-2)' }}>
        <EmConstrucao nota="A leitura virá em palavras de testemunho — 'você tem se tratado com mais gentileza' — nunca em porcentagem." />
      </div>
    </Secao>
  );
}

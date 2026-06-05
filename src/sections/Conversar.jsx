import Secao, { EmConstrucao } from '../components/Secao';

/*
 * Conversar — chat com a Val (seção 6), ciente do estado de chegada, valores,
 * conquistas, foco, elevadores e registros recentes. A geração usará
 * montarPrompt() de lib/constitution.js com o contexto pessoal.
 */
export default function Conversar() {
  return (
    <Secao titulo="Conversar" abertura="Estou aqui. Pode falar do jeito que vier.">
      <EmConstrucao nota="O fio da conversa vai morar aqui — a Val ouvindo, lúcida e calorosa, com uma pergunta de cada vez." />
    </Secao>
  );
}

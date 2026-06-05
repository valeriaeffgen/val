import Secao, { EmConstrucao } from '../components/Secao';

/*
 * Cartas — a parte humana (seção 8). NÃO é IA fingindo ser gente.
 * A mulher escreve; quem responde é a Valéria (depois, equipe). Toque humano
 * ocasional e precioso — não um canal de suporte que sufoca. Requer backend real.
 */
export default function Cartas() {
  return (
    <Secao titulo="Cartas" abertura="Aqui do outro lado tem gente. A Valéria lê, e responde quando puder.">
      <EmConstrucao nota="Você escreve uma carta; a resposta vem de uma pessoa, não de uma máquina. Sem pressa de chegar, sem pressa de responder." />
    </Secao>
  );
}

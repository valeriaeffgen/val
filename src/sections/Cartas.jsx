import Secao, { EmConstrucao } from '../components/Secao';

/*
 * Cartas — a parte humana (seção 8). NÃO é IA fingindo ser gente.
 * A mulher escreve; quem responde é a Valéria (depois, equipe). Toque humano
 * ocasional e precioso — não um canal de suporte que sufoca. Requer backend real.
 */
export default function Cartas() {
  return (
    <Secao titulo="Cartas" abertura="me escreva como quem escreve a uma amiga, eu respondo, de pessoa pra pessoa">
      <EmConstrucao nota="Você escreve uma carta; a resposta vem de uma pessoa, não de uma máquina. Sem pressa de chegar, sem pressa de responder." />
    </Secao>
  );
}

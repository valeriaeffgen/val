/*
 * Pack de conteúdo inicial — semente, não teto (seção 7).
 *
 * Estes são pontos de partida na voz da Val. A camada generativa expande a
 * partir daqui usando o contexto real da mulher; o que ela mais marca como útil
 * sobe para a fila de curadoria da Valéria.
 */

// Limiar (chegada): "Como você chega?" — os quatro estados (seção 6).
export const ESTADOS_CHEGADA = [
  { id: 'pesada', rotulo: 'pesada', valor: 1 },
  { id: 'agitada', rotulo: 'agitada', valor: 2 },
  { id: 'neutra', rotulo: 'neutra', valor: 3 },
  { id: 'elevada', rotulo: 'elevada', valor: 4 },
];

// Categorias do Diário (seção 6): gratidão/perspectiva + os rituais.
export const CATEGORIAS_DIARIO = [
  { id: 'luz', rotulo: 'luz em alguém' },
  { id: 'beleza', rotulo: 'beleza do dia' },
  { id: 'orgulho', rotulo: 'orgulho' },
  { id: 'sonhos', rotulo: 'sonhos' },
  { id: 'rir', rotulo: 'pra rir' },
  { id: 'elogio', rotulo: 'elogios' }, // ritual dos 3 por dia
  { id: 'autoamor', rotulo: 'autoamor' },
];

// Como lidar: caixa de ferramentas para o agudo (seção 6). Sementes.
export const FERRAMENTAS_COMO_LIDAR = [
  { id: 'irritacao', titulo: 'Irritação que sobe' },
  { id: 'discussao', titulo: 'Discussão em casa' },
  { id: 'comparacao', titulo: 'Comparação' },
];

// Olhar pra dentro: jornadas de autoconhecimento (seção 6). Sementes.
export const JORNADAS = [
  {
    id: 'o-que-me-sustenta',
    titulo: 'O que me sustenta',
    perguntas: [
      'O que te segurou de pé numa semana difícil recente?',
      'Quem você é quando ninguém está cobrando nada de você?',
    ],
  },
  {
    id: 'um-orgulho-pequeno',
    titulo: 'Um orgulho pequeno',
    perguntas: [
      'Conte um momento recente, pequeno que seja, em que você fez algo de que se orgulha.',
      'O que esse momento mostra sobre o tipo de pessoa que você é?',
    ],
  },
  {
    id: 'o-que-eu-carrego',
    titulo: 'O que eu carrego',
    perguntas: [
      'O que você tem carregado que já podia pousar um pouco?',
      'Se uma amiga querida estivesse carregando isso, o que você diria a ela?',
    ],
  },
];

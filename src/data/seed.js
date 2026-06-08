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

// Como lidar: caixa de ferramentas para o agudo (seção 6).
// CONTEÚDO PROVISÓRIO, escrito na voz da Val a partir da Constituição. O
// protótipo (val.jsx) não estava disponível; troque por este texto pelo seu
// quando ele chegar. Cada ferramenta: diagnóstico + micro-passos + uma pergunta.
export const FERRAMENTAS_COMO_LIDAR = [
  {
    id: 'irritacao',
    titulo: 'Irritação que sobe',
    diagnostico:
      'A irritação chegou rápido, e o corpo já se adiantou. Antes de responder ao mundo, um instante com você.',
    passos: [
      'Respira fundo uma vez, só uma, e solta devagar.',
      'Põe a mão no peito ou na barriga, sente os pés no chão.',
      'Adia a resposta em um minuto. O que é urgente espera um minuto.',
    ],
    pergunta: 'O que está pedindo cuidado por baixo dessa irritação?',
  },
  {
    id: 'discussao',
    titulo: 'Discussão em casa',
    diagnostico:
      'Vocês dois estão cansados, e o assunto virou ringue. Dá pra cuidar de você sem precisar ganhar a discussão.',
    passos: [
      'Diga, em voz alta ou por dentro: agora eu preciso de uma pausa.',
      'Saia do cômodo por dois minutos, beba água.',
      'Quando voltar, fale do que você sente, não do que a outra pessoa errou.',
    ],
    pergunta: 'O que você queria que a outra pessoa entendesse, no fundo?',
  },
  {
    id: 'comparacao',
    titulo: 'Comparação',
    diagnostico:
      'Você olhou a vida do outro e a sua encolheu na sua frente. A foto que você viu não é a vida inteira de ninguém.',
    passos: [
      'Feche o aplicativo por agora, é só um toque.',
      'Nomeie uma coisa concreta que é sua e não cabe numa tela.',
      'Lembre de algo que você construiu devagar, com as suas mãos.',
    ],
    pergunta: 'O que essa comparação está te mostrando que você deseja de verdade?',
  },
  {
    id: 'ansiedade',
    titulo: 'Ansiedade antes de algo',
    diagnostico:
      'O corpo está se preparando para algo que ainda não chegou. Ele te quer pronta, está do seu lado, só veio cedo demais.',
    passos: [
      'Conte cinco coisas que você vê agora, em voz baixa.',
      'Sente o ar entrando, e os pés no chão.',
      'Faça só a próxima coisa pequena, não a montanha inteira.',
    ],
    pergunta: 'Qual é o menor primeiro passo que cabe agora?',
  },
  {
    id: 'culpa-descanso',
    titulo: 'Culpa por descansar',
    diagnostico:
      'Você parou e veio a sensação de que devia estar fazendo algo. Descansar parece desistir, mas não é.',
    passos: [
      'Permita-se quinze minutos sem produzir nada.',
      'Repare que o mundo segue girando enquanto você respira.',
      'Lembre que você não é medida pelo que entrega.',
    ],
    pergunta: 'De quem é a voz que diz que você não pode parar?',
  },
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

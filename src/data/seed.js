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

// Categorias do Diário (seção 6) — do protótipo da Valéria. Gratidão/perspectiva
// + os rituais (elogio, autoamor). label aparece na interface; hint orienta.
export const CATEGORIAS_DIARIO = [
  { id: 'pessoas', label: 'Luz em alguém', hint: 'pontos positivos das pessoas do meu convívio' },
  { id: 'recebido', label: 'Fizeram por mim', hint: 'algo bom que alguém fez pra mim' },
  { id: 'dado', label: 'Eu fiz por alguém', hint: 'algo bom que eu fiz por alguém' },
  { id: 'elogio', label: 'Elogio que fiz', hint: 'elogiar 3 pessoas por dia' }, // ritual das três luzes
  { id: 'autoamor', label: 'Gesto de autoamor', hint: 'um gesto de amor por mim hoje' }, // ritual
  { id: 'beleza', label: 'Beleza do dia', hint: 'algo bonito que me tocou' },
  { id: 'cena', label: 'Cena marcante', hint: 'qualquer coisa que ficou' },
  { id: 'orgulho', label: 'Orgulho de mim', hint: 'meus pontos positivos, onde estou orgulhosa' },
  { id: 'melhorar', label: 'Quero melhorar', hint: 'com carinho, sem chicote' },
  { id: 'sonho', label: 'Sonhos & vontades bobas', hint: 'mesmo as súbitas, processamento' },
  { id: 'riso', label: 'Pra rir', hint: 'coisas simples que me fizeram rir' },
  { id: 'resumo', label: 'Resumo do dia', hint: 'o dia em poucas linhas' },
];

// Como lidar: caixa de ferramentas para o agudo (seção 6).
// Conteúdo do protótipo da Valéria, fiel, com os travessões trocados por
// vírgula (regra de voz). Cada ferramenta: diagnóstico + micro-passos + a
// pergunta. A geração de ferramenta nova sob demanda (seção 7) entra depois.
export const FERRAMENTAS_COMO_LIDAR = [
  {
    id: 'irritacao',
    situacao: 'Irritação',
    diagnostico: 'A irritação quase nunca é com o que está na frente. É um aviso de que algo mais fundo foi tocado.',
    passos: [
      'Pausa antes da reação, três respirações lentas. A irritação tem meia-vida curta, se você não a alimenta.',
      'Separe: o que aqui é meu, e o que é da outra pessoa?',
      'Se for agir, aja depois. Nunca dentro do pico.',
    ],
    pergunta: 'O que essa irritação está protegendo?',
  },
  {
    id: 'discussao',
    situacao: 'Discussão em casa',
    diagnostico: 'No calor, ninguém quer entender, quer vencer. E ninguém vence uma discussão em casa.',
    passos: [
      'Baixe o volume, não o argumento. O tom desarma mais que a razão.',
      "Troque 'você sempre' por 'eu me sinto'. Acusação fecha, vulnerabilidade abre.",
      'Se travou, peça uma pausa de 20 minutos. Não é fuga, é deixar o corpo voltar ao normal.',
    ],
    pergunta: 'Você quer ter razão, ou quer ficar bem com quem ama?',
  },
  {
    id: 'comparacao',
    situacao: 'Comparação',
    diagnostico: 'Você compara seu bastidor com a vitrine do outro. Jogo perdido por construção.',
    passos: [
      'Lembre: você vê o resultado dela, nunca o preço que ela pagou.',
      'Volte ao seu placar, o que você construiu que um dia foi só desejo?',
    ],
    pergunta: 'A inveja é um mapa. O que ela está te mostrando que você quer de verdade?',
  },
  {
    id: 'excesso',
    situacao: 'Quero fazer tudo',
    diagnostico: 'Querer tudo ao mesmo tempo é uma forma elegante de não fazer nada. A mente se protege na lista.',
    passos: [
      'Escreva tudo que está girando. Tirar de dentro já alivia.',
      'Circule UMA. Só ela existe pela próxima hora.',
      'O resto não sumiu, está guardado. Você volta.',
    ],
    pergunta: 'Se só uma coisa pudesse acontecer hoje, qual te deixaria em paz?',
  },
  {
    id: 'futuro',
    situacao: 'Medo do futuro',
    diagnostico: 'O medo do futuro é a mente vivendo num lugar que não existe. Você sofre por algo que talvez nunca venha.',
    passos: [
      'Volte ao corpo. Onde estão seus pés agora? O futuro não está aqui.',
      'Separe o que você controla do que não controla. Cuide só do primeiro.',
    ],
    pergunta: 'Neste exato momento, falta alguma coisa de verdade?',
  },
  {
    id: 'autocritica',
    situacao: 'Me cobrando demais',
    diagnostico: 'A voz que te cobra não te faz melhor, te faz menor. E do menor ninguém constrói bem.',
    passos: [
      'Repare na voz como quem ouve um vizinho barulhento. Ela não é você.',
      'Você falaria assim com uma amiga querida? Fale consigo com a mesma decência.',
    ],
    pergunta: 'O que essa cobrança esconde de cansaço, ou de medo?',
  },
  {
    id: 'frustracao',
    situacao: 'Frustração no trabalho',
    diagnostico: 'A frustração mede a distância entre o que você esperava e o que veio. Às vezes era a expectativa que estava torta.',
    passos: [
      'Nomeie o que escapou do seu controle, e solte essa parte.',
      'Ache a próxima ação pequena e concreta. Movimento dissolve frustração parada.',
    ],
    pergunta: 'O que isso ainda pode te ensinar, mesmo doendo agora?',
  },
  {
    id: 'noite',
    situacao: 'Mente acelerada à noite',
    diagnostico: 'À noite a mente fica sem testemunha e roda solta. Não é hora de resolver, é hora de pousar.',
    passos: [
      'Anote num papel o que está girando. A mente solta o que sabe que ficou guardado.',
      'Respire mais longo na saída do que na entrada. O corpo entende que pode descansar.',
    ],
    pergunta: 'O que pode esperar até amanhã? (Quase tudo.)',
  },
  {
    id: 'reclamar',
    situacao: 'Vontade de reclamar',
    diagnostico: 'Quem reclama de algo, tem algo. A reclamação quase sempre esconde uma posse.',
    passos: [
      "Termine a frase: 'só estou reclamando disso porque tenho...'",
      'Diga, em voz alta, uma coisa boa ligada ao mesmo assunto.',
    ],
    pergunta: 'Que abundância está escondida atrás dessa queixa?',
  },
  {
    id: 'paralisia',
    situacao: 'Travada, sem começar',
    diagnostico: 'Não é preguiça. É medo, ou a tarefa está grande demais pra caber numa ação.',
    passos: [
      "Quebre até virar ridícula de pequena. 'Abrir o documento' já conta.",
      'Combine cinco minutos só. Quase sempre o corpo continua sozinho.',
    ],
    pergunta: 'Qual é o menor primeiro passo que você não conseguiria falhar?',
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

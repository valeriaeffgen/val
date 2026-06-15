-- =============================================================================
-- Val — Jornadas: conteúdo detalhado e curado (reflexão + pergunta + tarefa).
--
-- Carrega o conteúdo completo das três jornadas (documento curado pela Valéria)
-- nos arcos. Cada dia ganha a REFLEXÃO curada (base que a Val adapta na geração,
-- ligando à tarefa de ontem), a PERGUNTA e a TAREFA refinadas. Tudo editável no
-- admin. Aplicar DEPOIS de 0010 e 0011 (0013 já cobre o que a 0012 fazia).
-- SQL Editor → cole → Run.
-- =============================================================================

alter table prosperidade_jornada_arcos add column if not exists tarefa   text;
alter table prosperidade_jornada_arcos add column if not exists reflexao text;


update prosperidade_jornada_arcos a
set reflexao = $v$Merecer descanso parece simples, mas repara numa coisa: você provavelmente só descansa depois de cumprir uma lista, como se o descanso fosse pagamento por serviço prestado. Hoje a gente olha pra essa moeda de troca, de onde ela veio, e se ela é mesmo sua.$v$, prompt = $v$O que você acha que precisa fazer pra merecer descanso?$v$, tarefa = $v$Hoje, descanse dez minutos sem ter terminado nada antes. Sente, respire, olhe pela janela. Só porque sim, não porque ganhou.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 1;

update prosperidade_jornada_arcos a
set reflexao = $v$A gente aprende que tudo de bom precisa ser conquistado com suor. Mas se você olhar com calma, muita coisa boa chegou sem você ter feito por merecer: um encontro, uma ajuda, uma sorte. Não é pra diminuir o seu esforço, é pra lembrar que receber nem sempre é uma fatura.$v$, prompt = $v$Uma coisa boa que te aconteceu sem você ter “merecido” por esforço?$v$, tarefa = $v$Hoje, quando algo bom acontecer, por menor que seja, em vez de pensar “mereço” ou “não mereço”, experimente só dizer pra você: isso chegou, e tudo bem receber.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 2;

update prosperidade_jornada_arcos a
set reflexao = $v$Ninguém nasce achando que precisa provar valor. Isso é ensinado, geralmente cedo, geralmente por alguém que também aprendeu assim. Hoje não é pra culpar ninguém, é pra ver de onde veio essa régua, porque o que a gente enxerga, a gente pode escolher se ainda serve.$v$, prompt = $v$De quem você aprendeu que precisa provar valor pra receber?$v$, tarefa = $v$Hoje, repare uma vez em que você se pegou provando algo que ninguém pediu. Só repare, não precisa mudar nada ainda.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 3;

update prosperidade_jornada_arcos a
set reflexao = $v$Quando alguém te elogia e você responde “imagina, foi sorte” ou “qualquer uma faria”, você está devolvendo um presente sem abrir. O elogio é algo que te oferecem, e desconversar é um jeito de dizer que você não merece segurar aquilo. Hoje a gente treina abrir.$v$, prompt = $v$Um elogio que você desconversou em vez de receber?$v$, tarefa = $v$Hoje, se alguém te elogiar, responda só “obrigada”. Sem emenda, sem diminuir. Sinta como é segurar o elogio inteiro.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 4;

update prosperidade_jornada_arcos a
set reflexao = $v$O corpo sabe antes da cabeça. Quando alguém te dá algo, um presente, um favor, um carinho, às vezes aperta, dá vontade de retribuir na hora, de não ficar devendo. Esse aperto conta uma história sobre o quanto você se permite simplesmente receber.$v$, prompt = $v$O que muda no seu corpo quando alguém te dá algo?$v$, tarefa = $v$Hoje, se você receber algo, repare na primeira reação do seu corpo antes de agir. Só observe, sem corrigir.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 5;

update prosperidade_jornada_arcos a
set reflexao = $v$A gente costuma ser uma juíza dura consigo e uma amiga doce com as outras. Você diria pra uma amiga cansada “você devia ter feito mais”? Provavelmente não. Mas diz pra você. Hoje a gente repara nessa diferença de tratamento.$v$, prompt = $v$Você cobra de si o que jamais cobraria de uma amiga?$v$, tarefa = $v$Hoje, quando você se pegar se cobrando, pergunte: eu diria isso pra alguém que amo? Se não, experimente falar com você do jeito que falaria com ela.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 6;

update prosperidade_jornada_arcos a
set reflexao = $v$Chegamos ao fim da primeira semana. Você passou dias olhando pra ideia de que precisa fazer por merecer. Hoje a gente vira a chave: e se algumas coisas você merece só por estar aqui, viva, inteira, sem ter que apresentar comprovante?$v$, prompt = $v$Uma coisa que você merece hoje, sem motivo, só por existir?$v$, tarefa = $v$Hoje, dê a você essa uma coisa. Pequena que seja. Não como recompensa, como direito.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 7;

update prosperidade_jornada_arcos a
set reflexao = $v$Receber e ficar devendo viraram quase a mesma coisa pra muita gente. Alguém te ajuda e já vem o “preciso retribuir”. Hoje a gente separa as duas: dá pra receber sem que isso abra uma conta a pagar.$v$, prompt = $v$Quando você se sente em dívida por receber?$v$, tarefa = $v$Hoje, se alguém fizer algo por você, agradeça e resista ao impulso de retribuir na mesma hora. Deixe o gesto ser só um gesto.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 8;

update prosperidade_jornada_arcos a
set reflexao = $v$Tem uma fila invisível onde você costuma ficar atrás de todo mundo: dos filhos, do trabalho, da casa, das outras pessoas. As suas necessidades esperam uma vez que quase nunca chega. Hoje a gente olha pra essa fila.$v$, prompt = $v$Uma necessidade sua que você sempre põe por último?$v$, tarefa = $v$Hoje, atenda uma necessidade sua antes de atender a de outra pessoa. Uma vez só. Veja o que acontece, por dentro e por fora.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 9;

update prosperidade_jornada_arcos a
set reflexao = $v$Quando uma menina pede algo com os olhos brilhando, a gente não responde “você não merece” nem “primeiro prove que dá conta”. A gente quer dar. Essa menina ainda mora em você, e ela continua pedindo.$v$, prompt = $v$O que você daria a uma menina de 8 anos que pedisse o que você quer?$v$, tarefa = $v$Hoje, faça por você uma coisa pequena que daria pra essa menina. Do jeito que daria pra ela: sem condição, com carinho.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 10;

update prosperidade_jornada_arcos a
set reflexao = $v$Cada “sim” que você dá com o coração apertado é um “não” que você negou a si mesma. Agradar virou um jeito de garantir que não te abandonem. Hoje a gente repara no preço disso.$v$, prompt = $v$Um “não” que você não deu por achar que devia agradar?$v$, tarefa = $v$Hoje, dê um “não” pequeno a algo que você diria “sim” só por agradar. Pode ser mínimo. O músculo se aprende no pequeno.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 11;

update prosperidade_jornada_arcos a
set reflexao = $v$Antes de qualquer raciocínio, o dinheiro entrando mexe com algo. Pra umas, alívio; pra outras, medo de perder, culpa, ou a pressa de já destinar tudo. Esse primeiro sentimento conta a sua relação real com receber, não a que você gostaria de ter.$v$, prompt = $v$Dinheiro entrando: o que você sente antes de pensar?$v$, tarefa = $v$Hoje, se entrar algum dinheiro, ou se imaginar entrando, pare um segundo e nomeie o primeiro sentimento. Sem julgar, só nomeie.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 12;

update prosperidade_jornada_arcos a
set reflexao = $v$“Já tá bom” é uma frase que protege e aprisiona ao mesmo tempo. Ela te poupa da decepção de querer, mas também tampa o desejo antes dele respirar. Hoje a gente pergunta se o “já tá bom” é paz ou é medo disfarçado.$v$, prompt = $v$Você se permite querer mais, ou se censura no “já tá bom”?$v$, tarefa = $v$Hoje, deixe-se querer uma coisa sem se justificar. Não precisa ir atrás ainda, só admita pra você que quer.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 13;

update prosperidade_jornada_arcos a
set reflexao = $v$Metade do caminho. Você vem esperando, talvez a vida toda, que alguém te autorize: a descansar, a querer, a receber, a ocupar espaço. Hoje a gente para de esperar. A permissão que não veio de fora pode vir de você.$v$, prompt = $v$Escreva pra você mesma a permissão que ninguém te deu.$v$, tarefa = $v$Hoje, leia em voz alta a permissão que você escreveu. Pra você mesma, no espelho ou só pro ar. Deixe seu corpo ouvir.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 14;

update prosperidade_jornada_arcos a
set reflexao = $v$O “quando der” é um tempo que não existe no calendário. A consulta, o descanso, o curso, a viagem, tudo que é seu fica esperando uma folga que você nunca se dá. Hoje a gente olha pra esse cuidado adiado.$v$, prompt = $v$Um cuidado que você adia “pra quando der”?$v$, tarefa = $v$Hoje, dê o primeiro passo mínimo nesse cuidado: marque, pesquise, agende. Não o cuidado inteiro, só o primeiro centímetro.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 15;

update prosperidade_jornada_arcos a
set reflexao = $v$Tem um teto invisível feito do olhar dos outros: “vão achar que sou gananciosa, que tô me achando, que não mereço”. Esse medo decide quanto você se permite ter antes mesmo de você tentar. Hoje a gente ilumina ele.$v$, prompt = $v$O que você teme que pensem se você receber demais?$v$, tarefa = $v$Hoje, repare se você diminuiu algo seu na frente de alguém pra não parecer “demais”. Só repare a cena.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 16;

update prosperidade_jornada_arcos a
set reflexao = $v$Dar é confortável, te mantém no controle, na posição de quem pode. Receber expõe, te coloca na posição de quem precisa. Por isso, pra muita mulher forte, receber é a parte mais difícil. Hoje a gente honra essa dificuldade.$v$, prompt = $v$Uma vez em que receber foi mais difícil que dar?$v$, tarefa = $v$Hoje, peça uma ajuda pequena a alguém, algo que você normalmente faria sozinha. Pratique o lado incômodo.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 17;

update prosperidade_jornada_arcos a
set reflexao = $v$Provar cansa. É um trabalho invisível e sem fim, porque a régua sempre sobe. Depois de tantos dias olhando pra isso, talvez já dê pra largar alguma prova que você carrega faz tempo. Hoje a gente escolhe o que soltar.$v$, prompt = $v$O que você está pronta pra parar de provar?$v$, tarefa = $v$Hoje, em uma situação, não prove nada. Não justifique, não mostre serviço, não se explique. Só esteja.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 18;

update prosperidade_jornada_arcos a
set reflexao = $v$Imagina por um instante que tudo já é seu por direito: o descanso, o prazer, o cuidado, o querer. Você não precisa ganhar nada. Como seria viver um dia assim? Essa imaginação não é fuga, é um ensaio do possível.$v$, prompt = $v$Como seria seu dia se você não precisasse merecer nada?$v$, tarefa = $v$Hoje, viva uma hora desse dia imaginado. Escolha uma hora e, nela, não mereça nada: só receba e exista.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 19;

update prosperidade_jornada_arcos a
set reflexao = $v$Estamos quase no fim. Tudo que a gente olhou só vira mudança quando vira gesto. Amanhã a jornada fecha, mas a sua permissão continua. Hoje a gente combina uma coisa concreta que você vai se dar nos próximos dias.$v$, prompt = $v$Uma coisa que você vai se permitir esta semana?$v$, tarefa = $v$Hoje, marque na agenda, ou diga em voz alta, quando você vai se permitir essa coisa. Dê data pra ela.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 20;

update prosperidade_jornada_arcos a
set reflexao = $v$Vinte e um dias atrás você começou perguntando o que precisava fazer pra merecer descanso. Hoje a Val olha com você todo o caminho que você fez, o que reconheceu, o que mudou no seu jeito de receber.$v$, prompt = $v$Olhando pra trás, o que mudou em você sobre merecer e receber? (a Val devolve o arco inteiro, dia a dia)$v$, tarefa = $v$Hoje, escolha uma frase que você quer levar dessa jornada e guarde onde você veja. Foi você que aprendeu, não foi ninguém que te deu.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = 21;

update prosperidade_jornada_arcos a
set reflexao = $v$A gente se acostuma rápido com o que conquista. O que um dia foi um sonho distante hoje é rotina invisível: a casa, o trabalho, a pessoa ao lado, o copo de café. Hoje a gente desacostuma pra ver de novo.$v$, prompt = $v$Algo que você usou hoje e que um dia foi um sonho?$v$, tarefa = $v$Hoje, ao usar essa coisa, pare um segundo e lembre de quando ela era só desejo. Deixe a memória te alcançar.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 1;

update prosperidade_jornada_arcos a
set reflexao = $v$Água quente que sai da torneira, luz que acende no escuro, um teto que segura a chuva. Conforto que vira invisível de tão constante. Não é pra sentir culpa por ter, é pra voltar a ver o que já está aqui te sustentando.$v$, prompt = $v$Um conforto tão presente que virou invisível?$v$, tarefa = $v$Hoje, use um desses confortos com atenção plena, uma vez. Sinta a água morna, a luz, o agasalho, como se fosse a primeira vez.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 2;

update prosperidade_jornada_arcos a
set reflexao = $v$Nem tudo de bom você foi atrás. Algumas pessoas simplesmente apareceram e ficaram, trazendo cor sem você ter planejado. Hoje a gente repara nessa abundância que chegou de graça, em forma de gente.$v$, prompt = $v$Alguém que apareceu na sua vida sem você buscar?$v$, tarefa = $v$Hoje, mande uma mensagem curta pra essa pessoa. Não precisa explicar a jornada, só diga que lembrou dela.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 3;

update prosperidade_jornada_arcos a
set reflexao = $v$Seu corpo faz milhares de coisas sem você pedir: respira, te leva de um lugar a outro, abraça, prova um sabor, escuta uma música. A gente só repara nele quando dói. Hoje a gente repara quando funciona.$v$, prompt = $v$Uma habilidade do seu corpo que você não agradece?$v$, tarefa = $v$Hoje, use essa habilidade com presença. Se é andar, ande reparando nos passos. Se é ver, olhe algo bonito de propósito.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 4;

update prosperidade_jornada_arcos a
set reflexao = $v$Toda casa tem um canto que é mais seu, onde o corpo relaxa sozinho: uma cadeira, um pedaço de chão com sol, a cozinha de manhã. Esse canto é uma riqueza pequena e diária. Hoje a gente o reconhece.$v$, prompt = $v$Um lugar da sua casa que te acolhe?$v$, tarefa = $v$Hoje, passe cinco minutos nesse lugar sem fazer nada útil. Só estar ali, deixando ele te acolher.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 5;

update prosperidade_jornada_arcos a
set reflexao = $v$O prazer de comer algo gostoso é uma abundância que se repete todo dia e quase sempre passa batida, no automático, na pressa. Hoje a gente desacelera pra sentir essa, que é das alegrias mais simples e disponíveis.$v$, prompt = $v$Uma comida que te deu prazer recente?$v$, tarefa = $v$Hoje, coma uma coisa devagar, prestando atenção no sabor. Sem tela, sem pressa. Só você e o gosto.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 6;

update prosperidade_jornada_arcos a
set reflexao = $v$Uma semana olhando pras pequenas coisas. Hoje a gente junta: um dia comum seu é cheio de coisas boas que você nem conta. Vamos contar. Não pra romantizar a vida, pra ver o que sempre esteve ali.$v$, prompt = $v$A abundância de um dia comum seu, listada. O que cabe num dia qualquer?$v$, tarefa = $v$Hoje, ao deitar, conte de cabeça três coisas boas que o dia comum te deu. Adormeça com a lista.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 7;

update prosperidade_jornada_arcos a
set reflexao = $v$Você sabe coisas hoje que pareceriam impossíveis pra você de anos atrás. Esse conhecimento foi construído tijolo por tijolo, e virou tão seu que parece que sempre soube. Hoje a gente reconhece essa riqueza que mora em você.$v$, prompt = $v$Um conhecimento que você tem e levou anos pra construir?$v$, tarefa = $v$Hoje, ensine ou compartilhe uma pontinha desse conhecimento com alguém. Veja o valor dele pelos olhos de quem não sabe.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 8;

update prosperidade_jornada_arcos a
set reflexao = $v$Tem gente torcendo por você em silêncio, de longe, sem você nem saber. Alguém que fala bem de você quando você não está, que te guarda no pensamento. Essa torcida invisível também é parte da sua riqueza.$v$, prompt = $v$Uma pessoa que torce por você de longe?$v$, tarefa = $v$Hoje, imagine essa pessoa torcendo por você. Deixe a sensação de ser bem-querida te alcançar por um momento.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 9;

update prosperidade_jornada_arcos a
set reflexao = $v$A chuva, um pássaro, uma música que você ama, a voz de alguém, o silêncio da manhã. Sons que fazem bem e estão quase sempre ao alcance, de graça. Hoje a gente repara nessa abundância que entra pelos ouvidos.$v$, prompt = $v$Um som que te faz bem e está sempre disponível?$v$, tarefa = $v$Hoje, pare um minuto só pra ouvir esse som. Olhos fechados, se der. Deixe ele te preencher.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 10;

update prosperidade_jornada_arcos a
set reflexao = $v$Liberdade, muitas vezes, é poder escolher. E você provavelmente tem hoje escolhas que um dia não teve: o que comer, com quem ficar, como gastar uma hora, pra onde ir. Hoje a gente reconhece essa abundância de poder escolher.$v$, prompt = $v$Uma escolha que hoje você tem e antes não tinha?$v$, tarefa = $v$Hoje, faça uma escolha pequena com consciência de que pode escolher. Saboreie o poder de decidir, mesmo numa coisa boba.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 11;

update prosperidade_jornada_arcos a
set reflexao = $v$O sol que aquece, o ar que você respira, o céu que muda de cor, uma árvore no caminho. A natureza distribui beleza e vida sem cobrar, todo dia. Hoje a gente recebe esse presente que não tem fatura.$v$, prompt = $v$Algo da natureza que te foi dado de graça hoje?$v$, tarefa = $v$Hoje, fique um momento ao ar livre, ou só na janela, recebendo algo da natureza de propósito: sol no rosto, vento, o verde.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 12;

update prosperidade_jornada_arcos a
set reflexao = $v$Sem comparar pra se sentir melhor que ninguém, mas pra ver com honestidade: a sua vida tem facilidades que pra muita gente seriam sonho. Reconhecer isso não tira a sua luta, só amplia a sua visão do que já é seu.$v$, prompt = $v$Uma facilidade da sua vida que muita gente não tem?$v$, tarefa = $v$Hoje, use essa facilidade reparando que ela é uma facilidade. Sem culpa, só com consciência.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 13;

update prosperidade_jornada_arcos a
set reflexao = $v$Metade da jornada das pequenas coisas. “Suficiente” é uma palavra que a pressa não deixa a gente sentir, porque sempre falta algo no horizonte. Hoje a gente para e pergunta o que já basta, de verdade.$v$, prompt = $v$O que “ter o suficiente” significa pra você hoje?$v$, tarefa = $v$Hoje, escolha uma área da vida e diga pra você: nessa, eu já tenho o suficiente. Sinta como é descansar nessa frase.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 14;

update prosperidade_jornada_arcos a
set reflexao = $v$As fases difíceis cobram caro, mas às vezes deixam algo que virou riqueza: uma força, uma sabedoria, um limite que você aprendeu a respeitar. Hoje a gente não romantiza a dor, só reconhece o que ela te deixou de bom.$v$, prompt = $v$Um aprendizado que veio de uma fase difícil?$v$, tarefa = $v$Hoje, agradeça em silêncio à sua versão que atravessou aquela fase. Ela construiu algo que você usa até hoje.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 15;

update prosperidade_jornada_arcos a
set reflexao = $v$A beleza não espera ocasião especial. Ela está no vapor do café, na luz da tarde, num gesto de alguém, e quase sempre passa porque a gente está olhando pra dentro da pressa. Hoje a gente treina o olho pra capturar.$v$, prompt = $v$Uma beleza pequena que você quase não viu hoje?$v$, tarefa = $v$Hoje, cace três belezas pequenas de propósito. Olhe pro mundo como quem procura, e elas aparecem.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 16;

update prosperidade_jornada_arcos a
set reflexao = $v$A gente pensa muito em quem faz falta pra nós, e pouco em pra quem nós fazemos falta. Mas você é abundância na vida de alguém: a sua presença importa, o seu sumiço pesa. Hoje a gente reconhece o seu valor pra fora.$v$, prompt = $v$Alguém a quem você faz falta?$v$, tarefa = $v$Hoje, deixe-se ser presença pra essa pessoa: uma ligação, uma visita, uma mensagem. Ocupe o espaço que é seu na vida dela.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 17;

update prosperidade_jornada_arcos a
set reflexao = $v$Abundância não é só o que você usa, é também o que está guardado esperando: um talento parado, um contato que você não aciona, um saber que não aplica. Riqueza adormecida ainda é riqueza. Hoje a gente acorda uma.$v$, prompt = $v$Um recurso seu (tempo, rede, saber) parado, esperando uso?$v$, tarefa = $v$Hoje, dê um primeiro movimento mínimo pra usar esse recurso: um e-mail, uma ligação, uma anotação. Tire ele da gaveta.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 18;

update prosperidade_jornada_arcos a
set reflexao = $v$Enquanto a gente lamenta as portas fechadas, costuma ter uma aberta que a gente nem olha: uma oportunidade, um convite, um caminho disponível agora. Hoje a gente repara no que está aberto, não no que travou.$v$, prompt = $v$Uma porta que está aberta pra você agora?$v$, tarefa = $v$Hoje, olhe pra essa porta aberta e dê um passo na direção dela. Pequeno, só pra sentir que ela é real.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 19;

update prosperidade_jornada_arcos a
set reflexao = $v$Você de dez anos atrás sonhava com coisas que hoje você tem e nem repara. Olhar pra trás assim não é nostalgia, é prova: você já chegou onde um dia quis chegar, em muita coisa. Hoje a gente vê isso.$v$, prompt = $v$O que você já tem que a sua versão de 10 anos atrás invejaria?$v$, tarefa = $v$Hoje, agradeça à sua versão de dez anos atrás por ter caminhado até aqui. E diga a ela: deu certo, em muita coisa deu.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 20;

update prosperidade_jornada_arcos a
set reflexao = $v$Vinte e um dias atrás você começou olhando pra algo que um dia foi sonho. A Val acompanhou cada pequena coisa que você nomeou, e hoje mostra a você o tamanho da abundância que sempre esteve aí, esperando o seu olhar.$v$, prompt = $v$Depois de 21 dias, o que mudou no seu jeito de olhar pro que você já tem? (a Val mostra quanta abundância você nomeou)$v$, tarefa = $v$Hoje, escolha um momento do dia pra ser, todo dia, o seu momento de reparar numa pequena coisa. A jornada acaba, o olhar fica.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = 21;

update prosperidade_jornada_arcos a
set reflexao = $v$O que é fácil pra você parece fácil pra todo mundo. Esse engano faz muita mulher entregar de graça o que é raro. Aquilo que você resolve sem esforço, que pra você é óbvio, pode ser exatamente o que falta pros outros. Hoje a gente começa a enxergar o seu raro.$v$, prompt = $v$O que você faz tão bem que nem percebe que é raro?$v$, tarefa = $v$Hoje, repare numa coisa que você fez no automático e que alguém ao seu redor não saberia fazer. Anote ela.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'nao-cobra' and a.dia = 1;

update prosperidade_jornada_arcos a
set reflexao = $v$Existe um trabalho que você já faz e não cobra, porque ele vem fácil e disfarçado de conversa, de favor, de “ajudinha”. Mas é trabalho, é o seu saber sendo entregue. Hoje a gente mapeia pra onde ele está indo de graça.$v$, prompt = $v$A quem você dá conselho ou ajuda de graça, e com frequência?$v$, tarefa = $v$Hoje, repare numa vez em que você der esse tipo de ajuda. Só note: isso que eu acabei de dar, alguém cobraria.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'nao-cobra' and a.dia = 2;

update prosperidade_jornada_arcos a
set reflexao = $v$Tem uma régua dupla aí: o que você cobraria de uma desconhecida, você faz de graça pra quem conhece, porque cobrar de perto parece feio. Mas o seu valor não muda com a proximidade de quem recebe. Hoje a gente olha pra essa régua.$v$, prompt = $v$O que você cobraria de uma estranha, mas faz por conhecidos sem cobrar?$v$, tarefa = $v$Hoje, imagine quanto você cobraria de uma estranha por isso. Coloque um número, mesmo que só na sua cabeça.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'nao-cobra' and a.dia = 3;

update prosperidade_jornada_arcos a
set reflexao = $v$“Tá caro?” é a pergunta que muita mulher faz antes mesmo do cliente. O medo de ser cara demais te faz baixar o preço antes de qualquer negociação, sozinha, por dentro. Hoje a gente flagra esse desconto que você se dá.$v$, prompt = $v$Qual desconto você dá por se sentir “cara demais”?$v$, tarefa = $v$Hoje, repare numa situação em que você quase baixou o seu valor por insegurança. Segure o número original por um instante, só pra sentir.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'nao-cobra' and a.dia = 4;

update prosperidade_jornada_arcos a
set reflexao = $v$Você entrega muito mais do que cobra, e nem nomeia. O extra que fez, a atenção a mais, a hora além do combinado, tudo isso vira invisível na conta. Hoje a gente traz pra luz o valor que você dá e não conta.$v$, prompt = $v$Um valor que você entregou e nem mencionou na hora de cobrar?$v$, tarefa = $v$Hoje, numa entrega sua, nomeie pra você (ou pra quem recebe) o valor extra que você colocou. Só dizer já muda algo.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'nao-cobra' and a.dia = 5;

update prosperidade_jornada_arcos a
set reflexao = $v$O medo de cobrar o cheio vive de um futuro catastrófico: “vão me achar gananciosa, vão embora, vou perder tudo”. Mas quando a gente olha o pior caso de frente, ele costuma ser menor do que o medo pintava. Hoje a gente encara.$v$, prompt = $v$Se você cobrasse o preço cheio uma vez, o que aconteceria de pior?$v$, tarefa = $v$Hoje, escreva o pior cenário e, do lado, o quão provável ele é de verdade. Veja o medo no tamanho real.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'nao-cobra' and a.dia = 6;

update prosperidade_jornada_arcos a
set reflexao = $v$Sete dias atrás você nem via o que entregava de graça. Hoje você já enxerga o seu raro, a régua dupla, o desconto que se dava, o medo no tamanho real. A Val fecha com você nomeando o seu valor, e combina um primeiro movimento pra começar a cobrá-lo.$v$, prompt = $v$Depois desses dias, como você nomearia o seu valor? E qual é o primeiro movimento pequeno pra começar a cobrá-lo?$v$, tarefa = $v$Hoje, dê esse primeiro movimento, ou marque o dia exato em que vai dar. Um movimento pequeno e real: mencionar um preço, ajustar um valor, dizer um número em voz alta.$v$
from prosperidade_jornadas j
where a.jornada_id = j.id and j.slug = 'nao-cobra' and a.dia = 7;

-- =============================================================================
-- Val — Jornadas: a TAREFA do dia (a terceira perna) e o ciclo diário.
--
-- Cada dia da jornada vira um processo de três pernas:
--   1. ABERTURA  (a Val ensina): reflexão curta na voz dela sobre o degrau.
--   2. A PERGUNTA (provoca): o questionamento que ela responde (já existia).
--   3. A TAREFA  (move): um micro-gesto de consciência, leve e factível, até o
--      dia seguinte. Micro-gesto, NUNCA ação estruturante (isso é o Ciclo da
--      Colheita). A intenção da tarefa é fixa e editável no admin, como a
--      pergunta; o texto final é gerado na voz da Val, adaptado às respostas.
--
-- Ciclo diário: no dia seguinte, ANTES da nova reflexão, a Val pergunta como foi
-- a tarefa de ontem. Ela registra o andamento, e isso alimenta a reflexão de
-- hoje. É o que faz a jornada ser um processo, não dias soltos. A tarefa é
-- convite, nunca cobrança: se ela não fez, a Val acolhe e segue.
--
-- Aplicar DEPOIS de 0010 e 0011. SQL Editor → cole → Run.
-- =============================================================================

-- A intenção da tarefa, no arco (fixa, editável no admin). Vazia no fechamento.
alter table prosperidade_jornada_arcos add column if not exists tarefa text;

-- No dia vivido: a tarefa gerada e o andamento que ela registra no dia seguinte.
alter table prosperidade_percurso_dias add column if not exists tarefa text;
alter table prosperidade_percurso_dias add column if not exists tarefa_andamento text;
alter table prosperidade_percurso_dias add column if not exists tarefa_andamento_em timestamptz;

-- --- Semente das tarefas (micro-gestos de consciência) ----------------------
-- Jornada "merecer"
update prosperidade_jornada_arcos a set tarefa = v.tarefa
from prosperidade_jornadas j, (values
  (1,  'hoje, descanse 15 minutos sem ter terminado nada antes, só porque sim.'),
  (2,  'hoje, quando algo bom chegar sem esforço, em vez de minimizar, diga pra si mesma: isso também é meu.'),
  (3,  'hoje, repare numa vez em que você se pegou provando seu valor, e só observe, sem se corrigir.'),
  (4,  'hoje, receba um elogio só com um obrigada, sem devolver e sem diminuir.'),
  (5,  'hoje, ao receber alguma coisa, pare três segundos e repare onde no corpo aperta ou relaxa.'),
  (6,  'hoje, antes de se cobrar por algo, pergunte: eu diria isso pra uma amiga? se não, reescreva pra você.'),
  (7,  'hoje, dê a si mesma uma coisa pequena que você merece, sem motivo nenhum.'),
  (8,  'hoje, receba algo sem oferecer nada em troca na hora, e repare na vontade de retribuir.'),
  (9,  'hoje, atenda uma necessidade sua antes da dos outros, uma vez só.'),
  (10, 'hoje, faça por você uma coisinha que você daria sem pensar pra uma menina de 8 anos.'),
  (11, 'hoje, diga um não pequeno que você costuma engolir, e veja que o mundo segue.'),
  (12, 'hoje, quando lidar com dinheiro, repare na primeira sensação antes do primeiro pensamento.'),
  (13, 'hoje, escreva uma coisa que você quer mais, sem se censurar com o "já tá bom".'),
  (14, 'hoje, escreva num papel uma permissão que você se dá, e deixe à vista.'),
  (15, 'hoje, faça uma parte pequena daquele cuidado com você que você vive adiando.'),
  (16, 'hoje, receba algo bom e repare no medo do que pensariam, sem obedecer a ele.'),
  (17, 'hoje, deixe alguém fazer uma coisa por você, e só agradeça, sem retribuir.'),
  (18, 'hoje, escolha uma coisa que você não vai provar pra ninguém, e só seja.'),
  (19, 'hoje, viva uma hora como se você não precisasse merecer nada pra ter.'),
  (20, 'hoje, marque na agenda a coisa que você vai se permitir, com dia e hora.')
) as v(dia, tarefa)
where a.jornada_id = j.id and j.slug = 'merecer' and a.dia = v.dia;

-- Jornada "pequenas coisas"
update prosperidade_jornada_arcos a set tarefa = v.tarefa
from prosperidade_jornadas j, (values
  (1,  'hoje, use uma coisa que já foi um sonho seu e, por um instante, lembre que um dia foi.'),
  (2,  'hoje, escolha um conforto que virou invisível e use-o reparando nele de propósito.'),
  (3,  'hoje, mande uma mensagem curta pra essa pessoa que apareceu sem você buscar, sem motivo.'),
  (4,  'hoje, ao usar essa habilidade do seu corpo, agradeça por ela em silêncio.'),
  (5,  'hoje, passe alguns minutos no lugar da casa que te acolhe, só pra estar ali.'),
  (6,  'hoje, coma uma coisa devagar, sentindo, sem fazer mais nada ao mesmo tempo.'),
  (7,  'hoje, anote três coisas comuns do seu dia que já são fartura.'),
  (8,  'hoje, repare numa vez em que você usou um saber que levou anos pra construir.'),
  (9,  'hoje, lembre de alguém que torce por você de longe, e mande um oi.'),
  (10, 'hoje, pare pra ouvir, de propósito, por um minuto, o som que te faz bem.'),
  (11, 'hoje, faça uma escolha pequena lembrando que um dia você não pôde escolher.'),
  (12, 'hoje, receba uma coisa da natureza de graça, o sol, o ar, e pare nela um instante.'),
  (13, 'hoje, ao usar uma facilidade sua, lembre que ela não é óbvia pra todo mundo.'),
  (14, 'hoje, repare numa hora em que você já tinha o suficiente e nem percebeu.'),
  (15, 'hoje, agradeça em silêncio por uma coisa que uma fase difícil te ensinou.'),
  (16, 'hoje, encontre uma beleza pequena e fique olhando dez segundos a mais.'),
  (17, 'hoje, lembre que você faz falta pra alguém, e deixe isso ser verdade.'),
  (18, 'hoje, dê um primeiro uso pequeno a um recurso seu que está parado.'),
  (19, 'hoje, repare numa porta que está aberta pra você, sem precisar atravessar ainda.'),
  (20, 'hoje, olhe uma coisa sua com os olhos de quem você era há dez anos.')
) as v(dia, tarefa)
where a.jornada_id = j.id and j.slug = 'pequenas-coisas' and a.dia = v.dia;

-- Jornada "não cobra" (micro-gestos de consciência; nunca método de preço)
update prosperidade_jornada_arcos a set tarefa = v.tarefa
from prosperidade_jornadas j, (values
  (1, 'hoje, repare numa coisa que você faz no automático e que pra outra pessoa seria difícil.'),
  (2, 'hoje, quando for ajudar alguém de graça, só perceba que está fazendo, sem precisar mudar nada.'),
  (3, 'hoje, anote uma coisa que você faz de graça pra conhecidos e cobraria de um estranho.'),
  (4, 'hoje, repare numa vez em que você quase se desculpou pelo seu preço, e só observe.'),
  (5, 'hoje, escreva um valor que você entregou e nunca disse em voz alta.'),
  (6, 'hoje, diga em voz alta, só pra você, o seu preço cheio, e repare como soa.')
) as v(dia, tarefa)
where a.jornada_id = j.id and j.slug = 'nao-cobra' and a.dia = v.dia;

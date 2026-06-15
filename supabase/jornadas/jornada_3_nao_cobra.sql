-- =============================================================================
-- Jornada da Prosperidade: 7 dias pra destravar o que você não cobra
-- Query idempotente: cria/atualiza a jornada e carrega todos os dias
-- (reflexão + pergunta + tarefa). Pode rodar e re-rodar.
-- Pré-requisito (uma vez): 0010 (tabelas + RLS), 0011 e 0014.
-- =============================================================================
alter table prosperidade_jornada_arcos add column if not exists tarefa   text;
alter table prosperidade_jornada_arcos add column if not exists reflexao text;

insert into prosperidade_jornadas (slug, titulo, subtitulo, convite, dias, intervalo_horas, ordem, ativa, fronteira)
values ($v$nao-cobra$v$, $v$7 dias pra destravar o que você não cobra$v$, $v$enxergar o valor que você entrega de graça$v$, $v$Sete dias pra ver de perto o que você faz tão bem que nem cobra, e chegar na beira de cobrar. Um dia por vez. No fim, a gente nomeia o seu valor e um primeiro passo, no seu tempo.$v$, 7, 24, 3, true, $v$Esta jornada chega na beira da ação, faz ela VER o valor que entrega, NUNCA reestrutura precificação com método, nunca vira consultoria de preços nem tabela. No fechamento, ajude a nomear o valor dela e UM primeiro movimento concreto e pequeno pra começar a cobrar, sem método, sem passo a passo de negócio. Prosperidade é reconhecer o que já é real e agir com clareza, nunca lei da atração.$v$)
on conflict (slug) do update set
  titulo = excluded.titulo, subtitulo = excluded.subtitulo, convite = excluded.convite,
  dias = excluded.dias, ordem = excluded.ordem, fronteira = excluded.fronteira;

insert into prosperidade_jornada_arcos (jornada_id, dia, reflexao, prompt, tarefa, fechamento)
select j.id, v.dia, v.reflexao, v.prompt, v.tarefa, v.fechamento
from prosperidade_jornadas j
join (values
  (1, $v$O que é fácil pra você parece fácil pra todo mundo. Esse engano faz muita mulher entregar de graça o que é raro. Aquilo que você resolve sem esforço, que pra você é óbvio, pode ser exatamente o que falta pros outros. Hoje a gente começa a enxergar o seu raro.$v$, $v$O que você faz tão bem que nem percebe que é raro?$v$, $v$Hoje, repare numa coisa que você fez no automático e que alguém ao seu redor não saberia fazer. Anote ela.$v$, false),
  (2, $v$Existe um trabalho que você já faz e não cobra, porque ele vem fácil e disfarçado de conversa, de favor, de “ajudinha”. Mas é trabalho, é o seu saber sendo entregue. Hoje a gente mapeia pra onde ele está indo de graça.$v$, $v$A quem você dá conselho ou ajuda de graça, e com frequência?$v$, $v$Hoje, repare numa vez em que você der esse tipo de ajuda. Só note: isso que eu acabei de dar, alguém cobraria.$v$, false),
  (3, $v$Tem uma régua dupla aí: o que você cobraria de uma desconhecida, você faz de graça pra quem conhece, porque cobrar de perto parece feio. Mas o seu valor não muda com a proximidade de quem recebe. Hoje a gente olha pra essa régua.$v$, $v$O que você cobraria de uma estranha, mas faz por conhecidos sem cobrar?$v$, $v$Hoje, imagine quanto você cobraria de uma estranha por isso. Coloque um número, mesmo que só na sua cabeça.$v$, false),
  (4, $v$“Tá caro?” é a pergunta que muita mulher faz antes mesmo do cliente. O medo de ser cara demais te faz baixar o preço antes de qualquer negociação, sozinha, por dentro. Hoje a gente flagra esse desconto que você se dá.$v$, $v$Qual desconto você dá por se sentir “cara demais”?$v$, $v$Hoje, repare numa situação em que você quase baixou o seu valor por insegurança. Segure o número original por um instante, só pra sentir.$v$, false),
  (5, $v$Você entrega muito mais do que cobra, e nem nomeia. O extra que fez, a atenção a mais, a hora além do combinado, tudo isso vira invisível na conta. Hoje a gente traz pra luz o valor que você dá e não conta.$v$, $v$Um valor que você entregou e nem mencionou na hora de cobrar?$v$, $v$Hoje, numa entrega sua, nomeie pra você (ou pra quem recebe) o valor extra que você colocou. Só dizer já muda algo.$v$, false),
  (6, $v$O medo de cobrar o cheio vive de um futuro catastrófico: “vão me achar gananciosa, vão embora, vou perder tudo”. Mas quando a gente olha o pior caso de frente, ele costuma ser menor do que o medo pintava. Hoje a gente encara.$v$, $v$Se você cobrasse o preço cheio uma vez, o que aconteceria de pior?$v$, $v$Hoje, escreva o pior cenário e, do lado, o quão provável ele é de verdade. Veja o medo no tamanho real.$v$, false),
  (7, $v$Sete dias atrás você nem via o que entregava de graça. Hoje você já enxerga o seu raro, a régua dupla, o desconto que se dava, o medo no tamanho real. A Val fecha com você nomeando o seu valor, e combina um primeiro movimento pra começar a cobrá-lo.$v$, $v$Depois desses dias, como você nomearia o seu valor? E qual é o primeiro movimento pequeno pra começar a cobrá-lo?$v$, $v$Hoje, dê esse primeiro movimento, ou marque o dia exato em que vai dar. Um movimento pequeno e real: mencionar um preço, ajustar um valor, dizer um número em voz alta.$v$, true)
) as v(dia, reflexao, prompt, tarefa, fechamento) on j.slug = $v$nao-cobra$v$
on conflict (jornada_id, dia) do update set
  reflexao = excluded.reflexao, prompt = excluded.prompt,
  tarefa = excluded.tarefa, fechamento = excluded.fechamento;

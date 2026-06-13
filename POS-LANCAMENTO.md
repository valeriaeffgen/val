# Pós-lançamento da Val

Lista viva do que ajustar/revisitar depois que a Val estiver no ar. Não é
cobrança, é memória, pra nada importante se perder entre uma rodada e outra.

## Custo e escala
- [ ] **Reorganizar os prompts pra cruzar o mínimo de cache do Opus (~4.096 tokens).**
  Hoje a Constituição + contexto fica abaixo disso, então o `cache_control` das
  funções Edge não dispara e não economiza nada. A entrada domina o custo, então
  esta é a **maior alavanca de custo** do app. Fazer quando o volume justificar.
- [ ] **Reavaliar o teto de 300 créditos/mês** com os dados reais do ledger
  (`creditos_lancamentos`) e da `degustacao_metricas`, depois dos primeiros meses.
  Ajuste é uma linha: `update planos set creditos_mes = ... where id = 'mensal'`.

## Assinatura (fases seguintes)
- [ ] FASE 3 — integrar o Asaas: cartão recorrente como caminho principal
  (assinatura nativa) + Pix avulso como alternativa; webhook → `conceder_creditos`;
  cancelamento digno no app; renovação mensal do pacote.
- [ ] Avaliar 3 dias de degustação com a `degustacao_metricas` (dias usados ×
  gerações por mulher): 3 dias convertem ou cortam cedo demais?

## Curadoria e conteúdo
- [ ] Subir o limiar de curadoria de **1 voto → 3** (`marcar_util`, migration 0003)
  quando terminar a fase de teste. Hoje 1 voto já promove à fila.
- [ ] Vídeos: hoje são placeholders (`VIDEOS_DEMO`), aguardam as gravações da Valéria.
- [ ] "Ciclo da Colheita" da Prosperidade está construído porém **dormente**
  (`CICLO_DA_COLHEITA_ATIVO = false`); ligar quando fizer sentido.

## Privacidade / jurídico
- [ ] Revisão jurídica da Política de Privacidade antes do lançamento público
  (a base já está escrita, em `src/data/politica.js`).
- [ ] Configurar o redirecionamento de `hello@val.help` (contato da política).

## Admin
- [ ] Transformar `/?caixa` numa tela de admin mais completa (gestão de curadoras,
  acervo oficial, pedidos de exclusão, panorama agregado e anônimo).

## Asaas: virada sandbox → produção (FASE 3)
- [ ] Remover o diagnóstico de sandbox: a linha técnica do erro do Asaas na tela
  de plano (`src/components/Plano.jsx`) e o detalhe em `src/lib/assinatura.js`.
- [ ] Trocar os segredos pra produção: `ASAAS_BASE_URL = https://api.asaas.com/v3`
  e `ASAAS_API_KEY` = a chave de PRODUÇÃO do Asaas.
- [ ] Recriar o webhook no painel de PRODUÇÃO do Asaas (mesma URL da função),
  com um novo `ASAAS_WEBHOOK_TOKEN` de produção (e atualizar o segredo).
- [ ] Fazer um pagamento real de R$48 de ponta a ponta antes de abrir ao público,
  e cancelar pra conferir o reembolso/encerramento.

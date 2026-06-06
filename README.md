# Val.

> Um santuário pessoal para mulheres ajustarem a própria vibração: elevar o estado no momento e, com o tempo, tornar o estado bom o padrão.

A alma do projeto vive em **[`CLAUDE.md`](./CLAUDE.md)** — a Constituição da Val.
Leia antes de escrever qualquer linha. Na dúvida entre o elegante e o fiel ao
documento, escolha o fiel.

## Rodar

```bash
npm install
npm run dev
```

## Estrutura

```
src/
  main.jsx              ponto de entrada
  App.jsx               casca: chegada → seções → rodapé
  components/
    Nav.jsx             navegação (ordem da seção 6 da Constituição)
    Secao.jsx           layout editorial compartilhado
  sections/
    index.js            registro das seções na ordem da navegação
    Limiar.jsx          ritual de chegada ("Como você chega?")
    Conversar.jsx       chat com a Val
    ComoLidar.jsx       caixa de ferramentas para o agudo
    Soltar.jsx          descompressão de pensamentos
    OlharPraDentro.jsx  jornadas de autoconhecimento
    Autoamor.jsx        gesto diário, palavra do dia, banco pessoal
    Diario.jsx          acervo + ritual dos Elogios
    Cartas.jsx          a parte humana (responde a Valéria)
    Trajetoria.jsx      gráfico de bem-estar (testemunho, não nota)
    MeuCentro.jsx       valores, conquistas, foco, elevadores
  lib/
    constitution.js     a Constituição como system prompt da camada generativa
    voice.js            guardião do léxico proibido (rede de segurança)
    db.js               fachada de dados async (escolhe Supabase ou localStorage)
    supabase.js         cliente Supabase + sessão anônima
    storage.js          adaptador local (localStorage), fallback offline
    useColecao.js       hooks finos sobre a camada de dados
  styles/
    tokens.css          paleta e tipografia (seção 5)
    global.css          base editorial
  data/
    seed.js             conteúdo-semente (seção 7: semente, não teto)
supabase/
  migrations/0001_init.sql   schema (seção 10) + RLS + camada generativa
  README.md                  como aplicar o schema e configurar o ambiente
```

## Dados

A camada de dados (`src/lib/db.js`) é assíncrona e tem dois adaptadores:

- **Com Supabase** (variáveis `VITE_SUPABASE_*` definidas): grava nas tabelas
  reais, com `user_id` e RLS. Abre uma sessão anônima na chegada — sem muro de
  cadastro. Ver [`supabase/README.md`](./supabase/README.md).
- **Sem Supabase:** roda em `localStorage` (fallback offline), para o app
  funcionar em qualquer ambiente.

As seções não sabem qual backend está embaixo — falam só com `db`.

## Stack (seção 9)

- **Frontend:** React + Vite.
- **Backend/dados:** Supabase (auth, banco, caixa das cartas) — a integrar.
- **IA:** API da Anthropic (Claude) para a camada generativa, **sempre** com a
  Constituição no system prompt. A chave fica no backend, nunca no frontend.

## Estado atual

Fundação: identidade visual, casca de navegação com as nove seções, ritual de
chegada funcional, camada de dados local espelhando a seção 10, e a Constituição
embutida pronta para a camada generativa. As seções são esqueletos honestos —
o conteúdo cresce a partir daqui.

# Supabase da Val

O schema que traduz a estrutura de dados da seção 10 da Constituição para
tabelas reais, com `user_id` em tudo e RLS protegendo a história de cada mulher.

## Aplicar o schema

**Pelo painel (mais simples):** abra o projeto no Supabase → _SQL Editor_ →
cole o conteúdo de [`migrations/0001_init.sql`](./migrations/0001_init.sql) →
_Run_.

**Pela CLI:**

```bash
supabase link --project-ref <seu-ref>
supabase db push
```

## Variáveis de ambiente

Copie `.env.example` para `.env` na raiz e preencha:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Sem essas variáveis, o app roda em `localStorage` (fallback offline) — útil em
desenvolvimento e em sessões sem backend. Com elas, o app abre uma **sessão
anônima** automática (sem muro de cadastro na chegada) e passa a gravar nas
tabelas reais. A chave da Anthropic **nunca** vai no frontend: ela vive no
backend (ex.: função Edge do Supabase) que injeta a Constituição no system
prompt.

## As tabelas

| Tabela | O que guarda | Seção |
| --- | --- | --- |
| `perfil` | valores, conquistas, foco, elevadores (Meu Centro) | 6, 10 |
| `diario` | acervo de gratidão/perspectiva + rituais (`cat`) | 6 |
| `soltar` | pensamentos soltos, "para lembrar depois" | 6 |
| `jornadas` | respostas + devolutiva ("seu espelho") | 6 |
| `cartas` | a parte humana — a mulher escreve, a curadora responde | 8 |
| `sessoes` | entrada→saída de cada visita (base da Trajetória) | 6 |
| `feedback` | a pergunta direta de feedback | 6 |
| `palavras` | banco do Autoamor | 6 |
| `conteudo_gerado` | a camada generativa (rascunho→curadoria→oficial) | 7 |
| `curadoras` | quem pode ler/responder Cartas e lapidar conteúdo | 7, 8 |

## Decisões de modelagem

- **`usuarias`** (citada na seção 10) é o `auth.users` do Supabase Auth; o
  perfil editável vive em `perfil` (uma linha por usuária, criada por trigger
  no primeiro acesso).
- **`cartas_inbox`** (a "caixa de entrada da Valéria") não é uma tabela à
  parte: é o acesso de **curadora** à própria tabela `cartas` via RLS
  (`is_curadora()`). Sem IA fingindo ser gente (seção 8).
- **Acervo de todas:** conteúdo com `status = 'oficial'` é legível por qualquer
  usuária autenticada — é o conteúdo aprovado que a fila de curadoria lapidou.

## Tornar alguém curadora

```sql
insert into curadoras (user_id) values ('<uuid-da-valeria>');
```

## A voz da Val — função Edge `conversar`

A seção Conversar fala com a Claude através de uma função Edge (`functions/conversar`),
para que a chave da Anthropic **nunca** apareça no frontend. A função injeta a
Constituição no system prompt e puxa o contexto pessoal da mulher do banco, sob
a RLS dela.

```bash
# 1. Guardar a chave da Anthropic como segredo da função (não vai no .env do frontend)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 2. Publicar a função
supabase functions deploy conversar
```

`SUPABASE_URL` e `SUPABASE_ANON_KEY` já são injetados automaticamente nas funções
Edge — não precisa configurá-los. A função usa o token da sessão (anônima) de
quem chama, então lê os dados sob a RLS correta.

Modelo usado: `claude-opus-4-8`. Para trocar, edite `functions/conversar/index.ts`.

### A palavra de hoje — função Edge `palavra`

O Autoamor gera "a palavra de hoje" pela função `functions/palavra`, com **cache
primeiro** (regra 2): uma palavra por dia, guardada em `conteudo_gerado` e
reaproveitada — não regera o que já existe. Publique do mesmo jeito:

```bash
supabase functions deploy palavra
# ou, de uma vez, todas: supabase functions deploy
```

Pelo painel: **Edge Functions → Create a function** → nome `palavra` → cole o
conteúdo de `functions/palavra/index.ts` → Deploy. A mesma `ANTHROPIC_API_KEY`
serve as duas funções.

## As Cartas e a caixa da Valéria (seção 8)

A mulher escreve em `Cartas` (grava em `cartas` sob a RLS dela). A Valéria lê e
responde na **caixa de entrada**, acessível por `https://SEU-APP/?caixa`,
protegida por login de e-mail e pela tabela `curadoras`.

**1. Permitir o login da caixa (uma vez):** Supabase → **Authentication → URL
Configuration** → adicione o domínio do app em **Site URL** e em **Redirect
URLs** (ex.: `https://val-one-gold.vercel.app/**`). Sem isso, o link mágico não
volta para o app.

**2. Tornar a Valéria curadora (uma vez, depois do primeiro login por e-mail):**

```sql
insert into curadoras (user_id)
select id from auth.users where email = 'voamulher2025@gmail.com'
on conflict do nothing;
```

A partir daí, `/?caixa` mostra as cartas que chegaram, com um campo para
responder. Responder grava `resposta`, `status='respondida'` e `respondida_em`;
a mulher passa a ver a resposta nas "Nossas cartas".

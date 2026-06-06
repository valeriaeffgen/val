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

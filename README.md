# Marketing AI Studio

Sistema interno (uso de uma única empresa, sem multi-tenant/planos/assinaturas) que funciona como
uma agência de marketing baseada em IA: o usuário escreve um pedido, um fluxo de agentes (CEO →
Editor-chefe → Redator LinkedIn / Redator Instagram / Redator de campanhas → Revisor) processa a
solicitação e entrega conteúdos estruturados.

**Estado atual (Fase 2): só o Editor-chefe usa IA real (Anthropic Claude).** Os outros 4 agentes
(LinkedIn, Instagram, Campanhas, Revisor) continuam simulados — ver "Fase 2" abaixo.

**Testado de ponta a ponta**: build de produção, seed e navegação completa (criar projeto → ver o
fluxo dos 6 agentes progredir em tempo real → entrega final com as 6 abas → `/projetos`,
`/biblioteca`, `/configuracoes`, `/historico`, mobile) foram verificados em um browser real, incluindo
o caminho de erro do Editor-chefe sem uma `ANTHROPIC_API_KEY` configurada.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Prisma
ORM 7 · SQLite (dev, zero setup) / PostgreSQL (produção, documentado abaixo) · Zod.

## Estrutura de pastas

```
prisma/
  schema.prisma            # entidades (enums viram String — ver nota SQLite abaixo)
  migrations/0001_init/     # migration inicial
  seed.ts                   # 1 admin, 1 CompanySettings, 3 projetos em estágios diferentes
docker-compose.yml          # Postgres opcional para produção (porta 5433 do host -> 5432 do container)
src/
  app/                       # rotas (App Router)
    page.tsx                 # tela inicial (inbox)
    projetos/                # lista + /projetos/[id] (fluxo do projeto)
    biblioteca/               # biblioteca de conteúdos
    configuracoes/            # configurações da empresa
    historico/                 # histórico global de eventos
    api/projects/[id]/         # endpoint de polling usado pela tela do projeto
  components/                 # layout, home, workflow, delivery, projects, library, settings, ui (shadcn)
  server/
    actions/                  # Server Actions ('use server') — mutações
    repositories/             # única camada que fala com o Prisma
  services/
    ai/
      agents/                  # chief-editor.agent.ts é o único agente REAL (chama Anthropic)
      providers/                # ai-provider.interface.ts, anthropic.provider.ts (real), openai.provider.ts (preparado, não usado)
      prompts/                  # chief-editor.prompt.ts — prompt real usado pelo Editor-chefe
      schemas/                  # Zod schemas de cada agente (chiefEditorPlanSchema é o real)
      types/                    # MarketingAgent<TInput,TOutput>, CompanyContext
      company-context.service.ts # buildCompanyContext() — monta o CompanyContext a partir do CompanySettings
    workflow/
      workflow-runner.ts        # orquestrador — chama o Editor-chefe real e os outros 4 simulados
      legacy-plan.mapper.ts     # converte o plano real do Editor-chefe pro shape que os 4 simulados esperam
      linkedin-writer.service.ts, instagram-writer.service.ts,
      campaign-writer.service.ts, reviewer.service.ts   # continuam 100% simulados (Fase 1, intocados)
  validations/                # Zod schemas de input (front + back)
  types/
    project.ts                # tipos derivados do Prisma (ProjectDetail etc.)
    enums.ts                   # unions TS que substituem os enums do Prisma (ver nota SQLite)
  lib/                        # prisma client, auth simulado, formatação, export JSON/MD, etc.
```

## Nota importante: SQLite em vez de PostgreSQL

O pedido original especificava PostgreSQL, e o projeto foi construído em cima dele (schema com
`enum`, `docker-compose.yml`, migration gerada via `prisma migrate diff`). Durante o setup, esta
máquina não tinha Docker disponível nem credenciais conhecidas para o Postgres nativo que já rodava
nela — a pedido do usuário, o datasource foi trocado para **SQLite** (arquivo local `dev.db`, zero
setup, zero credenciais) para permitir rodar e testar o sistema de ponta a ponta imediatamente.

Isso teve duas consequências no schema:

1. **Sem enums.** SQLite não tem tipo enum nativo — os campos que eram `enum` (status, tipos de
   agente, plataforma, formato, decisão) agora são `String`. Os valores permitidos continuam
   documentados como unions TypeScript em `src/types/enums.ts` e validados em runtime pelos schemas
   Zod (`src/validations/*`, `src/services/ai/schemas/*`) — nada no app depende do banco para
   impedir um valor inválido, então a segurança de tipo na prática não mudou.
2. **Sem `@default` em campos Json.** O engine de migration do Prisma para SQLite gera SQL inválido
   para defaults de array/objeto (`@default("[]")`). Os valores default agora são responsabilidade
   da camada de repositório (ex.: `settingsRepository.get()`, `generatedContentRepository.create()`).

Para voltar a usar PostgreSQL em produção: troque `datasource db { provider = "sqlite" }` por
`"postgresql"`, reintroduza os `enum` no lugar dos campos `String` marcados com `///
NomeDoEnum (see src/types/enums.ts)`, adicione de volta os `@default("[]")`/`@default("{}")` nos
campos Json, troque o adapter em `src/lib/prisma.ts` de `PrismaLibSql` para `PrismaPg`
(`@prisma/adapter-pg`, já instalado) e rode `prisma migrate dev`. O `docker-compose.yml` já sobe um
Postgres pronto para isso.

## Variáveis de ambiente

Copie `.env.example` para `.env` (o `prisma.config.ts` já carrega o `.env` via `dotenv`):

```
DATABASE_URL="file:./dev.db"
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

Para o Editor-chefe funcionar de verdade, preencha `ANTHROPIC_API_KEY` com uma chave da Anthropic
(https://console.anthropic.com/settings/keys). Sem ela, o Editor-chefe falha de forma tratada (ver
seção "Fase 2" abaixo) — o resto do app continua funcionando normalmente. `AI_PROVIDER` e
`OPENAI_API_KEY` estão preparados mas não são lidos por nenhum código ainda (ver "Fase 2").

## Instalação e execução

```bash
npm install
npm run db:migrate    # aplica a migration inicial (cria prisma/dev.db)
npm run db:seed       # cria admin, configurações e 3 projetos de exemplo
npm run dev           # http://localhost:3000
```

Não precisa de Docker nem de um servidor de banco — é só um arquivo local. Outros comandos úteis:
`npm run db:studio` (Prisma Studio), `npm run build` / `npm start` (produção), `npm run lint`,
`npx tsc --noEmit`.

Não há tela de login — a autenticação é simulada (`src/lib/auth.ts::getCurrentUser()` sempre
retorna o admin do seed, e a arquitetura já está pronta para trocar por autenticação real).

### Credenciais de teste

Não há login. O usuário "logado" é sempre o admin criado pelo seed:
`admin@marketingaistudio.local` — CEO / Responsável de Marketing.

## Funcionalidades concluídas

- Tela inicial com caixa de entrada, sugestões clicáveis e validação (mín. 10 caracteres).
- Criação de projeto → dispara o fluxo simulado em background (`after()` do Next.js) sem bloquear o redirect.
- Tela do projeto (`/projetos/[id]`) com fluxo vertical dos 6 agentes, status/horários/progresso/mensagem
  atual/resumo por agente, atualizada por **polling** (3s) via `GET /api/projects/[id]`.
- Cada etapa do fluxo é persistida no banco (`AgentExecution`, `GeneratedContent`, `Review`,
  `ProjectMessage`) — não é só animação de front-end.
- Entrega final em abas: Planejamento, LinkedIn (≥2 posts), Instagram (carrossel + Reels + post +
  Stories), Campanha, Revisão (notas por critério + decisão) e Resumo final (export JSON/MD, criar
  novo projeto).
- Ações por conteúdo: copiar, editar (JSON), aprovar, solicitar ajuste, arquivar (na biblioteca).
- `/projetos`: busca, filtro por status, excluir (com confirmação), duplicar.
- `/biblioteca`: filtros por projeto, agente, plataforma, formato e status.
- `/configuracoes`: formulário único (empresa única, sem multi-tenant) cobrindo todos os campos pedidos.
- `/historico`: feed global de eventos de todos os projetos.
- Tratamento de erro do fluxo com status `FAILED` + botão "Tentar novamente"; lock simples contra
  disparo duplo do mesmo fluxo (`workflow.status === RUNNING` é checado antes de iniciar).
- Layout responsivo: sidebar recolhível no desktop, barra inferior de navegação no mobile; o fluxo
  do projeto já é uma timeline vertical (funciona igual em mobile e desktop).
- Seed com 3 projetos em estágios diferentes (rascunho, em andamento, e um terceiro gerado
  rodando o `workflow-runner.ts` real de ponta a ponta — **fica `COMPLETED` se `ANTHROPIC_API_KEY`
  estiver configurada, ou `FAILED` se não estiver**, já que agora ele passa pelo Editor-chefe real).

## Fase 2 — Editor-chefe com IA real (Anthropic Claude)

Só o **Editor-chefe** chama uma IA de verdade agora. LinkedIn, Instagram, Campanhas e Revisor
continuam simulados, sem nenhuma linha alterada na lógica deles.

**Sem `ANTHROPIC_API_KEY` configurada, o Editor-chefe usa um plano simulado** —
`src/services/ai/agents/chief-editor.simulated.ts` (`generateSimulatedChiefEditorPlan`), com a
mesma variedade/randomização que os outros 4 agentes simulados já tinham. Isso garante que o fluxo
inteiro (os 6 agentes, ponta a ponta) funcione sem depender de nenhuma API real — testado criando
um projeto do zero até "Entrega final" sem chave configurada, no browser, sem erros. Assim que
`ANTHROPIC_API_KEY` é preenchida, esse desvio some sozinho e o Editor-chefe passa a chamar a
Anthropic de verdade (`chief-editor.agent.ts` checa `process.env.ANTHROPIC_API_KEY` a cada
execução — não precisa reiniciar nada além do processo do Next.js pegar a nova variável de ambiente).
O histórico do projeto deixa isso explícito ("ANTHROPIC_API_KEY não configurada — usando
planejamento simulado." vs. "Prompt enviado ao editor-chefe (IA real).").

**Arquitetura do provedor** (`src/services/ai/providers/`):

```ts
interface AIProvider {
  generateStructuredOutput<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T>;
  }): Promise<T>;
}
```

`anthropic.provider.ts` implementa isso com `client.messages.parse({ model: "claude-opus-4-8",
thinking: {type:"adaptive"}, output_config: {format: zodOutputFormat(schema), effort:"high"}, ... })`
— saída validada automaticamente contra o schema Zod (`response.parsed_output`), sem parsing manual
de texto. `openai.provider.ts` é uma implementação real equivalente (via `chat.completions.parse` +
`zodResponseFormat`), preparada mas **não usada por nenhum agente ainda** — só demonstra que a
interface funciona com um segundo provedor.

**Por que o schema do Editor-chefe é diferente do que os outros 4 agentes esperam**: o schema real
pedido (`projectTitle`, `summary`, `contentPlan[]` com `platform`/`format`/`theme`/`briefing`/
`suggestedDate` por item) não é o mesmo shape que `linkedin-writer.service.ts` /
`instagram-writer.service.ts` / `campaign-writer.service.ts` já liam do Editor-chefe simulado da
Fase 1. Para não alterar uma linha sequer desses 3 arquivos, `src/services/workflow/legacy-plan.mapper.ts`
converte o plano real no shape antigo (`toLegacyChiefEditorOutput`) antes de repassá-lo pra eles — o
plano **real** é o que fica salvo em `AgentExecution.output` e exibido na aba Planejamento; o plano
**legado** (derivado) só existe internamente, como entrada dos 3 redatores simulados.

**Briefings**: cada item do `contentPlan` vira uma linha de `GeneratedContent` (com o
`agentExecutionId` do Editor-chefe, sem gerar posts ainda — "Não gerar posts ainda. Somente
planejamento" era um requisito explícito). Esses briefings são filtrados para fora do input do
Revisor e das abas LinkedIn/Instagram/Campanha na entrega final (que continuam mostrando só os
posts reais dos redatores simulados) — mas aparecem na Biblioteca, filtráveis por
"Editor-chefe (briefings)".

**Tratamento de erro**: `withRetry()` (`src/lib/retry.ts`) tenta a chamada à IA até 2 vezes antes de
desistir. Se falhar mesmo assim (ex.: sem `ANTHROPIC_API_KEY`), o erro sobe para
`workflow-runner.ts`, que já tinha (desde a Fase 1) um `catch` global marcando o projeto como
`FAILED` com mensagem amigável + botão "Tentar novamente" — nesta fase, esse `catch` também marca a
execução específica do agente que estava rodando (não só o projeto) como `FAILED`, para o card do
agente na tela mostrar o erro em vez de ficar preso em "Trabalhando" para sempre. Testado sem uma
`ANTHROPIC_API_KEY` real: o fluxo falha de forma limpa, sem erro no console, com a mensagem exata do
SDK da Anthropic exibida no histórico.

**Ainda não implementado (por instrução explícita)**: escolha dinâmica de provedor via
`AI_PROVIDER` — o agente sempre usa `AnthropicProvider`, com um comentário
`TODO(ai-provider-switch)` em `chief-editor.agent.ts` marcando onde essa lógica entraria.

## Pontos preparados para IA real

- **Editor-chefe: já é real** (ver seção "Fase 2" acima) — use-o como referência para os próximos agentes.
- `src/services/ai/agents/*.agent.ts` — interfaces `MarketingAgent<TInput, TOutput>` por agente
  (LinkedIn/Instagram/Campanhas/Revisor ainda são só a interface — a implementação mock continua em
  `services/workflow/*.service.ts`, exatamente como description da Fase 1).
- `src/services/ai/providers/ai-provider.interface.ts` + `anthropic.provider.ts` (real) +
  `openai.provider.ts` (real, não usado) — repita o padrão do Editor-chefe para os próximos agentes:
  criar `<agente>.schema.ts`, `<agente>.prompt.ts`, e trocar o corpo do `.service.ts` por uma classe
  que chama `provider.generateStructuredOutput(...)`.
- `src/services/ai/schemas/*.ts` — Zod schemas do output estruturado de cada agente (o do Editor-chefe
  já é o real; os outros 4 ainda são os schemas legados usados pelos mocks).
- `src/services/ai/prompts/*.ts` — o do Editor-chefe já é o prompt real; os outros são só rascunho.
- `CompanySettings` → `buildCompanyContext()` (`src/services/ai/company-context.service.ts`) já
  monta o `CompanyContext` usado pelo Editor-chefe real — reaproveitável por qualquer agente futuro.

## Decisões de arquitetura (fora do pedido original)

- Optei por Server Actions + Server Components para tudo que não precisa de polling, em vez de
  recriar endpoints REST equivalentes — API route dedicada só existe onde é estritamente necessária
  (`GET /api/projects/[id]`, consumida pelo polling client-side).
- `next.config`/scripts já seguem o Next 16 (Turbopack por padrão, `params`/`searchParams` como
  Promise, `PageProps`/`RouteContext` gerados por `next typegen`).
- Prisma 7 mudou o generator padrão (`prisma-client`, cliente gerado em `src/generated/prisma`, **exige
  driver adapter**); `src/lib/prisma.ts` usa `@prisma/adapter-libsql` para SQLite hoje (troque para
  `@prisma/adapter-pg`, já instalado, ao migrar para Postgres).
- SQLite em vez de PostgreSQL — ver seção dedicada acima; é a mudança de arquitetura mais
  significativa em relação ao pedido original e a decisão foi tomada explicitamente com o usuário.

## Próximos passos recomendados

1. Repetir o padrão do Editor-chefe (agente real) para LinkedIn, Instagram, Campanhas e Revisor —
   nessa ordem, um de cada vez, validando cada um antes do próximo.
2. Implementar a escolha dinâmica de provedor via `AI_PROVIDER` (hoje só o comentário
   `TODO(ai-provider-switch)` existe).
3. Migrar para PostgreSQL em produção (passo a passo na seção "Nota importante" acima).
4. Autenticação real (hoje só existe `getCurrentUser()` simulado).
5. Fila/worker real para o `workflow-runner` em vez de `after()` in-process (importa se o volume crescer).
6. Trocar polling por Server-Sent Events se a frequência de atualização precisar ser menor que 3s.
7. Rich text editor no lugar do editor JSON simples nos conteúdos.
8. Integração real com LinkedIn/Instagram para publicação direta (fora de escopo por instrução do projeto).

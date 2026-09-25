# Histórico lógico de commits — Boards, dashboard e financeiro

Este documento registra as alterações realizadas como uma sequência lógica de commits.
Os identificadores abaixo são descritivos e não representam hashes reais do Git.

## Commit 01 — Qualificação obrigatória nas boards de oportunidades

**Mensagem**

```text
feat(oportunidades): adiciona qualificação obrigatória às boards
```

**Alterações**

- Adiciona o campo `qualificacao` ao cadastro de boards de oportunidades.
- Torna obrigatória a escolha de uma qualificação ao criar uma board.
- Permite alterar a qualificação pela edição da board.
- Adiciona validação da qualificação nas APIs de criação e edição.
- Define `Frio` como valor padrão para compatibilidade com boards existentes.
- Adiciona a migration responsável pela nova coluna no banco de dados.

**Arquivos principais**

- `prisma/schema.prisma`
- `prisma/migrations/20260806210000_board_oportunidade_qualificacao/migration.sql`
- `types/form.d.ts`
- `utils/rules.ts`
- `stores/useOportunidades.ts`
- `server/api/oportunidades/board/index.post.ts`
- `server/api/oportunidades/board/[id]/index.patch.ts`
- `server/api/oportunidades/board/index.get.ts`
- `components/Oportunidade/Board/CreateModal.vue`
- `components/Oportunidade/Board/EditModal.vue`

---

## Commit 02 — Identificação visual da qualificação nas boards

**Mensagem**

```text
feat(oportunidades): exibe qualificação diretamente no cabeçalho da board
```

**Alterações**

- Exibe a qualificação ao lado do nome da board.
- Posiciona o indicador à esquerda do menu de três pontos.
- Mantém a informação visível sem exigir a abertura das configurações.
- Adiciona badge discreto com cor específica para cada qualificação.
- Aplica a mesma experiência nas versões desktop e mobile.

**Arquivos principais**

- `components/Oportunidade/Board/Container/Desktop.vue`
- `components/Oportunidade/Board/Container/Mobile.vue`

---

## Commit 03 — Filtros de board e oportunidade no dashboard CRM

**Mensagem**

```text
feat(dashboard): adiciona filtros por board e oportunidade
```

**Alterações**

- Adiciona filtro por board, prancheta ou status no dashboard.
- Adiciona filtro por cliente/oportunidade.
- Faz os indicadores e gráficos responderem aos novos filtros.
- Aplica os filtros às interações, aos lembretes e às próximas visitas.
- Mantém separação entre o valor selecionado no formulário e o filtro efetivamente aplicado.
- Atualiza o estado global do dashboard para compartilhar os filtros entre os componentes.
- Adiciona suporte aos parâmetros `boardId` e `opportunityId` nas APIs relacionadas.

**Arquivos principais**

- `components/Home/FilterOptions.vue`
- `stores/useStats.ts`
- `server/api/stats/index.get.ts`
- `server/api/lembretes/index.get.ts`
- `server/api/visitas/index.get.ts`
- Componentes de lembretes e próximas visitas do dashboard

---

## Commit 04 — Seleção segura de cliente no filtro do dashboard

**Mensagem**

```text
fix(dashboard): substitui busca livre por seleção de oportunidade
```

**Alterações**

- Substitui o campo textual de cliente por um seletor pesquisável.
- Carrega oportunidades reais pela API durante a pesquisa.
- Exibe o nome do cliente, código da oportunidade e tipo para facilitar a identificação.
- Envia o identificador único da oportunidade ao dashboard.
- Evita resultados incorretos causados por nomes semelhantes, incompletos ou digitados incorretamente.

**Arquivos principais**

- `components/Home/FilterOptions.vue`
- `stores/useStats.ts`

---

## Commit 05 — Expansão e detalhamento das interações

**Mensagem**

```text
feat(dashboard): adiciona visualização expandida das interações
```

**Alterações**

- Adiciona o botão textual `Expandir` no cabeçalho da área de interações.
- Mantém o botão sempre visível para facilitar sua localização.
- Abre uma janela detalhada das interações do período filtrado.
- Quando uma oportunidade está filtrada, identifica o histórico pelo código da oportunidade.
- Exibe cliente, data e hora, tipo, board/status, responsável e conteúdo completo.
- Adiciona links diretos para abrir a oportunidade.
- Mantém o carregamento incremental de interações na visualização expandida.
- Utiliza diálogo em desktop e tela cheia em dispositivos móveis.

**Arquivos principais**

- `components/Home/ListInteractions.vue`

---

## Commit 06 — Relatório financeiro consolidado no dashboard CRM

**Mensagem**

```text
feat(financeiro): adiciona resumo consolidado ao dashboard CRM
```

**Alterações**

- Adiciona um relatório financeiro consolidado ao dashboard principal `/crm`.
- Exibe o relatório somente quando o módulo `FINANCEIRO` está ativo para a empresa e o usuário possui permissão de visualização.
- Apresenta os indicadores `Total a receber`, `Total recebido`, `Total a pagar` e `Total pago`.
- Exibe quantidade de títulos, saldo realizado e valores vencidos a receber e a pagar.
- Adiciona gráfico de entradas versus saídas efetivamente realizadas.
- Permite alternar o agrupamento do gráfico entre diário e mensal.
- Usa o período aplicado no filtro global do dashboard.
- Adiciona acesso direto à tela completa do Financeiro.
- Implementa layout responsivo para desktop e dispositivos móveis.
- Cria endpoint agregado isolado pela empresa autenticada.
- Respeita o módulo habilitado e a permissão `VER_FINANCEIRO` no frontend e no backend.

**Arquivos principais**

- `components/Home/FinancialSummary.vue`
- `pages/crm/index.vue`
- `server/api/financeiro/dashboard.get.ts`

**Banco de dados**

- Nenhuma migration foi necessária, pois o relatório utiliza as tabelas financeiras existentes.

---

## Commit 07 — Novas opções de qualificação das boards

**Mensagem**

```text
feat(oportunidades): amplia opções de qualificação das boards
```

**Alterações**

- Atualiza a lista de qualificações para:
  - `Prospecção`
  - `Frio`
  - `Morno`
  - `Quente`
  - `Fechado`
  - `Cancelado`
  - `Declinado`
- Preserva os valores que já existiam.
- Adiciona as novas opções às telas de criação e edição.
- Atualiza os tipos TypeScript e as validações das APIs.
- Adiciona cores discretas para `Prospecção` e `Cancelado` na identificação visual das boards.

**Arquivos principais**

- `types/form.d.ts`
- `components/Oportunidade/Board/CreateModal.vue`
- `components/Oportunidade/Board/EditModal.vue`
- `components/Oportunidade/Board/Container/Desktop.vue`
- `components/Oportunidade/Board/Container/Mobile.vue`
- `server/api/oportunidades/board/index.post.ts`
- `server/api/oportunidades/board/[id]/index.patch.ts`

**Banco de dados**

- Nenhuma migration adicional foi necessária, pois o campo é textual e já comporta os novos valores.

---

## Resumo de migrations

Foi criada uma migration para o conjunto completo de alterações:

```text
prisma/migrations/20260806210000_board_oportunidade_qualificacao/migration.sql
```

Ela adiciona o campo de qualificação às boards. Os filtros do dashboard, a expansão das interações, o relatório financeiro consolidado e a ampliação das opções não exigiram novas alterações estruturais no banco.

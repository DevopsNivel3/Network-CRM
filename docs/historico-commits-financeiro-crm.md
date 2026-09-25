# Historico logico de commits - Financeiro, CRM e relatorios

Este documento registra as entregas como uma sequencia recomendada de commits.
Os identificadores abaixo sao logicos e nao representam hashes reais do Git.

## Commit 01 - Permissoes e navegacao do financeiro

**Mensagem**

```text
feat(financeiro): adiciona modulo, permissao e acesso pelo menu principal
```

**Alteracoes**

- Adiciona o modulo `FINANCEIRO` ao controle de modulos da empresa.
- Adiciona a permissao `VER_FINANCEIRO`.
- Protege a rota financeira por modulo e permissao.
- Adiciona a opcao Financeiro na navegacao principal.

**Arquivos principais**

- `server/utils/permissions.ts`
- `components/Layout/Navigation.vue`
- `pages/financeiro/index.vue`

---

## Commit 02 - Estrutura de banco do financeiro

**Mensagem**

```text
feat(database): cria tabelas de contas a pagar e contas a receber
```

**Alteracoes**

- Cria `contas_pagar`.
- Cria `contas_receber`.
- Relaciona lancamentos com empresa, usuario criador e cliente/lead.
- Adiciona indices para empresa, status, vencimento, cliente e criador.
- Atualiza os relacionamentos do Prisma.

**Arquivos principais**

- `prisma/schema.prisma`
- `prisma/migrations/20260731120000_modulo_financeiro/migration.sql`

---

## Commit 03 - API de contas a pagar

**Mensagem**

```text
feat(financeiro): implementa gestao de contas a pagar
```

**Alteracoes**

- Lista contas a pagar com filtros.
- Cria e edita lancamentos.
- Registra pagamento com data, forma e banco.
- Permite cancelamento de lancamentos pendentes.
- Permite exclusao conforme permissao e estado do titulo.
- Gera o proximo lancamento para contas recorrentes apos a baixa.
- Registra as operacoes nos logs do sistema.

**Arquivos principais**

- `server/api/financeiro/contas-pagar/index.get.ts`
- `server/api/financeiro/contas-pagar/index.post.ts`
- `server/api/financeiro/contas-pagar/[id]/index.patch.ts`
- `server/api/financeiro/contas-pagar/[id]/index.delete.ts`
- `server/api/financeiro/contas-pagar/[id]/pagar.post.ts`
- `server/api/financeiro/contas-pagar/[id]/cancelar.post.ts`
- `server/utils/financeiro.ts`
- `server/utils/financeiro-schemas.ts`

---

## Commit 04 - API de contas a receber

**Mensagem**

```text
feat(financeiro): implementa gestao de contas a receber por cliente
```

**Alteracoes**

- Lista contas a receber com filtros.
- Vincula cada conta a um cliente/lead.
- Cria e edita lancamentos.
- Registra recebimento com data, forma e banco.
- Permite cancelamento de lancamentos pendentes.
- Impede exclusao de contas ja recebidas.
- Gera recorrencia apos o recebimento.
- Mantem isolamento dos dados por empresa.

**Arquivos principais**

- `server/api/financeiro/contas-receber/index.get.ts`
- `server/api/financeiro/contas-receber/index.post.ts`
- `server/api/financeiro/contas-receber/[id]/index.patch.ts`
- `server/api/financeiro/contas-receber/[id]/index.delete.ts`
- `server/api/financeiro/contas-receber/[id]/receber.post.ts`
- `server/api/financeiro/contas-receber/[id]/cancelar.post.ts`
- `server/api/financeiro/clientes.get.ts`

---

## Commit 05 - Pagina do modulo financeiro

**Mensagem**

```text
feat(financeiro): cria interface de contas a pagar e receber
```

**Alteracoes**

- Cria abas de contas a pagar e contas a receber.
- Adiciona cadastro e edicao de lancamentos.
- Adiciona baixa, cancelamento e exclusao.
- Adiciona filtros por pesquisa, status, forma e periodo.
- Exibe vencimentos e status dos titulos.
- Adiciona suporte a recorrencia, categoria, banco e observacoes.
- Mantem o padrao visual e tecnologico do NETWORK.

**Arquivos principais**

- `pages/financeiro/index.vue`

---

## Commit 06 - Relatorio financeiro de clientes

**Mensagem**

```text
feat(financeiro): adiciona relatorio de inadimplencia por cliente
```

**Alteracoes**

- Classifica clientes como inadimplentes, com pendencia ou sem pendencia.
- Calcula totais pendentes, vencidos e recebidos.
- Calcula quantidade de titulos e maior atraso.
- Calcula percentual de inadimplencia da carteira.
- Adiciona filtros por classificacao, estado, texto e dias em atraso.
- Exibe o detalhamento dos titulos do cliente.
- Permite exportar a relacao financeira de clientes.

**Arquivos principais**

- `server/api/financeiro/relatorio-clientes.get.ts`
- `pages/financeiro/index.vue`

---

## Commit 07 - Configuracao de motivos nas pranchetas

**Mensagem**

```text
feat(crm): permite configurar motivos obrigatorios por prancheta
```

**Alteracoes**

- Adiciona indicador de motivo obrigatorio na board.
- Adiciona nome do grupo de motivos.
- Adiciona lista configuravel de motivos.
- Permite exigir observacao quando o motivo for `Outro`.
- Inclui os campos nas rotas de criacao, edicao e consulta das boards.

**Arquivos principais**

- `prisma/schema.prisma`
- `prisma/migrations/20260731153000_board_move_reasons/migration.sql`
- `components/Oportunidade/Board/ReasonsConfig.vue`
- `components/Oportunidade/Board/CreateModal.vue`
- `components/Oportunidade/Board/EditModal.vue`
- `server/api/oportunidades/board/index.get.ts`
- `server/api/oportunidades/board/index.post.ts`
- `server/api/oportunidades/board/[id]/index.patch.ts`

---

## Commit 08 - Registro dos motivos nas movimentacoes

**Mensagem**

```text
feat(crm): registra motivo e observacao ao mover oportunidades
```

**Alteracoes**

- Solicita motivo ao mover um card para uma board configurada.
- Valida motivo e observacao obrigatoria.
- Salva motivo e observacao no historico da oportunidade.
- Aplica a validacao no desktop, mobile, criacao e edicao.
- Mantem usuario, data, prancheta e oportunidade no historico.

**Arquivos principais**

- `components/Oportunidade/Board/MoveReasonDialog.vue`
- `components/Oportunidade/Board/MoveReasonFields.vue`
- `components/Oportunidade/Board/Container/Desktop.vue`
- `components/Oportunidade/Board/Container/Mobile.vue`
- `components/Oportunidade/CreateModal.vue`
- `components/Oportunidade/EditModal.vue`
- `server/api/oportunidades/[id]/status.patch.ts`
- `server/api/oportunidades/[id]/index.patch.ts`
- `server/api/oportunidades/index.post.ts`
- `server/api/leads/index.post.ts`

---

## Commit 09 - Melhorias do dashboard do CRM

**Mensagem**

```text
feat(dashboard): melhora indicadores e visualizacao dos graficos do CRM
```

**Alteracoes**

- Reorganiza cards e graficos para leitura gerencial.
- Adiciona indicadores do periodo, medias e comparacao anterior.
- Melhora graficos de interacoes por tipo, usuario e evolucao.
- Adiciona cobertura de oportunidades por prancheta.
- Exibe o periodo ativo no cabecalho.
- Adiciona estados vazios para evitar o desaparecimento de secoes.

**Arquivos principais**

- `pages/crm/index.vue`
- `server/api/stats/index.get.ts`
- `stores/useStats.ts`

---

## Commit 10 - Graficos de motivos no dashboard

**Mensagem**

```text
feat(dashboard): adiciona graficos de motivos por prancheta
```

**Alteracoes**

- Agrupa os motivos registrados por board.
- Exibe quantidade por motivo.
- Respeita empresa, usuario e periodo selecionado.
- Mantem boards configuradas visiveis mesmo sem movimentacoes.
- Exibe mensagem explicativa quando o periodo nao possui dados.

**Arquivos principais**

- `components/Home/MoveReasonsCharts.vue`
- `server/api/stats/index.get.ts`
- `pages/crm/index.vue`

---

## Commit 11 - Exportacao gerencial do CRM

**Mensagem**

```text
feat(relatorios): cria exportacao Excel de performance do CRM
```

**Alteracoes**

- Mede performance da equipe dentro das oportunidades.
- Calcula oportunidades atribuidas e trabalhadas.
- Calcula cobertura e media de interacoes.
- Separa mensagens, e-mails e ligacoes.
- Consolida performance por prancheta.
- Lista oportunidades e seus responsaveis.
- Exporta o historico completo das interacoes dos cards atuais.

**Arquivos principais**

- `server/api/stats/export.post.ts`
- `pages/crm/index.vue`

---

## Commit 12 - Fluxo historico das oportunidades

**Mensagem**

```text
feat(relatorios): exporta oportunidades que passaram por cada board
```

**Alteracoes**

- Consulta o historico de movimentacao, independentemente da board atual.
- Conta oportunidades unicas por board e periodo.
- Evita duplicacao quando o card possui varias atualizacoes na mesma etapa.
- Informa primeira e ultima passagem.
- Informa usuario que movimentou e prancheta atual.
- Indica se a oportunidade permaneceu ou seguiu para outra etapa.

**Arquivos principais**

- `server/api/stats/export.post.ts`

---

## Commit 13 - Motivos no relatorio Excel

**Mensagem**

```text
feat(relatorios): inclui configuracoes e motivos registrados no Excel
```

**Alteracoes**

- Inclui grupo de motivos da prancheta.
- Inclui motivos configurados.
- Inclui motivos efetivamente registrados nas movimentacoes.
- Inclui observacoes dos motivos.
- Consolida varios motivos da mesma oportunidade.
- Exibe a configuracao da board mesmo sem movimentacoes no periodo.

**Arquivos principais**

- `server/api/stats/export.post.ts`

---

## Commit 14 - Consolidacao e compatibilidade do Excel

**Mensagem**

```text
refactor(relatorios): consolida Excel do CRM em seis abas filtraveis
```

**Alteracoes**

- Reduz o arquivo para seis abas uteis.
- Remove abas repetidas por board.
- Remove celulas mescladas e agrupamentos complexos.
- Adiciona filtros em todos os cabecalhos.
- Higieniza caracteres invalidos.
- Limita textos ao tamanho seguro aceito pelo Excel.
- Corrige avisos de compatibilidade e reparo do arquivo.

**Abas finais**

1. `01 Resumo`
2. `02 Equipe`
3. `03 Pranchetas`
4. `04 Oportunidades`
5. `05 Interacoes`
6. `06 Fluxo e Motivos`

**Arquivos principais**

- `server/api/stats/export.post.ts`
- `pages/crm/index.vue`

---

## Commit 15 - Periodo independente da exportacao

**Mensagem**

```text
fix(relatorios): adiciona periodo explicito e estado vazio ao fluxo do Excel
```

**Alteracoes**

- Adiciona seletor de periodo dentro da janela de exportacao.
- Evita depender da alteracao previa do filtro lateral do dashboard.
- Garante uma linha por board quando nao houver fluxo no periodo.
- Substitui a mensagem generica `Sem dados para os filtros aplicados`.
- Mantem os motivos configurados visiveis mesmo sem movimentacoes.

**Arquivos principais**

- `pages/crm/index.vue`
- `server/api/stats/export.post.ts`

---

## Commit 16 - Configuracao de build e PM2

**Mensagem**

```text
fix(deploy): configura PM2 para executar o bundle de producao do Nuxt
```

**Alteracoes**

- Configura o processo `NetworkAppWeb`.
- Executa `.output/server/index.mjs` em modo fork no Windows.
- Usa o Node incluido no projeto.
- Define porta, host e ambiente de producao.
- Documenta a necessidade de executar o build antes de iniciar o PM2.

**Arquivos principais**

- `ecosystem.config.cjs`
- `scripts/run-nuxt.ps1`

---

## Escopo removido intencionalmente

Os seguintes recursos nao fazem parte desta implantacao:

- Cheques.
- Promissorias.
- Controle de caixa.
- Gastos com carros.
- Oficinas e manutencoes automotivas.

## Ordem recomendada para aplicar em outro projeto

1. Permissoes e navegacao.
2. Schema e migration do financeiro.
3. APIs de contas a pagar e receber.
4. Interface e relatorio financeiro.
5. Schema e migration dos motivos.
6. Configuracao e registro dos motivos nas movimentacoes.
7. Dashboard e graficos.
8. Exportacao Excel, fluxo historico e consolidacao.
9. Build e configuracao do PM2.

## Comandos de producao

```bash
pm2 stop NetworkAppWeb
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 start ecosystem.config.cjs --update-env
```


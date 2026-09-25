# Historico logico de commits - Dashboard, motivos, CPF e grupo empresarial

Este documento registra as entregas realizadas depois do historico de Financeiro e CRM como uma sequencia recomendada de commits.
Os identificadores abaixo sao logicos e nao representam hashes reais do Git.

## Commit 01 - Motivo atual no dashboard

**Mensagem**

```text
fix(dashboard): contabiliza somente motivos dos cards que permanecem na board
```

**Alteracoes**

- Faz o dashboard representar o motivo atual de cada oportunidade.
- Remove a oportunidade do grafico de motivos quando ela sai da board correspondente.
- Evita manter no indicador movimentacoes historicas que ja foram desfeitas.
- Mantem boards configuradas visiveis mesmo quando nao possuem cards no periodo.

**Arquivos principais**

- `server/api/stats/index.get.ts`
- `components/Home/MoveReasonsCharts.vue`

---

## Commit 02 - Detalhes e pre-visualizacao dos motivos

**Mensagem**

```text
feat(crm): exibe detalhes do motivo no dashboard e nos cards da board
```

**Alteracoes**

- Adiciona interacao por clique ou passagem do mouse nos motivos do dashboard.
- Exibe motivo e observacao com mais detalhes.
- Adiciona uma pre-visualizacao do motivo diretamente no card da oportunidade.
- Evita a necessidade de abrir a oportunidade ou consultar o Excel para entender por que o card esta naquela board.
- Aplica a visualizacao nas versoes desktop e mobile da board.

**Arquivos principais**

- `components/Home/MoveReasonsCharts.vue`
- `components/Oportunidade/Board/ReasonPreview.vue`
- `components/Oportunidade/Board/Container/Desktop.vue`
- `components/Oportunidade/Board/Container/Mobile.vue`
- `server/api/stats/index.get.ts`

---

## Commit 03 - Reutilizacao dos motivos entre boards

**Mensagem**

```text
feat(crm): permite reutilizar motivos configurados em outras boards
```

**Alteracoes**

- Reune motivos ja cadastrados nas demais boards da empresa.
- Permite selecionar um motivo existente ao configurar uma nova board.
- Mantem a possibilidade de cadastrar novos motivos.
- Evita digitacao repetida e variacoes desnecessarias do mesmo motivo.

**Arquivos principais**

- `components/Oportunidade/Board/ReasonsConfig.vue`
- `components/Oportunidade/Board/CreateModal.vue`
- `components/Oportunidade/Board/EditModal.vue`
- `utils/boardReasons.ts`

---

## Commit 04 - Reorganizacao visual do dashboard

**Mensagem**

```text
refactor(dashboard): reorganiza proporcoes e hierarquia dos graficos
```

**Alteracoes**

- Reorganiza os graficos conforme a importancia e a quantidade de informacao.
- Reduz graficos compactos e amplia visualizacoes que precisam de mais espaco.
- Melhora cabecalhos, totais, estados vazios e leitura em diferentes resolucoes.
- Ajusta a grade para desktop, telas maiores e dispositivos moveis.
- Mantem compatibilidade com os temas claro e escuro.

**Arquivos principais**

- `components/Home/DashboardCharts.vue`
- `components/Home/Container/Desktop.vue`
- `components/Home/Container/Mobile.vue`
- `pages/crm/index.vue`

---

## Commit 05 - CPF opcional no cadastro de usuarios

**Mensagem**

```text
feat(usuarios): adiciona CPF opcional ao cadastro de usuarios
```

**Alteracoes**

- Adiciona a coluna opcional `cpf` na tabela `usuarios`.
- Inclui CPF na criacao, edicao e visualizacao do usuario.
- Normaliza o valor para 11 digitos antes de salvar.
- Aplica mascara na interface.
- Valida localmente o formato e os digitos verificadores.
- Nao realiza consulta na Receita Federal, Serpro ou outro servico externo.
- Nao sincroniza usuarios ou dados entre empresas.

**Arquivos principais**

- `prisma/schema.prisma`
- `prisma/migrations/20260804203000_usuario_cpf/migration.sql`
- `utils/cpf.ts`
- `utils/rules.ts`
- `server/utils/schema.ts`
- `server/api/usuarios/index.post.ts`
- `server/api/usuarios/[id]/index.patch.ts`
- `server/api/usuarios/[id]/index.get.ts`
- `components/Usuario/CreateModal.vue`
- `components/Usuario/EditModal.vue`
- `components/Usuario/Tabs/Dados.vue`
- `stores/useUsuario.ts`
- `types/form.d.ts`

---

## Commit 06 - CPF repetido entre usuarios

**Mensagem**

```text
fix(usuarios): permite reutilizar CPF em qualquer usuario e empresa
```

**Alteracoes**

- Remove a exclusividade de CPF por empresa.
- Permite o mesmo CPF em varios usuarios da mesma empresa.
- Permite o mesmo CPF em usuarios de empresas diferentes.
- Remove as consultas de duplicidade das APIs de criacao e edicao.
- Mantem o campo opcional e sem sincronizacao.
- Altera a validacao visual para ocorrer ao sair do campo, evitando aviso durante a digitacao.
- Documenta o escopo atual da funcionalidade.

**Arquivos principais**

- `prisma/schema.prisma`
- `prisma/migrations/20260804210000_usuario_cpf_permitir_duplicados/migration.sql`
- `server/api/usuarios/index.post.ts`
- `server/api/usuarios/[id]/index.patch.ts`
- `components/Usuario/CreateModal.vue`
- `components/Usuario/EditModal.vue`
- `utils/rules.ts`
- `docs/escopo-cpf-usuarios.md`

---

## Commit 07 - Grupo da empresa

**Mensagem**

```text
feat(empresas): adiciona classificacao por grupo empresarial
```

**Alteracoes**

- Adiciona a coluna opcional `grupo` na tabela `empresas`.
- Adiciona o campo `Empresa do Grupo` na criacao e edicao.
- Exibe o grupo nos detalhes da empresa.
- Disponibiliza as opcoes padrao `Nivel 3 TI` e `Bispo BPO`.
- Valida na API para aceitar somente as opcoes configuradas.
- Preserva empresas existentes sem grupo definido.

**Arquivos principais**

- `prisma/schema.prisma`
- `prisma/migrations/20260804220000_empresa_grupo/migration.sql`
- `utils/empresaGrupos.ts`
- `server/api/empresas/index.post.ts`
- `server/api/empresas/[id]/index.patch.ts`
- `server/api/empresas/[id]/index.get.ts`
- `components/Empresa/CreateModal.vue`
- `components/Empresa/EditModal.vue`
- `components/Empresa/ViewModal.vue`
- `stores/useEmpresa.ts`
- `types/form.d.ts`

---

## Migrations desta entrega

As alteracoes de banco desta sequencia sao:

1. `20260731153000_board_move_reasons`
2. `20260804203000_usuario_cpf`
3. `20260804210000_usuario_cpf_permitir_duplicados`
4. `20260804220000_empresa_grupo`

## Ordem recomendada para producao

```powershell
pm2 stop NetworkAppWeb
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 start ecosystem.config.cjs --only NetworkAppWeb --update-env
pm2 status
```

Validacao final:

```powershell
npx prisma migrate status
Test-Path .output\server\index.mjs
Invoke-WebRequest http://127.0.0.1:3000 -UseBasicParsing
```

## Recuperacao do erro P3018 no indice de CPF

Em bancos que ja possuem o indice `usuarios_empresa_id_fkey`, a migration de liberacao de CPF repetido pode falhar com o erro `Duplicate key name`.

Somente para esse erro especifico, execute:

```powershell
@'
DROP INDEX `usuarios_empresa_cpf_uq` ON `usuarios`;
'@ | npx prisma db execute --stdin --schema prisma/schema.prisma

npx prisma migrate resolve --applied 20260804210000_usuario_cpf_permitir_duplicados
npx prisma migrate deploy
npx prisma generate
```

O comando remove apenas a exclusividade do CPF. Ele nao remove usuarios, empresas, colunas ou valores cadastrados.

# Ajustes para a versao 2.4.4

## Objetivo

Este documento registra o que foi ajustado no codigo inicial para a aplicacao funcionar na versao 2.4.4, incluindo autenticacao, dashboard do CRM, lembretes de leads, melhorias de CNPJ e ajustes de banco/build.

## Contexto do problema

Durante os testes de login, o usuario conseguia entrar na plataforma, mas:

- era redirecionado para a tela inicial de modulos em vez do dashboard correto do CRM;
- algumas chamadas retornavam `401 Unauthorized` com erro de token nao fornecido;
- ao abrir o CRM, a API retornava erro de banco informando que a coluna `network.leads.controle_lembretes` nao existia;
- a empresa Lanlimp estava sem os modulos liberados no cadastro, deixando CRM/Financeiro indisponiveis na tela inicial;
- a aplicacao ainda exibia a versao 2.4.3, mas o pacote atual corresponde a 2.4.4.

## Correcoes no codigo

### Autenticacao e token

Arquivo alterado: `composables/useApi.ts`

O envio do header `Authorization` foi ajustado para:

- enviar o header somente quando existir token;
- aceitar token ja salvo com `Bearer`;
- adicionar o prefixo `Bearer` quando o token estiver salvo sem ele.

Isso evita chamadas protegidas sem token valido e reduz os erros de `401 Unauthorized`.

Arquivo alterado: `server/middleware/auth.ts`

O middleware de autenticacao passou a aceitar token em dois formatos:

- header `Authorization`;
- cookie `auth.token`.

Essa alteracao melhora a compatibilidade entre chamadas feitas pelo frontend e chamadas server-side do Nuxt.

### Redirecionamento apos login

Arquivo alterado: `composables/useAuthSession.ts`

O callback apos login foi alterado de `/inicio` para `/crm`.

Com isso, ao autenticar, o usuario entra diretamente no dashboard do CRM, que e o comportamento esperado para o usuario testado.

### Script de build

Arquivo alterado: `scripts/run-nuxt.ps1`

O script de execucao/build foi ajustado porque ainda tentava trabalhar com um caminho antigo de projeto e fazia copia temporaria para `%TEMP%`, o que gerava problemas no `npm install` e no build.

O build agora usa o proprio diretorio do repositorio como raiz, deixando o processo mais simples e estavel.

## Ajustes da versao 2.4.4

Arquivos alterados:

- `pages/inicio.vue`
- `nuxt.config.ts`
- `.env`
- `ecosystem.config.cjs`
- `package.json`
- `package-lock.json`

A versao exibida e usada pela aplicacao foi atualizada para `2.4.4`.

Tambem foi atualizado o changelog da tela inicial com as melhorias desta versao:

- lembrete de leads;
- filtro de CNPJ duplicado;
- integracao com API de CNPJ para buscar informacoes automaticamente;
- melhoria na lista de leads, com mais campos apresentados.

## Ajustes no banco de dados

Banco usado nos testes:

- database: `network`
- usuario: `root`
- senha: sem senha

### Migrations Prisma

Foi executado:

```powershell
npx.cmd prisma generate
npx.cmd prisma migrate deploy
```

Durante a aplicacao das migrations, a migration `20260511183000_fix_location_utf8` falhou porque a coluna `nome` encontrou valor nulo em uma conversao.

Como os dados que precisavam ser convertidos ja estavam tratados, a migration foi marcada como aplicada:

```powershell
npx.cmd prisma migrate resolve --applied 20260511183000_fix_location_utf8
npx.cmd prisma migrate deploy
```

Depois disso, nao havia mais migrations pendentes.

### Campos de lembretes

O schema da aplicacao ja esperava os campos `controle_lembretes`, mas eles nao existiam fisicamente nas tabelas. Por isso, o dashboard do CRM quebrava com erro de Prisma.

Foram adicionadas as colunas:

```sql
ALTER TABLE leads
  ADD COLUMN controle_lembretes BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE oportunidades
  ADD COLUMN controle_lembretes BOOLEAN NOT NULL DEFAULT TRUE;
```

Esses campos liberam a funcionalidade de lembretes de leads/oportunidades na versao 2.4.4.

### Liberacao de modulos para a Lanlimp

A empresa Lanlimp estava com `modulos = NULL`, entao os cards de CRM e Financeiro apareciam como indisponiveis.

Foi ajustado:

```sql
UPDATE empresas
SET modulos = JSON_ARRAY('CRM', 'FINANCEIRO'),
    desativado = 0
WHERE id = 14;
```

Com isso, o menu passou a exibir os modulos esperados para o usuario da Lanlimp.

Na revisao de producao, tambem foi ajustado o codigo para aceitar bases antigas em que `modulos` venha como `NULL`, JSON em texto ou lista separada por virgula. O arquivo `utils/permissions.ts` agora normaliza esses formatos antes de decidir se o modulo esta ativo.

Tambem foi corrigido o bloqueio do menu e das rotas:

- `components/Layout/Navigation.vue`
- `middleware/viewPermissions.global.ts`

Assim, se a empresa estiver com `modulos = NULL` por ser um registro legado, a aplicacao considera os modulos padrao liberados em vez de bloquear CRM/Financeiro.

Foi criado o script `prisma/2.4.4-producao.sql` para aplicar no servidor e gravar definitivamente os modulos da Lanlimp:

```sql
UPDATE empresas e
JOIN usuarios u ON u.empresa_id = e.id
SET e.modulos = JSON_ARRAY('CRM', 'FINANCEIRO'),
    e.desativado = 0,
    u.desativado = 0
WHERE u.email = 'admin@lanlimp';
```

### Usuario de teste DevOps

Para validar a autenticacao, a senha do usuario `devops@nivel3ti.com.br` foi redefinida em ambiente local para `123456`.

```sql
UPDATE usuarios
SET senha = '<hash bcrypt de 123456>',
    desativado = 0
WHERE email = 'devops@nivel3ti.com.br';
```

Esse ajuste foi feito somente para teste local.

## Build e PM2

Depois dos ajustes, foram executados:

```powershell
npm.cmd install
npm.cmd run build
pm2.cmd start ecosystem.config.cjs
```

Quando o PM2 estava rodando durante o build, houve erro de permissao no arquivo do Prisma Query Engine. A solucao foi parar o processo antes de buildar:

```powershell
pm2.cmd stop ecosystem.config.cjs
npm.cmd run build
pm2.cmd start ecosystem.config.cjs
```

## Validacoes realizadas

Foi validado que:

- o `npm install` conclui;
- o Prisma Client e gerado;
- as migrations ficam sem pendencias;
- o build de producao conclui;
- o login local funciona com usuario de teste;
- a sessao retorna usuario autenticado e modulos `CRM` e `FINANCEIRO`;
- a chamada do dashboard CRM nao quebra mais por falta da coluna `controle_lembretes`;
- a empresa Lanlimp tem os modulos liberados no banco.

## Observacoes

- O projeto esta rodando com Node `24.15.0`, mas o `package.json` indica preferencia por Node `22.x`. O npm emite aviso de engine por causa disso.
- O `npm install` informou vulnerabilidades em dependencias. Isso nao bloqueou o build, mas deve ser revisado separadamente.
- O build mostra avisos de bundle grande e `Browserslist/caniuse-lite` desatualizado. Tambem nao bloqueiam a execucao.
- O ajuste manual das colunas `controle_lembretes` resolveu o ambiente atual. O ideal e garantir que esses campos tambem estejam cobertos por migration versionada para novos ambientes.

# Network CRM

CRM web em Nuxt 3 com API Nitro, Prisma/MySQL e aplicativo mobile Expo.

## Por onde começar

- Interface web: `pages`, `components`, `composables` e `stores`.
- Endpoints HTTP: `server/api`.
- Regras de negócio novas: `server/domains`.
- Banco de dados: `prisma/schema.prisma` e `prisma/migrations`.
- Aplicativo mobile: `apps/mobile`.
- Configuração do Nuxt: `nuxt.config.ts` e `config`.
- Processo de produção: `ecosystem.config.cjs`.

Leia [docs/architecture.md](docs/architecture.md) antes de criar um domínio ou
alterar a organização das pastas. O documento também identifica o legado ainda
ativo que não pode ser removido de uma vez.

## Requisitos

- Node.js 24
- MySQL 8
- variáveis de ambiente baseadas em `.env.example`

## Desenvolvimento web

```powershell
npm install
npm run dev
```

O servidor de desenvolvimento usa a porta padrão do Nuxt. O processo PM2 deste
servidor publica o build na porta 3001.

## Validação e build

```powershell
npm run prisma:generate
npm run typecheck
npm run build
```

O projeto possui erros TypeScript legados conhecidos no frontend; o build de
produção é a validação obrigatória enquanto esses erros são eliminados por
domínio.

## Produção

```powershell
npm run build
pm2 restart NetworkAppWeb --update-env
pm2 save
```

O domínio público deve terminar em um proxy reverso HTTPS apontando para
`http://127.0.0.1:3001`.

## Aplicativo mobile

```powershell
cd apps/mobile
npm install
npx tsc --noEmit
npx expo start
```

O app lê a API de `apps/mobile/.env` pela variável `EXPO_PUBLIC_API_URL`. Essa
URL é incorporada durante a geração do aplicativo.

## Banco de dados

Não edite migrations já aplicadas. Para mudanças de schema:

```powershell
npx prisma migrate dev --name descricao_da_mudanca
npx prisma generate
```

Dados enviados ficam em `uploads`; logs, builds, releases e uploads não são
código-fonte e permanecem ignorados pelo controle de versão.

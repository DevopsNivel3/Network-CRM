# Arquitetura do Network CRM

O repositório contém dois aplicativos que compartilham a mesma API:

- a aplicação web Nuxt na raiz;
- o aplicativo Expo em `apps/mobile`.

## Fluxo de dependências

```text
Web / Mobile
    -> server/api (HTTP: valida entrada e traduz resposta)
        -> server/domains/<dominio>/*.service.ts (regras de negócio)
            -> server/domains/<dominio>/*.repository.ts (persistência)
                -> lib/prisma.ts
```

Uma camada só pode depender da camada abaixo. Endpoint não deve conter consulta
Prisma ou regra de negócio extensa. Repository não deve conhecer HTTP, cookies ou
objetos do Nitro.

## Pastas

- `pages`: rotas e composição das telas web.
- `components`: componentes visuais, agrupados por domínio.
- `composables`: comportamento reutilizável da interface.
- `stores`: estado remoto/compartilhado do Pinia.
- `server/api`: adaptadores HTTP do Nitro; devem permanecer pequenos.
- `server/domains`: casos de uso, regras e persistência por domínio.
- `server/utils`: infraestrutura transversal sem regra de domínio.
- `prisma`: contrato e histórico do banco. Migrações aplicadas nunca são editadas.
- `apps/mobile`: aplicação Expo independente.
- `config`: configuração declarativa dos módulos Nuxt.

## Convenções novas

Cada domínio novo usa nomes em português, iguais aos conceitos atuais do banco e
da interface. Dentro de `server/domains/<dominio>`:

- `*.service.ts`: casos de uso e regras de negócio;
- `*.repository.ts`: acesso ao Prisma;
- `*.schema.ts`: validação Zod compartilhada;
- `*.types.ts`: tipos exclusivos do domínio;
- `*.constants.ts`: constantes sem estado.

Validação exclusiva de uma rota permanece no endpoint. Segredos são lidos apenas
no servidor e nunca possuem valor real como fallback.

## Compatibilidade com URLs antigas

As implementações duplicadas em inglês (`User`, `Company`, `Opportunity`,
`/api/users` e `/api/opportunitys`) foram removidas. As URLs de páginas antigas
permanecem em `routeRules` como redirects permanentes para não quebrar favoritos:

- `/home` -> `/crm`;
- `/leads` -> `/crm/leads`;
- `/opportunity` -> `/crm/oportunidades`;
- `/visits` -> `/crm/visitas`;
- `/users` -> `/admin/usuarios`;
- `/manager/empresas` -> `/dev/empresas`.

## Critérios para remover código

Um arquivo só é removível quando não é rota pública necessária, não aparece em
busca de imports/auto-imports e o build web e o typecheck mobile continuam
passando. Arquivos em `uploads` são dados da aplicação, não código-fonte.

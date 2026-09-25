# Deploy em producao - correcao 2.4.4

## Pacote

Arquivo gerado para subir no servidor:

```text
releases/network-2.4.4-correcao-producao.zip
```

O pacote nao inclui:

- `node_modules`
- `.nuxt`
- `.output`
- `logs`
- `.env`

O `.env` do servidor deve ser preservado.

## Antes de iniciar

No servidor, confirme que voce esta na pasta correta da aplicacao e faca um backup do codigo e do banco.

Exemplo:

```bash
cp -r /caminho/da/app /caminho/da/app-backup-2.4.4
mysqldump -u root network > backup-network-antes-2.4.4.sql
```

Se o MySQL do servidor tiver senha, adicione `-p` no `mysqldump`.

## Passo a passo

### 1. Parar o PM2

```bash
pm2 stop ecosystem.config.cjs
```

Confirme que o processo parou:

```bash
pm2 status
```

### 2. Subir e extrair o ZIP

Envie o arquivo abaixo para o servidor:

```text
releases/network-2.4.4-correcao-producao.zip
```

Extraia o conteudo por cima da pasta atual da aplicacao, preservando o `.env` existente.

Exemplo em Linux:

```bash
unzip -o network-2.4.4-correcao-producao.zip -d /caminho/da/app
```

Exemplo em Windows PowerShell:

```powershell
Expand-Archive -Path .\network-2.4.4-correcao-producao.zip -DestinationPath C:\caminho\da\app -Force
```

### 3. Conferir o `.env`

O arquivo `.env` de producao deve continuar apontando para o banco correto.

Confirme principalmente:

```env
DATABASE_URL=...
JWT_SECRET=...
APP_VERSION=2.4.4
```

Se nao existir `APP_VERSION`, adicione:

```env
APP_VERSION=2.4.4
```

### 4. Aplicar os ajustes de banco

Na pasta da aplicacao, rode o script:

```bash
mysql -u root network < prisma/2.4.4-producao.sql
```

Se o MySQL tiver senha:

```bash
mysql -u root -p network < prisma/2.4.4-producao.sql
```

Esse script:

- cria `leads.controle_lembretes`, se ainda nao existir;
- cria `oportunidades.controle_lembretes`, se ainda nao existir;
- libera `CRM` e `FINANCEIRO` para a empresa do usuario `admin@lanlimp`;
- ativa a empresa e o usuario `admin@lanlimp`;
- preenche modulos padrao para empresas antigas com `modulos IS NULL`.

### 5. Instalar dependencias

```bash
npm install
```

### 6. Gerar Prisma Client

```bash
npx prisma generate
```

### 7. Aplicar migrations pendentes

```bash
npx prisma migrate deploy
```

Se a migration `20260511183000_fix_location_utf8` ja tiver sido resolvida no ambiente, esse comando deve finalizar sem pendencias.

### 8. Buildar

```bash
npm run build
```

Se aparecer erro de permissao em arquivo do Prisma ou `.output`, confirme que o PM2 esta parado e rode o build novamente.

### 9. Subir a aplicacao

```bash
pm2 start ecosystem.config.cjs
```

Ou, se o processo ja existir no PM2:

```bash
pm2 restart ecosystem.config.cjs
```

Confira:

```bash
pm2 status
pm2 logs NetworkAppWeb --lines 100
```

### 10. Testar no navegador

Depois do deploy:

1. Faca logout.
2. Limpe a sessao/cookies do dominio, se continuar mostrando modulos indisponiveis.
3. Entre novamente com `admin@lanlimp`.
4. A tela inicial deve mostrar CRM e Financeiro como ativos.
5. Acessar `/crm` nao deve mais redirecionar para `/inicio`.

## Validacao SQL opcional

Para confirmar se o banco ficou correto:

```sql
SELECT
  u.id,
  u.email,
  u.desativado AS usuario_desativado,
  e.id AS empresa_id,
  e.nome AS empresa_nome,
  e.desativado AS empresa_desativada,
  e.modulos
FROM usuarios u
JOIN empresas e ON e.id = u.empresa_id
WHERE u.email = 'admin@lanlimp';
```

O campo `modulos` deve retornar:

```json
["CRM", "FINANCEIRO"]
```

## Arquivos principais da correcao

- `utils/permissions.ts`
- `components/Layout/Navigation.vue`
- `middleware/viewPermissions.global.ts`
- `composables/useAuthSession.ts`
- `prisma/2.4.4-producao.sql`
- `docs/ajustes-versao-2.4.4.md`

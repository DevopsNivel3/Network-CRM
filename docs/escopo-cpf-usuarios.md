# Escopo do CPF no cadastro de usuários

**Data da decisão:** 04/08/2026  
**Status:** Implementado e mantido como escopo atual

## Comportamento atual

- O CPF no cadastro de usuários é opcional.
- Quando informado, o CPF é normalizado e armazenado somente com 11 dígitos.
- Um mesmo CPF pode ser cadastrado para mais de um usuário dentro da mesma empresa.
- Um mesmo CPF também pode ser utilizado por usuários pertencentes a empresas diferentes.
- Cada usuário permanece como um cadastro independente, mesmo quando compartilha o CPF com usuários de outras empresas.
- Não há busca automática, compartilhamento ou sincronização de dados de usuários entre empresas.

## Fora do escopo atual

Não será criado, por enquanto, um cadastro central de pessoa por CPF. Também não haverá:

- vínculo centralizado entre contas de empresas diferentes;
- preenchimento automático com dados encontrados em outra empresa;
- sincronização de nome, contato, e-mail, avatar ou outros dados pessoais;
- acesso de uma empresa aos dados cadastrais mantidos por outra empresa;
- unificação de autenticação, permissões ou status entre contas que possuem o mesmo CPF.

## Validação e integridade

Não há regra de unicidade para o CPF do usuário. Valores vazios e CPF repetido continuam permitidos.

Quando preenchido, o CPF passa somente por validação local de formato e dos dígitos verificadores. Não existe consulta à Receita Federal, Serpro ou outro serviço externo, nem busca automática por usuários com o mesmo CPF.

Uma eventual evolução para um cadastro único e compartilhado deverá ser tratada como uma nova funcionalidade, com definição prévia de privacidade, propriedade dos dados, sincronização e permissões entre empresas.

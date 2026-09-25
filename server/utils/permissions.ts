export enum UserPermissions {
  VER_LEAD = 1 << 0,
  VER_USUARIO = 1 << 1,
  VER_OPORTUNIDADE = 1 << 2,
  CRIAR_LEAD = 1 << 3,
  CRIAR_USUARIO = 1 << 4,
  CRIAR_OPORTUNIDADE = 1 << 5,
  EDITAR_LEAD = 1 << 6,
  EDITAR_USUARIO = 1 << 7,
  EDITAR_OPORTUNIDADE = 1 << 8,
  DELETAR_LEAD = 1 << 9,
  ADMIN = 1 << 10,
  GRANT_ADMIN = 1 << 11,
  CRIAR_VISITA = 1 << 12,
  VER_VISITA = 1 << 13,
  EDITAR_VISITA = 1 << 14,
  VER_RELATORIO = 1 << 15,
  GERENCIAR_RESPONSAVEIS = 1 << 16,
  CRIAR_GRUPO = 1 << 17,
  EDITAR_GRUPO = 1 << 18,
  DELETAR_GRUPO = 1 << 19,
  VER_GRUPO = 1 << 20,
  VER_FINANCEIRO = 1 << 21,
  VER_LOCALIZEIA = 1 << 22,
}

// Função para atribuir permissões a um usuário
export function grantUserPermission(...permissions: UserPermissions[]): number {
  return permissions.reduce((result, permission) => result | permission, 0);
}

// Função para verificar se um usuário possui uma permissão específica
export function hasUserPermission(
  userPermissions: number,
  requiredPermission: UserPermissions,
): boolean {
  if (userPermissions & UserPermissions.GRANT_ADMIN) return true;
  if (
    userPermissions & UserPermissions.ADMIN &&
    requiredPermission !== UserPermissions.GRANT_ADMIN
  )
    return true;
  return (userPermissions & requiredPermission) === requiredPermission;
}

// Função para remover uma permissão de um usuário
export function removeUserPermission(
  userPermissions: number,
  permissionToRemove: UserPermissions,
): number {
  return userPermissions & ~permissionToRemove;
}

// Gerência a permissão do usuário ao acesso as páginas pelo front
export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuthSession();

  if (!user) return;

  const requiredModule = to.meta.requiredModule as string | undefined;
  const requiredPermission = to.meta.requiredPermission as
    | UserPermissions
    | UserPermissions[]
    | undefined;

  if (hasUserPermission(user.permissoes, UserPermissions.GRANT_ADMIN)) return;

  if (requiredModule) {
    const enabledModules = normalizePermissionModules(user.empresa_modulos);
    const hasModule = enabledModules.includes(requiredModule);
    if (!hasModule) return navigateTo("/inicio");
  }

  if (!requiredPermission) return;

  const requiredPermissions = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  const hasAnyPermission = requiredPermissions.some((permission) =>
    hasUserPermission(user.permissoes, permission),
  );

  if (!hasAnyPermission) return navigateTo("/inicio");
});

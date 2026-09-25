// Fecha todos os modals e menu mobile, ao alterar/atualizar a página
export default defineNuxtRouteMiddleware(() => {
  const menu = useMenu();
  menu.closeMenu("mobile");
});

// Limpa os filtros automaticamente para stores que expõem clearFilters()
export default defineNuxtRouteMiddleware(() => {
  const nuxtApp = useNuxtApp();
  const registry = (
    nuxtApp as unknown as {
      $clearFiltersRegistry?: Map<string, { clearFilters: () => void }>;
    }
  ).$clearFiltersRegistry;

  if (!registry) return;

  for (const store of registry.values()) {
    store.clearFilters();
  }
});

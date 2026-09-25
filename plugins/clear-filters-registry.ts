export default defineNuxtPlugin((nuxtApp) => {
  const registry = new Map<string, { clearFilters: () => void }>();

  nuxtApp.provide("clearFiltersRegistry", registry);

  (nuxtApp.$pinia as any).use(({ store }: { store: any }) => {
    const anyStore = store as typeof store & { clearFilters?: () => void };
    if (typeof anyStore.clearFilters === "function") {
      registry.set(store.$id, { clearFilters: anyStore.clearFilters.bind(anyStore) });
    }
  });
});

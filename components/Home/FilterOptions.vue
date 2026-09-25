<script setup lang="ts">
const { user } = useAuthSession();
const stats = useStats();
const boards = ref<Array<{ id: number; titulo: string; cor: string | null }>>([]);
const isLoadingBoards = ref(false);
const opportunityOptions = ref<
    Array<{ id: number; label: string; tipo: string | null }>
>([]);
const isLoadingOpportunities = ref(false);
let opportunitySearchTimer: ReturnType<typeof setTimeout> | null = null;

const loadOpportunityOptions = async (search = "") => {
    isLoadingOpportunities.value = true;
    try {
        const response = await useApi<{
            data: Array<{
                id: number;
                tipo: string | null;
                descricao: string | null;
                lead: { nome_lead: string | null };
            }>;
        }>("/api/oportunidades", {
            method: "GET",
            query: {
                page: 1,
                perPage: 30,
                ...(search.trim() ? { name: search.trim() } : {}),
            },
        });

        opportunityOptions.value = response.data.map((item) => ({
            id: item.id,
            label:
                item.lead?.nome_lead ||
                item.tipo ||
                item.descricao ||
                `Oportunidade #${item.id}`,
            tipo: item.tipo,
        }));
    } catch (err: any) {
        stats.setError(err?.data?.message || "Erro ao carregar as oportunidades");
    } finally {
        isLoadingOpportunities.value = false;
    }
};

const searchOpportunities = (search: string) => {
    if (opportunitySearchTimer) clearTimeout(opportunitySearchTimer);
    opportunitySearchTimer = setTimeout(
        () => loadOpportunityOptions(search),
        300,
    );
};

onMounted(async () => {
    isLoadingBoards.value = true;
    await loadOpportunityOptions();
    try {
        boards.value = await useApi<Array<{ id: number; titulo: string; cor: string | null }>>(
            "/api/oportunidades/board",
            { method: "GET" },
        );
    } catch (err: any) {
        stats.setError(err?.data?.message || "Erro ao carregar as pranchetas");
    } finally {
        isLoadingBoards.value = false;
    }
});

onBeforeUnmount(() => {
    if (opportunitySearchTimer) clearTimeout(opportunitySearchTimer);
});
</script>

<template>
    <!-- Menu de Filtro -->
    <UIFilterMenu :reset="stats.clearFilters">
        <template #default>
            <div class="flex flex-col gap-2 w-full">
                <span class="text-xs text-black/80 dark:text-white/80">
                    Board / prancheta / status
                </span>
                <ElSelect
                    :model-value="stats.filterByBoardId"
                    @update:model-value="stats.setFilterByBoardId"
                    :loading="isLoadingBoards"
                    placeholder="Todas as pranchetas"
                    filterable
                    class="w-full"
                >
                    <ElOption label="Todas as pranchetas" value="all" />
                    <ElOption
                        v-for="board in boards"
                        :key="board.id"
                        :label="board.titulo"
                        :value="board.id"
                    >
                        <div class="flex items-center gap-2">
                            <span
                                class="h-2 w-2 rounded-full"
                                :style="{ backgroundColor: board.cor || '#3b82f6' }"
                            />
                            <span>{{ board.titulo }}</span>
                        </div>
                    </ElOption>
                </ElSelect>
            </div>
            <div class="flex flex-col gap-2 w-full">
                <span class="text-xs text-black/80 dark:text-white/80">
                    Cliente / oportunidade
                </span>
                <ElSelect
                    :model-value="stats.filterByOpportunityId"
                    @update:model-value="stats.setFilterByOpportunityId"
                    :remote-method="searchOpportunities"
                    :loading="isLoadingOpportunities"
                    placeholder="Selecione um cliente"
                    class="w-full"
                    filterable
                    remote
                    clearable
                >
                    <ElOption label="Todos os clientes" value="all" />
                    <ElOption
                        v-for="opportunity in opportunityOptions"
                        :key="opportunity.id"
                        :label="`${opportunity.label} (#${opportunity.id})`"
                        :value="opportunity.id"
                    >
                        <div class="flex min-w-0 flex-col py-1">
                            <span class="truncate">{{ opportunity.label }}</span>
                            <span class="truncate text-[11px] text-gray-400">
                                #{{ opportunity.id }}
                                <template v-if="opportunity.tipo">
                                    · {{ opportunity.tipo }}
                                </template>
                            </span>
                        </div>
                    </ElOption>
                </ElSelect>
            </div>
            <FilterBetweenDates
                :value="stats.filterByBetweenDates"
                @change="stats.setFilterByBetweenDates"
                :show-label="true"
            />
            <FilterBetweenDates
                :value="stats.filterByInteractionDates"
                @change="stats.setFilterByInteractionDates"
                label="Última Interação"
                :show-label="true"
            />
            <FilterUser
                v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
                @change="stats.setFilterByUserId"
                :value="stats.filterByUserId"
                :show-label="true"
                :have-all="true"
            />
        </template>
        <template #submit>
            <FilterSubmit
                @click="async () => await stats.findAll()"
                :loading="stats.isLoading"
            />
        </template>
    </UIFilterMenu>
</template>

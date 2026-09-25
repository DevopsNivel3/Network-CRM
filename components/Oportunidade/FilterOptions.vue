<script setup lang="ts">
const { user } = useAuthSession();
const oportunidades = useOportunidades();
</script>

<template>
    <!-- Menu de Filtro -->
    <UIFilterMenu :reset="oportunidades.clearFilters">
        <template #default>
            <FilterSearch
                @change="oportunidades.setFilterByName"
                :value="oportunidades.filterByName"
                label="Lead"
            />
            <FilterBetweenDates
                @change="oportunidades.setFilterByBetweenDates"
                :value="oportunidades.filterByBetweenDates"
                :showLabel="true"
            />
            <FilterBetweenDates
                @change="oportunidades.setFilterByInteractionDates"
                :value="oportunidades.filterByInteractionDates"
                label="Última Interação"
                :showLabel="true"
            />
            <FilterUser
                v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
                @change="oportunidades.setFilterByUserId"
                :value="oportunidades.filterByUserId"
                :show-label="true"
                :have-all="true"
            />
            <FilterLeadGroup
                @change="oportunidades.setFilterByGroupIds"
                :value="oportunidades.filterByGroupIds"
                :showLabel="true"
            />
            <FilterStatusOportunidade
                @change="oportunidades.setFilterByStatus"
                :value="oportunidades.filterByStatus"
                :have-all="true"
                show-label
            />
            <FilterCity
                @change="oportunidades.setFilterByCity"
                :value="oportunidades.filterByCity"
                :showLabel="true"
                :have-all="true"
            />
            <div class="flex flex-col gap-1">
                <span class="text-xs text-black/60 dark:text-white/60">
                    Inativos
                </span>
                <ElSelect
                    :model-value="oportunidades.filterByDisabledMode"
                    @change="
                        (value) => oportunidades.setFilterByDisabledMode(value)
                    "
                    placeholder="Selecione"
                >
                    <ElOption label="Sem inativos" value="without" />
                    <ElOption label="Somente inativos" value="only" />
                    <ElOption label="Com inativos" value="with" />
                </ElSelect>
            </div>
        </template>
        <template #submit>
            <FilterSubmit
                @click="
                    async () => {
                        oportunidades.clearPage();
                        await oportunidades.findAll();
                    }
                "
                :loading="oportunidades.isLoading"
            />
        </template>
    </UIFilterMenu>
</template>

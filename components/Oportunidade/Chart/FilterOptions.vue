<script setup lang="ts">
const props = defineProps<{
    activeTabName: string;
}>();

const { user } = useAuthSession();
const chart = useChart();
</script>

<template>
    <!-- Menu de Filtro -->
    <UIFilterMenu :reset="chart.clearFilters">
        <template #default>
            <FilterBetweenDates
                @change="chart.setFilterByBetweenDates"
                :value="chart.filterByBetweenDates"
                :showLabel="true"
                label="Período"
            />
            <FilterUser
                v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
                @change="chart.setFilterByUserId"
                :value="chart.filterByUserId"
                :show-label="true"
                :have-all="true"
            />
            <FilterLeadGroup
                @change="chart.setFilterByGroupIds"
                :value="chart.filterByGroupIds"
                :showLabel="true"
            />
            <FilterCity
                @change="chart.setFilterByCity"
                :value="chart.filterByCity"
                :showLabel="true"
                :have-all="true"
            />
        </template>
        <template #submit>
            <FilterSubmit
                @click="
                    async () => {
                        if ('funil' === props.activeTabName) {
                            await chart.oportunidadesChartFunil();
                        } else if ('interacoes' === props.activeTabName) {
                            await chart.oportunidadesChartInteracoes();
                        }
                    }
                "
                :loading="chart.isLoading"
            />
        </template>
    </UIFilterMenu>
</template>

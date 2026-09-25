<script setup lang="ts">
const leadGroups = useLeadGroups();
</script>

<template>
    <UIFilterMenu :reset="leadGroups.clearFilters">
        <template #default>
            <FilterSearch
                @change="leadGroups.setFilterByName"
                :value="leadGroups.filterByName"
                label="Nome"
                placeholder="Pesquisar grupo"
            />
        </template>
        <template #submit>
            <FilterSubmit
                @click="
                    async () => {
                        leadGroups.clearPage();
                        await leadGroups.findAll();
                    }
                "
                :loading="leadGroups.isLoading"
            />
        </template>
    </UIFilterMenu>
</template>

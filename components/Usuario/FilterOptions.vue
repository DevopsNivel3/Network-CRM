<script setup lang="ts">
const usuarios = useUsuarios();
const statusOptions = computed(() => {
    return [
        {
            label: "Ativo",
            value: "ativo",
        },
        {
            label: "Inativo",
            value: "inativo",
        },
    ];
});
</script>

<template>
    <!-- Menu de Filtro -->
    <UIFilterMenu :reset="usuarios.clearFilters">
        <template #default>
            <FilterSearch
                @change="usuarios.setFilterByName"
                :value="usuarios.filterByName"
                label="Nome"
            />
            <FilterSelect
                @change="usuarios.setFilterByStatus"
                :value="usuarios.filterByStatus"
                :options="statusOptions"
                :have-all="true"
            />
        </template>
        <template #submit>
            <FilterSubmit
                @click="
                    async () => {
                        usuarios.clearPage();
                        await usuarios.findAll();
                    }
                "
                :loading="usuarios.isLoading"
            />
        </template>
    </UIFilterMenu>
</template>

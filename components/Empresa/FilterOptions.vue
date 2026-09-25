<script setup lang="ts">
const empresas = useEmpresas();
</script>

<template>
  <!-- Menu de Filtro -->
  <UIFilterMenu :reset="empresas.clearFilters">
    <template #default>
      <FilterSearch
        @change="empresas.setFilterByName"
        :value="empresas.filterByName"
        label="Empresa"
      />
    </template>
    <template #submit>
      <FilterSubmit
        @click="
          async () => {
            empresas.clearPage();
            await empresas.findAll();
          }
        "
        :loading="empresas.isLoading"
      />
    </template>
  </UIFilterMenu>
</template>

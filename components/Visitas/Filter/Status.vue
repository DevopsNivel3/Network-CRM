<script setup lang="ts">
const visitas = useVisitas();
</script>

<template>
  <div class="flex items-center justify-center w-full md:w-[180px] gap-2">
    <span class="text-xs text-black/80 dark:text-white/80 text-nowrap w-12 md:w-auto">
      Status
    </span>
    <ElSelect
      @change="visitas.setFilterByStatus"
      v-model="visitas.filterByStatus"
      placeholder="Selecionar"
      :loading="visitas.isLoading"
    >
      <ElOption label="Todos" value="all" />
      <ElOption label="Pendente" value="Pendente" />
      <ElOption label="Em Progresso" value="Em Progresso" />
      <ElOption label="Reagendado" value="Reagendado" />
      <ElOption label="Cancelado" value="Cancelado" />
      <ElOption label="Concluído" value="Concluído" />
    </ElSelect>
  </div>
</template>

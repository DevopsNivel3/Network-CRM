<script setup lang="ts">
const visitas = useVisitas();
</script>

<template>
  <div class="flex items-center justify-center w-full md:w-[180px] gap-2">
    <span class="text-xs text-black/80 dark:text-white/80 text-nowrap w-12 md:w-auto"> Lead </span>
    <ElInput
      @change="visitas.setFilterByName"
      v-model="visitas.filterByName"
      placeholder="Pesquisar"
      class="!w-full"
      clearable
    />
  </div>
</template>

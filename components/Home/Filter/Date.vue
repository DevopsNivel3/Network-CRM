<script setup lang="ts">
const stats = useStats();
</script>

<template>
  <div class="flex items-center gap-2 w-full md:w-[160px]">
    <span class="text-xs text-black/80 dark:text-white/80 text-nowrap w-14 md:w-auto"> Ano </span>
    <ElDatePicker
      @change="stats.setFilterByYear"
      v-model="stats.filterByYear"
      placeholder="Selecionar"
      value-format="YYYY"
      class="!w-full"
      type="year"
    />
  </div>
</template>

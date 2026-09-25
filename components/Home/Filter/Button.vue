<script setup lang="ts">
import { Search } from '@element-plus/icons-vue';
const stats = useStats();
const handleFilter = async () => await stats.fetchStats();
</script>

<template>
  <ElButton
    class="!w-full md:!w-auto"
    @click="handleFilter()"
    size="default"
    :icon="Search"
  >
    Filtrar
  </ElButton>
</template>

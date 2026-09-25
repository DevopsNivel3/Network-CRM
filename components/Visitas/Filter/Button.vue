<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
const visitas = useVisitas();

const handleFilter = async () => {
  visitas.clearPage();
  await visitas.fetchVisitas();
};
</script>

<template>
  <ElButton @click="handleFilter()" size="default" :icon="Search"> Filtrar </ElButton>
</template>

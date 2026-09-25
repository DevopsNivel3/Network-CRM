<script setup lang="ts">
import { Search } from '@element-plus/icons-vue';
const leads = useLeads();

const handleFilter = async () => {
  leads.clearPage();
  await leads.fetchLeads();
};
</script>

<template>
  <ElButton
    @click="handleFilter()"
    size="default"
    :icon="Search"
  >
    Filtrar
  </ElButton>
</template>

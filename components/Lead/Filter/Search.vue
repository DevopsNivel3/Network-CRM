<script setup lang="ts">
const leads = useLeads();
</script>

<template>
  <div class="flex items-center justify-center w-full md:w-[180px] gap-2">
    <span class="text-xs text-black/80 dark:text-white/80 text-nowrap w-14 md:w-auto"> Lead </span>
    <ElInput
      @change="leads.setFilterByName"
      v-model="leads.filterByName"
      placeholder="Pesquisar"
      class="!w-full"
      clearable
    />
  </div>
</template>

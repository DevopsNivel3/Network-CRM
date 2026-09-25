<script setup lang="ts">
const stats = useStats();
const users = useUsuarios();

interface SelectOption {
  label: string;
  value: string | number;
}

const usersData = ref<SelectOption[]>([
  {
    label: 'Todos',
    value: 'all',
  },
]);

watch(
  () => users.data.data,
  (newUsers) => {
    if (newUsers) {
      usersData.value = [
        { label: 'Todos', value: 'all' },
        ...newUsers.map((u) => ({
          label: u.nome,
          value: u.id,
        })),
      ];
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex items-center justify-center w-full md:w-[180px] gap-2">
    <span class="text-xs text-black/80 dark:text-white/80 text-nowrap w-14 md:w-auto">
      Usuário
    </span>
    <el-select-v2
      @change="stats.setFilterByUserId"
      :options="usersData || []"
      no-match-text="Não encontrado"
      no-data-text="Sem dados"
      placeholder="Selecionar"
      v-model="stats.filterByUserId"
      :loading="users.isLoading"
      filterable
    >
      <template #loading>
        <span class="loading loading-infinity loading-md" />
      </template>
    </el-select-v2>
  </div>
</template>

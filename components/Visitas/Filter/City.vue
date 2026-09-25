<script setup lang="ts">
const visitas = useVisitas();

interface SelectOption {
  label: string;
  value: string | number;
}

const citiesData = ref<SelectOption[]>([
  {
    label: "Todos",
    value: "all",
  },
]);

watch(
  () => visitas.cities,
  (newCities) => {
    if (newCities) {
      citiesData.value = [
        { label: "Todos", value: "all" },
        ...newCities.map((c) => ({
          label: c.label,
          value: c.value,
        })),
      ];
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex items-center justify-center w-full md:w-[180px] gap-2">
    <span class="text-xs text-black/80 dark:text-white/80 text-nowrap w-12 md:w-auto">
      Cidade
    </span>
    <el-select-v2
      @change="visitas.setFilterByCity"
      v-model="visitas.filterByCity"
      :loading="visitas.isLoading"
      no-match-text="Não encontrado"
      :options="citiesData || []"
      no-data-text="Sem dados"
      placeholder="Selecionar"
      filterable
    >
      <template #loading>
        <span class="loading loading-infinity loading-md" />
      </template>
    </el-select-v2>
  </div>
</template>

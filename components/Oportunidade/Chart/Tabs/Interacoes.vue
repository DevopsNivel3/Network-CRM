<script setup lang="ts">
const chart = useChart();
const dayjs = useDayjs();

const oportunidadesChartInteracoesUsuario = computed(
  () => chart.data!.oportunidades!.interacoesPorUsuario || { categories: [], series: [] }
);
const oportunidadesChartInteracoesData = computed(
  () => chart.data?.oportunidades?.interacoesPorData || { categories: [], series: [] }
);
const oportunidadesChartPieData = computed(
  () =>
    chart.data!.oportunidades!.interacoesPorTipo!.map((item) => {
      return {
        name: item.name,
        value: item.value,
      };
    }) || []
);
</script>

<template>
  <div class="flex flex-col gap-2 h-full w-full">
    <div class="flex justify-between gap-2">
      <h3 class="font-medium uppercase text-xs tracking-wider">Interações</h3>
      <p class="text-xs text-nowrap opacity-80 uppercase tracking-wider">
        {{ dayjs(chart.filterByBetweenDates![0]).format("DD/MM/YYYY") }} -
        {{ dayjs(chart.filterByBetweenDates![1]).format("DD/MM/YYYY") }}
      </p>
    </div>
    <ElScrollbar class="!h-full !w-full" view-class="!h-full !w-full">
      <div class="flex flex-col gap-2 h-full w-full">
        <div class="flex flex-col md:flex-row gap-2 w-full">
          <div
            class="app-surface-muted flex w-full flex-col items-start justify-center gap-3 p-4 text-xs text-black/60 dark:text-white/80 md:w-[50%]"
          >
            <h3 class="font-medium uppercase !text-xs">Total por Tipo de Interação</h3>
            <ChartPie :data="oportunidadesChartPieData" />
          </div>
          <div
            class="app-surface-muted flex w-full flex-col items-start justify-center gap-3 p-4 text-xs text-black/60 dark:text-white/80"
          >
            <h3 class="font-medium uppercase !text-xs">Total por Usuário</h3>
            <ChartBar :series-data="oportunidadesChartInteracoesUsuario" />
          </div>
        </div>
        <div
          class="app-surface-muted flex min-h-[300px] w-full flex-col items-start justify-center gap-3 p-4 text-xs text-black/60 dark:text-white/80"
        >
          <h3 class="font-medium uppercase !text-xs">Evolução das Interações por Data</h3>
          <ChartLine :series-data="oportunidadesChartInteracoesData" />
        </div>
      </div>
    </ElScrollbar>
  </div>
</template>

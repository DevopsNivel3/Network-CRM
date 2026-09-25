<script setup lang="ts">
const {
  interacoesByTipoChart,
  interacoesByTipoOverTimeChart,
  leadsByDayLabel,
  periodStats,
} = useCrmDashboardMetrics();
</script>

<template>
  <section class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
    <div class="xl:col-span-12">
      <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
        Engajamento por canal
      </h2>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Composição e evolução das interações no período.
      </p>
    </div>
    <div class="app-surface min-h-[300px] w-full p-4 xl:col-span-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold uppercase text-gray-500">
          Interações por Tipo
        </h3>
        <span class="text-xs text-black/60 dark:text-white/60">
          Total:
          {{ formatNumber((periodStats?.totalInteracoes || 0).toString()) }}
        </span>
      </div>
      <div class="w-full h-[235px] relative">
        <ChartPie
          :data="interacoesByTipoChart"
          class="!w-full !h-full absolute inset-0"
        />
      </div>
    </div>
    <div class="app-surface min-h-[340px] w-full p-4 xl:col-span-8">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold uppercase text-gray-500">
          Evolução das Interações por Tipo ({{ leadsByDayLabel }})
        </h3>
      </div>
      <div class="w-full h-[275px] relative">
        <ChartLine
          :series-data="interacoesByTipoOverTimeChart"
          class="!w-full !h-full absolute inset-0"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const {
  canViewVisitas,
  leadsByDayLabel,
  leadsByStateChart,
  pipelineValueByDayChart,
  rankedBarHeight,
} = useCrmDashboardMetrics();
</script>

<template>
  <section
    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-stretch"
  >
    <div class="md:col-span-2 xl:col-span-12">
      <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
        Operação comercial
      </h2>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Pendências e compromissos que precisam de atenção.
      </p>
    </div>
    <div
      class="w-full"
      :class="canViewVisitas ? 'xl:col-span-6' : 'xl:col-span-12'"
    >
      <LembretesList />
    </div>
    <div v-if="canViewVisitas" class="w-full xl:col-span-6">
      <VisitasList />
    </div>
    <div
      class="md:col-span-2 xl:col-span-12 mt-2 border-t border-slate-200/80 pt-5 dark:border-white/10"
    >
      <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
        Distribuição e valor do pipeline
      </h2>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Onde os leads estão e como o valor evolui no período.
      </p>
    </div>
    <div class="w-full xl:col-span-5">
      <div class="app-surface h-full min-h-[360px] w-full p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold uppercase text-gray-500">
            Leads por Estado
          </h3>
        </div>
        <div
          class="w-full relative"
          :style="{
            height: rankedBarHeight(leadsByStateChart.length),
          }"
        >
          <ChartBar
            :data="leadsByStateChart"
            :horizontal="true"
            grid-left="3%"
            :y-axis-label-width="90"
            series-name="Leads"
            class="!w-full !h-full absolute inset-0"
          />
        </div>
      </div>
    </div>
    <div class="w-full xl:col-span-7">
      <div class="app-surface h-full min-h-[360px] w-full p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold uppercase text-gray-500">
            Evolução do Valor do Pipeline ({{ leadsByDayLabel }})
          </h3>
        </div>
        <div class="w-full h-[290px] relative">
          <ChartLine
            :series-data="pipelineValueByDayChart"
            class="!w-full !h-full absolute inset-0"
          />
        </div>
      </div>
    </div>
  </section>
</template>

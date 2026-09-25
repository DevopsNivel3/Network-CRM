<script setup lang="ts">
const { leadsByDayChart, leadsByDayLabel } = useCrmDashboardMetrics();
</script>

<template>
  <section class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
    <div class="xl:col-span-12">
      <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
        Aquisição e atividade recente
      </h2>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Ritmo de entrada no funil e últimos contatos realizados.
      </p>
    </div>
    <div class="w-full xl:col-span-8">
      <div class="app-surface h-full min-h-[420px] w-full p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold uppercase text-gray-500">
            Cadastros por Dia ({{ leadsByDayLabel }})
          </h3>
        </div>
        <div class="w-full h-[350px] relative">
          <ChartLine
            :series-data="leadsByDayChart"
            class="!w-full !h-full absolute inset-0"
          />
        </div>
      </div>
    </div>
    <div class="w-full xl:col-span-4">
      <HomeListInteractions />
    </div>
  </section>
</template>

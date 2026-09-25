<script setup lang="ts">
const { user } = useAuthSession();
const {
  coberturaOportunidadesByBoardChart,
  formatPercent,
  interacoesByResponsavelChart,
  periodStats,
  rankedBarHeight,
} = useCrmDashboardMetrics();
</script>

<template>
  <section class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
    <div class="xl:col-span-12">
      <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
        Cobertura e desempenho
      </h2>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Participação da equipe e boards que ainda precisam de contato.
      </p>
    </div>
    <div
      v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
      class="app-surface h-full min-h-[340px] w-full p-4 xl:col-span-6"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold uppercase text-gray-500">
          Interações por Responsável
        </h3>
      </div>
      <div
        class="w-full relative"
        :style="{
          height: rankedBarHeight(interacoesByResponsavelChart.length),
        }"
      >
        <ChartBar
          :data="interacoesByResponsavelChart"
          :horizontal="true"
          grid-left="3%"
          :y-axis-label-width="100"
          series-name="Interações"
          class="!w-full !h-full absolute inset-0"
        />
      </div>
    </div>
    <div
      class="app-surface h-full min-h-[340px] w-full p-4"
      :class="
        hasUserPermission(user.permissoes, UserPermissions.ADMIN)
          ? 'xl:col-span-6'
          : 'xl:col-span-12'
      "
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold uppercase text-gray-500">
          Cobertura de Oportunidades com Interação
        </h3>
        <span class="text-xs text-black/60 dark:text-white/60">
          Geral:
          {{ formatPercent(periodStats?.coberturaOportunidadesPercent || 0) }}%
        </span>
      </div>
      <div
        class="w-full relative"
        :style="{
          height: rankedBarHeight(coberturaOportunidadesByBoardChart.length),
        }"
      >
        <ChartBar
          :data="coberturaOportunidadesByBoardChart"
          :horizontal="true"
          grid-left="3%"
          :y-axis-label-width="130"
          series-name="% com interação"
          class="!w-full !h-full absolute inset-0"
        />
      </div>
    </div>
  </section>
</template>

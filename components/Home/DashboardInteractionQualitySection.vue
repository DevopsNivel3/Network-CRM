<script setup lang="ts">
const { interacoesDetalhamentoPorTipo, periodStats } = useCrmDashboardMetrics();
</script>

<template>
  <section class="space-y-3">
    <div>
      <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
        Qualidade das interações
      </h2>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Resultados obtidos em mensagens, e-mails e ligações.
      </p>
    </div>
    <div class="app-surface min-h-[420px] w-full p-4">
      <div class="flex items-center justify-between mb-3 gap-3">
        <div>
          <h3 class="text-xs font-semibold uppercase text-gray-500">
            Resultados por Tipo de Integração
          </h3>
          <p class="text-xs text-black/60 dark:text-white/60 mt-1">
            Comparativo consolidado de mensagem, e-mail e telefone por
            resultado.
          </p>
        </div>
        <span
          class="text-xs text-black/60 dark:text-white/60 whitespace-nowrap"
        >
          Total:
          {{ formatNumber((periodStats?.totalInteracoes || 0).toString()) }}
        </span>
      </div>
      <div class="w-full h-[340px] relative">
        <HomeMegaInteractionsResultsChart
          :data="interacoesDetalhamentoPorTipo"
          class="!w-full !h-full absolute inset-0"
        />
      </div>
    </div>
  </section>
</template>

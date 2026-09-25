<script setup lang="ts">
const chart = useChart();
const loadError = ref("");

const funilData = computed(() => chart.data?.oportunidades?.funil || []);
const interacoesPorTipo = computed(
  () => chart.data?.oportunidades?.interacoesPorTipo || [],
);
const interacoesPorData = computed(
  () => chart.data?.oportunidades?.interacoesPorData || null,
);

const funilTotal = computed(() =>
  Number(funilData.value[0]?.value || 0).toLocaleString("pt-BR"),
);
const interacoesTotal = computed(() =>
  interacoesPorTipo.value
    .reduce((total: number, item: any) => total + Number(item.value || 0), 0)
    .toLocaleString("pt-BR"),
);

const loadCharts = async () => {
  loadError.value = "";
  try {
    await Promise.all([
      chart.oportunidadesChartFunil(),
      chart.oportunidadesChartInteracoes(),
    ]);
  } catch (error: any) {
    loadError.value = error?.message || "Não foi possível carregar os gráficos.";
  }
};

onMounted(loadCharts);
</script>

<template>
  <div
    v-if="loadError"
    class="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center dark:border-red-900/60 dark:bg-red-950/20"
  >
    <p class="text-sm text-red-600 dark:text-red-300">{{ loadError }}</p>
    <ElButton size="small" @click="loadCharts">Tentar novamente</ElButton>
  </div>

  <div v-else class="grid h-full grid-cols-1 gap-4 lg:grid-cols-12">
    <section class="dashboard-chart-card lg:col-span-6 2xl:col-span-4">
      <header class="dashboard-chart-header">
        <div>
          <h3>Funil de vendas</h3>
          <p>Conversão entre as etapas comerciais</p>
        </div>
        <span class="dashboard-chart-total">{{ funilTotal }}</span>
      </header>
      <div class="dashboard-chart-body">
        <ChartFunnel
          v-if="funilData.length"
          :data="funilData"
          width="100%"
          height="100%"
        />
        <div v-else class="dashboard-chart-empty">Sem oportunidades no período</div>
      </div>
    </section>

    <section class="dashboard-chart-card dashboard-chart-card--compact lg:col-span-6 2xl:col-span-3">
      <header class="dashboard-chart-header">
        <div>
          <h3>Interações por tipo</h3>
          <p>Distribuição dos contatos realizados</p>
        </div>
        <span class="dashboard-chart-total">{{ interacoesTotal }}</span>
      </header>
      <div class="dashboard-chart-body">
        <ChartPie
          v-if="interacoesPorTipo.length"
          :data="interacoesPorTipo"
          width="100%"
          height="100%"
        />
        <div v-else class="dashboard-chart-empty">Sem interações no período</div>
      </div>
    </section>

    <section class="dashboard-chart-card lg:col-span-12 2xl:col-span-5">
      <header class="dashboard-chart-header">
        <div>
          <h3>Interações por data</h3>
          <p>Evolução dos contatos ao longo do tempo</p>
        </div>
      </header>
      <div class="dashboard-chart-body">
        <ChartLine
          v-if="interacoesPorData?.categories?.length"
          :series-data="interacoesPorData"
          width="100%"
          height="100%"
        />
        <div v-else class="dashboard-chart-empty">Sem dados para a linha do tempo</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-chart-card {
  display: flex;
  min-height: 340px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(15 23 42 / 8%);
  border-radius: 1rem;
  background: rgb(255 255 255 / 82%);
  box-shadow: 0 10px 28px rgb(15 23 42 / 5%);
}

.dashboard-chart-header {
  display: flex;
  min-height: 70px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgb(15 23 42 / 7%);
  padding: 1rem 1.125rem;
}

.dashboard-chart-header h3 {
  color: #1f2937;
  font-size: .82rem;
  font-weight: 700;
  letter-spacing: .035em;
  text-transform: uppercase;
}

.dashboard-chart-header p {
  margin-top: .25rem;
  color: #6b7280;
  font-size: .75rem;
}

.dashboard-chart-total {
  flex: none;
  border-radius: 9999px;
  background: rgb(16 185 129 / 10%);
  padding: .3rem .65rem;
  color: #047857;
  font-size: .75rem;
  font-weight: 700;
}

.dashboard-chart-body {
  position: relative;
  min-height: 260px;
  flex: 1;
  padding: .75rem;
}

.dashboard-chart-empty {
  display: flex;
  height: 100%;
  min-height: 235px;
  align-items: center;
  justify-content: center;
  border-radius: .75rem;
  background: rgb(248 250 252 / 70%);
  color: #9ca3af;
  font-size: .78rem;
}

:global(.dark) .dashboard-chart-card {
  border-color: rgb(255 255 255 / 10%);
  background: rgb(24 24 27 / 65%);
  box-shadow: 0 10px 28px rgb(0 0 0 / 18%);
}

:global(.dark) .dashboard-chart-header {
  border-color: rgb(255 255 255 / 8%);
}

:global(.dark) .dashboard-chart-header h3 { color: #f3f4f6; }
:global(.dark) .dashboard-chart-header p { color: #9ca3af; }
:global(.dark) .dashboard-chart-total { color: #6ee7b7; }
:global(.dark) .dashboard-chart-empty { background: rgb(0 0 0 / 12%); }

@media (max-width: 640px) {
  .dashboard-chart-card { min-height: 330px; }
  .dashboard-chart-card--compact { min-height: 300px; }
  .dashboard-chart-body { min-height: 245px; padding: .5rem; }
}
</style>

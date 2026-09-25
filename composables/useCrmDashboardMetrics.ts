import dayjs from "dayjs";

export function useCrmDashboardMetrics() {
  const stats = useStats();
  const { user } = useAuthSession();

  const leadsByState = computed(() => stats.data?.leadsByState || []);
  const leadsByDay = computed(() => stats.data?.leadsByDay || null);
  const pipelineValueByDay = computed(
    () => stats.data?.pipelineValueByDay || null,
  );
  const interacoes = computed(() => stats.data?.interacoes || null);
  const interacoesByTipo = computed(() => interacoes.value?.byTipo || []);
  const interacoesDetalhamentoPorTipo = computed(
    () =>
      interacoes.value?.detalhamentoPorTipo || {
        mensagem: [],
        email: [],
        telefone: [],
      },
  );
  const interacoesByResponsavel = computed(
    () => interacoes.value?.byResponsavel || [],
  );
  const interacoesByTipoOverTime = computed(
    () => interacoes.value?.byTipoOverTime || null,
  );
  const coberturaOportunidadesByBoard = computed(
    () => interacoes.value?.coberturaOportunidadesByBoard || [],
  );
  const canViewVisitas = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.VER_VISITA),
  );
  const periodStats = computed(() => stats.data?.period || null);
  const periodLeads = computed(() => periodStats.value?.totalLeads || 0);
  const periodOportunidades = computed(
    () => periodStats.value?.totalOportunidades || 0,
  );
  const periodPipelineValue = computed(
    () => periodStats.value?.pipelineValue || 0,
  );
  const periodConversionRate = computed(
    () => periodStats.value?.conversionRate || 0,
  );
  const periodTicketMedio = computed(() =>
    periodOportunidades.value
      ? periodPipelineValue.value / periodOportunidades.value
      : 0,
  );

  const withFallback = <T>(value: T[], fallback: T) =>
    value.length ? value : [fallback];
  const leadsByStateChart = computed(() =>
    withFallback(leadsByState.value, { name: "Sem dados", value: 1 }),
  );
  const leadsByDayChart = computed(() =>
    leadsByDay.value?.categories?.length
      ? leadsByDay.value
      : {
          categories: ["Sem dados"],
          series: [
            { name: "Leads", data: [1] },
            { name: "Oportunidades", data: [1] },
          ],
        },
  );
  const pipelineValueByDayChart = computed(() =>
    pipelineValueByDay.value?.categories?.length
      ? pipelineValueByDay.value
      : {
          categories: ["Sem dados"],
          series: [{ name: "Valor estimado acumulado", data: [1] }],
        },
  );
  const interacoesByTipoChart = computed(() =>
    withFallback(interacoesByTipo.value, { name: "Sem dados", value: 1 }),
  );
  const interacoesByTipoOverTimeChart = computed(() =>
    interacoesByTipoOverTime.value?.categories?.length &&
    interacoesByTipoOverTime.value?.series?.length
      ? interacoesByTipoOverTime.value
      : {
          categories: ["Sem dados"],
          series: [{ name: "Sem dados", data: [1] }],
        },
  );
  const interacoesByResponsavelChart = computed(() =>
    withFallback(interacoesByResponsavel.value, {
      name: "Sem dados",
      value: 1,
    }),
  );
  const coberturaOportunidadesByBoardChart = computed(() =>
    withFallback(coberturaOportunidadesByBoard.value, {
      name: "Sem dados",
      value: 1,
    }),
  );
  const leadsByDayLabel = computed(() => {
    const range = stats.filterByBetweenDates;
    const start =
      range?.length === 2 ? dayjs(range[0]) : dayjs().startOf("month");
    const end = range?.length === 2 ? dayjs(range[1]) : dayjs().endOf("month");
    return `${start.format("DD/MM/YYYY")} - ${end.format("DD/MM/YYYY")}`;
  });

  const rankedBarHeight = (count: number) =>
    `${Math.min(440, Math.max(260, count * 34 + 60))}px`;
  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatPercent = (value: number) =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  return {
    canViewVisitas,
    coberturaOportunidadesByBoardChart,
    formatCurrency,
    formatPercent,
    interacoesByResponsavelChart,
    interacoesByTipoChart,
    interacoesByTipoOverTimeChart,
    interacoesDetalhamentoPorTipo,
    leadsByDayChart,
    leadsByDayLabel,
    leadsByStateChart,
    periodConversionRate,
    periodLeads,
    periodOportunidades,
    periodPipelineValue,
    periodStats,
    periodTicketMedio,
    pipelineValueByDayChart,
    rankedBarHeight,
  };
}

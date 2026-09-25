<script setup lang="ts">
import { Folder } from "@element-plus/icons-vue";

const oportunidade = useOportunidade();
const device = useDevice();
const chart = useChart();
const emit = defineEmits<{
    (e: "open-view"): void;
}>();

// Dados do chart do funil
const oportunidadesChartData = computed(
    () => chart.data!.oportunidades!.funil || [],
);

// Dados do gráfico de origem de leads
const origemLeadData = computed(
    () => chart.data?.oportunidades?.insights?.origem_lead || [],
);

// Faz o fetch da oportunidade e abre o modal
const openOportunidadeView = async (id: number) => {
    oportunidade.findById(id);
    emit("open-view");
};

// Dados dos insights de leads presos
const stuckLeadsInsights = computed(
    () => chart.data?.oportunidades?.insights || null,
);
const stuckLeadsFilterEstagnado = ref("all");
const stuckLeadsFilterEstagnadoOptions = computed(() => {
    if (!stuckLeadsInsights.value?.stuck_leads?.length)
        return [{ label: "Todos", value: "all" }];

    const uniqueBoards = new Map();
    stuckLeadsInsights.value.stuck_leads.forEach((lead) => {
        if (!uniqueBoards.has(lead.board_id)) {
            uniqueBoards.set(lead.board_id, {
                label: lead.board_name,
                value: lead.board_id.toString(),
            });
        }
    });

    return [
        { label: "Todos", value: "all" },
        ...Array.from(uniqueBoards.values()),
    ];
});
const filteredStuckLeads = computed(() => {
    if (!stuckLeadsInsights.value?.stuck_leads?.length) return [];
    if (stuckLeadsFilterEstagnado.value === "all")
        return stuckLeadsInsights.value.stuck_leads;
    return stuckLeadsInsights.value.stuck_leads.filter(
        (lead) => lead.board_id.toString() === stuckLeadsFilterEstagnado.value,
    );
});
const stuckLeadsPieData = computed(() => {
    if (!filteredStuckLeads.value?.length) return [];

    const categories = {
        yellow: { name: "Até 14 dias", count: 0, color: "#EAB308" },
        orange: { name: "15-30 dias", count: 0, color: "#F97316" },
        red: { name: "Mais de 30 dias", count: 0, color: "#EF4444" },
    };

    filteredStuckLeads.value.forEach((lead) => {
        if (lead.days_stuck <= 14) categories.yellow.count++;
        else if (lead.days_stuck > 14 && lead.days_stuck <= 30)
            categories.orange.count++;
        else if (lead.days_stuck > 30) categories.red.count++;
    });

    return Object.values(categories)
        .filter((category) => category.count > 0)
        .map((category) => ({
            name: category.name,
            value: category.count,
            itemStyle: {
                color: category.color,
            },
        }));
});
</script>

<template>
    <div class="flex flex-col gap-2 h-full w-full">
        <div class="flex items-center justify-between gap-2">
            <h3 class="w-full font-medium uppercase text-xs tracking-wider">
                Oportunidades
            </h3>
            <p class="text-xs text-nowrap opacity-80 uppercase tracking-wider">
                {{
                    new Date(chart.filterByBetweenDates![0]).toLocaleDateString(
                        "pt-BR",
                    )
                }}
                -
                {{
                    new Date(chart.filterByBetweenDates![1]).toLocaleDateString(
                        "pt-BR",
                    )
                }}
            </p>
        </div>
        <ElScrollbar
            class="!h-full !w-full !space-y-2"
            view-class="!h-full !w-full !space-y-2"
        >
            <div
                class="flex flex-col xl:flex-row-reverse items-start gap-2 w-full"
            >
                <div
                    class="flex flex-col items-stretch gap-2 w-full xl:w-[50%]"
                >
                    <div
                        class="app-surface-muted flex min-h-[220px] flex-col p-4"
                    >
                        <h3
                            class="font-medium uppercase mb-3 text-xs text-black/60 dark:text-white/80"
                        >
                            Distribuição por Origem de Lead
                        </h3>
                        <div class="w-full relative min-h-[503px] h-full">
                            <ChartBar
                                :horizontal="true"
                                :data="origemLeadData"
                                series-name="Total"
                                grid-left="1%"
                                :y-axis-label-width="80"
                                class="!w-full !h-full absolute inset-0"
                            />
                        </div>
                    </div>
                    <div
                        class="app-surface-muted flex flex-col items-center justify-center p-4"
                    >
                        <h3
                            class="font-medium uppercase mb-3 text-xs text-black/60 dark:text-white/80"
                        >
                            Valor Estimado
                        </h3>
                        <h3
                            class="text-xl font-bold text-center text-black dark:text-white"
                        >
                            {{
                                chart.data?.oportunidades?.valor_estimado?.toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL",
                                    },
                                ) || "R$ 0,00"
                            }}
                        </h3>
                    </div>
                </div>
                <div
                    class="app-surface-muted relative flex w-full flex-col overflow-hidden p-4"
                >
                    <h3
                        class="font-medium uppercase mb-3 text-xs text-black/60 dark:text-white/80"
                    >
                        Funil de Vendas
                    </h3>
                    <ElScrollbar class="!w-full !h-full">
                        <div class="w-full relative min-h-[600px] md:h-full">
                            <ChartFunnel
                                :data="oportunidadesChartData"
                                class="!w-full !h-full !pb-16 md:!pb-0 absolute inset-0"
                            />
                        </div>
                    </ElScrollbar>
                </div>
            </div>
            <div
                class="flex flex-col-reverse md:flex-row-reverse items-start gap-2 w-full min-h-fit"
            >
                <div
                    class="app-surface-muted !min-h-fit !w-full p-4"
                >
                    <div class="flex flex-col gap-3 h-full">
                        <div class="flex items-center justify-between gap-2">
                            <h3
                                class="font-medium text-nowrap uppercase !text-xs text-black/60 dark:text-white/80"
                            >
                                Oportunidades estagnadas
                            </h3>
                            <ElSelect
                                class="!w-[100px] md:!w-[120px]"
                                placeholder="Selecione o board"
                                v-model="stuckLeadsFilterEstagnado"
                                :options="stuckLeadsFilterEstagnadoOptions"
                                :disabled="
                                    filteredStuckLeads &&
                                    filteredStuckLeads.length <= 0
                                "
                            />
                        </div>
                        <div class="w-full relative h-[380px] md:h-[285px]">
                            <ElScrollbar
                                v-if="
                                    filteredStuckLeads &&
                                    filteredStuckLeads.length > 0
                                "
                                class="!w-full !h-full"
                                view-class="!w-full !h-full flex flex-col"
                            >
                                <div class="space-y-2 pr-2 w-full">
                                    <div
                                        v-for="oportunidade in filteredStuckLeads"
                                        :key="oportunidade.id"
                                        class="flex items-stretch w-full"
                                    >
                                        <div
                                            class="flex items-center gap-2 justify-between flex-1 bg-white/50 dark:bg-black/20 p-3 rounded-l-lg min-w-0"
                                        >
                                            <div
                                                class="flex items-center gap-2 w-full min-w-0 truncate"
                                            >
                                                <span
                                                    class="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 flex-shrink-0"
                                                >
                                                    <span
                                                        class="inline-block w-2 h-2 mr-1 rounded-full"
                                                        :style="{
                                                            backgroundColor:
                                                                oportunidade.board_cor,
                                                        }"
                                                    />
                                                    {{
                                                        oportunidade.board_name
                                                    }}
                                                </span>
                                                <h4
                                                    :title="
                                                        oportunidade.lead_name ||
                                                        'Sem nome'
                                                    "
                                                    class="font-medium text-sm truncate flex-1 min-w-0"
                                                >
                                                    {{
                                                        oportunidade.lead_name ||
                                                        "Sem nome"
                                                    }}
                                                </h4>
                                            </div>
                                            <ElTooltip
                                                :disabled="device.isMobile"
                                                content="Visualizar"
                                                placement="bottom"
                                                effect="light"
                                                :hide-after="0"
                                            >
                                                <ElButton
                                                    @click="
                                                        openOportunidadeView(
                                                            oportunidade.id,
                                                        )
                                                    "
                                                    :icon="Folder"
                                                    size="small"
                                                    class="flex-shrink-0"
                                                />
                                            </ElTooltip>
                                        </div>
                                        <div
                                            class="text-xs py-3.5 px-3.5 rounded-r-lg font-medium tracking-wide uppercase text-nowrap flex-shrink-0"
                                            :class="{
                                                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400':
                                                    oportunidade.days_stuck <=
                                                    14,
                                                'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400':
                                                    oportunidade.days_stuck >
                                                        14 &&
                                                    oportunidade.days_stuck <=
                                                        30,
                                                'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400':
                                                    oportunidade.days_stuck >
                                                    30,
                                            }"
                                        >
                                            {{ oportunidade.days_stuck }} dias
                                        </div>
                                    </div>
                                </div>
                            </ElScrollbar>
                            <div
                                v-else
                                class="absolute inset-0 flex items-center justify-center w-full h-full"
                            >
                                <ElEmpty
                                    description="Todas as oportunidades estão progredindo."
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    class="app-surface-muted flex w-full flex-col items-start justify-center gap-3 p-4 text-xs text-black/60 dark:text-white/80 md:max-w-[400px]"
                >
                    <h3 class="font-medium uppercase !text-xs">
                        Total por Tempo Estagnado
                    </h3>
                    <ChartPie :data="stuckLeadsPieData" />
                </div>
            </div>
        </ElScrollbar>
    </div>
</template>

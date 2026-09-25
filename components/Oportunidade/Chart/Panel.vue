<script setup lang="ts">
import { Loading, ArrowLeftBold } from "@element-plus/icons-vue";
import type { TabsPaneContext } from "element-plus";

const device = useDevice();
const chart = useChart();
const emit = defineEmits<{
    (e: "open-view"): void;
}>();

// Para abrir o filtro do funil
const chartFilterMenu = ref<boolean>(device.isMobile ? false : true);
const toggleChartFilterMenu = () =>
    (chartFilterMenu.value = !chartFilterMenu.value);

// Ações para executar ao mudar de painel
const activePaneName = ref<string>("funil");
const handlePaneClick = async (tab: TabsPaneContext) => {
    if (tab.paneName?.toString() === "interacoes") {
        chart.oportunidadesChartInteracoes();
    } else if (tab.paneName?.toString() === "funil") {
        chart.oportunidadesChartFunil();
    }
};
</script>

<template>
    <div class="relative flex w-full h-full">
        <!-- Tela de Carregamento -->
        <div
            v-show="chart.isLoading"
            class="absolute inset-0 z-50 bg-black/40 flex items-center justify-center"
        >
            <ElIcon
                class="is-loading"
                color="var(--el-color-primary)"
                size="25"
            >
                <Loading />
            </ElIcon>
        </div>
        <!-- Painéis de Gráficos -->
        <ElScrollbar view-class="!w-full !h-full" class="!w-full !h-full">
            <ElTabs
                v-model="activePaneName"
                @tab-click="handlePaneClick"
                class="!h-full !w-full !border-none"
                type="border-card"
            >
                <ElTabPane
                    name="funil"
                    label="Gráfico de Oportunidades"
                    class="!h-full !w-full"
                >
                    <div class="w-full h-full flex-1 flex flex-col gap-3">
                        <OportunidadeChartTabsFunil
                            class="w-full h-full flex-1"
                            @open-view="emit('open-view')"
                        />
                    </div>
                </ElTabPane>
                <ElTabPane
                    name="interacoes"
                    label="Gráfico de Interações"
                    class="!h-full !w-full"
                >
                    <div class="w-full h-full flex-1 flex flex-col gap-3">
                        <OportunidadeChartTabsInteracoes
                            class="w-full h-full flex-1"
                        />
                    </div>
                </ElTabPane>
            </ElTabs>
        </ElScrollbar>
        <!-- Filtro do Funil -->
        <div class="absolute flex right-0 bottom-0 top-0 h-full !z-[999]">
            <div class="pt-2 flex items-center h-fit">
                <ElTooltip
                    effect="light"
                    :content="
                        chartFilterMenu ? 'Fechar filtro' : 'Expandir filtro'
                    "
                    :disabled="device.isMobile"
                >
                    <ElButton
                        @click="toggleChartFilterMenu"
                        class="!px-2 !bg-neutral-50 dark:!bg-eerie !py-0 !rounded-full"
                        :class="
                            chartFilterMenu ? '!text-nivel !border-nivel' : ''
                        "
                    >
                        <ElIcon
                            class="transition-transform duration-300 ease-in-out"
                            :class="{ '-rotate-180': chartFilterMenu }"
                            size="small"
                        >
                            <ArrowLeftBold />
                        </ElIcon>
                    </ElButton>
                </ElTooltip>
                <div
                    class="w-2 h-[0.5px] dark:bg-white/20 bg-black/20"
                    :class="chartFilterMenu ? '!bg-nivel' : ''"
                />
            </div>
            <div
                class="h-full bg-neutral-50 !max-w-[300px] !w-full border-l-[0.5px] dark:border-white/15 dark:bg-eerie"
                v-show="chartFilterMenu"
            >
                <OportunidadeChartFilterOptions
                    :activeTabName="activePaneName"
                />
            </div>
        </div>
    </div>
</template>

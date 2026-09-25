<script setup lang="ts">
import dayjs from "dayjs";

const stats = useStats();

const charts = computed(() => stats.data?.motivosMovimentacao || []);
const selectedReason = ref<Record<number, string | null>>({});

const toggleReason = (boardId: number, reason: string) => {
    selectedReason.value[boardId] =
        selectedReason.value[boardId] === reason ? null : reason;
};

const selectedItem = (chart: (typeof charts.value)[number]) =>
    chart.items.find((item) => item.name === selectedReason.value[chart.boardId]);
const chartHeight = (itemCount: number) =>
    `${Math.min(360, Math.max(180, itemCount * 42 + 54))}px`;
const periodLabel = computed(() => {
    const period = stats.data?.period;
    if (!period?.start || !period?.end) return "período selecionado";
    return `${dayjs(period.start).format("DD/MM/YYYY")} a ${dayjs(period.end).format("DD/MM/YYYY")}`;
});
</script>

<template>
    <section class="space-y-3">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Motivos atuais nas etapas</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Distribuição dos cards que permanecem em cada board.</p>
            </div>
            <span class="text-[11px] text-gray-400">{{ periodLabel }}</span>
        </div>
        <div class="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <div
            v-for="chart in charts"
            :key="chart.boardId"
            class="app-surface w-full p-4"
          >
            <div class="flex items-start justify-between gap-3">
                <div>
                    <h3 class="text-xs font-semibold uppercase text-gray-500">
                        Motivos {{ chart.boardTitulo }}
                    </h3>
                    <p class="text-xs text-black/50 dark:text-white/50 mt-1">
                        {{ chart.grupo || "Motivos de movimentação" }}
                    </p>
                </div>
                <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                    {{ chart.items.reduce((total, item) => total + item.value, 0) }}
                </span>
            </div>
            <div v-if="chart.items.length" class="mt-2">
                <div class="relative w-full" :style="{ height: chartHeight(chart.items.length) }">
                    <ChartBar
                        :data="chart.items"
                        :horizontal="true"
                        grid-left="3%"
                        :y-axis-label-width="110"
                        series-name="Movimentações"
                        class="!absolute !inset-0 !h-full !w-full"
                    />
                </div>

                <div class="mt-3 border-t border-black/5 pt-3 dark:border-white/10">
                    <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Passe o mouse ou clique para ver os cards
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <ElPopover
                            v-for="item in chart.items"
                            :key="item.name"
                            trigger="hover"
                            placement="top"
                            :width="300"
                            :show-after="200"
                        >
                            <template #reference>
                                <button
                                    type="button"
                                    class="max-w-full rounded-full border px-3 py-1.5 text-left text-xs font-medium transition"
                                    :class="selectedReason[chart.boardId] === item.name
                                        ? 'border-nivel bg-nivel text-white'
                                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-nivel dark:border-white/10 dark:bg-white/5 dark:text-gray-200'"
                                    @click="toggleReason(chart.boardId, item.name)"
                                >
                                    <span class="inline-block max-w-[190px] truncate align-bottom">{{ item.name }}</span>
                                    <span class="ml-1 opacity-70">({{ item.value }})</span>
                                </button>
                            </template>
                            <div class="space-y-2">
                                <p class="font-semibold text-gray-800">{{ item.name }}</p>
                                <div
                                    v-for="detail in item.details.slice(0, 5)"
                                    :key="detail.oportunidadeId"
                                    class="border-t border-gray-100 pt-2 first:border-0 first:pt-0"
                                >
                                    <p class="text-xs font-semibold text-gray-700">{{ detail.leadNome }}</p>
                                    <p v-if="detail.observacao" class="line-clamp-2 text-xs text-gray-500">{{ detail.observacao }}</p>
                                </div>
                                <p v-if="item.details.length > 5" class="text-xs text-gray-400">
                                    E mais {{ item.details.length - 5 }} card(s).
                                </p>
                            </div>
                        </ElPopover>
                    </div>

                    <div
                        v-if="selectedItem(chart)"
                        class="mt-3 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                        <div class="mb-2 flex items-center justify-between gap-2">
                            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {{ selectedItem(chart)?.name }}
                            </p>
                            <button
                                type="button"
                                class="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                @click="selectedReason[chart.boardId] = null"
                            >
                                Fechar
                            </button>
                        </div>
                        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div
                                v-for="detail in selectedItem(chart)?.details"
                                :key="detail.oportunidadeId"
                                class="min-w-0 rounded-md bg-white p-2.5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10"
                            >
                                <div class="flex items-start justify-between gap-2">
                                    <p class="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                                        {{ detail.leadNome }}
                                    </p>
                                    <span class="shrink-0 text-[10px] text-gray-400">
                                        {{ dayjs(detail.data).format("DD/MM/YYYY") }}
                                    </span>
                                </div>
                                <p v-if="detail.descricao" class="mt-1 line-clamp-1 text-[11px] text-gray-500">
                                    {{ detail.descricao }}
                                </p>
                                <p v-if="detail.observacao" class="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                                    {{ detail.observacao }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-else
                class="mt-5 flex h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/70 px-6 text-center dark:border-white/10 dark:bg-white/[0.03]"
            >
                <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Nenhuma movimentação com motivo
                </p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Não houve registros nesta prancheta entre {{ periodLabel }}.
                </p>
            </div>
          </div>

        <div
            v-if="!charts.length"
            class="app-surface 2xl:col-span-2 flex min-h-[180px] flex-col items-center justify-center border-dashed px-6 text-center"
        >
            <h3 class="text-xs font-semibold uppercase text-gray-500">
                Motivos das movimentações
            </h3>
            <p class="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                Nenhum motivo registrado no período
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Selecione outro período nos filtros para consultar o histórico.
            </p>
        </div>
        </div>
    </section>
</template>

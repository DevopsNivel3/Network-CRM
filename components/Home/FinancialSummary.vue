<script setup lang="ts">
import dayjs from "dayjs";
import { APP_FONT_FAMILY } from "~/utils/design";
import {
    BottomLeft,
    CircleCheck,
    Money,
    TopRight,
    WarningFilled,
    Wallet,
} from "@element-plus/icons-vue";
import { Modules, UserPermissions, hasUserPermission, normalizePermissionModules } from "~/utils/permissions";

type FinancialDashboard = {
    period: { start: string; end: string };
    totals: {
        receivable: number;
        received: number;
        payable: number;
        paid: number;
        balance: number;
        receivableOverdue: number;
        payableOverdue: number;
    };
    counts: Record<string, number>;
    cashFlow: {
        granularity: "diario" | "mensal";
        categories: string[];
        series: Array<{ name: string; data: number[] }>;
    };
};

const { user } = useAuthSession();
const stats = useStats();
const { isDark } = useTheme();
const loading = ref(false);
const error = ref("");
const data = ref<FinancialDashboard | null>(null);
const grouping = ref<"diario" | "mensal">("diario");
let requestId = 0;

const canView = computed(() =>
    normalizePermissionModules(user.empresa_modulos).includes(Modules.FINANCEIRO) &&
    hasUserPermission(user.permissoes, UserPermissions.VER_FINANCEIRO),
);

const selectedPeriod = computed(() => {
    const dates = stats.filterByBetweenDates;
    if (dates?.length === 2) return { start: dates[0], end: dates[1] };
    return {
        start: dayjs().startOf("month").format("YYYY-MM-DD"),
        end: dayjs().endOf("month").format("YYYY-MM-DD"),
    };
});

const money = (value: number) =>
    Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

const compactMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(Number(value || 0));

const periodLabel = computed(() =>
    `${dayjs(selectedPeriod.value.start).format("DD/MM/YYYY")} a ${dayjs(selectedPeriod.value.end).format("DD/MM/YYYY")}`,
);

const chartOption = computed(() => ({
    backgroundColor: "transparent",
    textStyle: { fontFamily: APP_FONT_FAMILY },
    color: ["#10b981", "#ef4444"],
    tooltip: {
        trigger: "axis",
        valueFormatter: (value: number) => money(value),
        backgroundColor: isDark.value ? "#23272b" : "#fff",
        borderColor: isDark.value ? "#444" : "#ddd",
        textStyle: { color: isDark.value ? "#fff" : "#222" },
    },
    legend: {
        top: 0,
        data: ["Entradas", "Saídas"],
        textStyle: { color: isDark.value ? "#d1d5db" : "#4b5563" },
    },
    grid: { left: "3%", right: "3%", top: 42, bottom: 12, containLabel: true },
    xAxis: {
        type: "category",
        data: data.value?.cashFlow.categories || [],
        axisLabel: {
            color: isDark.value ? "#9ca3af" : "#6b7280",
            interval: "auto",
            hideOverlap: true,
        },
        axisLine: { lineStyle: { color: isDark.value ? "#404040" : "#e5e7eb" } },
    },
    yAxis: {
        type: "value",
        axisLabel: {
            color: isDark.value ? "#9ca3af" : "#6b7280",
            formatter: (value: number) => compactMoney(value),
        },
        splitLine: { lineStyle: { color: isDark.value ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.08)" } },
    },
    series: (data.value?.cashFlow.series || []).map((series) => ({
        ...series,
        type: "bar",
        barMaxWidth: 28,
        itemStyle: { borderRadius: [5, 5, 0, 0] },
    })),
}));

const cards = computed(() => [
    { label: "Total a receber", value: data.value?.totals.receivable || 0, count: data.value?.counts.receivable || 0, icon: TopRight, tone: "emerald" },
    { label: "Total recebido", value: data.value?.totals.received || 0, count: data.value?.counts.received || 0, icon: CircleCheck, tone: "green" },
    { label: "Total a pagar", value: data.value?.totals.payable || 0, count: data.value?.counts.payable || 0, icon: BottomLeft, tone: "orange" },
    { label: "Total pago", value: data.value?.totals.paid || 0, count: data.value?.counts.paid || 0, icon: Money, tone: "red" },
]);

const load = async () => {
    if (!canView.value) return;
    const currentRequest = ++requestId;
    loading.value = true;
    error.value = "";
    try {
        const response = await useApi<FinancialDashboard>("/api/financeiro/dashboard", {
            query: {
                data_inicio: selectedPeriod.value.start,
                data_fim: selectedPeriod.value.end,
                agrupamento: grouping.value,
            },
        });
        if (currentRequest === requestId) data.value = response;
    } catch (err: any) {
        if (currentRequest === requestId) {
            error.value = err?.data?.message || "Não foi possível carregar o resumo financeiro.";
        }
    } finally {
        if (currentRequest === requestId) loading.value = false;
    }
};

watch(
    () => stats.filterVersion,
    () => {
        const days = dayjs(selectedPeriod.value.end).diff(dayjs(selectedPeriod.value.start), "day");
        const nextGrouping = days > 62 ? "mensal" : "diario";
        if (grouping.value !== nextGrouping) grouping.value = nextGrouping;
        else load();
    },
    { immediate: true },
);

watch(grouping, load);
</script>

<template>
    <section
        v-if="canView"
        class="financial-summary border-black/10 bg-white/80 dark:border-white/10 dark:bg-ebano/60"
    >
        <header class="flex flex-col gap-3 border-b border-slate-200/70 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between md:p-5">
            <div class="flex items-center gap-3">
                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ElIcon :size="19"><Wallet /></ElIcon>
                </span>
                <div>
                    <h2 class="text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-white/90">Financeiro consolidado</h2>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-white/50">{{ periodLabel }}</p>
                </div>
            </div>
            <NuxtLink to="/financeiro" class="text-xs font-medium text-nivel hover:underline">Abrir financeiro</NuxtLink>
        </header>

        <div v-if="loading && !data" class="flex min-h-64 items-center justify-center">
            <span class="loading loading-infinity loading-lg" />
        </div>
        <div v-else-if="error && !data" class="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <p class="text-sm text-red-500">{{ error }}</p>
            <ElButton size="small" @click="load">Tentar novamente</ElButton>
        </div>
        <div v-else-if="data" class="p-4 md:p-5">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article
                    v-for="card in cards"
                    :key="card.label"
                    class="financial-card border-black/10 bg-slate-50/70 dark:border-white/10 dark:bg-charcoal"
                    :class="`financial-card--${card.tone}`"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <p class="text-xs font-medium text-gray-500 dark:text-white/55">{{ card.label }}</p>
                            <p class="mt-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">{{ money(card.value) }}</p>
                            <p class="mt-1 text-[11px] text-gray-400">{{ card.count }} título(s) no período</p>
                        </div>
                        <span class="financial-card__icon"><ElIcon :size="17"><component :is="card.icon" /></ElIcon></span>
                    </div>
                </article>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
                <div class="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02] xl:col-span-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-white/50">Resumo do período</p>
                    <div class="mt-4 space-y-4">
                        <div>
                            <p class="text-xs text-gray-500 dark:text-white/60">Saldo realizado</p>
                            <p class="mt-1 text-lg font-bold" :class="data.totals.balance >= 0 ? 'text-emerald-600' : 'text-red-500'">{{ money(data.totals.balance) }}</p>
                        </div>
                        <div class="border-t border-slate-200/80 pt-3 dark:border-white/10">
                            <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/60"><ElIcon class="text-orange-500"><WarningFilled /></ElIcon> A receber vencido</div>
                            <p class="mt-1 font-semibold text-orange-600">{{ money(data.totals.receivableOverdue) }}</p>
                            <p class="text-[11px] text-gray-400">{{ data.counts.receivableOverdue || 0 }} título(s)</p>
                        </div>
                        <div class="border-t border-slate-200/80 pt-3 dark:border-white/10">
                            <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/60"><ElIcon class="text-red-500"><WarningFilled /></ElIcon> A pagar vencido</div>
                            <p class="mt-1 font-semibold text-red-500">{{ money(data.totals.payableOverdue) }}</p>
                            <p class="text-[11px] text-gray-400">{{ data.counts.payableOverdue || 0 }} título(s)</p>
                        </div>
                    </div>
                </div>

                <div class="min-h-[310px] rounded-xl border border-slate-200/80 p-3 dark:border-white/10 dark:bg-white/[0.02] xl:col-span-3">
                    <div class="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700 dark:text-white/80">Entradas x saídas realizadas</h3>
                            <p class="text-[11px] text-gray-400">Valores efetivamente recebidos e pagos</p>
                        </div>
                        <ElRadioGroup v-model="grouping" size="small">
                            <ElRadioButton value="diario">Diário</ElRadioButton>
                            <ElRadioButton value="mensal">Mensal</ElRadioButton>
                        </ElRadioGroup>
                    </div>
                    <VChart :option="chartOption" :theme="isDark ? 'dark' : 'light'" autoresize class="h-[245px] w-full" />
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.financial-summary { overflow: hidden; border-width: 1px; border-radius: 1rem; box-shadow: 0 10px 28px rgb(15 23 42 / 5%); }
.financial-card { border-width: 1px; border-radius: .8rem; padding: 1rem; }
.financial-card__icon { display: flex; height: 2rem; width: 2rem; flex: none; align-items: center; justify-content: center; border-radius: .65rem; background: rgb(100 116 139 / 10%); color: #64748b; }
.financial-card--emerald .financial-card__icon, .financial-card--green .financial-card__icon { background: rgb(16 185 129 / 10%); color: #059669; }
.financial-card--orange .financial-card__icon { background: rgb(249 115 22 / 10%); color: #ea580c; }
.financial-card--red .financial-card__icon { background: rgb(239 68 68 / 10%); color: #dc2626; }
:global(.dark) .financial-summary { box-shadow: 0 10px 28px rgb(0 0 0 / 18%); }
</style>

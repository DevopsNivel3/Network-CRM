<script setup lang="ts">
import { APP_FONT_FAMILY } from "~/utils/design";

const props = defineProps<{
    data: {
        mensagem: { name: string; value: number }[];
        email: { name: string; value: number }[];
        telefone: { name: string; value: number }[];
    };
}>();

const { isDark } = useTheme();
const device = useDevice();

const categoryConfig = [
    { key: "mensagem", label: "Mensagem" },
    { key: "email", label: "E-mail" },
    { key: "telefone", label: "Telefone" },
] as const;

const statusOrder = [
    "Enviada",
    "Respondida",
    "Ignorada",
    "Enviado",
    "Respondido",
    "Nao respondido",
    "Atendida",
    "Nao atendida",
    "Ocupado",
];

const statusColors: Record<string, string> = {
    Enviada: "#3B82F6",
    Respondida: "#10B981",
    Ignorada: "#F59E0B",
    Enviado: "#6366F1",
    Respondido: "#14B8A6",
    "Nao respondido": "#EF4444",
    Atendida: "#22C55E",
    "Nao atendida": "#F97316",
    Ocupado: "#8B5CF6",
};

const normalizedData = computed(() => {
    return categoryConfig.map((category) => {
        const source = props.data?.[category.key] || [];
        const values = Object.fromEntries(
            source.map((item) => [item.name, Number(item.value || 0)]),
        );
        const total = source.reduce(
            (sum, item) => sum + Number(item.value || 0),
            0,
        );

        return {
            key: category.key,
            label: category.label,
            values,
            total,
        };
    });
});

const chartSeries = computed(() => {
    return statusOrder
        .map((status) => {
            const data = normalizedData.value.map(
                (category) => category.values[status] || 0,
            );

            return {
                name: status,
                type: "bar",
                stack: "total",
                barMaxWidth: 56,
                emphasis: { focus: "series" },
                itemStyle: {
                    color: statusColors[status] || "#6B7280",
                    borderRadius: [6, 6, 0, 0],
                },
                label: {
                    show: false,
                },
                data,
            };
        })
        .filter((series) => series.data.some((value) => value > 0));
});

const totalInteractions = computed(() =>
    normalizedData.value.reduce((sum, category) => sum + category.total, 0),
);

const option = computed(() => ({
    textStyle: { fontFamily: APP_FONT_FAMILY },
    backgroundColor: "transparent",
    tooltip: {
        show: !device.isMobile,
        trigger: "axis",
        axisPointer: {
            type: "shadow",
        },
        textStyle: {
            fontWeight: 500,
            fontSize: 13,
            color: isDark.value ? "#fff" : "#222",
        },
        backgroundColor: isDark.value ? "#23272b" : "#fff",
        borderColor: isDark.value ? "#444" : "#ddd",
        formatter: (params: any[]) => {
            const items = (params || []).filter(
                (item) => Number(item?.value || 0) > 0,
            );
            const total = items.reduce(
                (sum, item) => sum + Number(item.value || 0),
                0,
            );

            if (!items.length) {
                return `<div>${params?.[0]?.axisValue || "Sem dados"}: 0</div>`;
            }

            const lines = items
                .map(
                    (item) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:6px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="display:inline-block;border-radius:999px;width:10px;height:10px;background-color:${item.color};"></span>
                            <span>${item.seriesName}</span>
                        </div>
                        <strong>${item.value}</strong>
                    </div>
                `,
                )
                .join("");

            return `
                <div style="min-width:220px;">
                    <div style="font-size:13px;font-weight:700;margin-bottom:8px;">
                        ${params[0].axisValue}
                    </div>
                    ${lines}
                    <div style="margin-top:10px;padding-top:8px;border-top:1px solid ${
                        isDark.value ? "#444" : "#ddd"
                    };display:flex;justify-content:space-between;gap:18px;">
                        <span>Total</span>
                        <strong>${total}</strong>
                    </div>
                </div>
            `;
        },
    },
    legend: {
        top: 0,
        type: "scroll",
        icon: "roundRect",
        itemWidth: 14,
        itemHeight: 10,
        textStyle: {
            color: isDark.value ? "#fff" : "#222",
            fontSize: 12,
        },
    },
    grid: {
        left: "4%",
        right: "4%",
        bottom: "4%",
        top: "18%",
        containLabel: true,
    },
    xAxis: {
        type: "category",
        data: normalizedData.value.map((item) => item.label),
        axisTick: { alignWithLabel: true },
        axisLabel: {
            color: isDark.value ? "#D1D5DB" : "#4B5563",
            fontWeight: 500,
        },
        axisLine: {
            lineStyle: {
                color: isDark.value ? "#4B5563" : "#D1D5DB",
            },
        },
    },
    yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: {
            color: isDark.value ? "#D1D5DB" : "#4B5563",
        },
        splitLine: {
            lineStyle: {
                color: isDark.value
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
            },
        },
    },
    series: chartSeries.value,
    graphic:
        chartSeries.value.length === 0
            ? [
                  {
                      type: "text",
                      left: "center",
                      top: "middle",
                      style: {
                          text: "Sem dados de resultados no período",
                          fill: isDark.value ? "#9CA3AF" : "#6B7280",
                          fontSize: 14,
                          fontWeight: 500,
                      },
                  },
              ]
            : [],
}));
</script>

<template>
    <div class="h-full w-full">
        <div class="flex flex-wrap items-center gap-2 mb-4">
            <div
                class="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold"
            >
                Total geral: {{ totalInteractions }}
            </div>
            <div
                v-for="category in normalizedData"
                :key="category.key"
                class="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 text-xs"
            >
                {{ category.label }}: {{ category.total }}
            </div>
        </div>
        <VChart
            :option="option"
            :theme="isDark ? 'dark' : 'light'"
            autoresize
            class="!w-full !h-full"
        />
    </div>
</template>

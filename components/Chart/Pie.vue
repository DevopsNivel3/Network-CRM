<script setup lang="ts">
import { APP_FONT_FAMILY } from "~/utils/design";

const props = defineProps<{
    width?: string;
    height?: string;
    data?: {
        name: number | string;
        value: number;
    }[];
    labels?: string[];
}>();

const { isDark } = useTheme();
const vchartRef = ref();

defineExpose({
    getDataURL: (opts?: any) => vchartRef.value?.getDataURL?.(opts),
});

const resolvedData = computed(() => props.data || []);
const hasData = computed(() =>
    resolvedData.value.some((item) => Number(item?.value || 0) > 0),
);

const predefinedColors = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
    "#f97316", // orange-500
    "#ec4899", // pink-500
    "#6366f1", // indigo-500
];

const option = computed(() => ({
    backgroundColor: "transparent",
    textStyle: { fontFamily: APP_FONT_FAMILY },
    tooltip: {
        show: hasData.value,
        trigger: "item",
        textStyle: {
            fontWeight: 500,
            fontSize: 13,
            color: isDark.value ? "#fff" : "#222",
        },
        backgroundColor: isDark.value ? "#23272b" : "#fff",
        borderColor: isDark.value ? "#444" : "#ddd",
        formatter: (params: any) => {
            return `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display:inline-block;margin-right:2px;border-radius:50%;width:10px;height:10px;background-color:${params.color};"></span>
          <span>${params.name}: ${params.value} (${params.percent}%)</span>
        </div>
      `;
        },
    },
    legend: {
        show: hasData.value,
        orient: "horizontal",
        type: "scroll",
        bottom: 0,
        left: "center",
        textStyle: {
            color: isDark.value ? "#fff" : "#333",
            fontSize: 12,
        },
        icon: "circle",
    },
    series: [
        {
            name: "",
            type: "pie",
            radius: ["42%", "70%"],
            center: ["50%", "45%"],
            minAngle: 3,
            avoidLabelOverlap: true,
            label: {
                show: hasData.value,
                formatter: (params: any) => {
                    if (!params?.value || params.percent < 5) return "";
                    return `{a|${params.value}}\n{b|${params.percent}%}`;
                },
                rich: {
                    a: {
                        color: "#fff",
                        fontSize: 14,
                        lineHeight: 20,
                        textShadowColor: "rgba(0, 0, 0, 0.5)",
                        textShadowBlur: 2,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1,
                    },
                    b: {
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "500",
                        lineHeight: 16,
                        textShadowColor: "rgba(0, 0, 0, 0.5)",
                        textShadowBlur: 2,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1,
                    },
                },
                position: "inside",
                textStyle: {
                    textBorderColor: "rgba(0, 0, 0, 0.3)",
                    textBorderWidth: 1,
                },
            },
            itemStyle: {
                borderColor: "transparent",
                borderWidth: 2,
                shadowColor: "rgba(0, 0, 0, 0.2)",
                color: (params: any) => {
                    return predefinedColors[
                        params.dataIndex % predefinedColors.length
                    ];
                },
            },
            labelLine: {
                show: false,
            },
            emphasis: {
                scaleSize: 7,
                itemStyle: {
                    shadowBlur: 12,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                    shadowColor: "rgba(0, 0, 0, 0.3)",
                },
                label: {
                    fontSize: 18,
                },
            },
            data: resolvedData.value,
        },
    ],
}));
</script>

<template>
    <div
        :style="{
            width: props.width || '100%',
            height: props.height || '300px',
        }"
    >
        <VChart
            ref="vchartRef"
            :option="option"
            :theme="isDark ? 'dark' : 'light'"
            autoresize
        />
    </div>
</template>

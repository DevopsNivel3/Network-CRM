<script setup lang="ts">
import { APP_FONT_FAMILY } from "~/utils/design";

const props = defineProps<{
    width?: string;
    height?: string;
    data?: {
        value: number;
        name: string;
        itemStyle?: {
            color?: string;
        };
    }[];
    labels?: string[];
}>();
const { isDark } = useTheme();
const device = useDevice();

const predefinedColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#f97316",
    "#84cc16",
    "#ec4899",
    "#6366f1",
];

const vchartRef = ref();
defineExpose({
    getDataURL: (opts?: any) => vchartRef.value?.getDataURL?.(opts),
});

const activeLegend = ref<string[]>(props.data?.map((d) => d.name) || []);
watch(
    () => props.data,
    (val) => {
        activeLegend.value = val?.map((d) => d.name) || [];
    },
);

const funnelData = computed(() => {
    const filtered = (props.data || []).filter((item) =>
        activeLegend.value.includes(item.name),
    );
    const uniformValue = Array.from(
        { length: filtered.length },
        (_, i) => 100 - (i * 90) / Math.max(filtered.length - 1, 1),
    );

    return filtered.map((item, idx) => ({
        ...item,
        value: uniformValue[idx],
        realValue: item.value,
    }));
});

const calcPorcentagem = (params: any) => {
    const idx = funnelData.value.findIndex((d) => d.name === params.data.name);
    if (idx === 0) return "100%";
    const prev = funnelData.value[idx - 1]?.realValue || 1;
    const percent = ((params.data.realValue / prev) * 100).toFixed(1);
    return `${percent}%`;
};

const getItemColor = (dataIndex: number, item?: any) => {
    if (item?.itemStyle?.color) return item.itemStyle.color;
    return predefinedColors[dataIndex % predefinedColors.length];
};

const option = computed(() => ({
    backgroundColor: "transparent",
    textStyle: { fontFamily: APP_FONT_FAMILY },
    tooltip: {
        show: true,
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
          <span style="display:inline-block;margin-right:2px;border-radius:20%;width:10px;height:10px;background-color:${
              params.color
          };"></span>
          <span>${params.name}: ${params.data.realValue} (${calcPorcentagem(params)})</span>
        </div>
      `;
        },
    },
    legend: {
        show: false,
    },
    series: [
        {
            name: "Nome",
            type: "funnel",
            left: "center",
            top: device.isMobile ? 12 : 8,
            bottom: 8,
            width: device.isMobile ? "94%" : "62%",
            minSize: "20%",
            maxSize: "100%",
            gap: 10,
            funnelAlign: "center",
            sort: "none",
            label: {
                show: device.isMobile ? false : true,
                position: "left",
                fontSize: 13,
                fontWeight: 500,
                color: isDark.value ? "#fff" : "#222",
                formatter: (params: any) => params.data.name,
                distance: 10,
            },
            labelLine: { show: device.isMobile ? false : true },
            itemStyle: {
                borderColor: "transparent",
                borderWidth: 0,
                color: (params: any) =>
                    getItemColor(
                        params.dataIndex,
                        funnelData.value[params.dataIndex],
                    ),
            },
            data: funnelData.value,
            z: 2,
        },
        {
            name: "Quantidade",
            type: "funnel",
            left: "center",
            top: device.isMobile ? 12 : 8,
            bottom: 8,
            width: device.isMobile ? "94%" : "62%",
            minSize: "20%",
            maxSize: "100%",
            gap: 10,
            sort: "none",
            label: {
                show: true,
                position: "inside",
                fontSize: 14,
                fontWeight: device.isMobile ? "500" : "700",
                formatter: (params: any) =>
                    device.isMobile
                        ? `${params.data.name}\n${params.data.realValue}\n${calcPorcentagem(params)}`
                        : (params.data.realValue ?? 0),
            },
            labelLine: { show: false },
            itemStyle: {
                color: "transparent",
                borderColor: "transparent",
                borderWidth: 0,
            },
            data: funnelData.value,
            z: 3,
        },
        {
            name: "Porcentagem",
            type: "funnel",
            left: "center",
            top: device.isMobile ? 12 : 8,
            bottom: 8,
            width: device.isMobile ? "94%" : "62%",
            minSize: "20%",
            maxSize: "100%",
            gap: 10,
            sort: "none",
            label: {
                show: device.isMobile ? false : true,
                position: "right",
                fontSize: 13,
                fontWeight: 500,
                color: isDark.value ? "#fff" : "#222",
                formatter: (params: any) => {
                    return calcPorcentagem(params);
                },
                distance: 12,
            },
            labelLine: { show: device.isMobile ? false : true },
            itemStyle: {
                borderColor: "transparent",
                borderWidth: 0,
                color: (params: any) =>
                    getItemColor(
                        params.dataIndex,
                        funnelData.value[params.dataIndex],
                    ),
            },
            data: funnelData.value,
            z: 1,
        },
    ],
}));

function toggleLegend(name: string) {
    const index = activeLegend.value.indexOf(name);
    if (index === -1) activeLegend.value.push(name);
    else activeLegend.value.splice(index, 1);
}
</script>

<template>
    <div
        :style="{
            width: props.width || '100%',
            height: props.height || '100%',
        }"
    >
        <div
            class="flex flex-wrap gap-x-3 gap-y-2 justify-center items-start mb-2"
            v-if="props.data && props.data.length > 0"
        >
            <span
                v-for="(item, index) in props.data"
                :key="item.name"
                @click="toggleLegend(item.name)"
                class="cursor-pointer !text-sm select-none flex items-center justify-center gap-1 transition-all whitespace-normal break-words text-center leading-tight max-w-[180px]"
                :style="{
                    opacity: activeLegend.includes(item.name) ? 1 : 0.5,
                }"
            >
                <span
                    class="inline-block w-[10px] h-[10px] rounded-sm mr-1"
                    :style="{
                        background: getItemColor(index, item),
                    }"
                />
                {{ item.name }}
            </span>
        </div>
        <VChart
            ref="vchartRef"
            :option="option"
            :theme="isDark ? 'dark' : 'light'"
            autoresize
        />
    </div>
</template>

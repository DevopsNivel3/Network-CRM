<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";

const oportunidades = useOportunidades();

interface OportunidadeOption {
    label: string;
    value: string | number;
}

const props = defineProps<{
    label?: string;
    value?: string | number;
    placeholder?: string;
    options?: OportunidadeOption[];
    haveAll?: boolean;
    largeSelect?: boolean;
    showLabel?: boolean;
}>();
const localValue = computed({
    get: () => props.value,
    set: (value: any) => emit("change", value),
});

const emit = defineEmits<{
    change: [value: string | number];
}>();

const statusOptions = computed(() => {
    const options: OportunidadeOption[] = [];
    if (props.haveAll) options.push({ label: "Todos", value: "all" });
    if (props.options) options.push(...props.options);
    options.push(...oportunidades.getStatusOptions);
    return options;
});
</script>

<template>
    <div class="flex flex-col w-full gap-2">
        <span
            v-if="props.showLabel"
            class="text-xs text-black/80 dark:text-white/80"
        >
            {{ props.label ?? "Status" }}
        </span>
        <ElSelectV2
            :placeholder="props.placeholder || 'Selecione um status'"
            :size="props.largeSelect ? 'large' : 'default'"
            @change="(value) => emit('change', value)"
            :loading="oportunidades.boards.isLoading"
            :options="statusOptions"
            v-model="localValue"
        >
            <template #default="{ item }">
                <div class="flex items-center justify-between relative">
                    <span class="truncate mr-2">{{ item.label }}</span>
                </div>
            </template>
            <template #loading>
                <div class="flex items-center justify-center h-full w-full">
                    <ElIcon class="is-loading" color="var(--el-color-primary)">
                        <Loading />
                    </ElIcon>
                </div>
            </template>
        </ElSelectV2>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    label?: string;
    value?: number[] | null;
    showLabel?: boolean;
}>();

const emit = defineEmits<{
    change: [value: number[]];
}>();

const leadGroups = useLeadGroups();

const localValue = computed({
    get: () => props.value || [],
    set: (value: number[]) => emit("change", value || []),
});

onMounted(async () => {
    if (!leadGroups.data?.data?.length) await leadGroups.findAll();
});
</script>

<template>
    <div class="flex flex-col w-full gap-2">
        <span
            v-if="props.showLabel !== false"
            class="text-xs text-black/80 dark:text-white/80"
        >
            {{ props.label ?? "Grupos" }}
        </span>
        <ElSelectV2
            v-model="localValue"
            :options="leadGroups.formattedOptions"
            :loading="leadGroups.isLoading"
            placeholder="Selecione grupos"
            class="flex-1"
            filterable
            multiple
            clearable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
        />
    </div>
</template>

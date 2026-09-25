<script setup lang="ts">
import { OfficeBuilding, InfoFilled } from "@element-plus/icons-vue";

interface LeadGroupData {
    id: number;
    nome: string;
    descricao: string | null;
}

const props = defineProps<{
    group: LeadGroupData | null;
}>();
</script>

<template>
    <ElScrollbar class="!h-full !w-full">
        <div class="p-4 flex flex-col gap-2">
            <div class="w-full space-y-1">
                <h3>Nome</h3>
                <div
                    class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                    :class="{ 'py-3': !props.group?.nome }"
                >
                    <ElIcon>
                        <OfficeBuilding />
                    </ElIcon>
                    {{ props.group?.nome || "-" }}
                </div>
            </div>
            <div class="w-full space-y-1">
                <h3>Descrição</h3>
                <div
                    class="flex items-start gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded min-h-[42px]"
                    :class="{ 'py-3': !props.group?.descricao }"
                >
                    <ElIcon class="mt-[2px]">
                        <InfoFilled />
                    </ElIcon>
                    <span class="whitespace-pre-wrap break-words">
                        {{ props.group?.descricao || "-" }}
                    </span>
                </div>
            </div>
        </div>
    </ElScrollbar>
</template>

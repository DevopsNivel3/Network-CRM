<script setup lang="ts">
import { ChatLineSquare } from "@element-plus/icons-vue";

defineProps<{
    motivo: {
        motivo: string;
        motivo_observacao?: string | null;
        criado?: string | Date;
    };
    grupo?: string | null;
}>();
</script>

<template>
    <ElTooltip
        :content="motivo.motivo_observacao || `Motivo: ${motivo.motivo}`"
        placement="top-start"
        effect="light"
        :show-after="250"
    >
        <div
            class="mt-2 flex min-w-0 items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
        >
            <ElIcon class="mt-0.5 shrink-0" :size="14">
                <ChatLineSquare />
            </ElIcon>
            <div class="min-w-0">
                <p class="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                    {{ grupo || "Motivo nesta etapa" }}
                </p>
                <p class="truncate text-xs font-semibold" :title="motivo.motivo">
                    {{ motivo.motivo }}
                </p>
                <p
                    v-if="motivo.motivo_observacao"
                    class="mt-0.5 line-clamp-2 text-[11px] leading-4 opacity-75"
                >
                    {{ motivo.motivo_observacao }}
                </p>
            </div>
        </div>
    </ElTooltip>
</template>

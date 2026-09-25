<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
    boardId: number | null;
    previousBoardId: number | null;
}>();
const emit = defineEmits<{
    (event: "update:modelValue", value: boolean): void;
    (event: "confirm", value: { motivo: string; motivo_observacao: string | null }): void;
    (event: "cancel"): void;
}>();
const motivo = ref<string | null>(null);
const observacao = ref<string | null>(null);
const fields = ref<any>(null);
const settled = ref(false);
const oportunidades = useOportunidades();
const board = computed(() => oportunidades.boards.data?.find((item) => item.id === props.boardId));

const cancel = () => {
    if (settled.value) return;
    settled.value = true;
    emit("update:modelValue", false);
    emit("cancel");
};
const confirm = () => {
    if (!fields.value?.validate() || !motivo.value) return;
    settled.value = true;
    emit("confirm", { motivo: motivo.value, motivo_observacao: observacao.value });
    emit("update:modelValue", false);
};
watch(() => props.modelValue, (open) => {
    if (open) {
        settled.value = false;
        motivo.value = null;
        observacao.value = null;
    }
});
</script>

<template>
    <ElDialog :model-value="modelValue" class="!w-full md:!w-[460px]" :title="`Mover para ${board?.titulo || 'etapa'}`" :close-on-click-modal="false" @close="cancel">
        <p class="text-sm text-black/60 dark:text-white/60 mb-4">Esta etapa exige que o motivo da movimentação seja informado.</p>
        <OportunidadeBoardMoveReasonFields
            ref="fields"
            :board-id="boardId"
            :previous-board-id="previousBoardId"
            v-model:motivo="motivo"
            v-model:observacao="observacao"
        />
        <template #footer>
            <ElButton @click="cancel">Cancelar</ElButton>
            <ElButton type="primary" @click="confirm">Confirmar movimentação</ElButton>
        </template>
    </ElDialog>
</template>

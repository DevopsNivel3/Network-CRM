<script setup lang="ts">
const props = defineProps<{ boardId?: number | string | null; previousBoardId?: number | null }>();
const motivo = defineModel<string | null>("motivo", { default: null });
const observacao = defineModel<string | null>("observacao", { default: null });
const oportunidades = useOportunidades();
const board = computed(() => oportunidades.boards.data?.find((item) => item.id === Number(props.boardId)));
const required = computed(() => !!board.value?.exige_motivo && Number(props.boardId) !== props.previousBoardId);
const options = computed(() => getBoardReasonOptions(board.value));

watch(() => props.boardId, () => {
    motivo.value = null;
    observacao.value = null;
});

defineExpose({
    validate: () => !required.value || validateBoardReason(board.value, motivo.value, observacao.value),
});
</script>

<template>
    <template v-if="required">
        <ElFormItem :label="board?.grupo_motivos || `Motivo para ${board?.titulo}`" required class="w-full">
            <ElSelect v-model="motivo" placeholder="Selecione o motivo" class="w-full" size="large">
                <ElOption v-for="option in options" :key="option" :label="option" :value="option" />
            </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="board?.exigir_obs_outro && motivo?.toLowerCase() === 'outro'" label="Observação" required class="w-full">
            <ElInput v-model="observacao" type="textarea" maxlength="1000" show-word-limit placeholder="Descreva o outro motivo" />
        </ElFormItem>
    </template>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

const props = defineProps<{
    board_id: number | null;
    modelValue: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const oportunidades = useOportunidades();
const usuarios = useUsuarios();
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const formRef = ref<FormInstance | null>(null);
const formRules = reactive(FormCreateBoardRules);
const qualificacaoOptions: Array<{
    label: QualificacaoOportunidade;
    value: QualificacaoOportunidade;
}> = ["Prospecção", "Frio", "Morno", "Quente", "Fechado", "Cancelado", "Declinado"].map(
    (value) => ({ label: value as QualificacaoOportunidade, value: value as QualificacaoOportunidade }),
);
const formData = reactive<FormBoardCreate>({
    titulo: "",
    descricao: "",
    cor: getRandomColor(),
    posicao: 0,
    qualificacao: null,
    usuario_atribuido_id: null,
    controle_lembretes: true,
    exige_motivo: false,
    grupo_motivos: null,
    motivos: [],
    exigir_obs_outro: false,
});

watch(
    () => isOpen.value,
    async (isOpen) => {
        if (isOpen) {
            if (!usuarios.data.data?.length) await usuarios.findAll();
            const board = await oportunidades.getBoardFromState(props.board_id);
            if (board) {
                formData.titulo = board.titulo;
                formData.descricao = board.descricao;
                formData.cor = board.cor;
                formData.qualificacao = board.qualificacao ?? null;
                formData.controle_lembretes =
                    board.controle_lembretes ?? true;
                formData.exige_motivo = board.exige_motivo ?? false;
                formData.grupo_motivos = board.grupo_motivos ?? null;
                formData.motivos = Array.isArray(board.motivos)
                    ? [...board.motivos]
                    : [];
                formData.exigir_obs_outro = board.exigir_obs_outro ?? false;
                formData.usuario_atribuido_id =
                    board.usuario_atribuido_id ?? null;
            }
        }
    },
);

// Fecha o modal
const closeEditModal = () => {
    if (formRef.value) formRef.value.resetFields();
    isOpen.value = false;
};

// Envia os dados ao backend
const handleEdit = async () => {
    if (oportunidades.isSubmitting) return;

    try {
        await formRef.value?.validate();

        const boardId = props.board_id!;
        const isBoardEdited = await oportunidades.editBoard(boardId, formData);
        if (isBoardEdited) {
            ElMessage.success({
                message: "Board editado com sucesso!",
                plain: true,
            });

            closeEditModal();
        }
    } catch (err) {
        console.error(err);
    }
};
</script>

<template>
    <ElDialog
        v-model="isOpen"
        class="!w-full md:!w-[520px]"
        title="Edição de Board"
        @close="closeEditModal"
        destroy-on-close
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader title="Edição de Board" @close="closeEditModal" />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
            <!-- Titulo -->
            <ElFormItem label="Titulo" prop="titulo" class="w-full">
                <ElInput
                    :disabled="oportunidades.isSubmitting"
                    placeholder="Digite o titulo"
                    :maxlength="maxLengthText"
                    v-model="formData.titulo"
                    size="large"
                    type="text"
                    clearable
                />
            </ElFormItem>
            <!-- Descrição -->
            <ElFormItem label="Descrição" prop="descricao" class="w-full">
                <ElInput
                    :disabled="oportunidades.isSubmitting"
                    placeholder="Escreva uma observação"
                    v-model="formData.descricao"
                    :maxlength="maxLengthText"
                    type="textarea"
                    show-word-limit
                />
            </ElFormItem>
            <ElFormItem
                label="Qualificação da oportunidade"
                prop="qualificacao"
                class="w-full"
                required
            >
                <ElSelect
                    v-model="formData.qualificacao"
                    :disabled="oportunidades.isSubmitting"
                    placeholder="Selecione uma qualificação"
                    size="large"
                    class="w-full"
                >
                    <ElOption
                        v-for="option in qualificacaoOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                    />
                </ElSelect>
            </ElFormItem>
            <!-- Cor -->
            <ElFormItem label="Cor" prop="cor" class="w-full">
                <ElColorPickerPanel
                    class="!w-full"
                    :disabled="oportunidades.isSubmitting"
                    v-model="formData.cor"
                />
            </ElFormItem>
            <ElFormItem label="Atribuir a um usuário" class="w-full">
                <ElSelect
                    v-model="formData.usuario_atribuido_id"
                    :disabled="oportunidades.isSubmitting || usuarios.isLoading"
                    placeholder="Selecione um usuário"
                    size="large"
                    clearable
                    filterable
                    class="w-full"
                >
                    <ElOption
                        v-for="usuario in usuarios.formattedOptions"
                        :key="usuario.value"
                        :label="usuario.label"
                        :value="usuario.value"
                    />
                </ElSelect>
            </ElFormItem>
            <ElFormItem label="Gerar lembretes automáticos" class="w-full">
                <ElSwitch
                    v-model="formData.controle_lembretes"
                    :disabled="oportunidades.isSubmitting"
                    inline-prompt
                    active-text="Sim"
                    inactive-text="Não"
                />
                <p class="text-xs text-black/60 dark:text-white/60 mt-2">
                    Quando desligado, as oportunidades desta board deixam de
                    gerar lembretes automáticos e os lembretes atuais sao
                    removidos.
                </p>
            </ElFormItem>
            <OportunidadeBoardReasonsConfig
                v-model:exige-motivo="formData.exige_motivo"
                v-model:grupo-motivos="formData.grupo_motivos"
                v-model:motivos="formData.motivos"
                v-model:exigir-obs-outro="formData.exigir_obs_outro"
            />
        </ElForm>
        <template #footer>
            <ElButton @click="closeEditModal">Cancelar</ElButton>
            <ElButton
                :disabled="oportunidades.isSubmitting"
                @click="handleEdit"
                type="primary"
                :icon="Check"
            >
                Salvar
            </ElButton>
        </template>
    </ElDialog>
</template>

<style scoped>
.el-color-svpanel {
    width: 95% !important;
}
</style>

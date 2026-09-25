<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

const oportunidades = useOportunidades();
const props = defineProps<{
    modelValue: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

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
    controle_lembretes: true,
    exige_motivo: false,
    grupo_motivos: null,
    motivos: [],
    exigir_obs_outro: false,
});

// Fecha o modal
const closeCreateModal = () => {
    if (formRef.value) formRef.value.resetFields();
    isOpen.value = false;
};

// Envia os dados ao backend
const handleCreate = async () => {
    if (oportunidades.isSubmitting) return;

    try {
        await formRef.value?.validate();

        const isBoardCreated = await oportunidades.createBoard(formData);
        if (isBoardCreated) {
            ElMessage.success({
                message: "Board criado com sucesso!",
                plain: true,
            });

            closeCreateModal();
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
        title="Criação de Board"
        @close="closeCreateModal"
        destroy-on-close
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Criação de Board"
                @close="closeCreateModal"
            />
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
            <ElFormItem label="Gerar lembretes automáticos" class="w-full">
                <ElSwitch
                    v-model="formData.controle_lembretes"
                    :disabled="oportunidades.isSubmitting"
                    inline-prompt
                    active-text="Sim"
                    inactive-text="Não"
                />
                <p class="text-xs text-black/60 dark:text-white/60 mt-2">
                    Quando desligado, nenhuma oportunidade desta board gera
                    lembretes automáticos.
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
            <ElButton @click="closeCreateModal">Cancelar</ElButton>
            <ElButton
                :disabled="oportunidades.isSubmitting"
                @click="handleCreate"
                type="primary"
                :icon="Plus"
            >
                Criar
            </ElButton>
        </template>
    </ElDialog>
</template>

<style scoped>
.el-color-svpanel {
    width: 95% !important;
}
</style>

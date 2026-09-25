<script setup lang="ts">
import { Wallet, Check, Plus, Close } from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

const oportunidades = useOportunidades();
const oportunidade = useOportunidade();
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
const reasonFields = ref<any>(null);
const formRules = reactive(FormUpdateOportunidadeRules);
const formData = reactive<FormOportunidadeCreate>({
    tipo: null,
    faixa_valor: "Baixo",
    valor_estimado: null,
    board_id: undefined,
    num_pdvs: 0,
    num_lojas: 0,
    infraestrutura: null,
    descricao: null,
    observacoes: null,
    lead_id: null,
    controle_lembretes: true,
    motivo: null,
    motivo_observacao: null,
});

// Fecha o modal
const closeEditModal = () => {
    handleReset();
    isOpen.value = false;
};

const ensureBoardsLoaded = async () => {
    if (oportunidades.boards.isLoading) return;
    if (oportunidades.boards.data?.length) return;
    await oportunidades.findAllBoards();
};

// Envia os dados ao backend
const handleEdit = async () => {
    if (!oportunidade.data || oportunidade.isSubmitting) return;

    try {
        await formRef.value?.validate();
        if (reasonFields.value && !reasonFields.value.validate()) return;

        ElMessageBox.confirm(
            `Deseja editar as informações da Oportunidade #${oportunidade.data?.id} ${oportunidade.data?.lead?.nome_lead}?`,
            "Atenção",
            {
                confirmButtonText: "Sim, editar!",
                cancelButtonText: "Cancelar",
                type: "info",
            },
        ).then(async () => {
            const oportunidadeId = oportunidade.data!.id;
            const isOportunidadeEdited = await oportunidade.updateById(
                oportunidadeId,
                formData,
            );

            if (isOportunidadeEdited) {
                ElMessage.success({
                    message: "Oportunidade editada com sucesso!",
                    plain: true,
                });

                oportunidades.updateOportunidadeFromState(oportunidadeId, {
                    tipo: formData.tipo as string,
                    board_id: formData.board_id as number,
                    descricao: formData.descricao as string,
                    atualizado: new Date().toString(),
                });

                closeEditModal();
            }
        });
    } catch (err) {
        console.error(err);
    }
};

// Handle de reset do Form
const handleReset = () => {
    if (formRef.value) formRef.value?.resetFields();
    resetFormData(oportunidade.data);
};

// Para resetar os dados do form
const resetFormData = (data: any) => {
    if (!data) return;

    Object.assign(formData, {
        tipo: data.tipo,
        faixa_valor: data.faixa_valor ?? "Baixo",
        valor_estimado: data.valor_estimado,
        board_id: data.board_id,
        num_pdvs: data.num_pdvs ?? 0,
        num_lojas: data.num_lojas ?? 0,
        infraestrutura: data.infraestrutura,
        descricao: data.descricao,
        observacoes: data.observacoes,
        lead_id: data.lead_id,
        controle_lembretes: data.controle_lembretes ?? true,
        motivo: null,
        motivo_observacao: null,
    });
};

// Options do faixa_valor
const faixaValorOptions = [
    {
        label: "Baixo",
        value: "Baixo",
    },
    {
        label: "Médio",
        value: "Médio",
    },
    {
        label: "Alto",
        value: "Alto",
    },
];

// Observa as mudanças na oportunidade
watch(
    () => oportunidade.data,
    (newOportunidadeData) => {
        if (newOportunidadeData) resetFormData(newOportunidadeData);
    },
    { immediate: true },
);

watch(
    () => isOpen.value,
    async (open) => {
        if (!open) return;
        await ensureBoardsLoaded();
    },
    { immediate: true },
);
</script>

<template>
    <ElDialog
        v-model="isOpen"
        class="!w-full md:!w-[600px]"
        title="Editando Oportunidade"
        @close="closeEditModal"
        destroy-on-close
        :z-index="1505"
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Editando Oportunidade"
                @close="closeEditModal"
            />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
            <ElCollapse class="!border-none">
                <div class="md:flex w-full items-center gap-4">
                    <!-- Tipo -->
                    <ElFormItem
                        label="Tipo de Serviço"
                        prop="tipo"
                        class="w-full"
                    >
                        <ElInput
                            :disabled="oportunidade.isSubmitting"
                            placeholder="Digite o serviço"
                            :maxlength="maxLengthText"
                            v-model="formData.tipo"
                            size="large"
                            type="text"
                            clearable
                        />
                    </ElFormItem>
                    <!-- Status -->
                    <ElFormItem prop="board_id" label="Status" class="w-full">
                        <FilterStatusOportunidade
                            @change="(value) => (formData.board_id = value)"
                            :value="formData.board_id"
                            placeholder="Selecione"
                            :showLabel="false"
                            largeSelect
                        />
                    </ElFormItem>
                    <ElFormItem
                        label="Gerar Lembretes"
                        prop="controle_lembretes"
                    >
                        <ElSwitch
                            v-model="formData.controle_lembretes"
                            :disabled="oportunidade.isSubmitting"
                            inline-prompt
                            active-text="Sim"
                            inactive-text="Não"
                        />
                    </ElFormItem>
                </div>
                <OportunidadeBoardMoveReasonFields
                    ref="reasonFields"
                    :board-id="formData.board_id"
                    :previous-board-id="oportunidade.data?.board_id ?? null"
                    v-model:motivo="formData.motivo"
                    v-model:observacao="formData.motivo_observacao"
                />
                <div class="w-full bg-black/15 dark:bg-white/15 h-[0.5px]" />
                <ElCollapseItem title="Valores">
                    <!-- Faixa de Valor -->
                    <ElFormItem
                        label="Faixa de Valor"
                        prop="faixa_valor"
                        class="w-full"
                    >
                        <ElSegmented
                            class="!w-full !uppercase !text-xs !font-medium !tracking-wide"
                            v-model="formData.faixa_valor"
                            :options="faixaValorOptions"
                            block
                        />
                    </ElFormItem>
                    <!-- Valor Estimado -->
                    <ElFormItem
                        label="Valor Estimado"
                        prop="valor_estimado"
                        class="w-full"
                    >
                        <ElInput
                            :disabled="oportunidade.isSubmitting"
                            v-model="formData.valor_estimado"
                            :maxlength="maxLengthText"
                            :formatter="formatNumber"
                            placeholder="000.000.000"
                            :prefix-icon="Wallet"
                            :parser="onlyNumber"
                            size="large"
                            type="text"
                            clearable
                        />
                    </ElFormItem>
                </ElCollapseItem>
                <ElCollapseItem title="Detalhes">
                    <div class="md:flex w-full items-center gap-4">
                        <!-- Número de Lojas -->
                        <ElFormItem
                            label="Nº de Lojas"
                            prop="num_lojas"
                            class="!w-full"
                        >
                            <ElInputNumber
                                :disabled="oportunidade.isSubmitting"
                                v-model="formData.num_lojas"
                                class="!w-full"
                                :max="9999999"
                                size="large"
                                :min="0"
                            />
                        </ElFormItem>
                        <!-- Número de PDVs -->
                        <ElFormItem
                            label="Nº de PDVs"
                            prop="num_pdvs"
                            class="!w-full"
                        >
                            <ElInputNumber
                                :disabled="oportunidade.isSubmitting"
                                v-model="formData.num_pdvs"
                                class="!w-full"
                                :max="9999999"
                                size="large"
                                :min="0"
                            />
                        </ElFormItem>
                    </div>
                    <!-- Infraestrutura -->
                    <ElFormItem
                        label="Infraestrutura"
                        prop="infraestrutura"
                        class="w-full"
                    >
                        <ElInput
                            placeholder="Escreva o tipo de infraestrutura"
                            :disabled="oportunidade.isSubmitting"
                            v-model="formData.infraestrutura"
                            :maxlength="maxLengthText"
                            size="large"
                        />
                    </ElFormItem>
                </ElCollapseItem>
                <!-- Descrição -->
                <ElFormItem
                    label="Descrição"
                    prop="descricao"
                    class="w-full mt-4"
                >
                    <ElInput
                        :disabled="oportunidade.isSubmitting"
                        placeholder="Escreva uma descrição"
                        v-model="formData.descricao"
                        :maxlength="maxLengthText"
                        size="large"
                    />
                </ElFormItem>
                <!-- Observação -->
                <ElFormItem
                    label="Observação"
                    prop="observacoes"
                    class="w-full"
                >
                    <ElInput
                        :disabled="oportunidade.isSubmitting"
                        placeholder="Escreva uma observação"
                        v-model="formData.observacoes"
                        :maxlength="maxLengthTextarea"
                        type="textarea"
                        show-word-limit
                    />
                </ElFormItem>
            </ElCollapse>
        </ElForm>
        <!-- Grupo de botão do footer -->
        <template #footer>
            <ElButton @click="closeEditModal"> Cancelar </ElButton>
            <ElButton
                :disabled="oportunidade.isSubmitting"
                @click="handleReset"
            >
                Resetar
            </ElButton>
            <ElButton
                :disabled="oportunidade.isSubmitting"
                @click="handleEdit"
                type="primary"
                :icon="Check"
            >
                Salvar
            </ElButton>
        </template>
    </ElDialog>
</template>

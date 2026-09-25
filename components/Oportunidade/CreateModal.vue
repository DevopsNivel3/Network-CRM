<script setup lang="ts">
import { Wallet, Plus } from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

const oportunidades = useOportunidades();
const oportunidade = useOportunidade();
const lead = useLead();
const props = defineProps<{
    modelValue: boolean;
    leadId?: number | null;
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
const formRules = reactive(FormCreateOportunidadeRules);
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
const closeCreateModal = () => {
    if (formRef.value) formRef.value.resetFields();
    isOpen.value = false;
};

watch(
    () => isOpen.value,
    async (open) => {
        if (!open) return;
        if (props.leadId) formData.lead_id = props.leadId;
        if (!oportunidades.boards.data?.length) await oportunidades.findAllBoards();
    },
);

// Envia os dados ao backend
const handleCreate = async () => {
    if (oportunidade.isSubmitting) return;

    try {
        await formRef.value?.validate();
        if (reasonFields.value && !reasonFields.value.validate()) return;

        const createdOportunidade = await oportunidade.create(formData);
        if (createdOportunidade) {
            ElMessage.success({
                message: "Oportunidade cadastrada com sucesso!",
                plain: true,
            });

            const targetLeadId = Number(
                formData.lead_id ?? props.leadId ?? createdOportunidade.lead_id,
            );

            if (lead.data?.id && lead.data.id === targetLeadId) {
                lead.addOportunidadeFromState({
                    id: createdOportunidade.id,
                    tipo: createdOportunidade.tipo,
                    descricao: createdOportunidade.descricao,
                    statusInt: createdOportunidade.statusInt,
                    board_id: createdOportunidade.board_id,
                    desativado: createdOportunidade.desativado,
                    criado: createdOportunidade.criado,
                    atualizado: createdOportunidade.atualizado,
                    usuario: createdOportunidade.usuario,
                });

                await lead.fetchOportunidades(lead.data.id, 1);
            }

            oportunidades.findAll();
            closeCreateModal();
        }
    } catch (err) {
        console.error(err);
    }
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
</script>

<template>
    <ElDialog
        v-model="isOpen"
        title="Cadastro de Oportunidade"
        class="!w-full md:!w-[600px]"
        @close="closeCreateModal"
        destroy-on-close
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Cadastro de Oportunidade"
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
            <ElCollapse class="!border-none">
                <!-- Select de oportunidade -->
                <div class="md:flex w-full items-end gap-4">
                    <ElFormItem
                        prop="lead_id"
                        label="Oportunidade"
                        class="w-full"
                        required
                    >
                        <FilterLead
                            @change="(value) => (formData.lead_id = value)"
                            :value="formData.lead_id"
                            :disabled="!!props.leadId"
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
                </div>
                <OportunidadeBoardMoveReasonFields
                    ref="reasonFields"
                    :board-id="formData.board_id"
                    :previous-board-id="null"
                    v-model:motivo="formData.motivo"
                    v-model:observacao="formData.motivo_observacao"
                />
                <div class="w-full bg-black/10 dark:bg-white/15 h-[0.5px]" />
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
        <template #footer>
            <ElButton @click="closeCreateModal">Cancelar</ElButton>
            <ElButton
                :disabled="oportunidade.isSubmitting"
                @click="handleCreate"
                type="primary"
                :icon="Plus"
            >
                Cadastrar
            </ElButton>
        </template>
    </ElDialog>
</template>

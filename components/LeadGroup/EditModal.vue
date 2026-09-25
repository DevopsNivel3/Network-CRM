<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

interface LeadGroupData {
    id: number;
    nome: string;
    descricao: string | null;
}

const props = defineProps<{
    modelValue: boolean;
    group: LeadGroupData | null;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    updated: [void];
}>();

const leadGroups = useLeadGroups();

const formRef = ref<FormInstance | null>(null);
const formData = reactive({
    nome: "",
    descricao: "",
});

const formRules = reactive({
    nome: [requiredRule("Nome")],
    descricao: [noWhitespaceRule("Descrição")],
});

const closeModal = () => emit("update:modelValue", false);

const setFormFromGroup = (group: LeadGroupData) => {
    formData.nome = group.nome || "";
    formData.descricao = group.descricao || "";
};

const resetForm = () => {
    if (formRef.value) formRef.value.resetFields();
    formData.nome = "";
    formData.descricao = "";
};

watch(
    () => props.modelValue,
    (open) => {
        if (open && props.group) setFormFromGroup(props.group);
        if (!open) resetForm();
    },
);

watch(
    () => props.group,
    (group) => {
        if (!group) return;
        if (props.modelValue) setFormFromGroup(group);
    },
    { immediate: true },
);

const handleSubmit = async () => {
    if (!props.group || leadGroups.isSubmitting) return;

    try {
        await formRef.value?.validate();

        const isUpdated = await leadGroups.update(props.group.id, {
            nome: formData.nome,
            descricao: formData.descricao || null,
        });

        if (isUpdated) {
            ElMessage.success({
                message: "Grupo atualizado com sucesso!",
                plain: true,
            });
            emit("updated");
            closeModal();
        }
    } catch (err) {
        console.error(err);
    }
};
</script>

<template>
    <ElDialog
        class="!w-full md:!w-[520px]"
        title="Editar grupo"
        :model-value="props.modelValue"
        @update:model-value="(value) => emit('update:modelValue', value)"
        @close="closeModal"
        destroy-on-close
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader title="Editar grupo" @close="closeModal" />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
            <ElFormItem label="Nome" prop="nome" class="w-full" required>
                <ElInput
                    v-model="formData.nome"
                    :disabled="leadGroups.isSubmitting"
                    :maxlength="maxLengthText"
                    placeholder="Digite o nome do grupo"
                    size="large"
                    clearable
                />
            </ElFormItem>
            <ElFormItem label="Descrição" prop="descricao" class="w-full">
                <ElInput
                    v-model="formData.descricao"
                    :disabled="leadGroups.isSubmitting"
                    :maxlength="maxLengthText"
                    placeholder="Descrição (opcional)"
                    size="large"
                    type="textarea"
                    :rows="3"
                    clearable
                />
            </ElFormItem>
        </ElForm>
        <template #footer>
            <ElButton @click="closeModal">Cancelar</ElButton>
            <ElButton
                type="primary"
                :loading="leadGroups.isSubmitting"
                @click="handleSubmit"
                :icon="Check"
            >
                Salvar
            </ElButton>
        </template>
    </ElDialog>
</template>

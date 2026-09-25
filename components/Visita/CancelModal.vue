<script setup lang="ts">
import type { FormInstance } from "element-plus";

const oportunidade = useOportunidade();
const visitas = useVisitas();
const visita = useVisita();
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
const formRules = reactive(FormCancelVisitaRules);
const formData = reactive<FormVisitaCreate>({
    motivo: null,
});

// Fecha o modal
const closeCancelModal = () => {
    if (formRef.value) formRef.value.resetFields();
    isOpen.value = false;
};

// Envia os dados para o backend
const handleCancel = async () => {
    if (visita.isSubmitting) return;

    try {
        await formRef.value?.validate();

        const visitaId = visita.data!.id;
        const isVisitaStatusCanceled = await visita.updateById(visitaId, {
            ...formData,
            data_fim: new Date().toISOString(),
            statusInt: 4, // Cancelado
        });

        if (isVisitaStatusCanceled) {
            ElMessage.success({
                message: "Visita cancelada com sucesso!",
                customClass: "!z-[2500]",
                plain: true,
            });

            visitas.updateStatusFromState(visitaId, 4);
            if (oportunidade.hasVisitas)
                oportunidade.updateVisitaFromState(visitaId, { statusInt: 4 });

            closeCancelModal();
        }
    } catch (err) {
        console.error(err);
    }
};
</script>

<template>
    <ElDialog
        v-model="isOpen"
        class="!w-full md:!w-[400px]"
        @close="closeCancelModal"
        title="Cancelar Visita"
        destroy-on-close
        :z-index="1515"
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader title="Cancelar Visita" @close="closeCancelModal" />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
            <ElFormItem label="Informe o motivo" prop="motivo" class="w-full">
                <ElInput
                    placeholder="Escreva um motivo"
                    :disabled="visita.isSubmitting"
                    :maxlength="maxLengthTextarea"
                    v-model="formData.motivo"
                    show-word-limit
                    type="textarea"
                />
            </ElFormItem>
        </ElForm>
        <template #footer>
            <ElButton @click="closeCancelModal">Fechar</ElButton>
            <ElButton
                :disabled="visita.isSubmitting"
                @click="handleCancel"
                type="primary"
            >
                Sim, cancelar!
            </ElButton>
        </template>
    </ElDialog>
</template>

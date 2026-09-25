<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { Lock } from "@element-plus/icons-vue";

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
const usuario = useUsuario();

const formRef = ref<FormInstance | null>(null);
const formData = reactive<FormChangePassword>({
    senha: null,
    novaSenha: null,
    checkNovaSenha: null,
});

// Validação de senha
const passwordPattern =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-]).{6,}$/;
const formRules = reactive<FormRules<FormChangePassword>>({
    senha: [
        {
            required: true,
            message: "O campo Senha é obrigatório",
            trigger: "change",
        },
        {
            min: 6,
            message: "A senha precisa ter no mínimo 6 caracteres",
            trigger: "change",
        },
        { validator: validatorActualPassword, trigger: "change" },
    ],
    novaSenha: [
        {
            required: true,
            message: "O campo Nova Senha é obrigatório",
            trigger: "change",
        },
        {
            pattern: passwordPattern,
            message:
                "Deve incluir uma letra maiúscula, um número e caractere especial",
            trigger: "change",
        },
    ],
    checkNovaSenha: [
        {
            required: true,
            message: "O campo Confirmação de Senha é obrigatório",
            trigger: "change",
        },
        { validator: validatorCheckPassword, trigger: "change" },
    ],
});

// Validação de senha atual
function validatorActualPassword(_: any, value: string, callback: Function) {
    value && formData.checkNovaSenha && value.length === 0
        ? callback(new Error("As senhas não são iguais"))
        : callback();
}

// Validação de senha confirmada
function validatorCheckPassword(_: any, value: string, callback: Function) {
    value !== formData.novaSenha
        ? callback(new Error("As senhas não são iguais"))
        : callback();
}

// Envia os dados ao backend
const handleSubmit = async () => {
    try {
        await formRef.value?.validate();
        const res = await usuario.changePassword(formData);

        if (res) {
            ElMessage.success({
                message: "Senha alterada com sucesso!",
                customClass: "!z-[2500]",
                type: "success",
                plain: true,
            });
            closeDialog();
        }
    } catch (err) {
        console.error(err);
    }
};

// Fecha o modal
const closeDialog = () => {
    if (formRef) formRef.value?.resetFields();
    isOpen.value = false;
};
</script>

<template>
    <ElDialog
        v-model="isOpen"
        title="Alterar Senha de Acesso"
        class="!w-full md:!w-[400px]"
        @close="closeDialog"
        destroy-on-close
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Alterar Senha de Acesso"
                @close="closeDialog"
            />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
            <!-- Input da senha atual -->
            <ElFormItem label="Senha Atual" prop="senha" required>
                <ElInput
                    placeholder="Digite a senha atual"
                    :disabled="usuario.isSubmitting"
                    v-model="formData.senha"
                    :prefix-icon="Lock"
                    type="password"
                    size="large"
                    clearable
                />
            </ElFormItem>
            <!-- Input da senha nova -->
            <ElFormItem label="Nova Senha" prop="novaSenha" required>
                <ElInput
                    placeholder="Digite a nova senha"
                    :disabled="usuario.isSubmitting"
                    v-model="formData.novaSenha"
                    :prefix-icon="Lock"
                    type="password"
                    size="large"
                    clearable
                />
            </ElFormItem>
            <!-- Input de confirmação senha nova -->
            <ElFormItem prop="checkNovaSenha">
                <ElInput
                    placeholder="Repita a senha nova"
                    v-model="formData.checkNovaSenha"
                    :disabled="usuario.isSubmitting"
                    :prefix-icon="Lock"
                    type="password"
                    size="large"
                    clearable
                />
            </ElFormItem>
        </ElForm>
        <!-- Botões do modal -->
        <template #footer>
            <ElButton @click="closeDialog">Cancelar</ElButton>
            <ElButton
                :disabled="usuario.isSubmitting"
                @click="handleSubmit"
                type="primary"
            >
                Salvar
            </ElButton>
        </template>
    </ElDialog>
</template>

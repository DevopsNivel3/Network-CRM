<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { Lock } from "@element-plus/icons-vue";
const dialog = useDialog();
const user = useUsuario();

const formRef = ref<FormInstance | null>(null);
const formData = reactive<FormChangePassword>({
  senha: null,
  novaSenha: null,
  checkNovaSenha: null,
});

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-]).{6,}$/;

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
      message: "Deve incluir uma letra maiúscula, um número e caractere especial",
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

function validatorActualPassword(_: any, value: string, callback: Function) {
  value && formData.checkNovaSenha && value.length === 0
    ? callback(new Error("As senhas não são iguais"))
    : callback();
}

function validatorCheckPassword(_: any, value: string, callback: Function) {
  value !== formData.novaSenha ? callback(new Error("As senhas não são iguais")) : callback();
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    const res = await user.changePassword(formData);

    if (res) {
      ElMessage.success({
        type: "success",
        message: "Senha alterada com sucesso!",
        customClass: "!z-[2500]",
        plain: true,
      });
      closeDialog();
    }
  } catch (err) {
    console.error(err);
  }
};

const closeDialog = () => {
  if (formRef) formRef.value?.resetFields();
  dialog.close("change_password");
};
</script>

<template>
  <ElDialog
    v-model="dialog.change_password"
    title="Alterar Senha de Acesso"
    class="!w-full md:!w-[400px]"
    @close="closeDialog"
    destroy-on-close
    align-center
  >
    <ElForm
      label-position="top"
      label-width="auto"
      :rules="formRules"
      :model="formData"
      ref="formRef"
    >
      <ElFormItem label="Senha Atual" prop="senha" required>
        <ElInput
          placeholder="Digite a senha atual"
          :disabled="user.isSubmitting"
          v-model="formData.senha"
          :prefix-icon="Lock"
          type="password"
          size="large"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="Nova Senha" prop="novaSenha" required>
        <ElInput
          placeholder="Digite a nova senha"
          :disabled="user.isSubmitting"
          v-model="formData.novaSenha"
          :prefix-icon="Lock"
          type="password"
          size="large"
          clearable
        />
      </ElFormItem>
      <ElFormItem prop="checkNovaSenha">
        <ElInput
          placeholder="Repita a senha nova"
          v-model="formData.checkNovaSenha"
          :disabled="user.isSubmitting"
          :prefix-icon="Lock"
          type="password"
          size="large"
          clearable
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="closeDialog">Cancelar</ElButton>
      <ElButton :disabled="user.isSubmitting" @click="handleSubmit" type="primary">
        Salvar
      </ElButton>
    </template>
  </ElDialog>
</template>

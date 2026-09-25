<script setup lang="ts">
import {
  Postcard,
  Plus,
  Suitcase,
  Cellphone,
  Refresh,
  Lock,
} from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

const empresas = useEmpresas();
const empresa = useEmpresa();
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
const formRules = reactive(FormCreateEmpresaRules);
const formData = reactive<FormEmpresaCreate>({
  nome: null,
  grupo: null,
  contato: null,
  email: null,
  senha: null,
  modulos: [...allPermissionModules],
  permissoes: [UserPermissions.ADMIN],
});
const moduleOptions = getPermissionModuleOptions();
const grupoOptions = empresaGrupoOptions;

const syncPermissionsWithModules = () => {
  formData.permissoes = filterPermissionKeysByModules(
    formData.permissoes || [],
    formData.modulos as any,
  );
};

watch(
  () => formData.modulos,
  () => syncPermissionsWithModules(),
  { deep: true },
);

// Handle de reset do Form
const handleReset = () => {
  if (formRef) formRef.value?.resetFields();
};

// Fecha o modal
const closeCreateModal = () => {
  handleReset();
  isOpen.value = false;
};

const handleSubmit = async () => {
  if (empresa.isSubmitting) return;

  try {
    await formRef.value?.validate();

    const isEmpresaCreated = await empresa.create(formData);
    if (isEmpresaCreated) {
      ElMessage.success({
        message: "Empresa cadastrada com sucesso!",
        plain: true,
      });

      empresas.findAll();
      closeCreateModal();
    }
  } catch (err) {
    console.error(err);
  }
};

// Função para gerar senha aleatória
const generateUsuarioPassword = () => (formData.senha = randomPassword(10));
</script>

<template>
  <ElDialog
    v-model="isOpen"
    class="!w-full md:!w-[600px]"
    title="Cadastro de Empresa"
    @close="closeCreateModal"
    destroy-on-close
    :show-close="false"
    align-center
  >
    <template #header>
      <UIDialogHeader title="Cadastro de Empresa" @close="closeCreateModal" />
    </template>
    <ElForm
      label-position="top"
      label-width="auto"
      :rules="formRules"
      :model="formData"
      ref="formRef"
    >
      <div class="md:flex w-full items-center gap-4">
        <!-- Nome -->
        <ElFormItem label="Nome" prop="nome" class="w-full" required>
          <ElInput
            :disabled="empresa.isSubmitting"
            :maxlength="maxLengthText"
            placeholder="Digite o nome"
            v-model="formData.nome"
            :prefix-icon="Suitcase"
            size="large"
            type="text"
            clearable
          />
        </ElFormItem>
        <!-- Telefone para contato -->
        <ElFormItem
          label="Telefone para Contato"
          prop="contato"
          class="w-full"
          required
        >
          <ElInput
            :disabled="empresa.isSubmitting"
            v-model="formData.contato"
            :maxlength="maxLengthPhone"
            placeholder="00 0000-0000"
            :prefix-icon="Cellphone"
            :formatter="formatPhone"
            :parser="onlyNumber"
            size="large"
            type="text"
            clearable
          />
        </ElFormItem>
      </div>
      <ElFormItem label="Empresa do Grupo" prop="grupo" class="w-full">
        <ElSelect
          v-model="formData.grupo"
          :disabled="empresa.isSubmitting"
          placeholder="Selecione o grupo"
          size="large"
          class="!w-full"
          clearable
        >
          <ElOption
            v-for="option in grupoOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <!-- E-mail -->
      <ElFormItem label="E-mail" prop="email" class="w-full" required>
        <ElInput
          placeholder="exemplo@email.com"
          :disabled="empresa.isSubmitting"
          :maxlength="maxLengthText"
          v-model="formData.email"
          :prefix-icon="Postcard"
          size="large"
          type="text"
          clearable
        />
      </ElFormItem>
      <div class="md:flex w-full items-center text-wrap md:text-nowrap gap-4">
        <!-- Senha -->
        <ElFormItem label="Senha" prop="senha" class="w-full" required>
          <ElInput
            :disabled="empresa.isSubmitting"
            :maxlength="maxLengthText"
            v-model="formData.senha"
            placeholder="*******"
            :prefix-icon="Lock"
            size="large"
            type="text"
            clearable
          >
            <template #append>
              <ElButton
                @click="generateUsuarioPassword"
                class="!text-blue-400"
                :icon="Refresh"
                size="small"
              />
            </template>
          </ElInput>
        </ElFormItem>
      </div>
      <!-- Módulos -->
      <ElFormItem class="!w-full !h-full" label="Módulos" prop="modulos">
        <ElSelect
          v-model="formData.modulos"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="Selecione os módulos"
          size="large"
          class="!w-full"
        >
          <ElOption
            v-for="option in moduleOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <!-- Permissões -->
      <ElFormItem class="!w-full !h-full" label="Permissões" prop="permissoes">
        <UITreeSelect
          v-model="formData.permissoes as number[]"
          :allowed-modules="formData.modulos as any"
        />
      </ElFormItem>
    </ElForm>
    <!-- Grupo de botão do footer -->
    <template #footer>
      <ElButton @click="closeCreateModal">Cancelar</ElButton>
      <ElButton
        :disabled="empresa.isSubmitting"
        @click="handleSubmit"
        type="primary"
        :icon="Plus"
      >
        Cadastrar
      </ElButton>
    </template>
  </ElDialog>
</template>

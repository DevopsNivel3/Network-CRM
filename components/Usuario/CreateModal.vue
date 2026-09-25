<script setup lang="ts">
import type {
  UploadInstance,
  FormInstance,
  UploadProps,
  UploadRawFile,
} from "element-plus";
import {
  User,
  Postcard,
  Plus,
  Lock,
  Refresh,
  Cellphone,
  UploadFilled,
  InfoFilled,
  Setting,
  ArrowRightBold,
  ArrowLeftBold,
} from "@element-plus/icons-vue";
import { genFileId } from "element-plus";

const { handleFileInput, files } = useFileStorage();
const usuarios = useUsuarios();
const usuario = useUsuario();
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
const { user: userAuth } = useAuthSession();
const allowedModules = computed(() =>
  normalizePermissionModules(userAuth.empresa_modulos as any),
);

const activeStep = ref<number>(0);
const uploadRef = ref<UploadInstance>();
const formRef = ref<FormInstance | null>(null);
const formRules = reactive(FormCreateUsuarioRules);
const formData = reactive<FormUsuarioCreate>({
  nome: null,
  cpf: null,
  contato: null,
  email: null,
  senha: null,
  image: null,
  permissoes: [],
});

// Fecha o modal
const closeCreateModal = () => {
  handleReset();
  activeStep.value = 0;
  isOpen.value = false;
};

// Função para enviar os dados ao backend
const handleCreate = async () => {
  if (usuario.isSubmitting) return;

  try {
    await formRef.value?.validate();

    const isUsuarioCreated = await usuario.create({
      ...formData,
      image: files.value[0],
    });
    if (isUsuarioCreated) {
      ElMessage.success({
        message: "Usuário criado com sucesso!",
        plain: true,
      });

      usuarios.findAll();
      closeCreateModal();
    }
  } catch (err) {
    console.error(err);
  }
};

// Handle de reset do Form
const handleReset = () => {
  if (formRef) formRef.value?.resetFields();
  uploadRef.value!.clearFiles();
  files.value = [];
  activeStep.value = 0;
};

// Função para gerar senha aleatória
const generateUsuarioPassword = () => (formData.senha = randomPassword(10));

const toggleStep = () => {
  activeStep.value = activeStep.value === 0 ? 1 : 0;
};

const disabledPermissionKeys = computed(() =>
  Object.keys(userPermissionsNames)
    .filter((key) => key !== "GRANT_ADMIN")
    .filter(
      (key) =>
        !hasUserPermission(
          userAuth.permissoes,
          UserPermissions[key as keyof typeof UserPermissions],
        ),
    )
    .map(
      (key) => UserPermissions[key as keyof typeof UserPermissions] as number,
    ),
);

// Função para o upload de imagem
const handleImageChange: UploadProps["onChange"] = (file) =>
  (formData.image = file ? file.name : null);
const handleImageRemove: UploadProps["onRemove"] = () =>
  (formData.image = null);
const handleImageExceed: UploadProps["onExceed"] = (files) => {
  uploadRef.value!.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value!.handleStart(file);
};
</script>

<template>
  <ElDialog
    v-model="isOpen"
    class="!w-full md:!w-[600px]"
    title="Cadastro de Usuário"
    @close="closeCreateModal"
    destroy-on-close
    :show-close="false"
    align-center
  >
    <template #header>
      <UIDialogHeader title="Cadastro de Usuário" @close="closeCreateModal" />
    </template>
    <ElSteps :active="activeStep" class="mb-4 mt-2">
      <ElStep :icon="InfoFilled" />
      <ElStep :icon="Setting" />
    </ElSteps>
    <ElForm
      label-position="top"
      label-width="auto"
      :rules="formRules"
      :model="formData"
      ref="formRef"
    >
      <div v-show="activeStep === 0">
        <div>
          <!-- Avatar -->
          <ElFormItem label="Foto de Perfil" prop="image" class="w-full">
            <ElUpload
              :on-exceed="handleImageExceed"
              :on-change="handleImageChange"
              :on-remove="handleImageRemove"
              v-model="formData.image"
              @input="handleFileInput"
              :autoUpload="false"
              ref="uploadRef"
              class="!w-full"
              :limit="1"
              drag
            >
              <ElIcon size="40">
                <UploadFilled />
              </ElIcon>
              <div>
                Solte o arquivo aqui ou
                <em>clique para fazer upload</em>
              </div>
            </ElUpload>
          </ElFormItem>
        </div>
        <div class="md:flex w-full items-center gap-4">
          <!-- Nome -->
          <ElFormItem label="Nome" prop="nome" class="w-full" required>
            <ElInput
              :disabled="usuario.isSubmitting"
              placeholder="Digite o nome"
              :maxlength="maxLengthText"
              v-model="formData.nome"
              :prefix-icon="User"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
          <!-- E-mail -->
          <ElFormItem label="E-mail" prop="email" class="w-full" required>
            <ElInput
              placeholder="exemplo@email.com"
              :disabled="usuario.isSubmitting"
              :maxlength="maxLengthText"
              v-model="formData.email"
              :prefix-icon="Postcard"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
        </div>
        <div class="md:flex w-full items-center gap-4">
          <!-- Senha -->
          <ElFormItem label="Senha" prop="senha" class="w-full" required>
            <ElInput
              :disabled="usuario.isSubmitting"
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
          <!-- Telefone para contato -->
          <ElFormItem
            label="Telefone para Contato"
            prop="contato"
            class="w-full"
            required
          >
            <ElInput
              :disabled="usuario.isSubmitting"
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
        <ElFormItem label="CPF (opcional)" prop="cpf" class="w-full">
          <ElInput
            :disabled="usuario.isSubmitting"
            v-model="formData.cpf"
            :maxlength="14"
            placeholder="000.000.000-00"
            :prefix-icon="Postcard"
            :formatter="formatCPF_CNPJ"
            :parser="onlyNumber"
            size="large"
            type="text"
            clearable
          />
          <span class="text-xs text-gray-500">
            Opcional. O mesmo CPF pode ser vinculado a mais de um usuário.
          </span>
        </ElFormItem>
      </div>
      <div v-show="activeStep === 1">
        <!-- Permissões -->
        <ElFormItem
          class="!w-full !h-full"
          label="Permissões"
          prop="permissoes"
        >
          <UITreeSelect
            v-model="formData.permissoes as number[]"
            :disabled-keys="disabledPermissionKeys"
            :allowed-modules="allowedModules"
          />
        </ElFormItem>
      </div>
    </ElForm>
    <!-- Grupo de botão do footer -->
    <template #footer>
      <ElButton @click="closeCreateModal">Cancelar</ElButton>
      <ElButton
        v-if="activeStep === 0"
        @click="toggleStep"
        :icon="ArrowRightBold"
      >
        Próximo
      </ElButton>
      <template v-else>
        <ElButton @click="toggleStep" :icon="ArrowLeftBold"> Voltar </ElButton>
        <ElButton
          :disabled="usuario.isSubmitting"
          @click="handleCreate"
          type="primary"
          :icon="Plus"
        >
          Cadastrar
        </ElButton>
      </template>
    </template>
  </ElDialog>
</template>

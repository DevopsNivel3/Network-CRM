<script setup lang="ts">
import {
  User,
  Postcard,
  Lock,
  Refresh,
  Cellphone,
  Check,
  UploadFilled,
  InfoFilled,
  Setting,
  ArrowRightBold,
  ArrowLeftBold,
} from "@element-plus/icons-vue";
import type {
  UploadInstance,
  FormInstance,
  UploadProps,
  UploadRawFile,
} from "element-plus";
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
  normalizePermissionModules(
    (usuario.data?.empresa?.modulos as any) ?? userAuth.empresa_modulos,
  ),
);

const activeStep = ref<number>(0);
const uploadRef = ref<UploadInstance>();
const formRef = ref<FormInstance | null>(null);
const formRules = reactive(FormUpdateUsuarioRules);
const formData = reactive<FormUsuarioCreate>({
  nome: null,
  cpf: null,
  contato: null,
  email: null,
  senha: null,
  desativado: false,
  image: null,
  permissoes: [],
  criado: null,
  atualizado: null,
});

// Função para enviar os dados ao backend
const handleEdit = async () => {
  if (!usuario.data || usuario.isSubmitting) return;

  try {
    await formRef.value?.validate();

    ElMessageBox.confirm(
      `Deseja editar as informações do Usuário ${usuario.data?.nome}?`,
      "Atenção",
      {
        confirmButtonText: "Sim, editar!",
        cancelButtonText: "Cancelar",
        type: "info",
      },
    ).then(async () => {
      const usuarioId = usuario.data!.id;
      const isUsuarioEdited = await usuario.updateById(usuarioId, {
        ...formData,
        image: files.value[0],
      });

      if (isUsuarioEdited) {
        ElMessage.success({
          message: "Usuário editado com sucesso!",
          plain: true,
        });

        if (formData.desativado)
          usuarios.updateStatusFromState(
            usuarioId,
            formData.desativado === "true",
          );

        closeEditModal();
      }
    });
  } catch (err) {
    console.error(err);
  }
};

// Fecha o modal de edição
const closeEditModal = () => {
  handleReset();
  activeStep.value = 0;
  isOpen.value = false;
};

// Handle de reset do Form
const handleReset = () => {
  if (formRef.value) formRef.value?.resetFields();
  resetFormData(usuario.data);
  uploadRef.value!.clearFiles();
  files.value = [];
  activeStep.value = 0;
};

// Função para gerar senha aleatória
const generateUsuarioPassword = () => (formData.senha = randomPassword(10));

const toggleStep = () => {
  activeStep.value = activeStep.value === 0 ? 1 : 0;
};

// Para resetar os dados do form
const resetFormData = (data: any) => {
  if (!data) return;

  Object.assign(formData, {
    nome: data.nome,
    cpf: data.cpf,
    contato: data.contato,
    email: data.email,
    senha: data.senha,
    image: data.image,
    desativado: String(data.desativado) || "false",
    permissoes: data.permissoes
      ? filterPermissionKeysByModules(
          getUserPermissionsBitfield(data.permissoes),
          allowedModules.value as any,
        )
      : null,
  });
};

// Opções de permissões
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

// Opções do select para o status
const statusOptions = [
  {
    label: "Ativo",
    value: "false",
  },
  {
    label: "Inativo",
    value: "true",
  },
];

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

// Observa as mudanças no usuário
watch(
  () => usuario.data,
  (newUserData) => {
    if (newUserData) resetFormData(newUserData);
  },
  { immediate: true },
);
</script>

<template>
  <ElDialog
    v-model="isOpen"
    class="!w-full md:!w-[600px]"
    title="Editando Usuário"
    @close="closeEditModal"
    destroy-on-close
    :z-index="1505"
    :show-close="false"
    align-center
  >
    <template #header>
      <UIDialogHeader title="Editando Usuário" @close="closeEditModal" />
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
        <div class="md:flex w-full items-center text-wrap md:text-nowrap gap-4">
          <!-- Senha atual -->
          <ElFormItem label="Senha" prop="senha" class="w-full">
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
              :maxlength="maxLengthPhone"
              v-model="formData.contato"
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
        <!-- Status do usuário (ativo | inativo) -->
        <ElFormItem label="Status" prop="desativado" class="w-full">
          <ElSegmented
            class="!w-full !uppercase !text-xs !font-medium !tracking-wide"
            v-model="formData.desativado"
            :options="statusOptions"
            block
          />
        </ElFormItem>
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
    <template #footer>
      <ElButton @click="closeEditModal"> Cancelar </ElButton>
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
          @click="handleEdit"
          type="primary"
          :icon="Check"
        >
          Salvar
        </ElButton>
      </template>
    </template>
  </ElDialog>
</template>

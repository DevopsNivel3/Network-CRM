<script setup lang="ts">
import { Suitcase, Postcard, Cellphone, Check } from "@element-plus/icons-vue";
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

// Fecha o modal de edição
const closeViewModal = () => {
  handleReset();
  isOpen.value = false;
};

const formRef = ref<FormInstance | null>(null);
const formRules = reactive(FormUpdateEmpresaRules);
const formData = reactive<FormEmpresaCreate>({
  nome: null,
  grupo: null,
  contato: null,
  email: null,
  desativado: "false",
  modulos: [...allPermissionModules],
});
const moduleOptions = getPermissionModuleOptions();
const grupoOptions = empresaGrupoOptions;

// Handle de reset do form
const handleReset = () => {
  if (formRef.value) formRef.value?.resetFields();
  resetFormData(empresa.data);
};

// Para resetar os dados do form
const resetFormData = (data: any) => {
  if (!data) return;

  Object.assign(formData, {
    nome: data.nome,
    grupo: data.grupo,
    contato: data.contato,
    email: data.email,
    desativado: String(data.desativado) || "false",
    modulos: Array.isArray(data.modulos) ? data.modulos : [],
  });
};

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

// Envia os dados para o backend
const handleEdit = async () => {
  if (!empresa.data || empresa.isSubmitting) return;

  try {
    await formRef.value?.validate();

    ElMessageBox.confirm(
      `Deseja editar as informações do Empresa ${empresa.data?.nome}?`,
      "Atenção",
      {
        confirmButtonText: "Sim, editar!",
        cancelButtonText: "Cancelar",
        type: "info",
      },
    ).then(async () => {
      const empresaId = empresa.data!.id;
      const isEmpresaEdited = await empresa.updateById(empresaId, formData);

      if (isEmpresaEdited) {
        ElMessage.success({
          message: "Empresa editado com sucesso!",
          plain: true,
        });

        if (formData.desativado)
          empresas.updateStatusFromState(
            empresaId,
            formData.desativado === "true",
          );

        closeViewModal();
      }
    });
  } catch (err) {
    console.error(err);
  }
};

// Observa as mudanças na empresa
watch(
  () => empresa.data,
  (newEmpresaData) => {
    if (newEmpresaData) resetFormData(newEmpresaData);
  },
  { immediate: true },
);
</script>

<template>
  <ElDialog
    v-model="isOpen"
    class="!w-full md:!w-[600px]"
    title="Editando Empresa"
    @close="closeViewModal"
    destroy-on-close
    :z-index="1505"
    :show-close="false"
    align-center
  >
    <template #header>
      <UIDialogHeader title="Editando Empresa" @close="closeViewModal" />
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
            placeholder="Digite o nome"
            :maxlength="maxLengthText"
            v-model="formData.nome"
            :prefix-icon="Suitcase"
            size="large"
            type="text"
            clearable
          />
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
      <!-- Telefone para contato -->
      <ElFormItem
        label="Telefone para Contato"
        prop="contato"
        class="w-full"
        required
      >
        <ElInput
          :disabled="empresa.isSubmitting"
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
      <!-- Statys -->
      <ElFormItem label="Status" prop="desativado" class="w-full">
        <ElSegmented
          class="!w-full !uppercase !text-xs !font-medium !tracking-wide"
          v-model="formData.desativado"
          :options="statusOptions"
          block
        />
      </ElFormItem>
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
    </ElForm>
    <template #footer>
      <ElButton @click="closeViewModal"> Cancelar </ElButton>
      <ElButton :disabled="empresa.isSubmitting" @click="handleReset">
        Resetar
      </ElButton>
      <ElButton
        :disabled="empresa.isSubmitting"
        @click="handleEdit"
        type="primary"
        :icon="Check"
      >
        Salvar
      </ElButton>
    </template>
  </ElDialog>
</template>

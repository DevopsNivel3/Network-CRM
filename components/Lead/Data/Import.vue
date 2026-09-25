<script setup lang="ts">
import {
  ArrowLeftBold,
  ArrowRightBold,
  Loading,
  UploadFilled,
  CircleCloseFilled,
  ArrowUpBold,
  ArrowDownBold,
} from "@element-plus/icons-vue";
import type { UploadInstance, UploadProps, UploadRawFile } from "element-plus";
import { genFileId } from "element-plus";

interface ImportResult {
  success: number;
  errors: number;
  opportunitiesCreated: number;
  errorDetails: string[];
}

const currentStep = ref(1);
const selectedFile = ref<File | null>(null);
const processing = ref(false);
const importing = ref(false);
const fileFields = ref<string[]>([]);
const previewData = ref<any[]>([]);
const fullData = ref<any[]>([]);
const fieldMapping = ref<Record<string, string>>({});
const importResult = ref<ImportResult>({
  success: 0,
  errors: 0,
  opportunitiesCreated: 0,
  errorDetails: [],
});
const uploadRef = ref<UploadInstance>();
const oportunidades = useOportunidades();
onMounted(async () => {
  if (!oportunidades.boards.data?.length) await oportunidades.findAllBoards();
});
const createOpportunities = ref(false);
const selectedBoardId = ref<number | null>(null);
const opportunityReason = ref<string | null>(null);
const opportunityReasonObservation = ref<string | null>(null);
const reasonFieldsRef = ref<{ validate: () => boolean } | null>(null);

const showLocationMapping = ref(false);

const fieldLabels: Record<string, string> = {
  nome_lead: "Nome do Lead",
  cpf_cnpj: "CPF/CNPJ",
  responsavel: "Responsável",
  contato_nome: "Nome do Contato",
  contato: "Contato",
  atividade: "Atividade",
  faturamento: "Faturamento",
  num_funcionarios: "Número de Funcionários",
  origem_lead: "Origem do Lead",
  observacoes: "Observações",
  rua: "Rua",
  numero: "Número",
  cidade: "Cidade",
  complemento: "Complemento",
  estado: "Estado",
  cep: "CEP",
};

const basicLeadFields = computed(() => {
  const basic: Record<string, string> = {};
  Object.entries(fieldLabels).forEach(([key, value]) => {
    if (!(key in locationFields.value)) basic[key] = value;
  });
  return basic;
});

const locationFields = computed(() => ({
  rua: "Rua",
  numero: "Número",
  cidade: "Cidade",
  complemento: "Complemento",
  estado: "Estado",
  cep: "CEP",
}));

const hasMappedFields = computed(() => {
  return Object.values(fieldMapping.value).some((value) => value !== "");
});

const mappedFields = computed(() => {
  const mapped: Record<string, string> = {};
  Object.entries(fieldMapping.value).forEach(([systemField, fileField]) => {
    if (fileField) mapped[systemField] = fileField;
  });
  return mapped;
});

const mappingTableData = computed(() => {
  return Object.entries(mappedFields.value).map(([systemField, fileField]) => ({
    fileField,
    systemField: getFieldLabel(systemField),
    preview: getFieldPreview(fileField),
  }));
});

function handleFileSelect(uploadFile: any) {
  selectedFile.value = uploadFile.raw;
}

async function processFile() {
  if (!selectedFile.value) return;

  processing.value = true;

  try {
    const data = await parseLeadImportFile(selectedFile.value);

    if (data.length > 0) {
      fileFields.value = Object.keys(data[0]);
      fullData.value = data;
      previewData.value = data.slice(0, 5);

      fieldMapping.value = {};
      Object.keys(basicLeadFields.value).forEach((systemField) => {
        fieldMapping.value[systemField] = "";
      });

      Object.keys(locationFields.value).forEach((systemField) => {
        fieldMapping.value[systemField] = "";
      });

      currentStep.value = 2;
    } else throw new Error("Arquivo vazio ou formato inválido");
  } catch (err: any) {
    ElMessage.error({
      message: `Erro ao processar arquivo. Verifique o formato e tente novamente. ${
        err.data?.message || err?.message
      }`,
      customClass: "!z-[2500]",
      plain: true,
    });
  } finally {
    processing.value = false;
  }
}

function getFieldPreview(field: string): string {
  const firstRow = previewData.value[0];
  if (!firstRow || firstRow[field] === undefined || firstRow[field] === null)
    return "-";
  const value = String(firstRow[field]);
  return value.length > 15 ? value.substring(0, 15) + "..." : value;
}

function getFieldLabel(systemField: string): string {
  return fieldLabels[systemField] || systemField;
}

async function importData() {
  if (createOpportunities.value && !selectedBoardId.value) {
    ElMessage.warning({
      message: "Selecione o status das oportunidades.",
      customClass: "!z-[2500]",
      plain: true,
    });
    return;
  }

  if (
    createOpportunities.value &&
    reasonFieldsRef.value?.validate() === false
  ) {
    ElMessage.warning({
      message: "Preencha o motivo exigido pelo status selecionado.",
      customClass: "!z-[2500]",
      plain: true,
    });
    return;
  }

  importing.value = true;

  try {
    const { data } = await useApi<any>("/api/leads/data/import", {
      method: "POST",
      body: {
        data: fullData.value,
        mapping: mappedFields.value,
        create_opportunities: createOpportunities.value,
        board_id: createOpportunities.value ? selectedBoardId.value : null,
        motivo: createOpportunities.value ? opportunityReason.value : null,
        motivo_observacao: createOpportunities.value
          ? opportunityReasonObservation.value
          : null,
      },
    });

    importResult.value = data;
    currentStep.value = 4;

    if (data.errors === 0) {
      ElMessage.success({
        message: `${data.success} registros importados com sucesso!`,
        customClass: "!z-[2500]",
        plain: true,
      });
    } else {
      ElMessage.warning({
        message: `Importação concluída: ${data.success} sucessos, ${data.errors} erros`,
        customClass: "!z-[2500]",
        plain: true,
      });
    }
  } catch (err: any) {
    ElMessage.error({
      message: `Erro ao importar dados. ${err.data?.message || err?.message}`,
      customClass: "!z-[2500]",
      plain: true,
    });
  } finally {
    importing.value = false;
  }
}

function resetWizard() {
  currentStep.value = 1;
  selectedFile.value = null;
  fileFields.value = [];
  previewData.value = [];
  fullData.value = [];
  fieldMapping.value = {};
  createOpportunities.value = false;
  selectedBoardId.value = null;
  opportunityReason.value = null;
  opportunityReasonObservation.value = null;
  importResult.value = {
    success: 0,
    errors: 0,
    opportunitiesCreated: 0,
    errorDetails: [],
  };
}

const handleImageExceed: UploadProps["onExceed"] = (files) => {
  uploadRef.value!.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value!.handleStart(file);
};
</script>

<template>
  <div class="">
    <div v-if="currentStep === 1" class="space-y-6">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Importar Dados
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Selecione um arquivo CSV, JSON ou XLSX
        </p>
      </div>
      <ElUpload
        :on-exceed="handleImageExceed"
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        accept=".csv,.json,.xlsx,.xls"
        @change="handleFileSelect"
        drag
        class="w-full"
      >
        <ElIcon class="el-icon--upload !text-nivel"><UploadFilled /></ElIcon>
        <div class="el-upload__text">
          Arraste o arquivo aqui ou <em>clique para selecionar</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">Arquivos CSV, JSON, XLSX (máx. 10MB)</div>
        </template>
      </ElUpload>
      <div v-if="selectedFile" class="flex justify-end">
        <ElButton
          type="primary"
          @click="processFile"
          :loading="processing"
          :disabled="!selectedFile"
          :icon="processing ? Loading : ArrowRightBold"
        >
          {{ processing ? "Processando..." : "Próximo" }}
        </ElButton>
      </div>
    </div>
    <div v-if="currentStep === 2" class="space-y-6">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Mapeamento de Campos
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Vincule os campos do arquivo com os campos do sistema
        </p>
      </div>
      <div>
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
          Preview dos Dados, {{ fullData.length }} registros no total
        </h4>
        <div class="overflow-x-auto">
          <ElTable :data="previewData.slice(0, 3)" class="!w-full">
            <ElTableColumn
              v-for="field in fileFields"
              :key="field"
              :prop="field"
              :label="field"
              show-overflow-tooltip
              class="!truncate"
              min-width="120"
            />
          </ElTable>
        </div>
      </div>
      <div class="">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Vincular Campos do Sistema com Campos do Arquivo
        </h4>
        <div class="space-y-4 mb-6">
          <h5 class="text-md font-medium text-gray-900 dark:text-white">
            Lead
          </h5>
          <div
            class="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-lg"
            v-for="(label, systemField) in basicLeadFields"
            :key="systemField"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ label }}
              </div>
            </div>
            <div class="flex-1 max-w-xs ml-4">
              <ElSelect
                v-model="fieldMapping[systemField]"
                placeholder="-- Não mapear --"
                clearable
                style="width: 100%"
              >
                <ElOption
                  v-for="fileField in fileFields"
                  :key="fileField"
                  :value="fileField"
                  :label="`${fileField} (${getFieldPreview(fileField)})`"
                />
              </ElSelect>
            </div>
          </div>
        </div>
        <div class="space-y-4 mb-6">
          <div class="flex items-center justify-between">
            <h5 class="text-md font-medium text-gray-900 dark:text-white">
              Localização
            </h5>
            <ElButton
              type="primary"
              size="small"
              :icon="showLocationMapping ? ArrowUpBold : ArrowDownBold"
              @click="showLocationMapping = !showLocationMapping"
            />
          </div>
          <div v-if="showLocationMapping" class="space-y-4">
            <div
              class="border border-black/10 dark:border-white/10 p-4 rounded-lg bg-black/5 dark:bg-white/5"
            >
              <div class="grid grid-cols-1 gap-4">
                <div
                  v-for="(label, systemField) in locationFields"
                  :key="systemField"
                  class="flex flex-col space-y-2"
                >
                  <label
                    class="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {{ label }}
                  </label>
                  <ElSelect
                    v-model="fieldMapping[systemField]"
                    placeholder="-- Não mapear --"
                    clearable
                  >
                    <ElOption
                      v-for="fileField in fileFields"
                      :key="fileField"
                      :value="fileField"
                      :label="`${fileField} (${getFieldPreview(fileField)})`"
                    />
                  </ElSelect>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-between">
        <ElButton :icon="ArrowLeftBold" @click="currentStep = 1">
          Voltar
        </ElButton>
        <ElButton
          :icon="ArrowRightBold"
          type="primary"
          @click="currentStep = 3"
          :disabled="!hasMappedFields"
        >
          Próximo
        </ElButton>
      </div>
    </div>
    <div v-if="currentStep === 3" class="space-y-6">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Confirmação
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Revise o mapeamento antes de importar os dados
        </p>
      </div>
      <div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumo da Importação
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-black/10 dark:bg-white/10 py-2 px-4 rounded-lg">
            <div class="text-sm text-gray-500 dark:text-gray-400">Arquivo</div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ selectedFile?.name }}
            </div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 py-2 px-4 rounded-lg">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Total de Registros
            </div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ fullData.length }}
            </div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 py-2 px-4 rounded-lg">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Campos Mapeados
            </div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ Object.keys(mappedFields).length }}
            </div>
          </div>
        </div>
      </div>
      <div
        class="rounded-lg border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              Gerar oportunidades
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Cria uma oportunidade para cada lead importado com sucesso.
            </div>
          </div>
          <ElSwitch
            v-model="createOpportunities"
            :disabled="importing"
            inline-prompt
            active-text="Sim"
            inactive-text="Não"
          />
        </div>

        <div v-if="createOpportunities" class="mt-4">
          <ElFormItem label="Status das oportunidades" required>
            <ElSelect
              v-model="selectedBoardId"
              placeholder="Selecione a prancheta/status"
              class="w-full"
              size="large"
              filterable
              :loading="oportunidades.boards.isLoading"
            >
              <ElOption
                v-for="board in oportunidades.getStatusOptions"
                :key="board.value"
                :label="board.label"
                :value="board.value"
              />
            </ElSelect>
          </ElFormItem>
          <OportunidadeBoardMoveReasonFields
            ref="reasonFieldsRef"
            v-model:motivo="opportunityReason"
            v-model:observacao="opportunityReasonObservation"
            :board-id="selectedBoardId"
            :previous-board-id="null"
          />
        </div>
      </div>
      <div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Mapeamento de Campos
        </h4>
        <div class="overflow-x-auto">
          <ElTable :data="mappingTableData" stripe style="width: 100%">
            <ElTableColumn
              prop="fileField"
              label="Campo do Arquivo"
              min-width="150"
            />
            <ElTableColumn
              prop="systemField"
              label="Campo do Sistema"
              min-width="150"
            />
            <ElTableColumn prop="preview" label="Exemplo" min-width="120" />
          </ElTable>
        </div>
      </div>
      <div class="flex justify-between">
        <ElButton :icon="ArrowLeftBold" @click="currentStep = 2">
          Voltar
        </ElButton>
        <ElButton type="primary" @click="importData" :loading="importing">
          {{ importing ? "Importando..." : "Importar Dados" }}
        </ElButton>
      </div>
    </div>
    <div v-if="currentStep === 4" class="space-y-6">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Resultado da Importação
        </h3>
      </div>
      <div class="text-center">
        <div
          v-if="importResult.errors === 0"
          class="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
        >
          <svg
            class="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <div
          v-else
          class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4"
        >
          <svg
            class="w-8 h-8 text-yellow-600 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            ></path>
          </svg>
        </div>
      </div>
      <div class="text-center">
        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {{
            importResult.errors === 0
              ? "Importação Concluída!"
              : "Importação Concluída com Erros"
          }}
        </h4>
        <div class="flex flex-col items-center justify-center gap-2">
          <div
            v-if="importResult.success > 0"
            class="block w-fit items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
          >
            {{ importResult.success }} registros importados com sucesso
          </div>
          <div
            v-if="importResult.errors > 0"
            class="block w-fit items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            {{ importResult.errors }} registros com erros
          </div>
          <div
            v-if="importResult.opportunitiesCreated > 0"
            class="block w-fit items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
          >
            {{ importResult.opportunitiesCreated }} oportunidades criadas
          </div>
        </div>
      </div>
      <div
        v-if="importResult.errorDetails.length > 0"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <ElCollapse>
          <ElCollapseItem title="Ver Detalhes dos Erros" name="errors">
            <div class="space-y-3">
              <div
                v-for="(error, index) in importResult.errorDetails"
                :key="index"
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <ElIcon class="text-red-400" size="20">
                      <CircleCloseFilled />
                    </ElIcon>
                  </div>
                  <div class="ml-3">
                    <h5
                      class="text-sm font-medium text-red-800 dark:text-red-200"
                    >
                      Erro {{ index + 1 }}
                    </h5>
                    <p class="text-sm text-red-700 dark:text-red-300">
                      {{ error }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ElCollapseItem>
        </ElCollapse>
      </div>
      <div class="text-center">
        <ElButton type="primary" @click="resetWizard" size="large">
          Nova Importação
        </ElButton>
      </div>
    </div>
  </div>
</template>

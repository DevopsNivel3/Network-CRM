<script setup lang="ts">
import { ArrowDownBold, ArrowLeftBold, ArrowRightBold, Loading } from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

const usuarios = useUsuarios();
const dayjs = useDayjs();

interface ExportData {
  export_type: string;
  userId?: string | number;
  city?: string | number;
  state?: string | number;
  dateBetween: string[] | null;
  dateField: "criado" | "atualizado";
  dateEntity: "lead" | "oportunidade" | "interacao";
  options: {
    leads: string[];
    oportunidades: string[];
    localizacoes: string[];
    oportunidades_interacoes: string[];
  };
}

const formRef = ref<FormInstance | null>(null);
const isLoading = ref<boolean>(false);
const setIsLoading = (value: boolean) => (isLoading.value = value);
const formData = reactive<ExportData>({
  export_type: "csv",
  userId: "all",
  city: "all",
  state: "all",
  dateBetween: [
    dayjs().startOf("month").subtract(2, "month").format("YYYY-MM-DD"),
    dayjs().endOf("month").format("YYYY-MM-DD"),
  ],
  dateField: "criado",
  dateEntity: "lead",
  options: {
    leads: [
      "ID",
      "LEAD_NOME",
      "CPF/CNPJ",
      "RESPONSAVEL",
      "CONTATO_NOME",
      "CONTATO_TELEFONE",
      "ATIVIDADE",
      "FATURAMENTO",
      "NUM_FUNCIONARIOS",
      "OBSERVACOES",
      "USUARIO_ID",
      "USUARIO_NOME",
      "CRIADO",
      "ATUALIZADO",
    ],
    oportunidades: [
      "ID",
      "VALOR_ESTIMADO",
      "FAIXA_VALOR",
      "DESCRICAO",
      "BOARD_ID",
      "BOARD_NOME",
      "USUARIO_ID",
      "USUARIO_NOME",
      "CRIADO",
      "ATUALIZADO",
    ],
    localizacoes: [
      "ID",
      "RUA",
      "NUMERO",
      "CIDADE",
      "COMPLEMENTO",
      "ESTADO",
      "CEP",
      "CRIADO",
      "ATUALIZADO",
    ],
    oportunidades_interacoes: [
      "ID",
      "USUARIO_ID",
      "USUARIO_NOME",
      "STATUS",
      "TIPO",
      "CONTEUDO",
      "DATA",
    ],
  },
});

const selectedOptions = ref({
  leads: [
    "ID",
    "LEAD_NOME",
    "CPF/CNPJ",
    "RESPONSAVEL",
    "CONTATO_NOME",
    "CONTATO_TELEFONE",
    "ATIVIDADE",
    "FATURAMENTO",
    "NUM_FUNCIONARIOS",
    "OBSERVACOES",
    "USUARIO_ID",
    "USUARIO_NOME",
    "CRIADO",
    "ATUALIZADO",
  ],
  oportunidades: [
    "ID",
    "VALOR_ESTIMADO",
    "FAIXA_VALOR",
    "DESCRICAO",
    "BOARD_ID",
    "BOARD_NOME",
    "USUARIO_ID",
    "USUARIO_NOME",
    "CRIADO",
    "ATUALIZADO",
  ],
  localizacoes: [
    "ID",
    "RUA",
    "NUMERO",
    "CIDADE",
    "COMPLEMENTO",
    "ESTADO",
    "CEP",
    "CRIADO",
    "ATUALIZADO",
  ],
  oportunidades_interacoes: [
    "ID",
    "USUARIO_ID",
    "USUARIO_NOME",
    "STATUS",
    "TIPO",
    "CONTEUDO",
    "DATA",
  ],
});

const activeStep = ref<number>(0);
const toggleStep = () => {
  activeStep.value = activeStep.value === 0 ? 1 : 0;
};

const hasAnySelected = computed(
  () =>
    selectedOptions.value.leads.length > 0 ||
    selectedOptions.value.oportunidades.length > 0 ||
    selectedOptions.value.localizacoes.length > 0 ||
    selectedOptions.value.oportunidades_interacoes.length > 0
);
const handleSubmit = async () => {
  if (!hasAnySelected.value) {
    ElMessage.warning({
      message: "Selecione pelo menos um campo para exportar",
      customClass: "!z-[2500]",
      plain: true,
    });
    return;
  }
  setIsLoading(true);

  try {
    const { token } = useAuth();
    const { headerName, csrf } = useCsrf();

    const res = await fetch("/api/leads/data/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.value!,
        [headerName]: csrf,
      },
      body: JSON.stringify({
        ...formData,
        options: {
          leads: selectedOptions.value.leads,
          oportunidades: selectedOptions.value.oportunidades,
          localizacoes: selectedOptions.value.localizacoes,
          oportunidades_interacoes: selectedOptions.value.oportunidades_interacoes,
          interacoes: selectedOptions.value.oportunidades_interacoes,
        },
      }),
    });

    if (!res.ok) {
      const errorMessage = await res.json();
      throw new Error(errorMessage.message || res?.message || "Erro ao exportar dados");
    }

    const contentDisposition = res.headers.get("Content-Disposition");
    let filename = "export";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) filename = filenameMatch[1];
    }

    const contentType = res.headers.get("Content-Type");
    let blob: Blob;

    if (contentType?.includes("application/json")) {
      const text = await res.text();
      blob = new Blob([text], { type: "application/json" });
    } else if (contentType?.includes("text/csv")) {
      const text = await res.text();
      blob = new Blob([text], { type: "text/csv" });
    } else if (
      contentType?.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      const arrayBuffer = await res.arrayBuffer();
      blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } else {
      const arrayBuffer = await res.arrayBuffer();
      blob = new Blob([arrayBuffer]);
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success({
      message: "Arquivo exportado com sucesso!",
      customClass: "!z-[2500]",
      plain: true,
    });
  } catch (err: any) {
    usuarios.setError(err);
  } finally {
    setIsLoading(false);
  }
};

const selectAllLeads = () => (selectedOptions.value.leads = [...formData.options.leads]);
const deselectAllLeads = () => (selectedOptions.value.leads = []);

const selectAllOportunidades = () =>
  (selectedOptions.value.oportunidades = [...formData.options.oportunidades]);
const deselectAllOportunidades = () => (selectedOptions.value.oportunidades = []);

const selectAllLocalizacoes = () =>
  (selectedOptions.value.localizacoes = [...formData.options.localizacoes]);
const deselectAllLocalizacoes = () => (selectedOptions.value.localizacoes = []);

const selectAllInteracoes = () =>
  (selectedOptions.value.oportunidades_interacoes = [...formData.options.oportunidades_interacoes]);
const deselectAllInteracoes = () => (selectedOptions.value.oportunidades_interacoes = []);
</script>

<template>
  <ElForm label-position="top" label-width="auto" :model="formData" ref="formRef">
    <div v-show="activeStep === 0" class="space-y-6">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exportar Dados</h3>
        <p class="text-gray-600 dark:text-gray-400">Selecione os filtros para exportar os dados</p>
      </div>
      <div class="pt-2 px-4 border border-black/10 dark:border-white/10 rounded-lg">
        <div class="flex items-center justify-center w-full gap-2">
          <ElFormItem label="Tipo de Arquivo" prop="export_type" class="!w-full">
            <ElSelect v-model="formData.export_type" placeholder="Selecione">
              <ElOption label="CSV" value="csv" />
              <ElOption label="Excel" value="xlsx" />
              <ElOption label="JSON" value="json" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="Usuário" prop="userId" class="!w-full">
            <FilterUser
              @change="(value) => (formData.userId = value)"
              :value="formData.userId"
              :showLabel="false"
              :haveAll="true"
            />
          </ElFormItem>
        </div>
        <div class="flex items-center justify-center w-full gap-2">
          <ElFormItem label="Cidade" prop="city" class="!w-full">
            <FilterCity
              @change="(value) => (formData.city = value)"
              :value="formData.city"
              :showLabel="false"
              :haveAll="true"
            />
          </ElFormItem>
          <ElFormItem label="Estado" prop="state" class="!w-full">
            <FilterEstado
              @change="(value) => (formData.state = value)"
              :value="formData.state"
              :showLabel="false"
              :haveAll="true"
            />
          </ElFormItem>
        </div>
        <div
          class="flex flex-col items-center justify-center w-full gap-1 border-t border-black/10 dark:border-white/10"
        >
          <h3 class="font-bold text-gray-900 dark:text-white mb-1 mt-2">Filtros de Data</h3>
          <div class="flex items-center justify-center w-full gap-2">
            <ElFormItem label="Filtro por" prop="dateField" class="!w-full">
              <ElSelect v-model="formData.dateField" placeholder="Selecione">
                <ElOption label="Data de criação" value="criado" />
                <ElOption label="Data de atualização" value="atualizado" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="Entidade" prop="dateEntity" class="!w-full">
              <ElSelect v-model="formData.dateEntity" placeholder="Selecione">
                <ElOption label="Lead" value="lead" />
                <ElOption label="Oportunidade" value="oportunidade" />
                <ElOption label="Interação" value="interacao" />
              </ElSelect>
            </ElFormItem>
          </div>
          <ElFormItem label="Período" prop="dateBetween" class="!w-full">
            <FilterBetweenDates
              @change="(value) => (formData.dateBetween = value)"
              :value="formData.dateBetween"
              :showLabel="false"
            />
          </ElFormItem>
        </div>
      </div>
      <div class="flex items-center justify-end">
        <ElButton :icon="ArrowRightBold" type="primary" @click="toggleStep"> Próximo </ElButton>
      </div>
    </div>

    <div v-show="activeStep === 1" class="space-y-6">
      <div class="space-y-3">
        <h3 class="font-semibold text-gray-800 dark:text-gray-200">
          Selecione os campos para exportar:
        </h3>

        <!-- Leads Fields -->
        <div class="border rounded-lg p-4 border-black/10 dark:border-white/10">
          <h4
            class="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between"
          >
            Leads
            <div class="space-x-2">
              <ElButton size="small" @click="selectAllLeads">Selecionar Todos</ElButton>
              <ElButton size="small" @click="deselectAllLeads">Desmarcar Todos</ElButton>
            </div>
          </h4>
          <div class="grid gap-2">
            <ElCheckboxGroup v-model="selectedOptions.leads">
              <ElCheckbox
                v-for="field in formData.options.leads"
                :key="field"
                :value="field"
                :label="field"
              >
                {{ field }}
              </ElCheckbox>
            </ElCheckboxGroup>
          </div>
        </div>
        <div class="flex items-center justify-center w-full my-1">
          <ElIcon>
            <ArrowDownBold />
          </ElIcon>
        </div>
        <!-- Oportunidades Fields -->
        <div class="border rounded-lg p-4 border-black/10 dark:border-white/10">
          <h4
            class="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between"
          >
            Oportunidades
            <div class="space-x-2">
              <ElButton size="small" @click="selectAllOportunidades"> Selecionar Todos </ElButton>
              <ElButton size="small" @click="deselectAllOportunidades"> Desmarcar Todos </ElButton>
            </div>
          </h4>
          <div class="grid gap-2">
            <ElCheckboxGroup v-model="selectedOptions.oportunidades">
              <ElCheckbox
                v-for="field in formData.options.oportunidades"
                :key="field"
                :value="field"
                :label="field"
              >
                {{ field }}
              </ElCheckbox>
            </ElCheckboxGroup>
          </div>
        </div>
        <div class="flex items-center justify-center w-full my-1">
          <ElIcon>
            <ArrowDownBold />
          </ElIcon>
        </div>
        <!-- Interações da Oportunidade Fields -->
        <div class="border rounded-lg p-4 border-black/10 dark:border-white/10">
          <h4
            class="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between"
          >
            Interações
            <div class="space-x-2">
              <ElButton size="small" @click="selectAllInteracoes"> Selecionar Todos </ElButton>
              <ElButton size="small" @click="deselectAllInteracoes"> Desmarcar Todos </ElButton>
            </div>
          </h4>
          <div class="grid gap-2">
            <ElCheckboxGroup v-model="selectedOptions.oportunidades_interacoes">
              <ElCheckbox
                v-for="field in formData.options.oportunidades_interacoes"
                :key="field"
                :value="field"
                :label="field"
              >
                {{ field }}
              </ElCheckbox>
            </ElCheckboxGroup>
          </div>
        </div>
        <div class="flex items-center justify-center w-full my-1">
          <ElIcon>
            <ArrowDownBold />
          </ElIcon>
        </div>
        <!-- Localizações Fields -->
        <div class="border rounded-lg p-4 border-black/10 dark:border-white/10">
          <h4
            class="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between"
          >
            Localizações
            <div class="space-x-2">
              <ElButton size="small" @click="selectAllLocalizacoes"> Selecionar Todos </ElButton>
              <ElButton size="small" @click="deselectAllLocalizacoes"> Desmarcar Todos </ElButton>
            </div>
          </h4>
          <div class="grid gap-2">
            <ElCheckboxGroup v-model="selectedOptions.localizacoes">
              <ElCheckbox
                v-for="field in formData.options.localizacoes"
                :key="field"
                :value="field"
                :label="field"
              >
                {{ field }}
              </ElCheckbox>
            </ElCheckboxGroup>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <ElButton :icon="ArrowLeftBold" @click="toggleStep" :disabled="isLoading">
          Voltar
        </ElButton>
        <ElButton
          type="primary"
          @click="handleSubmit"
          :loading="isLoading"
          :disabled="isLoading || !hasAnySelected"
        >
          {{ isLoading ? "Processando..." : "Exportar Dados" }}
        </ElButton>
      </div>
    </div>
  </ElForm>
</template>

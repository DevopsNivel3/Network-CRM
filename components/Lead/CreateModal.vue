<script setup lang="ts">
import {
  User,
  Postcard,
  Plus,
  OfficeBuilding,
  Close,
  MapLocation,
  Cellphone,
  Briefcase,
  Wallet,
  Management,
  InfoFilled,
  LocationFilled,
  ArrowRightBold,
  ArrowLeftBold,
  Loading,
  Search,
} from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

const { getGeolocation } = useLocation();
const props = defineProps<{
  modelValue: boolean;
  initialData?: Partial<FormLeadCreate> | null;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "prefill-applied"): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
const leads = useLeads();
const lead = useLead();
const map = useMap();
const leadGroups = useLeadGroups();

const activeStep = ref<number>(0);
const formRef = ref<FormInstance | null>(null);
const formRules = reactive(FormCreateLeadRules);
const isFetchingCnpj = ref(false);

interface BrasilApiCnpjResponse {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  capital_social?: string | number;
  cnae_fiscal_descricao?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  qsa?: Array<{
    nome_socio?: string;
    qualificacao_socio?: string;
  }>;
}

const getDefaultFormData = (): FormLeadCreate => ({
  nome_lead: null,
  cpf_cnpj: null,
  contato: null,
  contato_nome: null,
  atividade: null,
  faturamento: null,
  num_funcionarios: 1,
  responsavel: null,
  origem_lead: null,
  controle_lembretes: true,
  classificacao_oportunidade: null,
  grupo_ids: [],
  localizacoes: [
    {
      key: 1,
      rua: "",
      cidade: "",
      complemento: "",
      estado: "",
      numero: "",
      cep: "",
    },
  ],
  observacoes: null,
});

const formData = reactive<FormLeadCreate>(getDefaultFormData());

const {
  cidadesPorEstado,
  handleAddLocation,
  handleEstadoChange,
  handleLocation,
  handleRemoveLocation,
  resetCidadesPorEstado,
  setupWatchForLocation,
  updateCidadesPorEstado,
} = useLeadLocationForm(formData, map, getGeolocation);

// Handlers de Modal
const closeCreateModal = () => {
  if (formRef.value) formRef.value.resetFields();
  Object.assign(formData, getDefaultFormData());
  cidadesPorEstado.value = {};
  isOpen.value = false;
  setTimeout(() => (activeStep.value = 0), 200);
};

const applyInitialData = () => {
  if (!props.initialData) return;

  Object.assign(formData, {
    ...getDefaultFormData(),
    ...props.initialData,
    localizacoes:
      props.initialData.localizacoes || getDefaultFormData().localizacoes,
  });
  emit("prefill-applied");
};

onMounted(async () => {
  if (!leadGroups.data?.data?.length) await leadGroups.findAll();
});

const toggleStep = () => {
  activeStep.value = activeStep.value === 0 ? 1 : 0;
};

const handleCreate = async () => {
  if (lead.isSubmitting) return;

  try {
    await formRef.value?.validate();

    const isLeadCreated = await lead.create(formData);
    if (isLeadCreated) {
      ElMessage.success({
        message: "Lead criado com sucesso!",
        plain: true,
      });

      leads.findAll();
      closeCreateModal();
    }
  } catch (err) {
    console.error(err);
  }
};

const getCnpjDigits = () => String(formData.cpf_cnpj || "").replace(/\D/g, "");

const canFetchCnpj = computed(() => getCnpjDigits().length === 14);

watch(
  () => formData.cpf_cnpj,
  () => {
    if (canFetchCnpj.value && !isFetchingCnpj.value) {
      handleCnpjLookup();
    }
  },
);

const handleCnpjLookup = async () => {
  const cnpj = getCnpjDigits();
  if (cnpj.length !== 14 || isFetchingCnpj.value) return;

  isFetchingCnpj.value = true;

  try {
    if (!map.data?.length) await map.findEstados();

    const data = await useApi<BrasilApiCnpjResponse>(`/api/cnpj/${cnpj}`, {
      method: "GET",
    });

    if (!data) return;

    formData.cpf_cnpj = data.cnpj || cnpj;
    formData.nome_lead = data.razao_social || formData.nome_lead;
    formData.atividade = data.cnae_fiscal_descricao || formData.atividade;
    formData.faturamento = data.capital_social
      ? formatNumber(String(data.capital_social))
      : formData.faturamento;

    const socioResponsavel = data.qsa?.find((socio) =>
      Boolean(socio?.nome_socio),
    );
    formData.responsavel = socioResponsavel?.nome_socio || formData.responsavel;

    const location = formData.localizacoes?.[0];
    if (location) {
      const estado = map.data?.find(
        (item) => item.uf?.toUpperCase() === data.uf?.toUpperCase(),
      );

      if (estado) {
        location.estado = estado.value;
        const cidades = await map.findCidadesByEstado(estado.value);
        updateCidadesPorEstado(location.key, location, cidades);

        const cidade = cidades?.find(
          (item: any) =>
            item.value?.toUpperCase() === data.municipio?.toUpperCase(),
        );
        location.cidade = cidade?.value || location.cidade;
      }

      location.rua = data.logradouro || location.rua;
      location.numero = data.numero || location.numero;
      location.complemento = data.complemento || location.complemento;
      location.cep = data.cep || location.cep;
    }

    ElMessage.success({
      message: "Dados do CNPJ preenchidos com sucesso.",
      plain: true,
    });
  } catch (err: any) {
    ElMessage.error({
      message:
        err?.data?.message ||
        err?.message ||
        "Não foi possível consultar este CNPJ.",
      customClass: "!z-[2500]",
      grouping: true,
      plain: true,
    });
  } finally {
    isFetchingCnpj.value = false;
  }
};

const origemLeadOptions = ref([
  { label: "Indicação", value: "indicacao" },
  { label: "Facebook", value: "facebook" },
  { label: "Google", value: "google" },
  { label: "PAP", value: "pap" },
  { label: "SDR", value: "sdr" },
  { label: "Instagram", value: "instagram" },
  { label: "Linkedin", value: "linkedin" },
  { label: "Twitter", value: "twitter" },
  { label: "TikTok", value: "tiktok" },
  { label: "YouTube", value: "youtube" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Email", value: "email" },
  { label: "Evento", value: "evento" },
  { label: "Feira", value: "feira" },
  { label: "Out of Home", value: "out_of_home" },
  { label: "Pesquisa", value: "pesquisa" },
  { label: "Publicidade", value: "publicidade" },
  { label: "Rádio", value: "radio" },
  { label: "TV", value: "tv" },
  { label: "Revista", value: "revista" },
  { label: "Jornal", value: "jornal" },
  { label: "Site", value: "site" },
  { label: "Blog", value: "blog" },
  { label: "Podcast", value: "podcast" },
  { label: "Influenciador", value: "influenciador" },
  { label: "Parceria", value: "parceria" },
  { label: "Networking", value: "networking" },
  { label: "Campanha", value: "campanha" },
  { label: "Promoção", value: "promocao" },
  { label: "Anúncio", value: "anuncio" },
  { label: "Marketing Digital", value: "marketing_digital" },
  { label: "Outbound", value: "outbound" },
  { label: "Inbound", value: "inbound" },
  { label: "Telemarketing", value: "telemarketing" },
  { label: "Vendas Diretas", value: "vendas_diretas" },
  { label: "Franquia", value: "franquia" },
  { label: "Distribuidor", value: "distribuidor" },
  { label: "Revendedor", value: "revendedor" },
  { label: "Agência", value: "agencia" },
  { label: "Consultoria", value: "consultoria" },
]);

const classificacaoOportunidadeOptions: Array<{
  label: string;
  value: "frio" | "morno" | "quente";
}> = [
  {
    label: "Frio",
    value: "frio",
  },
  {
    label: "Morno",
    value: "morno",
  },
  {
    label: "Quente",
    value: "quente",
  },
];

watch(
  () => isOpen.value,
  async (isOpen) => {
    if (isOpen) {
      applyInitialData();
      await map.findEstados();
      await Promise.all(
        formData.localizacoes?.map((loc) => setupWatchForLocation(loc.key)) ||
          [],
      );
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="isOpen"
    class="!w-full md:!w-[600px]"
    title="Cadastro de Lead"
    @close="closeCreateModal"
    destroy-on-close
    :show-close="false"
    align-center
  >
    <template #header>
      <UIDialogHeader title="Cadastro de Lead" @close="closeCreateModal" />
    </template>
    <ElSteps :active="activeStep" class="mb-4 mt-2">
      <ElStep :icon="InfoFilled" />
      <ElStep :icon="LocationFilled" />
    </ElSteps>
    <ElForm
      label-position="top"
      label-width="auto"
      :rules="formRules"
      :model="formData"
      ref="formRef"
    >
      <!-- Painel 0 -->
      <div v-show="activeStep === 0">
        <div class="md:flex w-full items-center gap-4">
          <!-- Razão social -->
          <ElFormItem
            label="Razão Social"
            prop="nome_lead"
            class="w-full"
            required
          >
            <ElInput
              placeholder="Digite a razão social"
              v-model="formData.nome_lead"
              :prefix-icon="OfficeBuilding"
              :disabled="lead.isSubmitting"
              :maxlength="maxLengthText"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
          <!-- CPF/CNPJ -->
          <ElFormItem label="CPF/CNPJ" prop="cpf_cnpj" class="w-full">
            <div class="flex w-full gap-2">
              <ElInput
                placeholder="00.000.000/0000-00"
                :maxlength="maxLengthCPF_CNPJ"
                v-model="formData.cpf_cnpj"
                :disabled="lead.isSubmitting"
                :formatter="formatCPF_CNPJ"
                :prefix-icon="Postcard"
                :parser="onlyNumber"
                @blur="handleCnpjLookup"
                @keyup.enter="handleCnpjLookup"
                size="large"
                type="text"
                clearable
              />
              <ElTooltip content="Buscar dados do CNPJ">
                <ElButton
                  :icon="Search"
                  :loading="isFetchingCnpj"
                  :disabled="!canFetchCnpj || lead.isSubmitting"
                  @click="handleCnpjLookup"
                  size="large"
                />
              </ElTooltip>
            </div>
          </ElFormItem>
        </div>
        <div class="md:flex w-full items-center gap-4">
          <!-- Responsável -->
          <ElFormItem label="Responsável" prop="responsavel" class="w-full">
            <ElInput
              placeholder="Digite o responsável"
              v-model="formData.responsavel"
              :disabled="lead.isSubmitting"
              :maxlength="maxLengthText"
              :prefix-icon="Management"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
          <!-- Atividade -->
          <ElFormItem label="Atividade" prop="atividade" class="w-full">
            <ElInput
              placeholder="Digite a atividade"
              v-model="formData.atividade"
              :disabled="lead.isSubmitting"
              :maxlength="maxLengthText"
              :prefix-icon="Briefcase"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
        </div>
        <div class="md:flex w-full items-center text-wrap md:text-nowrap gap-4">
          <!-- Número de colaboradores -->
          <ElFormItem label="Nº de Colaboradores" prop="num_funcionarios">
            <ElInputNumber
              v-model="formData.num_funcionarios"
              :disabled="lead.isSubmitting"
              class="!w-full"
              :max="9999999"
              size="large"
              :min="1"
            />
          </ElFormItem>
          <!-- Controle de Lembretes -->
          <ElFormItem label="Gerar Lembretes" prop="controle_lembretes">
            <ElSwitch
              v-model="formData.controle_lembretes"
              :disabled="lead.isSubmitting"
              inline-prompt
              active-text="Sim"
              inactive-text="Não"
            />
          </ElFormItem>
          <!-- Fonte de Contato -->
          <ElFormItem
            label="Fonte do Contato"
            prop="origem_lead"
            class="w-full"
          >
            <div class="w-full">
              <ElSelectV2
                v-model="formData.origem_lead"
                :disabled="lead.isSubmitting"
                :options="origemLeadOptions"
                :loading="map.isLoading"
                placeholder="Selecione"
                class="flex-1"
                allow-create
                size="large"
                filterable
              />
              <div class="lead-temperature-inline">
                <span class="lead-temperature-label"> Oportunidade </span>
                <div class="lead-temperature-options">
                  <button
                    v-for="option in classificacaoOportunidadeOptions"
                    :key="option.value"
                    type="button"
                    class="lead-temperature-option"
                    :class="{
                      'is-selected':
                        formData.classificacao_oportunidade === option.value,
                    }"
                    :disabled="lead.isSubmitting"
                    @click="
                      formData.classificacao_oportunidade =
                        formData.classificacao_oportunidade === option.value
                          ? null
                          : option.value
                    "
                  >
                    <span class="lead-temperature-check" />
                    <span>{{ option.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </ElFormItem>
        </div>
        <!-- Grupos -->
        <ElFormItem label="Grupos" prop="grupo_ids" class="w-full">
          <ElSelectV2
            v-model="formData.grupo_ids"
            :options="leadGroups.formattedOptions"
            :loading="leadGroups.isLoading"
            :disabled="lead.isSubmitting"
            placeholder="Selecione grupos"
            class="flex-1"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
            size="large"
          />
        </ElFormItem>
        <!-- Faturamento -->
        <ElFormItem label="Faturamento" prop="faturamento" class="w-full">
          <ElInput
            placeholder="000.000.000"
            v-model="formData.faturamento"
            :disabled="lead.isSubmitting"
            :maxlength="maxLengthText"
            :prefix-icon="Wallet"
            :formatter="formatNumber"
            :parser="onlyNumber"
            size="large"
            type="text"
            clearable
          />
        </ElFormItem>
        <div class="md:flex w-full items-center gap-4">
          <!-- Telefone para contato -->
          <ElFormItem
            label="Telefone para contato"
            prop="contato"
            class="w-full"
          >
            <ElInput
              placeholder="00 0000-0000"
              v-model="formData.contato"
              :maxlength="maxLengthPhone"
              :disabled="lead.isSubmitting"
              :prefix-icon="Cellphone"
              :formatter="formatPhone"
              :parser="onlyNumber"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
          <!-- Nome do contato -->
          <ElFormItem
            label="Nome do Contato"
            prop="contato_nome"
            class="w-full"
          >
            <ElInput
              placeholder="Digite o nome do contato"
              :disabled="lead.isSubmitting"
              :maxlength="maxLengthText"
              v-model="formData.contato_nome"
              :prefix-icon="User"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
        </div>
        <!-- Observação -->
        <ElFormItem label="Observação" prop="observacoes" class="w-full">
          <ElInput
            placeholder="Escreva uma observação"
            v-model="formData.observacoes"
            :maxlength="maxLengthTextarea"
            :disabled="lead.isSubmitting"
            type="textarea"
            show-word-limit
          />
        </ElFormItem>
      </div>
      <div v-show="activeStep === 1">
        <div class="flex items-center justify-between gap-2">
          <h3>Localizações</h3>
          <ElButton :icon="Plus" size="small" @click="handleAddLocation">
            Adicionar Endereço
          </ElButton>
        </div>
        <div class="mt-3">
          <div
            v-for="(localizacao, index) in formData.localizacoes"
            :key="localizacao.key"
            class="w-full mb-3 bg-gray-200 dark:bg-white/5 px-4 pt-4 pb-2 rounded"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center justify-center">
                <ElButton size="small"> Endereço {{ index + 1 }} </ElButton>
                <ElButton
                  class="!flex !items-center !text-blue-400"
                  @click="handleLocation(localizacao)"
                  :icon="MapLocation"
                  size="small"
                >
                  GPS
                </ElButton>
              </div>
              <ElButton
                v-if="index !== 0"
                @click="handleRemoveLocation(localizacao)"
                class="!text-red-500"
                :icon="Close"
                size="small"
              >
              </ElButton>
            </div>
            <div class="flex flex-col md:flex-row gap-0 md:gap-4">
              <ElFormItem
                :prop="'localizacoes.' + index + '.estado'"
                class="w-full"
                :rules="{
                  message: 'O campo Estado é obrigatório.',
                  trigger: 'change',
                }"
              >
                <ElSelectV2
                  v-model="localizacao.estado"
                  placeholder="Selecione"
                  :options="map.data || []"
                  no-match-text="Não encontrado"
                  no-data-text="Sem dados"
                  :disabled="lead.isSubmitting"
                  :loading="map.isLoading"
                  size="large"
                  filterable
                >
                  <template #prefix>Estado:</template>
                  <template #loading>
                    <ElIcon class="is-loading" color="var(--el-color-primary)">
                      <Loading />
                    </ElIcon>
                  </template>
                </ElSelectV2>
              </ElFormItem>
              <ElFormItem
                :prop="'localizacoes.' + index + '.cidade'"
                class="w-full"
                :rules="{
                  message: 'O campo Cidade é obrigatório.',
                  trigger: 'change',
                }"
              >
                <ElSelectV2
                  v-model="localizacao.cidade"
                  placeholder="Selecione"
                  :options="cidadesPorEstado[localizacao.key] || []"
                  :disabled="!localizacao.estado || lead.isSubmitting"
                  no-match-text="Não encontrado"
                  no-data-text="Sem dados"
                  :loading="map.isLoading"
                  size="large"
                  filterable
                  clearable
                >
                  <template #prefix>Cidade:</template>
                  <template #loading>
                    <ElIcon class="is-loading" color="var(--el-color-primary)">
                      <Loading />
                    </ElIcon>
                  </template>
                </ElSelectV2>
              </ElFormItem>
            </div>
            <div class="flex flex-col md:flex-row gap-0 md:gap-4">
              <ElFormItem
                :prop="'localizacoes.' + index + '.rua'"
                class="w-full"
                :rules="{
                  message: 'O campo Rua é obrigatório.',
                  trigger: 'change',
                }"
              >
                <ElInput
                  placeholder="Digite o nome da rua"
                  :disabled="!localizacao.estado || lead.isSubmitting"
                  v-model="localizacao.rua"
                  :maxlength="maxLengthText"
                  clearable
                  size="large"
                >
                  <template #prefix>
                    <span class="mr-0.5">Rua:</span>
                  </template>
                </ElInput>
              </ElFormItem>
              <ElFormItem
                :prop="'localizacoes.' + index + '.cep'"
                class="w-full"
                :rules="[
                  {
                    message: 'O campo CEP é obrigatório.',
                    trigger: 'change',
                  },
                ]"
              >
                <ElInput
                  placeholder="Digite o CEP"
                  :disabled="!localizacao.estado || lead.isSubmitting"
                  v-model="localizacao.cep"
                  :maxlength="maxLengthCep"
                  :formatter="formatCep"
                  :parser="onlyNumber"
                  clearable
                  size="large"
                >
                  <template #prefix>
                    <span class="mr-0.5">CEP:</span>
                  </template>
                </ElInput>
              </ElFormItem>
              <ElFormItem
                :prop="'localizacoes.' + index + '.numero'"
                class="w-full md:w-3/5"
                :rules="{
                  message: 'O campo Número é obrigatório.',
                  trigger: 'change',
                }"
              >
                <ElInput
                  :disabled="!localizacao.estado || lead.isSubmitting"
                  v-model="localizacao.numero"
                  :maxlength="maxLengthCep"
                  placeholder="000"
                  clearable
                  size="large"
                >
                  <template #prefix>
                    <span class="mr-0.5">Nº</span>
                  </template>
                </ElInput>
              </ElFormItem>
            </div>
            <ElFormItem
              :prop="'localizacoes.' + index + '.complemento'"
              class="w-full"
            >
              <ElInput
                placeholder="Digite o complemento"
                :disabled="!localizacao.estado || lead.isSubmitting"
                v-model="localizacao.complemento"
                :maxlength="maxLengthText"
                clearable
                size="large"
              >
                <template #prefix>
                  <span class="mr-0.5">Complemento:</span>
                </template>
              </ElInput>
            </ElFormItem>
          </div>
        </div>
      </div>
    </ElForm>
    <template #footer>
      <ElButton @click="closeCreateModal">Cancelar</ElButton>
      <ElButton
        :icon="activeStep === 0 ? ArrowRightBold : ArrowLeftBold"
        @click="toggleStep"
      >
        {{ activeStep === 0 ? "Avançar" : "Voltar" }}
      </ElButton>
      <ElButton
        :disabled="lead.isSubmitting"
        v-if="activeStep === 1"
        @click="handleCreate"
        type="primary"
        :icon="Plus"
      >
        Cadastrar
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.lead-temperature-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.lead-temperature-inline {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.lead-temperature-label {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 500;
}

.lead-temperature-option {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.08);
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  opacity: 0.5;
  padding: 0 10px;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    opacity 0.18s ease;
}

.lead-temperature-option:hover:not(:disabled) {
  border-color: var(--el-color-primary-light-5);
  opacity: 0.82;
}

.lead-temperature-option:disabled {
  cursor: not-allowed;
}

.lead-temperature-option.is-selected {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  opacity: 1;
}

.lead-temperature-check {
  width: 10px;
  height: 10px;
  border: 1.5px solid currentColor;
  border-radius: 999px;
  opacity: 0.65;
  transition:
    border-width 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.lead-temperature-option.is-selected .lead-temperature-check {
  border-width: 3px;
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  opacity: 1;
}

@media (max-width: 767px) {
  .lead-temperature-inline {
    align-items: flex-start;
    flex-direction: column;
  }

  .lead-temperature-options {
    justify-content: flex-start;
  }
}
</style>

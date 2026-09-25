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
  Check,
  Management,
  InfoFilled,
  LocationFilled,
  ArrowRightBold,
  ArrowLeftBold,
  Loading,
} from "@element-plus/icons-vue";
import { type FormInstance } from "element-plus";

const { getGeolocation } = useLocation();
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
const lead = useLead();
const map = useMap();
const leadGroups = useLeadGroups();

const activeStep = ref<number>(0);
const formRef = ref<FormInstance | null>(null);
const formRules = reactive(FormCreateLeadRules);

const formData = reactive<FormLeadCreate>({
  nome_lead: null,
  cpf_cnpj: null,
  contato: null,
  contato_nome: null,
  atividade: null,
  faturamento: null,
  num_funcionarios: 1,
  responsavel: null,
  localizacoes: null,
  origem_lead: null,
  controle_lembretes: true,
  grupo_ids: [],
  usuario: {
    id: null,
    nome: null,
  },
  observacoes: null,
  criado: null,
  atualizado: null,
});

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

const resetFormData = (data: any) => {
  if (!data) return;

  Object.assign(formData, {
    nome_lead: data.nome_lead,
    cpf_cnpj: data.cpf_cnpj,
    contato: data.contato,
    contato_nome: data.contato_nome,
    atividade: data.atividade,
    faturamento: data.faturamento,
    num_funcionarios: data.num_funcionarios,
    responsavel: data.responsavel,
    observacoes: data.observacoes,
    origem_lead: data.origem_lead,
    controle_lembretes: data.controle_lembretes ?? true,
    grupo_ids: (data.grupos || []).map((grupo: any) => grupo.id),
    usuario: { id: data.usuario.id, nome: data.usuario.nome },
    criado: data.criado,
    atualizado: data.atualizado,
    localizacoes: data.localizacoes.map((location: any, index: number) => ({
      key: index,
      rua: location.rua,
      cidade: location.cidade,
      estado: location.estado,
      complemento: location.complemento,
      numero: location.numero,
      cep: location.cep,
      id: location.id,
    })),
  });
};

onMounted(async () => {
  if (!leadGroups.data?.data?.length) await leadGroups.findAll();
});

// Handlers de Modal
const closeEditModal = () => {
  resetFormData(lead.data);
  cidadesPorEstado.value = {};
  isOpen.value = false;
  setTimeout(() => (activeStep.value = 0), 200);
};

const toggleStep = () => {
  activeStep.value = activeStep.value === 0 ? 1 : 0;
};

const handleEdit = async () => {
  if (!lead.data || lead.isSubmitting) return;

  try {
    await formRef.value?.validate();

    ElMessageBox.confirm(
      `Deseja editar as informações do Lead ${lead.data.nome_lead}?`,
      "Atenção",
      {
        confirmButtonText: "Sim, editar!",
        cancelButtonText: "Cancelar",
        type: "info",
      },
    ).then(async () => {
      const leadId = lead.data!.id;
      const isLeadEdited = await lead.updateById(leadId, formData);

      if (isLeadEdited) {
        ElMessage.success({
          message: "Lead editada com sucesso!",
          plain: true,
        });
        closeEditModal();
      }
    });
  } catch (err) {
    console.error(err);
  }
};

// Handlers de Formulário
const handleReset = () => {
  if (formRef.value) formRef.value.resetFields();
  resetFormData(lead.data);
  formData.localizacoes?.forEach((value) => setupWatchForLocation(value.key));
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

// Watchers
watch(
  () => lead.data,
  (newLeadData) => {
    if (newLeadData) resetFormData(newLeadData);
  },
  { immediate: true },
);

watch(
  () => isOpen.value,
  async (isOpen) => {
    if (isOpen) {
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
    class="!w-full md:!w-[600px]"
    v-model="isOpen"
    @close="closeEditModal"
    title="Editando Lead"
    destroy-on-close
    :z-index="1505"
    :show-close="false"
    align-center
  >
    <template #header>
      <UIDialogHeader title="Editando Lead" @close="closeEditModal" />
    </template>
    <!-- Mostra em qual painel está selecionado -->
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
          <!-- Input para nome -->
          <ElFormItem label="Razão Social" prop="nome_lead" class="w-full">
            <ElInput
              placeholder="Digite a razão social"
              v-model="formData.nome_lead"
              :prefix-icon="OfficeBuilding"
              :disabled="lead.isSubmitting"
              maxlength="256"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
          <!-- Input para CPF/CNPJ -->
          <ElFormItem label="CPF/CNPJ" prop="cpf_cnpj" class="w-full">
            <ElInput
              placeholder="00.000.000/0000-00"
              :maxlength="maxLengthCPF_CNPJ"
              v-model="formData.cpf_cnpj"
              :disabled="lead.isSubmitting"
              :formatter="formatCPF_CNPJ"
              :prefix-icon="Postcard"
              :parser="onlyNumber"
              size="large"
              type="text"
              clearable
            />
          </ElFormItem>
        </div>
        <div class="md:flex w-full items-center gap-4">
          <!-- Input para responsável -->
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
          <!-- Input para atividade -->
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
          <!-- Input para número de colaboradores -->
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
        <!-- Input para faturamento -->
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
          <!-- Input para telefone de contato -->
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
          <!-- Input para nome de contato -->
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
        <!-- Input para observação -->
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
      <!-- Painel 1 -->
      <div v-show="activeStep === 1">
        <div class="flex items-center justify-between gap-2">
          <h3>Localizações</h3>
          <!-- Adicionar localização -->
          <ElButton :icon="Plus" size="small" @click="handleAddLocation">
            Adicionar Endereço
          </ElButton>
        </div>
        <!-- Lista de localização/endereço -->
        <div class="mt-3">
          <div
            class="w-full mb-3 bg-gray-200 dark:bg-white/5 px-4 pt-4 pb-2 rounded"
            v-for="(localizacao, index) in formData.localizacoes"
            :key="localizacao.key"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center justify-center">
                <ElButton size="small"> Endereço {{ index + 1 }} </ElButton>
                <!-- Botão para pegar localização do GPS -->
                <ElButton
                  class="!flex !items-center !text-blue-400"
                  @click="handleLocation(localizacao)"
                  :icon="MapLocation"
                  size="small"
                >
                  GPS
                </ElButton>
              </div>
              <!-- Remover localização -->
              <ElButton
                @click="handleRemoveLocation(localizacao)"
                class="!text-red-500"
                v-if="index !== 0"
                :icon="Close"
                size="small"
              >
              </ElButton>
            </div>
            <div class="flex flex-col md:flex-row gap-0 md:gap-4">
              <!-- Select de estado -->
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
                  no-match-text="Não encontrado"
                  :disabled="lead.isSubmitting"
                  :options="map.data || []"
                  :loading="map.isLoading"
                  no-data-text="Sem dados"
                  placeholder="Selecione"
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
              <!-- Select de cidade -->
              <ElFormItem
                :prop="'localizacoes.' + index + '.cidade'"
                class="w-full"
                :rules="{
                  message: 'O campo Cidade é obrigatório.',
                  trigger: 'change',
                }"
              >
                <ElSelectV2
                  :disabled="!localizacao.estado || lead.isSubmitting"
                  :options="cidadesPorEstado[localizacao.key] || []"
                  no-match-text="Não encontrado"
                  v-model="localizacao.cidade"
                  placeholder="Selecione"
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
              <!-- Input de rua -->
              <ElFormItem
                :prop="'localizacoes.' + index + '.rua'"
                class="w-full"
                :rules="{
                  whitespace: true,
                  message: 'O campo Rua é obrigatório.',
                  trigger: 'change',
                }"
              >
                <ElInput
                  :disabled="!localizacao.estado || lead.isSubmitting"
                  placeholder="Digite o nome da rua"
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
              <!-- Input de CEP -->
              <ElFormItem
                :prop="'localizacoes.' + index + '.cep'"
                class="w-full"
                :rules="[
                  {
                    whitespace: true,
                    message: 'O campo CEP é obrigatório.',
                    trigger: 'change',
                  },
                ]"
              >
                <ElInput
                  :disabled="!localizacao.estado || lead.isSubmitting"
                  placeholder="Digite o CEP"
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
              <!-- Input de número -->
              <ElFormItem
                :prop="'localizacoes.' + index + '.numero'"
                class="w-full md:w-3/5"
                :rules="{
                  whitespace: true,
                  message: 'O campo Número é obrigatório.',
                  trigger: 'change',
                }"
              >
                <ElInput
                  :disabled="!localizacao.estado || lead.isSubmitting"
                  v-model="localizacao.numero"
                  :maxlength="maxLengthCep"
                  placeholder="000"
                  size="large"
                  clearable
                >
                  <template #prefix>
                    <span class="mr-0.5">Nº</span>
                  </template>
                </ElInput>
              </ElFormItem>
            </div>
            <!-- Input de complemento -->
            <ElFormItem
              :prop="'localizacoes.' + index + '.complemento'"
              class="w-full"
              :rules="{
                whitespace: true,
                message:
                  'O campo Complemento não pode conter apenas espaços em branco.',
                trigger: 'change',
              }"
            >
              <ElInput
                :disabled="!localizacao.estado || lead.isSubmitting"
                placeholder="Digite o complemento"
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
    <!-- Grupo de botão do footer -->
    <template #footer>
      <ElButton @click="closeEditModal"> Cancelar </ElButton>
      <ElButton :disabled="lead.isSubmitting" @click="handleReset">
        Resetar
      </ElButton>
      <ElButton
        :icon="activeStep === 0 ? ArrowRightBold : ArrowLeftBold"
        @click="toggleStep"
      >
        {{ activeStep === 0 ? "Avançar" : "Voltar" }}
      </ElButton>
      <ElButton
        :disabled="lead.isSubmitting"
        v-if="activeStep === 1"
        class="!mt-4 md:!mt-0"
        @click="handleEdit"
        type="primary"
        :icon="Check"
      >
        Salvar
      </ElButton>
    </template>
  </ElDialog>
</template>

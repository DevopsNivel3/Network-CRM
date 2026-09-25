<script setup lang="ts">
import {
  OfficeBuilding,
  Cellphone,
  Edit,
  InfoFilled,
  Clock,
  Postcard,
  UserFilled,
  Suitcase,
  Loading,
} from "@element-plus/icons-vue";

const { isDark } = useTheme();
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
const isEditOpen = ref(false);
const empresaModules = computed(() =>
  normalizePermissionModules(empresa.data?.modulos as any),
);
const getPermissionModuleLabel = (module: string) => module;

// Abre o modal de edição
const openEditModal = () => (isEditOpen.value = true);

// Fecha o modal de visualização
const closeViewModal = () => {
  activePaneName.value = "info";
  isOpen.value = false;
};

// Ações para executar ao mudar de painel
const activePaneName = ref<string>("info");
// const handlePaneClick = async (tab: TabsPaneContext) => {
//   if (tab.paneName?.toString() === "oportunidades") {
//     oportunidades.clearFilters();
//     await oportunidades.findByLeadId(lead.data?.id);
//   } else {
//     oportunidades.clearFilters();
//   }
// };
</script>

<template>
  <ElDialog
    class="!w-full md:!w-[1000px]"
    v-model="isOpen"
    title="Visualizando Empresa"
    @close="closeViewModal"
    destroy-on-close
    :z-index="1500"
    :show-close="false"
    align-center
  >
    <template #header>
      <UIDialogHeader title="Visualizando Empresa" @close="closeViewModal" />
    </template>
    <div
      class="flex flex-col-reverse md:flex-row w-full"
      v-if="!empresa.isLoading"
    >
      <!-- Quadro de Informações -->
      <div
        class="md:min-w-[230px] md:max-w-[230px] space-y-4 md:space-y-8 py-4 md:pr-4 border-y-[0.5px] md:rounded-r-[4px] md:border-r-[0.5px] border-y-black/10 dark:border-y-white/10 md:border-r-black/10 dark:md:border-r-white/10 md:mr-4"
      >
        <h1
          class="flex items-center gap-2 font-semibold tracking-wider uppercase"
        >
          <ElIcon size="large">
            <InfoFilled />
          </ElIcon>
          Informações
        </h1>
        <div
          class="flex md:flex-col flex-row md:items-start gap-2 items-center md:space-y-6"
        >
          <!-- Mostra o Id -->
          <div class="space-y-2 w-full">
            <h3 class="text-sm">ID do Empresa</h3>
            <div class="flex items-center gap-1">
              <span class="text-sm text-black/80 dark:text-white/80">
                #{{ empresa?.data?.id }}
              </span>
            </div>
          </div>
          <!-- Mostra o status -->
          <div class="space-y-2 w-full">
            <h3 class="text-sm">Status</h3>
            <div class="flex items-center gap-1">
              <ElTag
                effect="dark"
                :class="{
                  '!bg-red-400 !border-red-400': empresa.data?.desativado,
                  '!bg-nivel !border-nivel !text-black':
                    !empresa.data?.desativado,
                }"
                :type="!empresa.data?.desativado ? 'primary' : 'danger'"
                disable-transitions
              >
                <span class="font-medium">
                  {{ !empresa.data?.desativado ? "Ativo" : "Inativo" }}
                </span>
              </ElTag>
            </div>
          </div>
        </div>
        <div
          class="flex md:flex-col flex-row md:items-start gap-2 items-center md:space-y-8"
        >
          <!-- Mostra a data que foi criado -->
          <div class="space-y-2 w-full">
            <h3 class="text-sm">Criado em</h3>
            <div class="flex items-center gap-1">
              <ElIcon size="large">
                <Clock />
              </ElIcon>
              <span class="text-xs truncate text-black/80 dark:text-white/80">
                {{
                  $dayjs(empresa.data?.criado).format(
                    "DD[/]MM[/]YYYY, [às] HH:mm",
                  )
                }}
              </span>
            </div>
          </div>
          <!-- Mostra a data foi atualizado pela última vez -->
          <div class="space-y-2 w-full">
            <h3 class="text-sm">Última Atualização</h3>
            <div class="flex items-center gap-1">
              <ElIcon size="large">
                <Clock />
              </ElIcon>
              <span class="text-xs truncate text-black/80 dark:text-white/80">
                {{
                  $dayjs(empresa.data?.atualizado).format(
                    "DD[/]MM[/]YYYY, [às] HH:mm",
                  )
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex text- flex-col gap-4 w-full !break-all">
        <!-- Paineis -->
        <ElTabs
          class="!h-full !bg-transparent !border-[0.5px] !p-0 !border-black/10 dark:!border-white/10 !rounded"
          v-model="activePaneName"
          type="border-card"
        >
          <ElScrollbar class="!h-full !w-full">
            <!-- Painel de Informações -->
            <ElTabPane label="Dados" name="info" class="!flex !flex-col !gap-2">
              <!-- Aparece caso a empresa esteja inativa -->
              <ElAlert
                v-if="empresa.data?.desativado"
                title="O Empresa está inativo, portanto nenhum usuário possui permissão para acessar o sistema."
                :effect="isDark ? 'light' : 'dark'"
                class="!text-balance !py-2"
                :closable="false"
                type="warning"
                show-icon
              />
              <div class="flex flex-col md:flex-row w-full items-center gap-4">
                <!-- Mostra o nome -->
                <div class="w-full space-y-1">
                  <h3>Nome</h3>
                  <div
                    class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                  >
                    <ElIcon>
                      <Suitcase />
                    </ElIcon>
                    {{ empresa.data?.nome }}
                  </div>
                </div>
                <!-- Mostra o nome -->
                <div class="w-full space-y-1">
                  <h3>E-mail</h3>
                  <div
                    class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                  >
                    <ElIcon>
                      <Postcard />
                    </ElIcon>
                    <a
                      :href="toMail(empresa.data?.email)"
                      class="underline transition-opacity hover:opacity-70 cursor-pointer"
                    >
                      {{ empresa.data?.email }}
                    </a>
                  </div>
                </div>
              </div>
              <div class="w-full space-y-1">
                <h3>Empresa do Grupo</h3>
                <div
                  class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                >
                  <ElIcon>
                    <OfficeBuilding />
                  </ElIcon>
                  {{ empresa.data?.grupo || "Não informado" }}
                </div>
              </div>
              <!-- Mostra o telefone para contato -->
              <div class="w-full space-y-1">
                <h3>Telefone para Contato</h3>
                <div
                  class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                >
                  <ElIcon>
                    <Cellphone />
                  </ElIcon>
                  <a
                    :href="toTel(empresa.data?.contato)"
                    class="underline transition-opacity hover:opacity-70"
                  >
                    {{ formatPhone(String(empresa.data?.contato)) }}
                  </a>
                </div>
              </div>
              <div
                class="flex flex-col md:flex-row w-full items-center text-wrap md:text-nowrap gap-4"
              >
                <!-- Mostra o número de empresas -->
                <div class="w-full space-y-1">
                  <h3>Nº de Empresas</h3>
                  <div
                    class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                  >
                    <ElIcon>
                      <OfficeBuilding />
                    </ElIcon>
                    {{ formatNumber(String(empresa.data?._count?.leads)) }}
                  </div>
                </div>
                <!-- Mostra o número de usuários -->
                <div class="w-full space-y-1">
                  <h3>Nº de Usuários</h3>
                  <div
                    class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                  >
                    <ElIcon>
                      <UserFilled />
                    </ElIcon>
                    {{ formatNumber(String(empresa.data?._count?.usuarios)) }}
                  </div>
                </div>
              </div>
              <!-- Módulos liberados -->
              <div class="w-full space-y-1">
                <h3>Módulos liberados</h3>
                <div class="flex flex-wrap gap-2">
                  <ElTag
                    v-for="module in empresaModules"
                    :key="module"
                    effect="dark"
                    type="primary"
                    disable-transitions
                  >
                    {{ getPermissionModuleLabel(module) }}
                  </ElTag>
                </div>
              </div>
            </ElTabPane>
          </ElScrollbar>
        </ElTabs>
      </div>
    </div>
    <!-- Grupo de botão do footer -->
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="closeViewModal"> Fechar </ElButton>
        <ElButton
          :disabled="empresa.isSubmitting"
          v-if="!empresa.isLoading"
          @click="openEditModal"
          type="primary"
          :icon="Edit"
        >
          Editar
        </ElButton>
      </div>
    </template>
    <!-- Tela de carregamento -->
    <div
      v-if="empresa.isLoading"
      class="flex items-center justify-center h-96 w-full"
    >
      <ElIcon class="is-loading" color="var(--el-color-primary)" size="25">
        <Loading />
      </ElIcon>
    </div>
  </ElDialog>
  <!-- Modal de edição -->
  <EmpresaEditModal v-model="isEditOpen" />
</template>

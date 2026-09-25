<script setup lang="ts">
import {
  ArrowDown,
  Clock,
  Download,
  Filter,
  Link as LinkIcon,
  Location,
  Monitor,
  Refresh,
  View,
} from "@element-plus/icons-vue";

interface AuditDetail { label: string; value: string }
interface AuditItem {
  id: number; operacao: string; operacaoLabel: string; titulo: string; resumo: string;
  detalhes: AuditDetail[]; link: string | null; ip: string; navegador: string;
  dispositivo: string; criado: string;
}
interface AuditResponse {
  data: AuditItem[]; total: number; page: number; totalPages: number;
  resumo: Record<string, number>;
}

const usuario = useUsuario();
const dayjs = useDayjs();
const loading = ref(false);
const exporting = ref(false);
const page = ref(1);
const perPage = 20;
const operation = ref("ALL");
const filtersOpen = ref(false);
const defaultStartDate = () => dayjs().subtract(30, "day").format("YYYY-MM-DD");
const defaultEndDate = () => dayjs().format("YYYY-MM-DD");
const startDate = ref<string | null>(defaultStartDate());
const endDate = ref<string | null>(defaultEndDate());
const appliedStartDate = ref<string | null>(startDate.value);
const appliedEndDate = ref<string | null>(endDate.value);
const appliedOperation = ref(operation.value);
const response = ref<AuditResponse>({ data: [], total: 0, page: 1, totalPages: 0, resumo: {} });
const selected = ref<AuditItem | null>(null);
const detailsOpen = ref(false);

const operationLabel = computed(() => ({
  ALL: "Todas as operações",
  CREATE: "Criações",
  UPDATE: "Atualizações",
  DELETE: "Exclusões",
  VIEW: "Visualizações e acessos",
}[appliedOperation.value] || "Todas as operações"));
const periodLabel = computed(() => {
  const start = appliedStartDate.value ? dayjs(appliedStartDate.value).format("DD/MM/YYYY") : "início";
  const end = appliedEndDate.value ? dayjs(appliedEndDate.value).format("DD/MM/YYYY") : "hoje";
  return `${start} até ${end}`;
});

const query = computed(() => ({
  page: page.value,
  perPage,
  operacao: appliedOperation.value,
  ...(appliedStartDate.value ? { inicio: appliedStartDate.value } : {}),
  ...(appliedEndDate.value ? { fim: appliedEndDate.value } : {}),
}));

const load = async () => {
  if (!usuario.data?.id) return;
  loading.value = true;
  try {
    response.value = await useApi<AuditResponse>(`/api/usuarios/${usuario.data.id}/logs`, {
      method: "GET", query: query.value,
    });
  } catch (err: any) {
    ElMessage.error({ message: err?.data?.message || "Não foi possível carregar os logs", customClass: "!z-[2500]" });
  } finally {
    loading.value = false;
  }
};

const applyFilters = async () => {
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    ElMessage.warning({ message: "A data inicial não pode ser maior que a data final", customClass: "!z-[2500]" });
    return;
  }
  appliedStartDate.value = startDate.value;
  appliedEndDate.value = endDate.value;
  appliedOperation.value = operation.value;
  page.value = 1;
  await load();
  filtersOpen.value = false;
};
const resetFilters = async () => {
  startDate.value = defaultStartDate();
  endDate.value = defaultEndDate();
  operation.value = "ALL";
  await applyFilters();
};
const changePage = async (value: number) => { page.value = value; await load() };
const showDetails = (item: AuditItem) => { selected.value = item; detailsOpen.value = true };
const operationType = (name: string) => ({
  CREATE: "success", UPDATE: "warning", DELETE: "danger", VIEW: "info",
}[name] || "info") as "success" | "warning" | "danger" | "info";

const exportLogs = async () => {
  if (!usuario.data?.id) return;
  exporting.value = true;
  try {
    const { token } = useAuth();
    const params = new URLSearchParams({
      operacao: appliedOperation.value,
      ...(appliedStartDate.value ? { inicio: appliedStartDate.value } : {}),
      ...(appliedEndDate.value ? { fim: appliedEndDate.value } : {}),
    });
    const res = await fetch(`/api/usuarios/${usuario.data.id}/logs/export?${params}`, {
      headers: token.value ? { Authorization: token.value } : {},
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error?.message || "Erro ao exportar os logs");
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "logs-usuario.xlsx";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    ElMessage.success({ message: "Logs exportados com sucesso", customClass: "!z-[2500]" });
  } catch (err: any) {
    ElMessage.error({ message: err?.message || "Não foi possível exportar os logs", customClass: "!z-[2500]" });
  } finally {
    exporting.value = false;
  }
};

onMounted(load);
watch(() => usuario.data?.id, (id, previousId) => {
  if (id && previousId && id !== previousId) { page.value = 1; load() }
});
</script>

<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
    <div class="shrink-0 border-b border-black/10 bg-black/[0.015] p-3 dark:border-white/10 dark:bg-white/[0.02]">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-start gap-2">
          <ElIcon class="mt-0.5 shrink-0"><Filter /></ElIcon>
          <div class="min-w-0">
            <h3 class="text-sm font-medium">Filtros da auditoria</h3>
            <p class="truncate text-xs text-black/55 dark:text-white/55">
              {{ periodLabel }} · {{ operationLabel }}
            </p>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <ElButton size="small" :icon="Download" :loading="exporting" @click="exportLogs">
            <span class="hidden sm:inline">Baixar Excel</span>
          </ElButton>
          <ElButton size="small" @click="filtersOpen = !filtersOpen">
            {{ filtersOpen ? "Minimizar" : "Filtrar" }}
            <ElIcon class="ml-1 transition-transform" :class="{ 'rotate-180': filtersOpen }">
              <ArrowDown />
            </ElIcon>
          </ElButton>
        </div>
      </div>

      <div v-show="filtersOpen" class="mt-3 border-t border-black/10 pt-3 dark:border-white/10">
        <div class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="min-w-0">
          <div class="mb-1 text-xs text-black/60 dark:text-white/60">Data inicial</div>
          <ElDatePicker v-model="startDate" type="date" value-format="YYYY-MM-DD"
            format="DD/MM/YYYY" placeholder="Selecione a data inicial" clearable class="!w-full" />
        </div>
        <div class="min-w-0">
          <div class="mb-1 text-xs text-black/60 dark:text-white/60">Data final</div>
          <ElDatePicker v-model="endDate" type="date" value-format="YYYY-MM-DD"
            format="DD/MM/YYYY" placeholder="Selecione a data final" clearable class="!w-full" />
        </div>
        <div class="min-w-0 sm:col-span-2">
          <div class="mb-1 text-xs text-black/60 dark:text-white/60">Tipo de operação</div>
          <ElSelect v-model="operation" class="!w-full">
              <ElOption label="Todas as operações" value="ALL" />
              <ElOption label="Criações" value="CREATE" />
              <ElOption label="Atualizações" value="UPDATE" />
              <ElOption label="Exclusões" value="DELETE" />
              <ElOption label="Visualizações, login e logout" value="VIEW" />
          </ElSelect>
        </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <ElButton :disabled="loading" @click="resetFilters">Restaurar período</ElButton>
          <ElButton type="primary" :icon="Refresh" :loading="loading" @click="applyFilters">Aplicar filtros</ElButton>
        </div>
      </div>

      <div class="mt-2 flex flex-wrap gap-1.5 text-xs">
        <ElTag effect="plain">Total: {{ response.total }}</ElTag>
        <ElTag v-if="response.resumo.CREATE" type="success" effect="plain">Criações: {{ response.resumo.CREATE }}</ElTag>
        <ElTag v-if="response.resumo.UPDATE" type="warning" effect="plain">Atualizações: {{ response.resumo.UPDATE }}</ElTag>
        <ElTag v-if="response.resumo.DELETE" type="danger" effect="plain">Exclusões: {{ response.resumo.DELETE }}</ElTag>
        <ElTag v-if="response.resumo.VIEW" type="info" effect="plain">Visualizações/acessos: {{ response.resumo.VIEW }}</ElTag>
      </div>
    </div>

    <ElScrollbar v-loading="loading" class="min-h-0 flex-1">
      <div v-if="response.data.length" class="space-y-3 p-3">
        <article v-for="item in response.data" :key="item.id"
          class="rounded border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <ElTag :type="operationType(item.operacao)" size="small" effect="dark">{{ item.operacaoLabel }}</ElTag>
                <h3 class="font-medium">{{ item.titulo }}</h3>
              </div>
              <p class="mt-2 line-clamp-2 break-words text-sm text-black/65 dark:text-white/65">{{ item.resumo }}</p>
            </div>
            <div class="shrink-0 text-xs text-black/55 dark:text-white/55">
              <ElIcon class="mr-1"><Clock /></ElIcon>{{ dayjs(item.criado).format("DD/MM/YYYY [às] HH:mm:ss") }}
            </div>
          </div>
          <div class="mt-3 flex flex-col gap-2 border-t border-black/5 pt-3 text-xs dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-black/55 dark:text-white/55">
              <span><ElIcon class="mr-1"><Location /></ElIcon>{{ item.ip }}</span>
              <span><ElIcon class="mr-1"><Monitor /></ElIcon>{{ item.dispositivo }} · {{ item.navegador }}</span>
            </div>
            <div class="flex gap-2">
              <ElButton size="small" :icon="View" @click="showDetails(item)">Ver detalhes</ElButton>
              <ElButton v-if="item.link" size="small" type="primary" plain :icon="LinkIcon">
                <NuxtLink :to="item.link" target="_blank">Abrir registro</NuxtLink>
              </ElButton>
            </div>
          </div>
        </article>
      </div>
      <ElEmpty v-else-if="!loading" description="Nenhuma atividade encontrada neste período." />
    </ElScrollbar>

    <div v-if="response.total > perPage" class="flex justify-center border-t border-black/10 p-2 dark:border-white/10">
      <ElPagination :current-page="page" :page-size="perPage" :total="response.total"
        layout="prev, pager, next" @current-change="changePage" />
    </div>

    <ElDialog v-model="detailsOpen" title="Detalhes da atividade" width="min(720px, 96vw)"
      append-to-body :z-index="2300">
      <div v-if="selected" class="space-y-4">
        <div class="rounded bg-black/[0.03] p-3 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center gap-2">
            <ElTag :type="operationType(selected.operacao)" effect="dark">{{ selected.operacaoLabel }}</ElTag>
            <strong>{{ selected.titulo }}</strong>
          </div>
          <div class="mt-2 text-sm text-black/60 dark:text-white/60">
            {{ dayjs(selected.criado).format("DD/MM/YYYY [às] HH:mm:ss") }} · IP {{ selected.ip }}
          </div>
        </div>
        <ElDescriptions v-if="selected.detalhes.length" :column="1" border>
          <ElDescriptionsItem v-for="detail in selected.detalhes"
            :key="`${detail.label}-${detail.value}`" :label="detail.label">
            <span class="break-words">{{ detail.value }}</span>
          </ElDescriptionsItem>
        </ElDescriptions>
        <p v-else class="text-sm">{{ selected.resumo }}</p>
        <div class="rounded border border-black/10 p-3 text-sm dark:border-white/10">
          <div><strong>Dispositivo:</strong> {{ selected.dispositivo }}</div>
          <div><strong>Navegador:</strong> {{ selected.navegador }}</div>
        </div>
        <div v-if="selected.link" class="flex justify-end">
          <ElButton type="primary" :icon="LinkIcon">
            <NuxtLink :to="selected.link" target="_blank">Abrir registro relacionado</NuxtLink>
          </ElButton>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

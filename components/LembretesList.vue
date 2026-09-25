<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Clock, WarningFilled, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';

const stats = useStats();

const lembretes = ref<any[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const page = ref(1);
const perPage = ref(25);
const total = ref(0);

interface LembretesResponse {
  data: any[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

const fetchLembretes = async (append = false) => {
  try {
    if (append) loadingMore.value = true;
    else loading.value = true;
    const response = await useApi<LembretesResponse>('/api/lembretes', {
      method: 'GET',
      query: {
        status: 'Pendente',
        page: page.value,
        perPage: perPage.value,
        ...(stats.appliedBoardId !== 'all' ? { boardId: stats.appliedBoardId } : {}),
        ...(stats.appliedOpportunityId !== 'all'
          ? { opportunityId: stats.appliedOpportunityId }
          : {}),
      },
    });
    lembretes.value = append
      ? [...lembretes.value, ...response.data]
      : response.data;
    page.value = response.pagination.page;
    perPage.value = response.pagination.perPage;
    total.value = response.pagination.total;
  } catch (err) {
    if (append) page.value = Math.max(page.value - 1, 1);
    console.error('Erro ao buscar lembretes:', err);
  } finally {
    if (append) loadingMore.value = false;
    else loading.value = false;
  }
};

const loadMore = async () => {
  if (loading.value || loadingMore.value || lembretes.value.length >= total.value) return;
  page.value += 1;
  await fetchLembretes(true);
};

const completeLembrete = async (id: number) => {
  try {
    await useApi(`/api/lembretes/${id}`, {
      method: 'PATCH',
      body: { status: 'Concluido' }
    });
    ElMessage.success('Lembrete concluído!');
    page.value = 1;
    await fetchLembretes();
  } catch (err) {
    ElMessage.error('Erro ao concluir lembrete');
  }
};

const getPriorityColor = (priority: string) => {
  if (priority === 'Alta') return 'danger';
  if (priority === 'Media') return 'warning';
  return 'info';
};

const isOverdue = (date: string) => {
  return dayjs().isAfter(dayjs(date), 'day');
};

const navigateToLeadOrOp = (lembrete: any) => {
  if (lembrete.oportunidade_id) {
    navigateTo(`/crm/oportunidades?id=${lembrete.oportunidade_id}&tab=interacoes`);
  } else if (lembrete.lead_id) {
    navigateTo(`/crm/leads?id=${lembrete.lead_id}&tab=observacoes`);
  }
};

onMounted(() => {
  fetchLembretes();
});

watch(() => stats.filterVersion, async () => {
  page.value = 1;
  await fetchLembretes();
});
</script>

<template>
  <div class="app-surface w-full p-4 h-[320px] max-h-[320px] flex flex-col">
    <div class="flex items-center justify-between mb-3 shrink-0">
      <h3 class="text-xs font-semibold uppercase text-gray-500 flex items-center gap-2">
        <ElIcon><Clock /></ElIcon>
        Lembretes e Follow-ups
      </h3>
      <ElTag size="small" type="info">{{ total }} pendentes</ElTag>
    </div>

    <div
      class="flex-1 overflow-y-auto pr-2 space-y-3"
      v-loading="loading"
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="loading || loadingMore || lembretes.length >= total"
      :infinite-scroll-immediate="false"
      :infinite-scroll-distance="80"
    >
      <div v-if="lembretes.length === 0" class="text-center text-gray-400 dark:text-gray-500 text-sm py-10">
        Nenhum lembrete pendente.
      </div>
      
      <div 
        v-for="lembrete in lembretes" 
        :key="lembrete.id"
        class="p-3 rounded-lg border dark:border-white/10 flex items-start gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
        :class="isOverdue(lembrete.data_vencimento) ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10' : ''"
        @click="navigateToLeadOrOp(lembrete)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <ElTag :type="getPriorityColor(lembrete.prioridade)" size="small" effect="dark">
              {{ lembrete.prioridade }}
            </ElTag>
            <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ lembrete.lead?.nome_lead || lembrete.oportunidade?.descricao || 'Lead/Oportunidade' }}
            </span>
            <span v-if="isOverdue(lembrete.data_vencimento)" class="text-xs text-red-500 flex items-center gap-1">
              <ElIcon><WarningFilled /></ElIcon> Atrasado
            </span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {{ lembrete.descricao }}
          </p>
          <div class="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-500">
            <span>Vence em: {{ dayjs(lembrete.data_vencimento).format('DD/MM/YYYY') }}</span>
            <span v-if="lembrete.usuario?.nome" class="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-3">
              Resp: {{ lembrete.usuario.nome }}
            </span>
          </div>
        </div>
        
        <ElTooltip content="Marcar como concluído" placement="left">
          <ElButton 
            type="success" 
            circle 
            plain 
            size="small"
            @click.stop="completeLembrete(lembrete.id)"
          >
            <ElIcon><Check /></ElIcon>
          </ElButton>
        </ElTooltip>
      </div>
      <div v-if="loadingMore" class="py-3 flex justify-center">
        <span class="loading loading-infinity loading-sm" />
      </div>
    </div>
  </div>
</template>

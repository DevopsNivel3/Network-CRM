<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { Rank, RefreshLeft } from "@element-plus/icons-vue";

const { user } = useAuthSession();
const leads = useLeads();
const oportunidades = useOportunidades();
const { columns, saving: savingGrid, load: loadGrid, save: saveGrid, reset: resetGrid } = useLeadGridPreferences();
const visibleCount = computed(() => columns.value.filter((column) => column.visible).length);

const persistGrid = async () => {
    try { await saveGrid(); ElMessage.success("Visualização da grade salva."); }
    catch { ElMessage.error("Não foi possível salvar a visualização da grade."); }
};
const restoreGrid = async () => {
    try { await resetGrid(); ElMessage.success("Visualização padrão restaurada."); }
    catch { ElMessage.error("Não foi possível restaurar a visualização."); }
};

const origemLeadOptions = [
    { label: "Indicação", value: "indicacao" },
    { label: "Facebook", value: "facebook" },
    { label: "Google", value: "google" },
    { label: "PAP", value: "pap" },
    { label: "SDR", value: "sdr" },
    { label: "Instagram", value: "instagram" },
    { label: "LinkedIn", value: "linkedin" },
    { label: "WhatsApp", value: "whatsapp" },
    { label: "Email", value: "email" },
    { label: "Evento", value: "evento" },
    { label: "Site", value: "site" },
    { label: "Networking", value: "networking" },
    { label: "Inbound", value: "inbound" },
    { label: "Outbound", value: "outbound" },
    { label: "Telemarketing", value: "telemarketing" },
    { label: "Vendas Diretas", value: "vendas_diretas" },
];

onMounted(async () => {
    await Promise.all([
        oportunidades.boards.data?.length ? Promise.resolve() : oportunidades.findAllBoards(),
        loadGrid(),
    ]);
});
</script>

<template>
    <!-- Menu de Filtro -->
    <UIFilterMenu :reset="leads.clearFilters">
        <template #default>
            <FilterSearch
                @change="leads.setFilterByName"
                :value="leads.filterByName"
                label="Nome, CNPJ ou telefone"
            />
            <FilterSelect
                @change="leads.setFilterByOrigin"
                :value="leads.filterByOrigin"
                label="Origem"
                placeholder="Selecione uma origem"
                :options="origemLeadOptions"
                have-all
            />
            <FilterStatusOportunidade
                @change="leads.setFilterByStatus"
                :value="leads.filterByStatus"
                label="Status"
                :show-label="true"
                :have-all="true"
            />
            <ElCheckbox
                :model-value="leads.filterWithoutInteraction"
                @change="(value: any) => leads.setFilterWithoutInteraction(Boolean(value))"
            >
                Sem interação
            </ElCheckbox>
            <FilterBetweenDates
                @change="leads.setFilterByBetweenDates"
                :value="leads.filterByBetweenDates"
                :showLabel="true"
            />
            <FilterBetweenDates
                @change="leads.setFilterByInteractionDates"
                :value="leads.filterByInteractionDates"
                label="Última Interação"
                :showLabel="true"
            />
            <FilterUser
                v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
                @change="leads.setFilterByUserId"
                :value="leads.filterByUserId"
                :show-label="true"
                :have-all="true"
            />
            <FilterLeadGroup
                @change="leads.setFilterByGroupIds"
                :value="leads.filterByGroupIds"
                :showLabel="true"
            />
            <FilterCity
                @change="leads.setFilterByCity"
                :value="leads.filterByCity"
                :showLabel="true"
                :have-all="true"
            />
            <div class="mt-2 border-t pt-4 dark:border-white/15">
                <div class="mb-1 flex items-center justify-between gap-2">
                    <div>
                        <h4 class="text-sm font-semibold">Colunas da grade</h4>
                        <p class="text-xs text-black/50 dark:text-white/50">Arraste para ordenar e escolha o que será exibido.</p>
                    </div>
                    <ElButton :icon="RefreshLeft" text size="small" :loading="savingGrid" @click="restoreGrid">Restaurar</ElButton>
                </div>
                <VueDraggable v-model="columns" handle=".column-drag-handle" :animation="180" class="mt-3 space-y-2">
                    <div v-for="column in columns" :key="column.key" class="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 dark:border-white/15 dark:bg-white/5">
                        <ElIcon class="column-drag-handle cursor-grab text-black/35 active:cursor-grabbing dark:text-white/35"><Rank /></ElIcon>
                        <span class="min-w-0 flex-1 truncate text-sm">{{ column.label }}</span>
                        <ElSwitch v-model="column.visible" :disabled="column.visible && visibleCount === 1" size="small" />
                    </div>
                </VueDraggable>
                <ElButton class="mt-3 !w-full" type="primary" :loading="savingGrid" @click="persistGrid">Salvar visualização</ElButton>
            </div>
        </template>
        <template #submit>
            <FilterSubmit
                @click="
                    async () => {
                        leads.clearPage();
                        await leads.findAll();
                    }
                "
                :loading="leads.isLoading"
            />
        </template>
    </UIFilterMenu>
</template>

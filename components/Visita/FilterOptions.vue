<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { Rank, RefreshLeft } from "@element-plus/icons-vue";

const visitas = useVisitas();
const { columns, saving, load, save, reset } = useVisitGridPreferences();
const visibleCount = computed(() => columns.value.filter((column) => column.visible).length);

const persistGrid = async () => {
  try { await save(); ElMessage.success("Visualização da grade salva."); }
  catch { ElMessage.error("Não foi possível salvar a visualização da grade."); }
};
const restoreGrid = async () => {
  try { await reset(); ElMessage.success("Visualização padrão restaurada."); }
  catch { ElMessage.error("Não foi possível restaurar a visualização."); }
};
onMounted(load);
</script>

<template>
  <!-- Menu de Filtro -->
  <UIFilterMenu :reset="visitas.clearFilters">
    <template #default>
      <FilterSearch @change="visitas.setFilterByName" :value="visitas.filterByName" label="Lead" />
      <FilterStatusVisita
        @change="visitas.setFilterByStatus"
        :value="visitas.filterByStatus"
        :have-all="true"
      />
      <FilterCity
        @change="visitas.setFilterByCity"
        :value="visitas.filterByCity"
        :showLabel="true"
        :have-all="true"
      />
      <div class="mt-2 border-t pt-4 dark:border-white/15">
        <div class="mb-1 flex items-center justify-between gap-2">
          <div>
            <h4 class="text-sm font-semibold">Colunas da grade</h4>
            <p class="text-xs text-black/50 dark:text-white/50">Arraste para ordenar e escolha o que será exibido.</p>
          </div>
          <ElButton :icon="RefreshLeft" text size="small" :loading="saving" @click="restoreGrid">Restaurar</ElButton>
        </div>
        <VueDraggable v-model="columns" handle=".column-drag-handle" :animation="180" class="mt-3 space-y-2">
          <div v-for="column in columns" :key="column.key" class="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 dark:border-white/15 dark:bg-white/5">
            <ElIcon class="column-drag-handle cursor-grab text-black/35 active:cursor-grabbing dark:text-white/35"><Rank /></ElIcon>
            <span class="min-w-0 flex-1 truncate text-sm">{{ column.label }}</span>
            <ElSwitch v-model="column.visible" :disabled="column.visible && visibleCount === 1" size="small" />
          </div>
        </VueDraggable>
        <ElButton class="mt-3 !w-full" type="primary" :loading="saving" @click="persistGrid">Salvar visualização</ElButton>
      </div>
    </template>
    <template #submit>
      <FilterSubmit
        @click="
          async () => {
            visitas.clearPage();
            await visitas.findAll();
          }
        "
        :loading="visitas.isLoading"
      />
    </template>
  </UIFilterMenu>
</template>

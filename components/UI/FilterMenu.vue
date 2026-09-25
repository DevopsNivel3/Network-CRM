<script setup lang="ts">
import { Filter, RefreshLeft } from "@element-plus/icons-vue";

// Passa o método reset para limpar o filtro
const props = defineProps<{
  reset: () => void;
}>();
</script>

<template>
  <div class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div class="flex shrink-0 items-center justify-between gap-2 px-4 py-4 dark:!border-white/15 !border-b">
      <!-- Título do filtro -->
      <div class="flex items-center gap-2">
        <ElIcon>
          <Filter />
        </ElIcon>
        <h3 class="font-bold text-sm uppercase tracking-widest">Filtro</h3>
      </div>
      <!-- Botão para reiniciar o filtro -->
      <ElButton @click="() => props.reset()" :icon="RefreshLeft" type="text">Reiniciar</ElButton>
    </div>
    <!-- Slot para adicionar os campos de filtro -->
    <ElScrollbar class="min-h-0 flex-1">
      <div class="grow flex flex-col gap-4 px-4 py-3">
        <slot />
      </div>
    </ElScrollbar>
    <!-- Botão para enviar o filtro -->
    <div class="w-full shrink-0 dark:!border-white/15 !border-t">
      <div class="px-4 py-3">
        <slot name="submit" />
      </div>
    </div>
  </div>
</template>

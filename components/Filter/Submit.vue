<script setup lang="ts">
const props = defineProps<{
  label?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  click: [void];
}>();
</script>

<template>
  <ElButton @click="emit('click')" :disabled="props.loading" class="!w-full" type="primary">
    {{ props.label ?? "Aplicar filtros" }}
  </ElButton>
</template>

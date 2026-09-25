<script setup lang="ts">
interface SearchProps {
  label?: string;
  value?: string | null;
  placeholder?: string;
}

const props = defineProps<SearchProps>();
const localValue = computed({
  get: () => props.value,
  set: (value: any) => emit("change", value),
});

const emit = defineEmits<{
  change: [value: string | null];
}>();
</script>

<template>
  <div class="flex flex-col w-full gap-2">
    <span class="text-xs text-black/80 dark:text-white/80">
      {{ props.label ?? "Buscar" }}
    </span>
    <ElInput
      @change="(value: string) => emit('change', value)"
      :placeholder="props.placeholder || 'Pesquisar'"
      v-model="localValue"
      class="!w-full"
      clearable
    />
  </div>
</template>

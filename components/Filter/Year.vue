<script setup lang="ts">
interface YearProps {
  label?: string;
  value: string;
  placeholder?: string;
}

const props = defineProps<YearProps>();
const localValue = computed({
  get: () => props.value,
  set: (value: any) => emit("change", value),
});

const emit = defineEmits<{
  change: [value: string];
}>();
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <span class="text-xs text-black/80 dark:text-white/80">
      {{ props.label ?? "Ano" }}
    </span>
    <ElDatePicker
      @change="(value: string) => emit('change', value)"
      :placeholder="props.placeholder || 'Selecionar'"
      v-model="localValue"
      value-format="YYYY"
      :clearable="false"
      class="!w-full"
      type="year"
    />
  </div>
</template>

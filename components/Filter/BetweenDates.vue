<script setup lang="ts">
interface BetweenDatesProps {
  label?: string;
  value?: string[] | null;
  showLabel?: boolean;
}

const props = defineProps<BetweenDatesProps>();

const localValue = computed({
  get: () => props.value || [],
  set: (value: any) => emit("change", value),
});

const emit = defineEmits<{
  change: [value: string[] | null];
}>();
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <span v-if="props.showLabel" class="text-xs text-black/80 dark:text-white/80">
      {{ props.label ?? "Período de criação" }}
    </span>
    <ElDatePicker
      @change="(value: string[]) => emit('change', value)"
      start-placeholder="Início"
      end-placeholder="Término"
      value-format="YYYY-MM-DD"
      v-model="localValue"
      format="DD/MM/YYYY"
      :clearable="false"
      type="daterange"
      class="!w-full"
    />
  </div>
</template>

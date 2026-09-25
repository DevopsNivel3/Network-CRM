<script setup lang="ts">
const props = defineProps({
  text: String,
  position: {
    type: String,
    default: "center",
    validator: (value: string) => ["center", "right", "left"].includes(value),
  },
});
</script>

<template>
  <!-- Texto do divisor -->
  <div :class="'flex items-center gap-2 text-nowrap justify-' + props.position">
    <div v-if="props.position !== 'right'" class="w-[3%] bg-black/10 dark:bg-white/10 h-[0.5px]" />
    <span>{{ props.text }}</span>
    <div v-if="props.position !== 'left'" class="w-full bg-black/10 dark:bg-white/10 h-[0.5px]" />
  </div>
</template>

<script setup lang="ts">
import { Sunny, Moon } from "@element-plus/icons-vue";
const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <!-- Botão para alterar o tema -->
  <button
    class="rounded-full px-2 pt-2 pb-0.5 h-fit transition duration-300 border text-black border-black/10 dark:border-white/20 bg-black/5 hover:bg-black/10 dark:bg-eerie dark:hover:bg-white/10 dark:text-white"
    @click="toggleTheme()"
  >
    <ElIcon size="large">
      <Moon v-if="isDark" />
      <Sunny v-else />
    </ElIcon>
  </button>
</template>

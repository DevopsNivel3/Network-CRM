<script setup lang="ts">
const handleError = () => clearError({ redirect: "/inicio" });
</script>

<template>
  <!-- Página de Erro (Client/Server) -->
  <NuxtLayout>
    <div class="flex items-center justify-center h-full w-full">
      <ElEmpty description="Oops... ocorreu um erro na página">
        <ElButton type="default" @click="handleError"> Voltar ao início </ElButton>
      </ElEmpty>
    </div>
  </NuxtLayout>
</template>

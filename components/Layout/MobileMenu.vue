<script setup lang="ts">
const menu = useMenu();
</script>

<template>
  <!-- Menu Drawer/Sidebar -->
  <ElDrawer
    class="!p-0 !m-0 !w-full flex"
    v-model="menu.state.mobile"
    :with-header="false"
    :show-close="false"
    direction="ltr"
  >
    <ElAside class="!w-full !h-full flex flex-col">
      <LayoutNavigation />
    </ElAside>
  </ElDrawer>
</template>

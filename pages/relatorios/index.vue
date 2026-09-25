<script setup lang="ts">
import {
    Plus,
    OfficeBuilding,
    Folder,
    Filter,
    Loading,
} from "@element-plus/icons-vue";

definePageMeta({
    requiredModule: "CRM",
    requiredPermission: UserPermissions.VER_RELATORIO,
});

const { user } = useAuthSession();

// Para abrir e fechar o filtro de pesquisa
const filterMenu = ref<boolean>(false);
const toggleFilterMenu = () => (filterMenu.value = !filterMenu.value);

// Busca os dados para exibir na tabela quando carrega a página
const isDataLoaded = ref<boolean>(false);
onMounted(async () => {
    isDataLoaded.value = true;
});
</script>

<template>
    <ElScrollbar view-class="!h-full !w-full">
        <div v-if="isDataLoaded">
            <ChartPie />
            <ChartFunnel />
        </div>
        <!-- Tela de carregamento -->
        <div
            v-else
            class="flex items-center justify-center !grow h-full w-full"
        >
            <ElIcon
                class="is-loading"
                color="var(--el-color-primary)"
                size="25"
            >
                <Loading />
            </ElIcon>
        </div>
    </ElScrollbar>
</template>

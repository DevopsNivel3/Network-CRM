<script setup lang="ts">
import { Filter } from "@element-plus/icons-vue";

definePageMeta({
  requiredModule: Modules.CRM,
});

const device = useDevice();
const stats = useStats();

const filterMenu = ref<boolean>(false);
const toggleFilterMenu = () => (filterMenu.value = !filterMenu.value);

const isDataLoaded = ref<boolean>(false);
onMounted(async () => {
  const res = await stats.findAll();
  isDataLoaded.value = res;
});

const { leadsByDayLabel } = useCrmDashboardMetrics();
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between md:bg-gray-50 dark:md:!bg-charcoal dark:!border-white/15 border-b px-4 py-3 gap-3"
    >
      <ElSkeleton
        class="w-full flex items-center justify-between"
        :loading="!isDataLoaded"
        animated
      >
        <template #template>
          <ElSkeletonItem variant="text" class="!hidden md:!block !w-20 !h-5" />
          <ElSkeletonItem variant="text" class="!w-full md:!w-12 !h-8" />
        </template>
        <template #default>
          <div class="hidden md:flex items-center gap-3">
            <h1 class="font-medium text-base text-nowrap">Dashboard</h1>
            <span
              class="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
            >
              Período: {{ leadsByDayLabel }}
            </span>
          </div>
          <div
            class="flex flex-col w-full md:w-auto md:flex-row gap-2 md:gap-4 md:items-center"
          >
            <!-- Botão para abrir o menu de filtro -->
            <HomeDashboardExport />
            <ElTooltip
              :content="!filterMenu ? 'Expandir filtro' : 'Fechar filtro'"
              :disabled="device.isMobile"
              placement="bottom"
              :hide-after="0"
              effect="light"
            >
              <ElButton
                @click="toggleFilterMenu"
                :class="filterMenu ? '!text-nivel !border-nivel' : ''"
                class="w-full md:w-auto"
              >
                <ElIcon class="hidden md:block">
                  <Filter />
                </ElIcon>
                <span class="block md:hidden mr-2">Filtro</span>
              </ElButton>
            </ElTooltip>
          </div>
        </template>
      </ElSkeleton>
    </div>
    <div class="relative flex-1 min-h-0 w-full">
      <!--  Menu do filtro de pesquisa -->
      <div
        class="absolute bg-neutral-50 top-0 bottom-0 right-0 left-0 md:left-auto w-full md:w-[320px] lg:w-[360px] !z-10 border-l-0 md:border-l-[0.5px] dark:border-white/15 dark:bg-eerie shadow-xl md:shadow-none overflow-hidden"
        v-show="filterMenu"
      >
        <HomeFilterOptions />
      </div>
      <ElScrollbar class="!h-full" view-class="!h-full">
        <ElSkeleton
          class="!px-4 md:!px-6 !py-3 w-full"
          :loading="!isDataLoaded || stats.isLoading"
          animated
        >
          <template #template>
            <div class="space-y-6 w-full pb-8">
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <ElSkeletonItem
                  variant="rect"
                  class="!h-36 !w-full !rounded-xl"
                />
                <ElSkeletonItem
                  variant="rect"
                  class="!h-36 !w-full !rounded-xl"
                />
                <ElSkeletonItem
                  variant="rect"
                  class="!h-36 !w-full !rounded-xl"
                />
                <ElSkeletonItem
                  variant="rect"
                  class="!h-36 !w-full !rounded-xl"
                />
              </div>
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ElSkeletonItem
                  variant="rect"
                  class="!h-80 !w-full !rounded-xl"
                />
                <ElSkeletonItem
                  variant="rect"
                  class="!h-80 !w-full !rounded-xl"
                />
              </div>
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ElSkeletonItem
                  variant="rect"
                  class="!h-80 !w-full !rounded-xl"
                />
                <ElSkeletonItem
                  variant="rect"
                  class="!h-80 !w-full !rounded-xl"
                />
              </div>
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ElSkeletonItem
                  variant="rect"
                  class="!h-80 !w-full !rounded-xl"
                />
                <ElSkeletonItem
                  variant="rect"
                  class="!h-80 !w-full !rounded-xl"
                />
              </div>
            </div>
          </template>
          <template #default>
            <div class="space-y-8 !px-4 md:!px-6 !py-4 pb-10">
              <HomeDashboardKpis />
              <HomeFinancialSummary />
              <HomeMoveReasonsCharts />

              <HomeDashboardPipelineSection />

              <HomeDashboardAcquisitionSection />

              <HomeDashboardEngagementSection />

              <HomeDashboardInteractionQualitySection />

              <HomeDashboardCoverageSection />
            </div>
          </template>
        </ElSkeleton>
      </ElScrollbar>
    </div>
  </div>
</template>

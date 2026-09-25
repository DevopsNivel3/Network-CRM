<script setup lang="ts">
import {
  MoreFilled,
  Clock,
  Edit,
  Delete,
  ArrowLeft,
  ArrowRight,
  Loading,
  StarFilled,
} from "@element-plus/icons-vue";
import { VueDraggable } from "vue-draggable-plus";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Mousewheel } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper/types";
import "swiper/css";

const oportunidades = useOportunidades();
const oportunidade = useOportunidade();
const { user } = useAuthSession();
const device = useDevice();
const emit = defineEmits<{
  (e: "open-view"): void;
  (e: "open-create-board"): void;
}>();
const {
  boardList,
  cancelReasonMove,
  canMoveItem,
  confirmReasonMove,
  getExtraCount,
  getResponsaveis,
  handleChangeStatus,
  loadMore,
  oportunidadesByStatus,
  pendingMove,
  reasonDialogOpen,
} = useOpportunityBoard();

const swiperModules = [Mousewheel];
const swiperRef = ref<SwiperType | null>(null);
const swiperInstance = ref<SwiperType | null>(null);
const isDragging = ref(false);
const dragPosition = ref({ x: 0, y: 0 });
const edgeThreshold = 50;
const autoSlideTimeout = ref<NodeJS.Timeout | null>(null);
const showEdgeIndicator = ref({ left: false, right: false });

const handleDragStart = (event: any) => {
  isDragging.value = true;

  if (swiperInstance.value) {
    swiperInstance.value.allowTouchMove = false;
    swiperInstance.value.disable();
  }
};

const handleDragEnd = (event: any) => {
  isDragging.value = false;

  setTimeout(() => {
    if (swiperInstance.value) {
      swiperInstance.value.allowTouchMove = true;
      swiperInstance.value.enable();
    }
  }, 100);

  if (autoSlideTimeout.value) {
    clearTimeout(autoSlideTimeout.value);
    autoSlideTimeout.value = null;
  }

  showEdgeIndicator.value = { left: false, right: false };
};

// Adicionar event listeners para detectar movimento durante o drag
onMounted(() => {
  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("touchmove", handleDragMove);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("touchmove", handleDragMove);

  if (autoSlideTimeout.value) clearTimeout(autoSlideTimeout.value);
});

// Função para detectar movimento do mouse/touch durante o drag
const handleDragMove = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;

  const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
  const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;

  dragPosition.value = { x: clientX, y: clientY };

  const screenWidth = window.innerWidth;
  const currentSlide = swiperRef.value?.activeIndex || 0;
  const totalSlides = boardList.value.length;

  showEdgeIndicator.value = { left: false, right: false };

  if (clientX < edgeThreshold && currentSlide < totalSlides - 1) {
    showEdgeIndicator.value.left = true;

    if (!autoSlideTimeout.value) {
      autoSlideTimeout.value = setTimeout(() => {
        const swiper = swiperRef.value;

        if (swiper) {
          try {
            setTimeout(() => {
              swiper.slidePrev(300);
            }, 50);
          } catch (err) {
            console.error(err);
          }
        }

        autoSlideTimeout.value = null;
        showEdgeIndicator.value.left = false;
      }, 500);
    }
  } else if (clientX > screenWidth - edgeThreshold && currentSlide > 0) {
    showEdgeIndicator.value.right = true;

    if (!autoSlideTimeout.value) {
      autoSlideTimeout.value = setTimeout(() => {
        const swiper = swiperRef.value;

        if (swiper) {
          try {
            setTimeout(() => {
              swiper.slideNext(300);
            }, 50);
          } catch (err) {
            console.error(err);
          }
        }

        autoSlideTimeout.value = null;
        showEdgeIndicator.value.right = false;
      }, 500);
    }
  } else {
    if (autoSlideTimeout.value) {
      clearTimeout(autoSlideTimeout.value);
      autoSlideTimeout.value = null;
    }
  }
};

// Faz o fetch da oportunidade e abre o modal
const openOportunidadeView = async (id: number) => {
  oportunidade.findById(id);
  emit("open-view");
};

// Abrir o modal de criação do board
const openCreateBoardModal = () => emit("open-create-board");

// Abrir o modal de edição do board
const editingBoardId = ref<number | null>(null);
const isEditBoardOpen = ref(false);
const openEditBoardModal = (boardId: number) => {
  editingBoardId.value = boardId;
  isEditBoardOpen.value = true;
};

// Abre o modal de deletar o board com confirmação
const openBoardDeleteModalConfirmation = async (boardId: number) => {
  if (!boardId) return;

  const board = oportunidades.getBoardFromState(boardId);
  if (!board) return;

  try {
    ElMessageBox.confirm(
      h(
        "span",
        null,
        `Você excluirá permanentemente o board (${board.titulo}). Deseja continuar?`,
      ),
      "Atenção",
      {
        confirmButtonClass:
          "!bg-red-400 hover:!bg-red-400/60 !transition-colors !text-white !border-none",
        confirmButtonText: "Sim, deletar!",
        cancelButtonText: "Cancelar",
        type: "warning",
      },
    ).then(async () => {
      const isDeleted = await oportunidades.deleteBoard(boardId);

      if (isDeleted)
        ElMessage.success({
          message: `Board (${board.titulo}) deletado com sucesso!`,
          grouping: true,
          plain: true,
        });
    });
  } catch (err) {
    console.error(err);
  }
};
</script>

<template>
  <ClientOnly>
    <div
      class="!overflow-hidden !w-full !flex !h-[calc(100vh_-_127px)] !select-none relative"
    >
      <!-- Indicadores visuais nas bordas -->
      <Transition name="fade">
        <div
          v-if="showEdgeIndicator.left"
          class="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-nivel/30 to-transparent z-10 flex items-center justify-start pl-2"
        >
          <ElIcon class="text-nivel text-2xl">
            <ArrowLeft />
          </ElIcon>
        </div>
      </Transition>

      <Transition name="fade">
        <div
          v-if="showEdgeIndicator.right"
          class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-nivel/30 to-transparent z-10 flex items-center justify-end pr-2"
        >
          <ElIcon class="text-nivel text-2xl">
            <ArrowRight />
          </ElIcon>
        </div>
      </Transition>

      <div
        class="absolute w-full left-0 right-0 h-[65px] z-[-1] bg-gray-50 dark:bg-charcoal"
      />
      <Swiper
        @swiper="(swiper) => (swiperRef = swiper)"
        :modules="swiperModules"
        :slides-per-view="'auto'"
        :centered-slides="true"
        :space-between="16"
        :mousewheel="{
          enabled: true,
          forceToAxis: true,
        }"
        direction="horizontal"
        :allow-touch-move="!isDragging"
        :speed="300"
        :effect="'slide'"
        class="!w-full !h-full"
      >
        <SwiperSlide
          v-for="board in boardList"
          :key="board?.id"
          class="!h-full !w-[330px] !flex-shrink-0"
        >
          <div class="!w-full !h-full flex flex-col overflow-hidden">
            <div
              class="flex w-full px-4 py-3 items-center justify-between flex-shrink-0"
            >
              <!-- Nome do Grupo -->
              <div
                class="flex items-center gap-2 px-1 py-2 justify-between min-w-0"
              >
                <div class="min-w-0">
                  <h1
                    :title="board.titulo"
                    class="font-semibold max-w-[200px] truncate"
                  >
                    {{ board.titulo }}
                  </h1>
                  <div
                    v-if="board.usuario_atribuido"
                    class="mt-1 flex items-center gap-1.5 text-[11px] text-black/60 dark:text-white/60"
                    :title="`Atribuida para ${board.usuario_atribuido.nome}`"
                  >
                    <ElAvatar
                      class="!text-black dark:!text-white !font-semibold !min-w-5 !max-w-5 !max-h-5 !min-h-5"
                      :src="parserAvatar(board.usuario_atribuido.avatar)"
                    >
                      <span class="text-[10px] uppercase">
                        {{ board.usuario_atribuido.nome?.slice(0, 1) }}
                      </span>
                    </ElAvatar>
                    <span class="truncate max-w-[150px]">
                      {{ board.usuario_atribuido.nome }}
                    </span>
                  </div>
                  <div
                    v-if="board.controle_lembretes === false"
                    class="mt-1 text-[11px] text-amber-600 dark:text-amber-300"
                  >
                    Lembretes automáticos desativados
                  </div>
                </div>
                <span
                  class="font-bold text-xs bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md shrink-0"
                >
                  {{
                    (oportunidadesByStatus[board?.id]?.length || 0) +
                    "/" +
                    (oportunidades.boardTotals?.[board?.id] || 0)
                  }}
                </span>
              </div>
              <span
                v-if="board.qualificacao"
                class="ml-auto inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-black/50 dark:text-white/50"
                :title="`Qualificação: ${board.qualificacao}`"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="{
                    'bg-slate-400': board.qualificacao === 'Prospecção',
                    'bg-blue-400': board.qualificacao === 'Frio',
                    'bg-amber-400': board.qualificacao === 'Morno',
                    'bg-orange-500': board.qualificacao === 'Quente',
                    'bg-gray-500': board.qualificacao === 'Cancelado',
                    'bg-red-400': board.qualificacao === 'Declinado',
                    'bg-green-500': board.qualificacao === 'Fechado',
                  }"
                />
                {{ board.qualificacao }}
              </span>
              <ElDropdown
                :disabled="
                  !hasUserPermission(user.permissoes, UserPermissions.ADMIN)
                "
                trigger="click"
                :class="{
                  '!pointer-events-none': !hasUserPermission(
                    user.permissoes,
                    UserPermissions.ADMIN,
                  ),
                }"
              >
                <ElButton
                  type="text"
                  class="hover:dark:!bg-white/20 dark:!text-white !text-black hover:!bg-black/5 !rounded-md !px-2"
                >
                  <ElIcon>
                    <MoreFilled />
                  </ElIcon>
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem
                      @click="openEditBoardModal(board?.id)"
                      :icon="Edit"
                    >
                      Editar
                    </ElDropdownItem>
                    <ElDropdownItem
                      @click="openBoardDeleteModalConfirmation(board?.id)"
                      class="!bg-red-500 !text-white"
                      :icon="Delete"
                    >
                      Deletar
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
            <div class="flex-1 overflow-hidden">
              <ElScrollbar
                view-class="!h-full !w-full relative"
                :wrap-class="`kanban-scroll-${board.id}`"
              >
                <!-- Card's -->
                <VueDraggable
                  :on-update="(event) => handleChangeStatus(event, board?.id)"
                  :on-add="(event) => handleChangeStatus(event, board?.id)"
                  :move="(evt: any) => canMoveItem(evt.draggedContext.element)"
                  v-infinite-scroll="() => loadMore(board?.id)"
                  :infinite-scroll-disabled="
                    oportunidades.isLoading ||
                    oportunidades.boardLoadingMore?.[board?.id] ||
                    !oportunidades.boardHasMore?.[board?.id]
                  "
                  :infinite-scroll-container="`.kanban-scroll-${board.id}`"
                  :infinite-scroll-immediate="false"
                  :infinite-scroll-distance="150"
                  :filter="'.drag-disabled'"
                  :prevent-on-filter="true"
                  :on-start="handleDragStart"
                  :on-end="handleDragEnd"
                  class="flex flex-col gap-3 px-4 pt-3 pb-6 min-h-full"
                  v-model="oportunidadesByStatus[board?.id]"
                  :group="{ name: 'opportunities' }"
                  :scroll-sensitivity="150"
                  :fallback-on-body="true"
                  :fallback-tolerance="1"
                  :force-fallback="true"
                  :scroll-speed="10"
                  item-key="id"
                  :delay="100"
                  :touch-start-threshold="5"
                  :disabled="false"
                >
                  <div
                    class="bg-white dark:bg-white/5 shadow-md rounded-md p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                    :class="{
                      'drag-disabled': !canMoveItem(oportunidade),
                      'hover:ring-2': canMoveItem(oportunidade),
                    }"
                    v-for="oportunidade in oportunidadesByStatus[board?.id]"
                    @click="openOportunidadeView(oportunidade.id)"
                    :key="oportunidade.id"
                  >
                    <div class="flex justify-between items-center w-full gap-2">
                      <div class="flex items-center gap-2 mb-2">
                        <div
                          :style="{
                            backgroundColor: board?.cor,
                          }"
                          class="w-12 h-2 rounded-full"
                        />
                        <div
                          class="text-[10px] text-gray-400 dark:text-gray-500 font-medium"
                        >
                          Criado em:
                          {{ $dayjs(oportunidade.criado).format("DD/MM/YYYY") }}
                        </div>
                      </div>
                      <ElIcon size="large" class="-mt-2">
                        <MoreFilled />
                      </ElIcon>
                    </div>
                    <div class="flex items-start justify-between">
                      <!-- Nome -->
                      <h3
                        class="font-semibold text-sm truncate pr-8 text-gray-800 dark:text-gray-50"
                      >
                        {{ oportunidade.lead.nome_lead }}
                      </h3>
                    </div>
                    <!-- Descrição -->
                    <div v-if="oportunidade.descricao" class="mt-1">
                      <h3
                        class="font-medium !text-pretty text-xs text-gray-800/80 dark:text-gray-100/80 break-words"
                      >
                        {{ oportunidade.descricao }}
                      </h3>
                    </div>
                    <OportunidadeBoardReasonPreview
                      v-if="oportunidade.motivo_atual"
                      :motivo="oportunidade.motivo_atual"
                      :grupo="board.grupo_motivos"
                    />
                    <div class="flex items-end justify-between mt-2">
                      <!-- Horário da última atualização -->
                      <div class="flex items-center gap-2 flex-wrap">
                        <div
                          class="text-xs flex items-center gap-1 justify-center bg-black/5 dark:bg-white/10 text-black dark:text-white font-semibold px-2 py-0.5 rounded"
                          :title="
                            $dayjs(oportunidade.atualizado).format(
                              'DD/MM/YYYY, [às] HH:mm',
                            )
                          "
                        >
                          <ElIcon>
                            <Clock />
                          </ElIcon>
                          {{
                            $dayjs(oportunidade.atualizado).format(
                              "MMM D, YYYY",
                            )
                          }}
                        </div>
                        <!-- Tipo -->
                        <div class="flex items-center gap-2">
                          <div
                            class="text-xs rounded truncate max-w-24 bg-black/5 dark:bg-white/10 text-black dark:text-white font-semibold px-2 py-0.5"
                            v-if="oportunidade.tipo"
                          >
                            {{ oportunidade.tipo }}
                          </div>
                        </div>
                      </div>
                      <!-- Responsáveis -->
                      <div class="flex items-center gap-1">
                        <template v-if="getResponsaveis(oportunidade).length">
                          <ElTooltip
                            v-for="resp in getResponsaveis(oportunidade)"
                            :key="resp.id"
                            :content="resp.nome || 'Desconhecido'"
                            :disabled="device.isMobile"
                            placement="top"
                            effect="light"
                          >
                            <div class="relative">
                              <ElAvatar
                                class="!text-black dark:!text-white !max-w-6 !max-h-6 !min-h-6 !min-w-6 !font-semibold"
                                :src="parserAvatar(resp.avatar)"
                                size="small"
                              >
                                <span class="text-[11px] uppercase">
                                  {{ resp.nome.slice(0, 1) }}
                                </span>
                              </ElAvatar>
                              <ElIcon
                                v-if="resp.principal"
                                class="!absolute !left-0 !ml-4 !rotate-180 !mb-2 !top-0 !text-nivel"
                                size="14"
                              >
                                <StarFilled />
                              </ElIcon>
                            </div>
                          </ElTooltip>
                          <div
                            v-if="
                              getExtraCount(
                                oportunidade,
                                getResponsaveis(oportunidade).length,
                              ) > 0
                            "
                            class="!text-black dark:!text-white !bg-black/5 dark:!bg-white/5 rounded-xl flex items-center justify-center !font-semibold !max-h-[24px] !min-h-[24px] !px-2"
                          >
                            <span class="text-[11px] uppercase">
                              {{
                                "+" +
                                getExtraCount(
                                  oportunidade,
                                  getResponsaveis(oportunidade).length,
                                )
                              }}
                            </span>
                          </div>
                        </template>
                        <ElAvatar
                          v-else
                          class="!text-black dark:!text-white !max-w-6 !max-h-6 !min-h-6 !min-w-6 !font-semibold"
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                </VueDraggable>
                <div
                  v-if="oportunidades.boardLoadingMore?.[board?.id]"
                  class="absolute left-0 right-0 bottom-2 flex items-center justify-center"
                >
                  <ElIcon
                    class="is-loading"
                    color="var(--el-color-primary)"
                    size="18"
                  >
                    <Loading />
                  </ElIcon>
                </div>
              </ElScrollbar>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  </ClientOnly>
  <OportunidadeBoardEditModal
    v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
    :board_id="editingBoardId"
    v-model="isEditBoardOpen"
  />
  <OportunidadeBoardMoveReasonDialog
    v-if="pendingMove"
    v-model="reasonDialogOpen"
    :board-id="pendingMove.status"
    :previous-board-id="pendingMove.previousBoardId"
    @confirm="confirmReasonMove"
    @cancel="cancelReasonMove"
  />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

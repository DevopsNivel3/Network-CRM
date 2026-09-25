<script setup lang="ts">
import {
  MoreFilled,
  Clock,
  Plus,
  Delete,
  Edit,
  Loading,
  StarFilled,
} from "@element-plus/icons-vue";
import { VueDraggable } from "vue-draggable-plus";

const { isTablet, isMobile } = useDevice();
const oportunidades = useOportunidades();
const oportunidade = useOportunidade();
const { user } = useAuthSession();
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

// Lida com o evento de mudança de status do board e salva no backend
const handleBoardChangeStatus = async (event: any) => {
  try {
    const item = event.clonedData as { id: number; posicao: number };
    const newIndex = event.newIndex;

    if (!item) return;

    const originalList = [...boardList.value];
    const listWithoutDraggedItem = originalList.filter(
      (board) => board.id !== item.id,
    );

    let beforeItem = null;
    let afterItem = null;

    if (newIndex > 0) beforeItem = listWithoutDraggedItem[newIndex - 1] ?? null;
    if (newIndex < listWithoutDraggedItem.length)
      afterItem = listWithoutDraggedItem[newIndex] ?? null;

    let newPosicao: number;

    if (beforeItem && afterItem)
      newPosicao = (beforeItem.posicao + afterItem.posicao) / 2;
    else if (beforeItem) newPosicao = beforeItem.posicao + 1024;
    else if (afterItem) newPosicao = afterItem.posicao - 1;
    else newPosicao = 1024;

    while (listWithoutDraggedItem.some((board) => board.posicao === newPosicao))
      newPosicao += 0.0001;

    const boardsList = oportunidades.boards?.data ?? [];
    const boardIndex = boardsList.findIndex((board) => board.id === item.id);
    if (boardIndex !== -1) {
      boardsList[boardIndex].posicao = newPosicao;
    }

    item.posicao = newPosicao;

    const isStatusUpdated = await oportunidades.updateBoardStatusById(
      item.id,
      newPosicao,
    );
    if (isStatusUpdated)
      ElMessage.success({
        message: `Board movido com sucesso!`,
        grouping: true,
        plain: true,
      });
  } catch (err) {
    console.error(err);
  }
};

// Inicia o style de grabbing no mouse
const handleStartGrab = () => document.body.classList.add("!cursor-grabbing");

// Retira o style de grabbing no mouse
const handleStopGrab = () => document.body.classList.remove("!cursor-grabbing");

// Faz o fetch da oportunidade e abre o modal
const openOportunidadeView = async (id: number) => {
  oportunidade.findById(id);
  emit("open-view");
};

// Refs para armazenar os valores
const currentDragDelay = ref<number>(0);
const currentScrollSensitivity = ref<number>(100);
const currentScrollSpeed = ref<number>(30);

// Para sincronizar o grab dos elementos com o dispositivo
const dragDelay = computed(() => currentDragDelay.value);
const scrollSensitivity = computed(() => currentScrollSensitivity.value);
const scrollSpeed = computed(() => currentScrollSpeed.value);

// Função para atualizar todas as configurações
const updateScrollSettings = () => {
  currentDragDelay.value = isTablet ? 200 : 0;
  currentScrollSensitivity.value = isTablet ? 150 : 100;
  currentScrollSpeed.value = isTablet ? 15 : 30;
};

onMounted(() => {
  updateScrollSettings();
  window.addEventListener("resize", updateScrollSettings);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScrollSettings);
});

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
  <div
    class="!overflow-x-auto !w-full !flex !p-4 !h-full md:!h-[calc(100vh_-_127px)] !select-none scrollbar-minimal"
  >
    <VueDraggable
      :disabled="!hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
      :on-update="(event) => handleBoardChangeStatus(event)"
      :on-add="(event) => handleBoardChangeStatus(event)"
      :on-start="() => handleStartGrab()"
      :on-end="() => handleStopGrab()"
      class="flex gap-3 min-h-full"
      :group="{ name: 'boards' }"
      handle=".handle-board"
      v-model="boardList"
      item-key="id"
    >
      <div
        class="relative min-w-[320px] max-w-[320px] h-full border-2 pb-1 rounded-lg border-black/10 dark:border-white/10 shadow transition-all flex flex-col"
        v-for="board in boardList"
        :key="board.id"
      >
        <div
          class="handle-board cursor-grab flex gap-2 items-center justify-between px-2 py-1 w-full border-b border-black/5 dark:border-white/5"
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
        <ElScrollbar
          class="!flex-1 !min-h-0 !h-full"
          view-class="!flex-1 px-2 !h-full !min-h-0"
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
            class="flex flex-col p-2 gap-3 w-full min-h-full"
            v-model="oportunidadesByStatus[board?.id]"
            :scroll-sensitivity="scrollSensitivity"
            :on-start="() => handleStartGrab()"
            :group="{ name: 'opportunities' }"
            :on-end="() => handleStopGrab()"
            :scroll-speed="scrollSpeed"
            :fallback-on-body="true"
            :fallback-tolerance="1"
            :force-fallback="true"
            :delay="dragDelay"
            item-key="id"
          >
            <div
              v-for="item in oportunidadesByStatus[board?.id]"
              :key="item.id"
              :class="{ 'drag-disabled': !canMoveItem(item) }"
            >
              <div
                class="bg-white v dark:bg-white/5 shadow-md !ring-1 !ring-opacity-10 ring-black dark:ring-white transition-all rounded-md p-4 cursor-pointer max-w-full hover:bg-black/5 dark:hover:bg-white/10"
                :class="{
                  'hover:!ring-2 hover:!ring-opacity-100 hover:!ring-nivel':
                    canMoveItem(item),
                }"
                @click="openOportunidadeView(item.id)"
              >
                <div class="flex flex-col items-start w-full justify-between">
                  <!-- Header do Card -->
                  <div class="flex justify-between items-center w-full gap-2">
                    <div class="flex items-center gap-2 mb-2">
                      <div
                        :style="{
                          backgroundColor:
                            item.board_id !== board.id ? '#fef08a' : board?.cor,
                        }"
                        class="w-12 h-2 rounded-full"
                      />
                      <div
                        class="text-[10px] text-gray-400 dark:text-gray-500 font-medium"
                      >
                        Criado em:
                        {{ $dayjs(item.criado).format("DD/MM/YYYY") }}
                      </div>
                    </div>
                    <ElIcon size="large" class="-mt-2">
                      <MoreFilled />
                    </ElIcon>
                  </div>
                  <!-- Nome -->
                  <h3
                    :title="item.lead.nome_lead"
                    class="font-semibold text-sm truncate max-w-[240px] pr-8 text-gray-800 dark:text-gray-50"
                  >
                    {{ item.lead.nome_lead }}
                  </h3>
                </div>
                <!-- Descrição -->
                <div :title="item.descricao" v-if="item.descricao" class="mt-1">
                  <h3
                    class="font-medium !text-pretty text-xs text-gray-800/80 dark:text-gray-100/80 break-words"
                  >
                    {{ item.descricao.slice(0, 100)
                    }}{{ item.descricao.length > 100 ? "..." : "" }}
                  </h3>
                </div>
                <OportunidadeBoardReasonPreview
                  v-if="item.motivo_atual"
                  :motivo="item.motivo_atual"
                  :grupo="board.grupo_motivos"
                />
                <div class="flex items-end justify-between gap-3 mt-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Horário da última atualização -->
                    <div
                      class="text-xs flex items-center gap-1 justify-center bg-black/5 dark:bg-white/10 text-black dark:text-white font-semibold px-2 py-0.5 rounded"
                      :title="
                        $dayjs(item.atualizado).format('DD/MM/YYYY, [às] HH:mm')
                      "
                    >
                      <ElIcon><Clock /></ElIcon>
                      {{ $dayjs(item.atualizado).format("MMM D, YYYY") }}
                    </div>
                    <!-- Tipo -->
                    <div
                      v-if="item.tipo"
                      :title="item.tipo"
                      class="text-xs bg-black/5 truncate max-w-[200px] dark:bg-white/10 text-black dark:text-white font-semibold px-2 py-0.5 rounded"
                    >
                      {{ item.tipo }}
                    </div>
                  </div>
                  <!-- Responsáveis -->
                  <div class="flex items-center gap-1">
                    <template v-if="getResponsaveis(item).length">
                      <ElTooltip
                        v-for="resp in getResponsaveis(item)"
                        :key="resp.id"
                        :content="resp.nome || 'Desconhecido'"
                        :disabled="isMobile"
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
                          getExtraCount(item, getResponsaveis(item).length) > 0
                        "
                        class="!text-black dark:!text-white !bg-black/5 dark:!bg-white/5 rounded-xl flex items-center justify-center !font-semibold !max-h-[24px] !min-h-[24px] !px-2"
                      >
                        <span class="text-[11px] uppercase">
                          {{
                            "+" +
                            getExtraCount(item, getResponsaveis(item).length)
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
            </div>
          </VueDraggable>
        </ElScrollbar>
        <div
          v-if="oportunidades.boardLoadingMore?.[board?.id]"
          class="absolute left-0 right-0 bottom-0 rounded-b-lg py-3 bg-black/80 dark:bg-black/60 flex items-center justify-center"
        >
          <ElIcon class="is-loading" color="var(--el-color-primary)" size="18">
            <Loading />
          </ElIcon>
        </div>
      </div>
    </VueDraggable>
    <template v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)">
      <div
        v-if="boardList && boardList.length > 0"
        @click="openCreateBoardModal"
        class="min-w-[80px] max-w-[80px] ml-3 !h-full border-2 hover:!border-nivel hover:!text-nivel border-dashed rounded-lg flex items-center cursor-pointer justify-center border-black/10 dark:border-white/10 !min-h-[calc(100vh-200px)] shadow transition-all"
      >
        <ElIcon>
          <Plus />
        </ElIcon>
      </div>
      <div
        v-else
        class="flex-1 border-2 border-dashed rounded-lg flex flex-col gap-2 items-center cursor-pointer justify-center border-black/10 dark:border-white/10 shadow transition-all"
      >
        <h3 class="font-medium">Para começar, crie um novo board</h3>
        <ElButton
          @click="openCreateBoardModal"
          :icon="Plus"
          type="primary"
          size="small"
        >
          Criar Board
        </ElButton>
      </div>
    </template>
  </div>

  <OportunidadeBoardEditModal
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

<style>
.sortable-ghost {
  opacity: 0.2;
  background: transparent;
  position: relative;
  pointer-events: none;
}

.sortable-ghost::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  border-radius: 6px;
  pointer-events: none;
}

html.dark .sortable-ghost::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 6px;
  pointer-events: none;
}

.sortable-fallback {
  transform: rotate(5deg);
  opacity: 1 !important;
  background: #fff !important;
  border: solid 2px #79fe96;
  border-radius: 6px;
  box-shadow: 0 0 1px 1px #79fe96;
}

html.dark .sortable-fallback {
  transform: rotate(5deg);
  opacity: 1 !important;
  background: #252525 !important;
  border: solid 2px #79fe96;
  border-radius: 6px;
  box-shadow: 0 0 1px 1px #79fe96;
}
</style>

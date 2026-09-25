<script setup lang="ts">
import { ChatLineRound, Message, Phone, FullScreen } from "@element-plus/icons-vue";

const stats = useStats();
const device = useDevice();
const expanded = ref(false);
const hasSelectedOpportunity = computed(
    () => stats.appliedOpportunityId !== "all",
);
const expandedTitle = computed(() =>
    hasSelectedOpportunity.value
        ? `Interações da oportunidade #${stats.appliedOpportunityId}`
        : "Interações detalhadas",
);

const loadMore = async () => {
    await stats.loadMoreInteractions();
};

const getIconForType = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
        case "mensagem":
            return ChatLineRound;
        case "e-mail":
            return Message;
        case "telefone":
            return Phone;
        default:
            return ChatLineRound;
    }
};

const getColorForType = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
        case "mensagem":
            return "text-green-500";
        case "e-mail":
            return "text-blue-500";
        case "telefone":
            return "text-purple-500";
        default:
            return "text-gray-500";
    }
};

const stripHtml = (text: string) => {
    if (!text) return "Sem conteúdo";
    return text.replace(/<[^>]*>?/gm, "");
};

const formatText = (text: string) => {
    const stripped = stripHtml(text);
    return stripped.length > 80 ? stripped.substring(0, 80) + "..." : stripped;
};

watch(
    () => stats.filterVersion,
    () => {
        if (!hasSelectedOpportunity.value) expanded.value = false;
    },
);
</script>

<template>
    <div
        class="app-surface w-full h-[420px] flex flex-col"
    >
        <div class="flex items-start justify-between gap-3 p-4 border-b dark:border-white/15">
            <div>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-white/80 uppercase">
                    Interações ({{ stats.data?.interacoes?.pagination?.total || 0 }})
                </h3>
                <p class="mt-1 text-xs text-gray-500 dark:text-white/50">
                    Role para carregar mais interações do período filtrado
                </p>
            </div>
            <ElButton
                :icon="FullScreen"
                size="small"
                plain
                class="!ml-0 shrink-0"
                aria-label="Expandir interações"
                @click="expanded = true"
            >
                Expandir
            </ElButton>
        </div>

        <div class="dashboard-interactions-scroll overflow-y-auto flex-1 min-h-0 p-4 md:p-6 pr-3">
            <div
                class="space-y-4"
                v-infinite-scroll="loadMore"
                :infinite-scroll-disabled="stats.isInteractionLoadingMore || (stats.data?.interacoes?.pagination?.page || 1) >= (stats.data?.interacoes?.pagination?.totalPages || 1)"
                infinite-scroll-container=".dashboard-interactions-scroll"
                :infinite-scroll-immediate="false"
                :infinite-scroll-distance="100"
            >
            <template v-if="stats.data?.interacoes?.lista && stats.data.interacoes.lista.length > 0">
                <div
                    v-for="interacao in stats.data.interacoes.lista"
                    :key="interacao.id"
                    class="flex gap-4 items-start pb-4 border-b dark:border-white/10 last:border-0 last:pb-0"
                >
                    <div
                        class="w-10 h-10 rounded-full bg-white dark:bg-charcoal border dark:border-white/10 flex items-center justify-center flex-shrink-0"
                    >
                        <ElIcon :class="getColorForType(interacao.tipo)" :size="18">
                            <component :is="getIconForType(interacao.tipo)" />
                        </ElIcon>
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <h4 class="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                                {{ interacao.lead.nome_lead || interacao.lead.contato_nome || "Cliente sem nome" }}
                            </h4>
                            <span class="text-[11px] text-gray-500 dark:text-white/50 whitespace-nowrap">
                                {{ $dayjs(interacao.data).format("DD/MM/YYYY HH:mm") }}
                            </span>
                        </div>
                        
                        <div class="text-xs text-gray-600 dark:text-white/70 flex items-center flex-wrap gap-2 mb-1.5">
                            <span class="font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-charcoal border dark:border-white/10">
                                {{ interacao.tipo }}
                            </span>
                            <span
                                v-if="interacao.oportunidade.status"
                                class="font-medium px-2 py-1 rounded-md bg-nivel/10 text-nivel border border-nivel/20"
                            >
                                {{ interacao.oportunidade.status }}
                            </span>
                            <span>por {{ interacao.usuario.nome }}</span>
                        </div>

                        <p class="text-xs text-gray-500 dark:text-white/60 line-clamp-2">
                            {{ formatText(interacao.conteudo || "") }}
                        </p>

                        <div class="mt-2">
                            <NuxtLink
                                :to="`/crm/oportunidades?id=${interacao.oportunidade_id}`"
                                class="text-xs text-nivel hover:underline inline-flex items-center gap-1"
                            >
                                Ver oportunidade
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </template>
            <div v-else class="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-white/50 space-y-2 py-8">
                <ElIcon :size="32"><Message /></ElIcon>
                <p class="text-sm">Nenhuma interação encontrada no período.</p>
            </div>
            <div v-if="stats.isInteractionLoadingMore" class="py-3 flex justify-center">
                <span class="loading loading-infinity loading-sm" />
            </div>
            </div>
        </div>
    </div>

    <ElDialog
        v-model="expanded"
        :fullscreen="device.isMobile"
        :class="device.isMobile ? '' : '!w-[900px] max-w-[95%]'"
        align-center
        destroy-on-close
    >
        <template #header>
            <UIDialogHeader
                :title="expandedTitle"
                @close="expanded = false"
            />
        </template>

        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                    Histórico detalhado
                </p>
                <p class="text-xs text-gray-500 dark:text-white/50">
                    {{ stats.data?.interacoes?.pagination?.total || 0 }} interação(ões) no período filtrado
                </p>
            </div>
            <NuxtLink
                v-if="hasSelectedOpportunity"
                :to="`/crm/oportunidades?id=${stats.appliedOpportunityId}&tab=interacoes`"
            >
                <ElButton type="primary" plain size="small">
                    Abrir oportunidade
                </ElButton>
            </NuxtLink>
        </div>

        <div
            class="expanded-interactions-scroll h-[65vh] overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02] md:p-5"
        >
            <div
                class="space-y-3"
                v-infinite-scroll="loadMore"
                :infinite-scroll-disabled="stats.isInteractionLoadingMore || (stats.data?.interacoes?.pagination?.page || 1) >= (stats.data?.interacoes?.pagination?.totalPages || 1)"
                infinite-scroll-container=".expanded-interactions-scroll"
                :infinite-scroll-immediate="false"
                :infinite-scroll-distance="120"
            >
                <article
                    v-for="interacao in stats.data?.interacoes?.lista || []"
                    :key="`expanded-${interacao.id}`"
                    class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-charcoal"
                >
                    <div class="flex items-start gap-3">
                        <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-slate-50 dark:border-white/10 dark:bg-white/5"
                        >
                            <ElIcon :class="getColorForType(interacao.tipo)" :size="18">
                                <component :is="getIconForType(interacao.tipo)" />
                            </ElIcon>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                                <h4 class="font-medium text-gray-900 dark:text-white">
                                    {{ interacao.lead.nome_lead || interacao.lead.contato_nome || "Cliente sem nome" }}
                                </h4>
                                <time class="shrink-0 text-xs text-gray-500 dark:text-white/50">
                                    {{ $dayjs(interacao.data).format("DD/MM/YYYY [às] HH:mm") }}
                                </time>
                            </div>

                            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span class="rounded-md border bg-slate-50 px-2 py-1 font-medium dark:border-white/10 dark:bg-white/5">
                                    {{ interacao.tipo }}
                                </span>
                                <span
                                    v-if="interacao.oportunidade.status"
                                    class="rounded-md border border-nivel/20 bg-nivel/10 px-2 py-1 font-medium text-nivel"
                                >
                                    {{ interacao.oportunidade.status }}
                                </span>
                                <span class="text-gray-500 dark:text-white/60">
                                    Responsável: {{ interacao.usuario.nome }}
                                </span>
                            </div>

                            <div class="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-gray-700 dark:bg-white/5 dark:text-white/75">
                                <p class="whitespace-pre-wrap break-words">
                                    {{ stripHtml(interacao.conteudo || "") }}
                                </p>
                            </div>

                            <div class="mt-3 flex items-center justify-between gap-2 text-xs text-gray-400">
                                <span>Interação #{{ interacao.id }}</span>
                                <NuxtLink
                                    :to="`/crm/oportunidades?id=${interacao.oportunidade_id}&tab=interacoes`"
                                    class="text-nivel hover:underline"
                                >
                                    Ver na oportunidade
                                </NuxtLink>
                            </div>
                        </div>
                    </div>
                </article>

                <div
                    v-if="!stats.data?.interacoes?.lista?.length"
                    class="flex min-h-48 flex-col items-center justify-center gap-2 text-center text-gray-500 dark:text-white/50"
                >
                    <ElIcon :size="32"><Message /></ElIcon>
                    <p class="text-sm">Nenhuma interação encontrada no período.</p>
                </div>
                <div
                    v-if="stats.isInteractionLoadingMore"
                    class="flex justify-center py-3"
                >
                    <span class="loading loading-infinity loading-sm" />
                </div>
            </div>
        </div>
    </ElDialog>
</template>

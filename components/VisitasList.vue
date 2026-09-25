<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Calendar, WarningFilled, Check } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

const { user } = useAuthSession();
const stats = useStats();

type VisitaListItem = {
    id: number;
    data_inicio: string;
    hora_inicio: string;
    statusInt: number;
    localizacao?: {
        cidade?: string;
        estado?: string;
    } | null;
    oportunidade?: {
        id: number;
        lead?: {
            nome_lead?: string | null;
        } | null;
    } | null;
};

const visitas = ref<VisitaListItem[]>([]);
const loading = ref(true);

const activeStatuses = [1, 2, 3];

const statusMap: Record<number, string> = {
    1: "Pendente",
    2: "Em Progresso",
    3: "Reagendado",
    4: "Cancelado",
    5: "Concluído",
};

const statusTagType = (statusInt: number) => {
    if (statusInt === 1) return "warning";
    if (statusInt === 2) return "primary";
    if (statusInt === 3) return "success";
    return "info";
};

const isOverdue = (date: string) => {
    return dayjs().startOf("day").isAfter(dayjs(date).startOf("day"));
};

const sortedVisitas = computed(() => {
    return [...visitas.value].sort((a, b) => {
        const dateA = dayjs(a.data_inicio).startOf("day");
        const dateB = dayjs(b.data_inicio).startOf("day");
        const today = dayjs().startOf("day");
        const isTodayA = dateA.isSame(today);
        const isTodayB = dateB.isSame(today);

        if (isTodayA && !isTodayB) return -1;
        if (!isTodayA && isTodayB) return 1;
        if (!dateA.isSame(dateB)) return dateA.diff(dateB);

        const [hoursA, minutesA] = a.hora_inicio.split(":").map(Number);
        const [hoursB, minutesB] = b.hora_inicio.split(":").map(Number);
        return hoursA * 60 + minutesA - (hoursB * 60 + minutesB);
    });
});

const fetchVisitas = async () => {
    try {
        loading.value = true;
        const response = await useApi<{
            data: VisitaListItem[];
        }>("/api/visitas", {
            method: "GET",
            query: {
                page: 1,
                perPage: 100,
                ...(stats.appliedBoardId !== "all"
                    ? { boardId: stats.appliedBoardId }
                    : {}),
                ...(stats.appliedOpportunityId !== "all"
                    ? { opportunityId: stats.appliedOpportunityId }
                    : {}),
            },
        });

        visitas.value = (response?.data || []).filter((item) =>
            activeStatuses.includes(Number(item.statusInt)),
        );
    } catch (err) {
        console.error("Erro ao buscar visitas:", err);
    } finally {
        loading.value = false;
    }
};

const completeVisita = async (id: number) => {
    try {
        await useApi(`/api/visitas/${id}/status`, {
            method: "PATCH",
            body: { statusInt: 5 },
        });
        ElMessage.success("Visita concluída!");
        await fetchVisitas();
    } catch (err) {
        ElMessage.error("Erro ao concluir visita");
    }
};

const navigateToVisita = (visita: VisitaListItem) => {
    navigateTo(`/crm/visitas?id=${visita.id}`);
};

onMounted(() => {
    fetchVisitas();
});

watch(() => stats.filterVersion, fetchVisitas);
</script>

<template>
    <div
        class="app-surface w-full p-4 h-[320px] max-h-[320px] flex flex-col"
    >
        <div class="flex items-center justify-between mb-3 shrink-0">
            <h3
                class="text-xs font-semibold uppercase text-gray-500 flex items-center gap-2"
            >
                <ElIcon><Calendar /></ElIcon>
                Próximas Visitas
            </h3>
            <ElTag size="small" type="info"
                >{{ sortedVisitas.length }} ativas</ElTag
            >
        </div>

        <div class="flex-1 overflow-y-auto pr-2 space-y-3" v-loading="loading">
            <div
                v-if="sortedVisitas.length === 0"
                class="text-center text-gray-400 dark:text-gray-500 text-sm py-10"
            >
                Nenhuma visita agendada.
            </div>

            <div
                v-for="visita in sortedVisitas"
                :key="visita.id"
                class="p-3 rounded-lg border dark:border-white/10 flex items-start gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                :class="
                    isOverdue(visita.data_inicio)
                        ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10'
                        : ''
                "
                @click="navigateToVisita(visita)"
            >
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <ElTag
                            :type="statusTagType(visita.statusInt)"
                            size="small"
                            effect="dark"
                        >
                            {{ statusMap[visita.statusInt] }}
                        </ElTag>
                        <span
                            class="text-sm font-medium text-gray-900 dark:text-white truncate"
                        >
                            {{
                                visita.oportunidade?.lead?.nome_lead ||
                                "Visita agendada"
                            }}
                        </span>
                        <span
                            v-if="isOverdue(visita.data_inicio)"
                            class="text-xs text-red-500 flex items-center gap-1"
                        >
                            <ElIcon><WarningFilled /></ElIcon> Atrasada
                        </span>
                    </div>
                    <p
                        class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2"
                    >
                        {{
                            [
                                dayjs(visita.data_inicio).format("DD/MM/YYYY"),
                                visita.hora_inicio?.slice(0, 5),
                                visita.localizacao?.cidade,
                                visita.localizacao?.estado,
                            ]
                                .filter(Boolean)
                                .join(" - ")
                        }}
                    </p>
                    <div
                        class="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-500"
                    >
                        <span
                            >Agendada para:
                            {{
                                dayjs(visita.data_inicio).format("DD/MM/YYYY")
                            }}</span
                        >
                        <span
                            v-if="visita.hora_inicio"
                            class="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-3"
                        >
                            Hora: {{ visita.hora_inicio.slice(0, 5) }}
                        </span>
                    </div>
                </div>

                <ElTooltip
                    v-if="
                        hasUserPermission(
                            user.permissoes,
                            UserPermissions.EDITAR_VISITA,
                        )
                    "
                    content="Marcar como concluída"
                    placement="left"
                >
                    <ElButton
                        type="success"
                        circle
                        plain
                        size="small"
                        @click.stop="completeVisita(visita.id)"
                    >
                        <ElIcon><Check /></ElIcon>
                    </ElButton>
                </ElTooltip>
            </div>
        </div>
    </div>
</template>

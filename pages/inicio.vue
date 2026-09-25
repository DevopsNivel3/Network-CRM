<script setup lang="ts">
import {
    Briefcase,
    Calendar,
    Wallet,
    ArrowRightBold,
    Search,
} from "@element-plus/icons-vue";
import { normalizePermissionModules, allModules } from "~/utils/permissions";

const { user } = useAuthSession();

const availableModules = computed(() =>
    normalizePermissionModules(user.empresa_modulos as any),
);

const moduleCatalog = [
    {
        key: "CRM",
        title: "CRM",
        description:
            "Gestão completa de leads, oportunidades, visitas e grupos em um único lugar.",
        href: "/crm",
        icon: Briefcase,
    },
    {
        key: "FINANCEIRO",
        title: "Financeiro",
        description:
            "Controle financeiro, fluxo de caixa e indicadores em um só lugar.",
        href: "/financeiro",
        icon: Wallet,
    },
    {
        key: "LOCALIZEIA",
        title: "Buscar Oportunidades",
        description:
            "Mineracao de leads B2B por nicho, cidade e UF a partir do Google Maps.",
        href: "/localizeia",
        icon: Search,
    },
];

const moduleCatalogMap = computed(() =>
    moduleCatalog.reduce(
        (acc, item) => {
            acc[item.key] = item;
            return acc;
        },
        {} as Record<
            string,
            {
                key: string;
                title: string;
                description: string;
                href?: string;
                icon: typeof Briefcase;
            }
        >,
    ),
);

const moduleCards = computed(() =>
    allModules.map((moduleKey) => {
        const catalog =
            moduleCatalogMap.value[moduleKey] ??
            ({
                key: moduleKey,
                title: moduleKey,
                description: "Em breve.",
                href: undefined,
                icon: Briefcase,
            } as const);

        return {
            ...catalog,
            enabled: availableModules.value.includes(moduleKey),
        };
    }),
);

const changeLog = [
    {
        version: "2.4.4",
        date: "17/05/2026",
        items: [
            "Lembretes automáticos para leads.",
            "Filtro de CNPJ duplicado com integração à API de CNPJ para preenchimento de informações.",
            "Melhorias na lista de leads, com mais campos apresentados.",
        ],
    },
];

const changeLogOpen = ref(false);
const selectedChangeLog = ref<(typeof changeLog)[number] | null>(null);

const openChangeLog = (log: (typeof changeLog)[number]) => {
    selectedChangeLog.value = log;
    changeLogOpen.value = true;
};
</script>

<template>
    <div class="h-full w-full overflow-hidden">
        <ElScrollbar class="!h-full">
            <div class="px-6 py-6 space-y-8">
                <section
                    class="app-surface relative overflow-hidden p-6 md:p-8"
                >
                    <div
                        class="absolute inset-0 bg-[url('/img/app-background.webp')] bg-cover bg-center opacity-70"
                    />
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-nivel/30 via-nivel/10 to-transparent"
                    />
                    <div
                        class="absolute inset-0 bg-[linear-gradient(60deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.9)_48%,rgba(255,255,255,0.45)_56%,transparent_64%)] dark:bg-[linear-gradient(60deg,rgba(12,12,13,0.9)_0%,rgba(12,12,13,0.9)_48%,rgba(12,12,13,0.5)_56%,transparent_64%)]"
                    />
                    <div class="relative space-y-3 max-w-2xl">
                        <p
                            class="text-xs uppercase tracking-[0.3em] text-gray-500"
                        >
                            Bem-vindo
                        </p>
                        <h1
                            class="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white"
                        >
                            Central de módulos e novidades
                        </h1>
                        <p
                            class="text-sm md:text-base text-gray-600 dark:text-white/70"
                        >
                            Aqui você encontra um resumo dos módulos ativos e as
                            últimas atualizações da plataforma.
                        </p>
                    </div>
                </section>

                <section class="space-y-4">
                    <div class="flex items-center gap-2">
                        <h2 class="text-lg font-semibold">Módulos</h2>
                    </div>
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    >
                        <template v-for="card in moduleCards" :key="card.key">
                            <NuxtLink
                                v-if="card.enabled"
                                :to="card.href"
                                class="app-surface group flex cursor-pointer flex-col gap-3 p-5 transition-all hover:!border-nivel hover:!shadow-md"
                            >
                                <div class="flex items-start justify-between">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="bg-black/10 dark:bg-white/20 flex items-center justify-center h-12 w-12 rounded-lg"
                                        >
                                            <ElIcon
                                                class="text-slate-700 dark:text-white/80 group-hover:text-nivel transition-colors"
                                            >
                                                <component :is="card.icon" />
                                            </ElIcon>
                                        </div>
                                        <h3
                                            class="font-semibold text-gray-900 dark:text-white"
                                        >
                                            {{ card.title }}
                                        </h3>
                                    </div>
                                    <ElTag
                                        effect="dark"
                                        :disable-transitions="true"
                                    >
                                        Ativo
                                    </ElTag>
                                </div>
                                <p
                                    class="text-sm text-gray-600 dark:text-white/70 flex-1"
                                >
                                    {{ card.description }}
                                </p>
                                <div class="pt-2 flex justify-end">
                                    <span class="inline-flex">
                                        <ElIcon
                                            class="group-hover:text-nivel transition-colors"
                                        >
                                            <ArrowRightBold />
                                        </ElIcon>
                                    </span>
                                </div>
                            </NuxtLink>
                            <div
                                v-else
                                class="app-surface flex cursor-not-allowed flex-col gap-3 p-5 opacity-70 transition-all"
                            >
                                <div class="flex items-start justify-between">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="bg-black/10 dark:bg-white/20 flex items-center justify-center h-12 w-12 rounded-lg"
                                        >
                                            <ElIcon
                                                class="text-slate-700 dark:text-white/80"
                                            >
                                                <component :is="card.icon" />
                                            </ElIcon>
                                        </div>
                                        <h3
                                            class="font-semibold text-gray-900 dark:text-white"
                                        >
                                            {{ card.title }}
                                        </h3>
                                    </div>
                                    <ElTag
                                        effect="dark"
                                        :disable-transitions="true"
                                        type="info"
                                    >
                                        Indisponível
                                    </ElTag>
                                </div>
                                <p
                                    class="text-sm text-gray-600 dark:text-white/70 flex-1"
                                >
                                    {{ card.description }}
                                </p>
                                <div class="pt-2 flex justify-end">
                                    <span class="inline-flex">
                                        <ElIcon class="text-gray-400">
                                            <ArrowRightBold />
                                        </ElIcon>
                                    </span>
                                </div>
                            </div>
                        </template>
                    </div>
                </section>

                <section class="space-y-4">
                    <div class="flex items-center gap-2">
                        <h2 class="text-lg font-semibold">Atualizações</h2>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <button
                            v-for="log in changeLog"
                            :key="log.version"
                            type="button"
                            class="app-surface space-y-3 p-5 text-left transition-all hover:!border-nivel hover:!shadow-md"
                            @click="openChangeLog(log)"
                        >
                            <div class="flex items-center justify-between">
                                <div
                                    class="text-base font-semibold text-gray-900 dark:text-white"
                                >
                                    v{{ log.version }}
                                </div>
                                <div
                                    class="inline-flex items-center gap-2 text-xs text-gray-500"
                                >
                                    {{ log.date }}
                                </div>
                            </div>
                            <ul
                                class="text-sm text-gray-600 dark:text-white/70 space-y-1"
                            >
                                <li v-for="item in log.items" :key="item">
                                    {{ item }}
                                </li>
                            </ul>
                        </button>
                    </div>
                </section>
            </div>
        </ElScrollbar>
    </div>
    <ElDialog
        v-model="changeLogOpen"
        width="520px"
        :show-close="false"
        @closed="selectedChangeLog = null"
    >
        <template #header>
            <UIDialogHeader
                :title="
                    selectedChangeLog
                        ? `v${selectedChangeLog.version}`
                        : 'Change-log'
                "
                @close="changeLogOpen = false"
            />
        </template>
        <div v-if="selectedChangeLog" class="space-y-4">
            <div class="text-xs text-gray-500">
                {{ selectedChangeLog.date }}
            </div>
            <ul class="text-sm text-gray-700 dark:text-white/70 space-y-2">
                <li v-for="item in selectedChangeLog.items" :key="item">
                    {{ item }}
                </li>
            </ul>
        </div>
    </ElDialog>
</template>

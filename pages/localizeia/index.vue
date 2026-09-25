<script setup lang="ts">
import {
    Download,
    Expand,
    Fold,
    Location,
    Message,
    Search,
    Iphone,
    Plus,
} from "@element-plus/icons-vue";
import { Modules, UserPermissions } from "~/utils/permissions";
import * as XLSX from "xlsx";

definePageMeta({
    requiredModule: Modules.LOCALIZEIA,
    requiredPermission: UserPermissions.VER_LOCALIZEIA,
});

interface EstadoOption {
    id: number;
    label: string;
    value: string;
    uf: string;
}

interface CidadeOption {
    id: number;
    label: string;
    value: string;
}

interface LocalizeIaLead {
    companyName: string;
    phone: string;
    website: string;
    cnpj: string;
    address: string;
    source: string;
}

const estados = ref<EstadoOption[]>([]);
const cidades = ref<CidadeOption[]>([]);
const selectedEstado = ref("");
const selectedUf = ref("");
const selectedCidade = ref("");
const niche = ref("");
const loadingFilters = ref(false);
const loadingCities = ref(false);
const searching = ref(false);
const searchSeconds = ref(0);
const warning = useState("localizeia:warning", () => "");
const leads = useState<LocalizeIaLead[]>("localizeia:leads", () => []);
const pendingLeadDraft = useState<Partial<FormLeadCreate> | null>(
    "lead:create:draft",
    () => null,
);
const filtersCollapsed = ref(false);
const { token } = useAuth();

const canSearch = computed(
    () => !!niche.value.trim() && !!selectedCidade.value && !!selectedUf.value,
);

const resultsGridClass = computed(() =>
    filtersCollapsed.value
        ? "md:grid-cols-[minmax(0,1fr)]"
        : "md:grid-cols-[360px_minmax(0,1fr)]",
);

const selectedEstadoLabel = computed(() => {
    const estado = estados.value.find((item) => item.value === selectedEstado.value);
    return estado ? `${estado.label} (${estado.uf})` : "";
});

const buildWhatsAppLink = (phone: string) => {
    if (!phone || phone === "-") return "";
    if (phone.startsWith("https://wa.me/")) return phone;

    let digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    if (!digits.startsWith("55")) digits = `55${digits}`;

    return `https://wa.me/${digits}`;
};

const normalizeLeadPhone = (phone: string) => {
    if (!phone || phone === "-") return null;

    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("55") && digits.length > 11) {
        digits = digits.slice(2);
    }

    return digits || null;
};

const normalizeLeadCnpj = (cnpj: string) => {
    if (!cnpj || cnpj === "-") return null;

    const digits = cnpj.replace(/\D/g, "");
    return digits.length === 14 ? cnpj : null;
};

const openLeadCreate = async (lead: LocalizeIaLead) => {
    pendingLeadDraft.value = {
        nome_lead: lead.companyName || null,
        contato: normalizeLeadPhone(lead.phone),
        cpf_cnpj: normalizeLeadCnpj(lead.cnpj),
    };

    await navigateTo({
        path: "/crm/leads",
        query: { create: "1" },
    });
};

const getLeadKey = (lead: LocalizeIaLead) =>
    `${lead.companyName || ""}|${lead.address || ""}|${lead.phone || ""}`;

const upsertLead = (lead: LocalizeIaLead) => {
    const key = getLeadKey(lead);
    const index = leads.value.findIndex((item) => getLeadKey(item) === key);

    if (index >= 0) {
        leads.value.splice(index, 1, lead);
        return;
    }

    leads.value.push(lead);
};

const parseStreamLine = (line: string) => {
    if (!line.trim()) return;

    const message = JSON.parse(line);

    if (message.type === "lead" && message.lead) {
        upsertLead(message.lead);
        filtersCollapsed.value = true;
        return;
    }

    if (message.type === "done") {
        warning.value = message.warning || "";
        ElMessage.success(`Busca concluida: ${message.total || leads.value.length} empresas.`);
        return;
    }

    if (message.type === "error") {
        throw new Error(message.message || "Falha ao buscar empresas.");
    }
};

const loadEstados = async () => {
    loadingFilters.value = true;
    try {
        const data = await useApi<EstadoOption[]>("/api/map/estados");
        estados.value = [...data].sort((a, b) => a.label.localeCompare(b.label));
    } catch {
        ElMessage.error("Falha ao carregar estados.");
    } finally {
        loadingFilters.value = false;
    }
};

const loadCidades = async () => {
    cidades.value = [];
    selectedCidade.value = "";

    if (!selectedEstado.value) return;

    const estado = estados.value.find((item) => item.value === selectedEstado.value);
    selectedUf.value = estado?.uf || "";

    loadingCities.value = true;
    try {
        const data = await useApi<CidadeOption[]>("/api/map/cidades", {
            query: {
                estado: selectedEstado.value,
                page: 1,
                perPage: 10000,
            },
        });
        cidades.value = [...data].sort((a, b) => a.label.localeCompare(b.label));
    } catch {
        ElMessage.error("Falha ao carregar cidades.");
    } finally {
        loadingCities.value = false;
    }
};

const searchLeads = async () => {
    if (!canSearch.value || searching.value) return;

    warning.value = "";
    searching.value = true;
    leads.value = [];

    try {
        const params = new URLSearchParams({
            niche: niche.value.trim(),
            city: selectedCidade.value,
            uf: selectedUf.value,
        });
        const authToken = token.value
            ? token.value.startsWith("Bearer ")
                ? token.value
                : `Bearer ${token.value}`
            : "";
        const response = await fetch(
            `/api/localizeia/search-leads-stream?${params.toString()}`,
            {
                method: "GET",
                credentials: "same-origin",
                headers: authToken ? { Authorization: authToken } : {},
            },
        );

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(text || "Falha ao buscar empresas.");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Navegador sem suporte a streaming.");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) parseStreamLine(line);
        }

        buffer += decoder.decode();
        parseStreamLine(buffer);
    } catch (err: any) {
        ElMessage.error(err?.data?.message || err?.message || "Falha ao buscar empresas.");
    } finally {
        searching.value = false;
    }
};

{ /*const exportCsv = () => {
    const header = ["Empresa", "Telefone", "CNPJ", "Website", "Endereco", "Fonte"];
    const rows = leads.value.map((lead) => [
        lead.companyName,
        lead.phone,
        lead.cnpj,
        lead.website,
        lead.address,
        lead.source,
    ]);

    const csvContent = [header, ...rows]
        .map((row) =>
            row
                .map((value) => {
                    const normalized = String(value ?? "")
                        .replace(/\r?\n|\r/g, " ")
                        .replace(/\s+/g, " ")
                        .trim()
                        .replace(/"/g, '""');

                    return `"${normalized}"`;
                })
                .join(";"),
        )
        .join("\r\n");
    const blob = new Blob([`\uFEFFsep=;\r\n${csvContent}`], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `localizeia-leads-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}; */}

const exportExcel = () => {
    // 1. Prepara os dados (Header + Linhas)
    const data = [
        ["Empresa", "Telefone", "CNPJ", "Website", "Endereco", "Fonte"], // Cabeçalho
        ...leads.value.map((lead) => [
            lead.companyName || "",
            lead.phone || "",
            lead.cnpj || "",
            lead.website || "",
            lead.address || "",
            lead.source || "",
        ])
    ];

    // 2. Cria a planilha (Worksheet)
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 3. Ajusta a largura das colunas (Exemplo: 20 caracteres por coluna)
    const colWidths = data[0].map(() => ({ wch: 25 }));
    ws['!cols'] = colWidths;

    // 4. Cria o livro (Workbook)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");

    // 5. Salva o arquivo
    XLSX.writeFile(wb, `localizeia-leads-${Date.now()}.xlsx`);
};

watch(selectedEstado, loadCidades);

watch(searching, (value) => {
    if (!value) {
        searchSeconds.value = 0;
        return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
        if (!searching.value) {
            window.clearInterval(timer);
            return;
        }

        searchSeconds.value = Math.floor((Date.now() - startedAt) / 1000);
    }, 1000);
});

onMounted(loadEstados);
</script>

<template>
    <div class="flex h-full w-full flex-col overflow-hidden">
        <div
            class="flex items-center justify-between gap-4 border-b px-4 py-3 dark:!border-white/15"
        >
            <h1 class="flex items-center gap-2 text-nowrap text-base font-medium">
                <ElIcon class="!text-nivel">
                    <Search />
                </ElIcon>
                <span>Buscar Oportunidades</span>
                <span
                    class="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                >
                    Beta
                </span>
            </h1>
            <div class="flex items-center gap-2">
                <ElButton
                    :icon="filtersCollapsed ? Expand : Fold"
                    @click="filtersCollapsed = !filtersCollapsed"
                >
                    {{ filtersCollapsed ? "Filtros" : "Ocultar Buscador" }}
                </ElButton>
                <ElButton
                    :icon="Download"
                    :disabled="!leads.length"
                    @click="exportExcel"
                >
                    Exportar Excel
                </ElButton>
            </div>
        </div>

        <div
            class="grid min-h-0 min-w-0 flex-1 grid-cols-1 transition-[grid-template-columns] duration-200"
            :class="resultsGridClass"
        >
            <aside
                v-show="!filtersCollapsed"
                class="min-h-0 overflow-y-auto border-b bg-white/80 p-4 dark:border-white/10 dark:bg-ebano/60 md:border-b-0 md:border-r"
            >
                <ElForm label-position="top" @submit.prevent="searchLeads">
                    <ElFormItem label="Estado">
                        <ElSelect
                            v-model="selectedEstado"
                            filterable
                            clearable
                            :loading="loadingFilters"
                            placeholder="Selecione a UF"
                            class="w-full"
                        >
                            <ElOption
                                v-for="estado in estados"
                                :key="estado.id"
                                :label="`${estado.label} (${estado.uf})`"
                                :value="estado.value"
                            />
                        </ElSelect>
                        <p v-if="selectedEstadoLabel" class="mt-1 text-xs text-nivel">
                            {{ selectedEstadoLabel }}
                        </p>
                    </ElFormItem>

                    <ElFormItem label="Cidade">
                        <ElSelect
                            v-model="selectedCidade"
                            filterable
                            clearable
                            :loading="loadingCities"
                            :disabled="!selectedEstado"
                            placeholder="Selecione a cidade"
                            class="w-full"
                        >
                            <ElOption
                                v-for="cidade in cidades"
                                :key="cidade.id"
                                :label="cidade.label"
                                :value="cidade.value"
                            />
                        </ElSelect>
                    </ElFormItem>

                    <ElFormItem label="Nicho">
                        <ElInput
                            v-model="niche"
                            placeholder="Busque um por vez, ex: mercado..."
                            clearable
                            @keyup.enter="searchLeads"
                        />
                    </ElFormItem>

                    <ElButton
                        type="primary"
                        class="w-full"
                        :icon="Search"
                        :loading="searching"
                        :disabled="!canSearch"
                        @click="searchLeads"
                    >
                        {{ searching ? `Buscando... ${searchSeconds}s` : "Buscar empresas" }}
                    </ElButton>
                </ElForm>

                <ElAlert
                    class="mt-4"
                    type="info"
                    :closable="false"
                    show-icon
                    title="A busca usa o Google Maps e buscador de CNPJ,  pode levar alguns minutos, as oportunidades aparecerão gradualmente!"
                />
            </aside>

            <main class="min-h-0 min-w-0 overflow-hidden bg-gray-50/70 dark:bg-transparent">
                <div class="flex h-full min-h-0 flex-col">
                    <div class="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
                        <div>
                            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                                Resultados
                            </h2>
                            <p class="text-xs text-gray-500 dark:text-white/50">
                                <span v-if="searching && leads.length">
                                    {{ leads.length }} empresas completas encontradas ate agora
                                </span>
                                <span v-else-if="leads.length">
                                    {{ leads.length }} empresas encontradas
                                </span>
                                <span v-else>
                                    {{ leads.length }} empresas encontradas
                                </span>
                            </p>
                        </div>
                    </div>

                    <div class="shrink-0 px-4 pb-3" v-if="warning">
                        <ElAlert :title="warning" type="warning" show-icon />
                    </div>

                    <div class="localizeia-results-area">
                        <ElEmpty
                            v-if="!leads.length && !searching"
                            class="localizeia-results-placeholder"
                            description="Faca uma busca para listar empresas B2B."
                        />

                        <ElSkeleton
                            v-else-if="searching && !leads.length"
                            class="localizeia-results-placeholder"
                            :rows="8"
                            animated
                        />

                        <ElTable
                            v-else
                            :data="leads"
                            border
                            fit
                            size="small"
                            height="100%"
                            table-layout="fixed"
                            class="localizeia-results-table"
                        >
                            <ElTableColumn
                                prop="companyName"
                                label="Empresa"
                                min-width="150"
                                show-overflow-tooltip
                            >
                                <template #default="{ row }">
                                    <ElTooltip
                                        content="Cadastrar lead com estes dados"
                                        placement="top"
                                        :hide-after="0"
                                    >
                                        <ElButton
                                            link
                                            type="primary"
                                            class="!h-auto !min-w-0 !justify-start !whitespace-normal !text-left"
                                            :icon="Plus"
                                            @click="openLeadCreate(row)"
                                        >
                                            {{ row.companyName || "Empresa sem nome" }}
                                        </ElButton>
                                    </ElTooltip>
                                </template>
                            </ElTableColumn>
                            <ElTableColumn label="WhatsApp" width="92" align="center">
                                <template #default="{ row }">
                                    <ElLink
                                        v-if="buildWhatsAppLink(row.phone)"
                                        type="success"
                                        :href="buildWhatsAppLink(row.phone)"
                                        target="_blank"
                                    >
                                        <ElIcon><Iphone /></ElIcon>
                                    </ElLink>
                                    <span v-else class="text-gray-400">-</span>
                                </template>
                            </ElTableColumn>
                            <ElTableColumn label="CNPJ" width="154" show-overflow-tooltip>
                                <template #default="{ row }">
                                    <span>{{ row.cnpj || "-" }}</span>
                                </template>
                            </ElTableColumn>
                            <ElTableColumn label="Site" width="64" align="center">
                                <template #default="{ row }">
                                    <ElLink
                                        v-if="row.website && row.website !== '-'"
                                        type="primary"
                                        :href="row.website"
                                        target="_blank"
                                    >
                                        Site
                                    </ElLink>
                                    <span v-else class="text-gray-400">-</span>
                                </template>
                            </ElTableColumn>
                            <ElTableColumn
                                prop="address"
                                label="Endereco"
                                min-width="260"
                            >
                                <template #default="{ row }">
                                    <span class="localizeia-cell-wrap inline-flex min-w-0 items-start gap-1">
                                        <ElIcon class="mt-0.5 shrink-0 text-gray-400"><Location /></ElIcon>
                                        <span>{{ row.address || "-" }}</span>
                                    </span>
                                </template>
                            </ElTableColumn>
                            <ElTableColumn
                                prop="source"
                                label="Fonte"
                                min-width="110"
                            >
                                <template #default="{ row }">
                                    <span class="localizeia-cell-wrap">{{ row.source || "-" }}</span>
                                </template>
                            </ElTableColumn>
                        </ElTable>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<style scoped>
.localizeia-results-area {
    display: flex;
    min-height: 0;
    min-width: 0;
    flex: 1 1 auto;
    flex-direction: column;
    overflow: hidden;
    padding: 0 16px 16px;
}

.localizeia-results-placeholder {
    min-height: 260px;
}

.localizeia-results-table {
    min-height: 0;
    flex: 1 1 auto;
    width: 100%;
}

.localizeia-results-table :deep(.el-table__cell) {
    padding-left: 6px;
    padding-right: 6px;
}

.localizeia-results-table :deep(.cell) {
    padding-left: 4px;
    padding-right: 4px;
    line-height: 1.35;
    white-space: normal;
}

.localizeia-cell-wrap {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.localizeia-results-table :deep(.el-table__inner-wrapper),
.localizeia-results-table :deep(.el-table__body-wrapper),
.localizeia-results-table :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
}

.localizeia-results-table :deep(.el-table__header-wrapper),
.localizeia-results-table :deep(.el-table__body-wrapper) {
    min-width: 0;
}

.localizeia-results-table :deep(.el-table__body-wrapper) {
    overflow-y: auto;
}

.localizeia-results-table :deep(.el-scrollbar__bar.is-horizontal) {
    display: none;
}
</style>

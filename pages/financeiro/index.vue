<script setup lang="ts">
import dayjs from "dayjs";
import {
    Wallet, Plus, Search, EditPen, CircleCheck, CloseBold, Delete,
    Refresh, WarningFilled, UserFilled, Download, View, Money,
} from "@element-plus/icons-vue";
import { Modules, UserPermissions, hasUserPermission } from "~/utils/permissions";

definePageMeta({
    requiredModule: Modules.FINANCEIRO,
    requiredPermission: UserPermissions.VER_FINANCEIRO,
});

type LeadOption = { id: number; nome_lead?: string | null; cpf_cnpj?: string | null; contato?: string | null };
type FinancialAccount = {
    id: number; descricao: string; valor: number; data_vencimento: string;
    status: string; responsavel?: string | null; banco?: string | null;
    recorrente: boolean; categoria?: string | null; observacoes?: string | null;
    fornecedor?: string | null; forma_pagamento?: string | null; data_pagamento?: string | null;
    lead_id?: number; lead?: LeadOption; forma_recebimento?: string | null; data_recebimento?: string | null;
};
type ClientReport = LeadOption & {
    contato_nome?: string | null; responsavel?: string | null; atividade?: string | null;
    cidade?: string | null; estado?: string | null; classificacao: string;
    titulos_total: number; titulos_pendentes: number; titulos_vencidos: number; titulos_recebidos: number;
    total_pendente: number; total_vencido: number; total_recebido: number;
    vencimento_mais_antigo?: string | null; dias_atraso: number; contas?: FinancialAccount[];
};

const { user } = useAuthSession();
const activeTab = ref("pagar");
const loading = ref(false);
const saving = ref(false);
const payables = ref<FinancialAccount[]>([]);
const receivables = ref<FinancialAccount[]>([]);
const clients = ref<LeadOption[]>([]);
const reportClients = ref<ClientReport[]>([]);
const reportSummary = ref<Record<string, number>>({});
const reportStates = ref<string[]>([]);
const reportPagination = reactive({ page: 1, pageSize: 25, total: 0, pages: 1 });
const reportLoaded = ref(false);
const detailLoading = ref(false);
const accountDialog = ref(false);
const settlementDialog = ref(false);
const detailDialog = ref(false);
const editingId = ref<number | null>(null);
const selectedAccount = ref<FinancialAccount | null>(null);
const selectedClient = ref<ClientReport | null>(null);

const filters = reactive({ search: "", status: "todos", forma: "todos", data_inicio: "", data_fim: "" });
const reportFilters = reactive({ search: "", classificacao: "todos", estado: "todos", dias_atraso: 0 });
const form = reactive({
    descricao: "", fornecedor: "", lead_id: null as number | null, responsavel: "",
    valor: null as number | null, data_vencimento: "", forma: "", banco: "",
    recorrente: false, categoria: "", observacoes: "",
});
const settlement = reactive({ data: dayjs().format("YYYY-MM-DD"), forma: "dinheiro", banco: "" });

const paymentMethods = [
    ["dinheiro", "Dinheiro"], ["pix", "PIX"], ["transferencia", "Transferência"],
    ["boleto", "Boleto"], ["cartao_credito", "Cartão de crédito"],
    ["cartao_debito", "Cartão de débito"], ["outros", "Outros"],
];
const isReceivable = computed(() => activeTab.value === "receber");
const canDelete = computed(() => hasUserPermission(user.permissoes, UserPermissions.ADMIN));
const currentAccounts = computed(() => isReceivable.value ? receivables.value : payables.value);
const today = () => dayjs().startOf("day");
const isOverdue = (row: FinancialAccount) => row.status === "pendente" && dayjs(row.data_vencimento).isBefore(today());
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const date = (value?: string | null) => value ? dayjs(value).format("DD/MM/YYYY") : "-";
const document = (value?: string | null) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return value || "-";
};
const methodLabel = (value?: string | null) => paymentMethods.find(([key]) => key === value)?.[1] || "Não informada";
const statusLabel = (row: FinancialAccount) => isOverdue(row) ? "Vencida" : ({ pendente: "Pendente", pago: "Pago", recebido: "Recebido", cancelado: "Cancelado" }[row.status] || row.status);
const statusType = (row: FinancialAccount) => isOverdue(row) ? "danger" : row.status === "pendente" ? "warning" : ["pago", "recebido"].includes(row.status) ? "success" : "info";
const classificationLabel = (value: string) => ({ inadimplente: "Inadimplente", com_pendencia: "Com pendência", sem_pendencia: "Sem pendência" }[value] || value);
const classificationType = (value: string) => value === "inadimplente" ? "danger" : value === "com_pendencia" ? "warning" : "success";

const accountSummary = computed(() => {
    const pending = currentAccounts.value.filter((item) => item.status === "pendente");
    const settledStatus = isReceivable.value ? "recebido" : "pago";
    return {
        pending: pending.reduce((sum, item) => sum + Number(item.valor), 0),
        settled: currentAccounts.value.filter((item) => item.status === settledStatus).reduce((sum, item) => sum + Number(item.valor), 0),
        overdue: pending.filter(isOverdue).reduce((sum, item) => sum + Number(item.valor), 0),
        dueToday: pending.filter((item) => dayjs(item.data_vencimento).isSame(today(), "day")).reduce((sum, item) => sum + Number(item.valor), 0),
    };
});

const queryParams = () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
const errorMessage = (error: any, fallback: string) => error?.data?.message || error?.message || fallback;

const loadPayables = async () => {
    const response = await useApi<{ data: FinancialAccount[] }>("/api/financeiro/contas-pagar", { query: queryParams() });
    payables.value = response.data;
};
const loadReceivables = async () => {
    const response = await useApi<{ data: FinancialAccount[] }>("/api/financeiro/contas-receber", { query: queryParams() });
    receivables.value = response.data;
};
const loadClients = async () => {
    const response = await useApi<{ data: LeadOption[] }>("/api/financeiro/clientes");
    clients.value = response.data;
};
const loadReport = async () => {
    const response = await useApi<{ summary: Record<string, number>; clients: ClientReport[]; states: string[]; pagination: typeof reportPagination }>("/api/financeiro/relatorio-clientes", {
        query: { ...reportFilters, page: reportPagination.page, page_size: reportPagination.pageSize },
    });
    reportSummary.value = response.summary;
    reportClients.value = response.clients;
    reportStates.value = response.states;
    Object.assign(reportPagination, response.pagination);
    reportLoaded.value = true;
};
const loadData = async () => {
    loading.value = true;
    try {
        await Promise.all([loadPayables(), loadReceivables(), loadClients()]);
    } catch (error) {
        ElMessage.error(errorMessage(error, "Não foi possível carregar o Financeiro."));
    } finally { loading.value = false; }
};

const resetForm = () => Object.assign(form, {
    descricao: "", fornecedor: "", lead_id: null, responsavel: "", valor: null,
    data_vencimento: "", forma: "", banco: "", recorrente: false, categoria: "", observacoes: "",
});
const openCreate = () => { editingId.value = null; resetForm(); accountDialog.value = true; };
const openEdit = (row: FinancialAccount) => {
    editingId.value = row.id;
    Object.assign(form, {
        descricao: row.descricao, fornecedor: row.fornecedor || "", lead_id: row.lead_id || null,
        responsavel: row.responsavel || "", valor: Number(row.valor), data_vencimento: row.data_vencimento,
        forma: isReceivable.value ? row.forma_recebimento || "" : row.forma_pagamento || "",
        banco: row.banco || "", recorrente: row.recorrente, categoria: row.categoria || "", observacoes: row.observacoes || "",
    });
    accountDialog.value = true;
};
const accountPayload = () => ({
    descricao: form.descricao, ...(isReceivable.value ? { lead_id: form.lead_id, forma_recebimento: form.forma || null } : { fornecedor: form.fornecedor || null, forma_pagamento: form.forma || null }),
    responsavel: form.responsavel || null, valor: form.valor, data_vencimento: form.data_vencimento,
    banco: form.banco || null, recorrente: form.recorrente, categoria: form.categoria || null, observacoes: form.observacoes || null,
});
const saveAccount = async () => {
    if (!form.descricao.trim() || !form.valor || !form.data_vencimento || (isReceivable.value && !form.lead_id)) {
        return ElMessage.warning("Preencha descrição, valor, vencimento e cliente quando aplicável.");
    }
    saving.value = true;
    try {
        const base = isReceivable.value ? "/api/financeiro/contas-receber" : "/api/financeiro/contas-pagar";
        await useApi(editingId.value ? `${base}/${editingId.value}` : base, { method: editingId.value ? "PATCH" : "POST", body: accountPayload() });
        ElMessage.success(editingId.value ? "Conta atualizada." : "Conta cadastrada.");
        accountDialog.value = false;
        await Promise.all([isReceivable.value ? loadReceivables() : loadPayables(), loadReport()]);
    } catch (error) { ElMessage.error(errorMessage(error, "Não foi possível salvar a conta.")); }
    finally { saving.value = false; }
};

const openSettlement = (row: FinancialAccount) => {
    selectedAccount.value = row;
    settlement.data = dayjs().format("YYYY-MM-DD");
    settlement.forma = (isReceivable.value ? row.forma_recebimento : row.forma_pagamento) || "dinheiro";
    settlement.banco = row.banco || "";
    settlementDialog.value = true;
};
const settleAccount = async () => {
    if (!selectedAccount.value) return;
    saving.value = true;
    try {
        const action = isReceivable.value ? "receber" : "pagar";
        const base = isReceivable.value ? "contas-receber" : "contas-pagar";
        await useApi(`/api/financeiro/${base}/${selectedAccount.value.id}/${action}`, { method: "POST", body: settlement });
        ElMessage.success(isReceivable.value ? "Recebimento confirmado." : "Pagamento confirmado.");
        settlementDialog.value = false;
        await Promise.all([isReceivable.value ? loadReceivables() : loadPayables(), loadReport()]);
    } catch (error) { ElMessage.error(errorMessage(error, "Não foi possível baixar a conta.")); }
    finally { saving.value = false; }
};
const reopenReceivable = async (row: FinancialAccount) => {
    try {
        const { value } = await ElMessageBox.prompt(
            "Explique por que este recebimento precisa ser reaberto. O motivo ficará registrado na auditoria.",
            "Reabrir recebimento",
            {
                confirmButtonText: "Reabrir",
                cancelButtonText: "Cancelar",
                type: "warning",
                inputType: "textarea",
                inputPlaceholder: "Ex.: Forma de recebimento informada incorretamente",
                inputValidator: (text: string) => text?.trim().length >= 5 || "Informe um motivo com pelo menos 5 caracteres.",
            },
        );
        saving.value = true;
        await useApi(`/api/financeiro/contas-receber/${row.id}/reabrir`, { method: "POST", body: { motivo: value.trim() } });
        ElMessage.success("Recebimento reaberto. O lançamento já pode ser ajustado.");
        await Promise.all([loadReceivables(), loadReport()]);
    } catch (error: any) {
        if (error !== "cancel" && error !== "close") ElMessage.error(errorMessage(error, "Não foi possível reabrir o recebimento."));
    } finally { saving.value = false; }
};
const cancelAccount = async (row: FinancialAccount) => {
    try {
        await ElMessageBox.confirm("Deseja cancelar este lançamento?", "Confirmar cancelamento", { type: "warning" });
        const base = isReceivable.value ? "contas-receber" : "contas-pagar";
        await useApi(`/api/financeiro/${base}/${row.id}/cancelar`, { method: "POST" });
        ElMessage.success("Lançamento cancelado.");
        await Promise.all([isReceivable.value ? loadReceivables() : loadPayables(), loadReport()]);
    } catch (error: any) { if (error !== "cancel") ElMessage.error(errorMessage(error, "Não foi possível cancelar.")); }
};
const deleteAccount = async (row: FinancialAccount) => {
    try {
        await ElMessageBox.confirm("A exclusão é permanente. Deseja continuar?", "Excluir lançamento", { type: "error" });
        const base = isReceivable.value ? "contas-receber" : "contas-pagar";
        await useApi(`/api/financeiro/${base}/${row.id}`, { method: "DELETE" });
        ElMessage.success("Lançamento excluído.");
        await Promise.all([isReceivable.value ? loadReceivables() : loadPayables(), loadReport()]);
    } catch (error: any) { if (error !== "cancel") ElMessage.error(errorMessage(error, "Não foi possível excluir.")); }
};

let reportTimer: ReturnType<typeof setTimeout> | undefined;
watch(reportFilters, () => {
    if (!reportLoaded.value) return;
    clearTimeout(reportTimer);
    reportTimer = setTimeout(async () => { reportPagination.page = 1; await loadReport(); }, 350);
}, { deep: true });
const changeReportPage = async (page: number) => { reportPagination.page = page; await loadReport(); };
const changeReportPageSize = async (size: number) => { reportPagination.pageSize = size; reportPagination.page = 1; await loadReport(); };
const showClient = async (client: ClientReport) => {
    selectedClient.value = { ...client, contas: [] };
    detailDialog.value = true;
    detailLoading.value = true;
    try {
        const response = await useApi<{ contas: FinancialAccount[] }>(`/api/financeiro/relatorio-clientes/${client.id}`);
        if (selectedClient.value?.id === client.id) selectedClient.value.contas = response.contas;
    } catch (error) { ElMessage.error(errorMessage(error, "Não foi possível carregar os títulos do cliente.")); }
    finally { detailLoading.value = false; }
};
const exportCsv = () => {
    const headers = ["Cliente", "CPF/CNPJ", "Contato", "Cidade", "UF", "Classificação", "Títulos", "Pendente", "Vencido", "Recebido", "Dias de atraso"];
    const rows = reportClients.value.map((client) => [client.nome_lead, client.cpf_cnpj, client.contato, client.cidade, client.estado, classificationLabel(client.classificacao), client.titulos_total, client.total_pendente.toFixed(2), client.total_vencido.toFixed(2), client.total_recebido.toFixed(2), client.dias_atraso]);
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const blob = new Blob(["\uFEFF" + [headers, ...rows].map((row) => row.map(escape).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = globalThis.document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `inadimplencia_clientes_${dayjs().format("YYYY-MM-DD")}.csv`; link.click(); URL.revokeObjectURL(link.href);
};

watch(activeTab, async (tab) => {
    if (tab === "clientes") {
        if (!reportLoaded.value) await loadReport();
    } else await (tab === "receber" ? loadReceivables() : loadPayables());
});
onMounted(loadData);
</script>

<template>
    <div class="flex h-full w-full flex-col overflow-hidden">
        <header class="flex items-center justify-between gap-3 border-b px-4 py-3 dark:!border-white/15">
            <h1 class="flex items-center gap-2 text-base font-medium"><ElIcon class="!text-nivel"><Wallet /></ElIcon>Financeiro</h1>
            <div class="flex gap-2">
                <ElButton :icon="Refresh" circle :loading="loading" @click="loadData" />
                <ElButton v-if="activeTab !== 'clientes'" type="primary" :icon="Plus" @click="openCreate">Novo lançamento</ElButton>
                <ElButton v-else :icon="Download" :disabled="!reportClients.length" @click="exportCsv">Exportar página</ElButton>
            </div>
        </header>

        <ElScrollbar class="!h-full">
            <div class="space-y-5 p-4 md:p-6" v-loading="loading">
                <ElTabs v-model="activeTab" class="finance-tabs">
                    <ElTabPane label="Contas a pagar" name="pagar" />
                    <ElTabPane label="Contas a receber" name="receber" />
                    <ElTabPane label="Clientes e inadimplência" name="clientes" />
                </ElTabs>

                <template v-if="activeTab !== 'clientes'">
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <ElCard shadow="never"><div class="text-xs text-black/55 dark:text-white/55">Em aberto</div><div class="mt-1 text-xl font-semibold">{{ money(accountSummary.pending) }}</div></ElCard>
                        <ElCard shadow="never"><div class="text-xs text-black/55 dark:text-white/55">{{ isReceivable ? 'Recebido' : 'Pago' }}</div><div class="mt-1 text-xl font-semibold text-emerald-600">{{ money(accountSummary.settled) }}</div></ElCard>
                        <ElCard shadow="never"><div class="flex items-center gap-1 text-xs text-red-600"><WarningFilled class="h-3.5 w-3.5" />Vencido</div><div class="mt-1 text-xl font-semibold text-red-600">{{ money(accountSummary.overdue) }}</div></ElCard>
                        <ElCard shadow="never"><div class="text-xs text-black/55 dark:text-white/55">Vence hoje</div><div class="mt-1 text-xl font-semibold text-orange-500">{{ money(accountSummary.dueToday) }}</div></ElCard>
                    </div>

                    <ElCard shadow="never">
                        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                            <ElInput v-model="filters.search" :prefix-icon="Search" clearable placeholder="Descrição, cliente ou fornecedor" class="xl:col-span-2" @keyup.enter="isReceivable ? loadReceivables() : loadPayables()" />
                            <ElSelect v-model="filters.status"><ElOption label="Todos os status" value="todos" /><ElOption label="Pendente" value="pendente" /><ElOption :label="isReceivable ? 'Recebido' : 'Pago'" :value="isReceivable ? 'recebido' : 'pago'" /><ElOption label="Cancelado" value="cancelado" /></ElSelect>
                            <ElSelect v-model="filters.forma"><ElOption label="Todas as formas" value="todos" /><ElOption v-for="method in paymentMethods" :key="method[0]" :label="method[1]" :value="method[0]" /></ElSelect>
                            <ElDatePicker v-model="filters.data_inicio" value-format="YYYY-MM-DD" type="date" placeholder="Vencimento inicial" class="!w-full" />
                            <div class="flex gap-2"><ElDatePicker v-model="filters.data_fim" value-format="YYYY-MM-DD" type="date" placeholder="Vencimento final" class="!w-full" /><ElButton type="primary" :icon="Search" @click="isReceivable ? loadReceivables() : loadPayables()" /></div>
                        </div>
                    </ElCard>

                    <ElCard shadow="never" body-class="!p-0">
                        <ElTable :data="currentAccounts" stripe empty-text="Nenhum lançamento encontrado">
                            <ElTableColumn label="Descrição" min-width="220"><template #default="{ row }"><div class="font-medium">{{ row.descricao }}</div><div class="text-xs text-black/50 dark:text-white/50">{{ isReceivable ? row.lead?.nome_lead : row.fornecedor || 'Sem fornecedor' }}</div></template></ElTableColumn>
                            <ElTableColumn label="Valor" width="135"><template #default="{ row }"><span class="font-semibold">{{ money(row.valor) }}</span></template></ElTableColumn>
                            <ElTableColumn label="Vencimento" width="125"><template #default="{ row }"><span :class="isOverdue(row) ? 'font-medium text-red-600' : ''">{{ date(row.data_vencimento) }}</span></template></ElTableColumn>
                            <ElTableColumn label="Status" width="115"><template #default="{ row }"><ElTag :type="statusType(row)" effect="light">{{ statusLabel(row) }}</ElTag></template></ElTableColumn>
                            <ElTableColumn label="Forma" width="150"><template #default="{ row }">{{ methodLabel(isReceivable ? row.forma_recebimento : row.forma_pagamento) }}</template></ElTableColumn>
                            <ElTableColumn prop="responsavel" label="Responsável" min-width="130" />
                            <ElTableColumn label="Ações" fixed="right" width="230" align="right">
                                <template #default="{ row }">
                                    <div class="flex justify-end gap-1">
                                        <ElTooltip content="Editar"><ElButton circle size="small" :icon="EditPen" :disabled="row.status !== 'pendente'" @click="openEdit(row)" /></ElTooltip>
                                        <ElTooltip :content="isReceivable ? 'Receber' : 'Pagar'"><ElButton circle size="small" type="success" :icon="CircleCheck" :disabled="row.status !== 'pendente'" @click="openSettlement(row)" /></ElTooltip>
                                        <ElTooltip v-if="isReceivable && row.status === 'recebido'" content="Reabrir recebimento"><ElButton circle size="small" type="primary" plain :icon="Refresh" :loading="saving" @click="reopenReceivable(row)" /></ElTooltip>
                                        <ElTooltip content="Cancelar"><ElButton circle size="small" type="warning" :icon="CloseBold" :disabled="row.status !== 'pendente'" @click="cancelAccount(row)" /></ElTooltip>
                                        <ElTooltip v-if="canDelete" content="Excluir"><ElButton circle size="small" type="danger" :icon="Delete" :disabled="['pago','recebido'].includes(row.status)" @click="deleteAccount(row)" /></ElTooltip>
                                    </div>
                                </template>
                            </ElTableColumn>
                        </ElTable>
                    </ElCard>
                </template>

                <template v-else>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <ElCard shadow="never"><div class="text-xs text-black/55 dark:text-white/55">Clientes</div><div class="mt-1 text-xl font-semibold">{{ reportSummary.total_clientes || 0 }}</div></ElCard>
                        <ElCard shadow="never"><div class="text-xs text-red-600">Inadimplentes</div><div class="mt-1 text-xl font-semibold text-red-600">{{ reportSummary.clientes_inadimplentes || 0 }}</div><div class="text-xs text-black/45">{{ reportSummary.inadimplencia_percentual || 0 }}% da carteira</div></ElCard>
                        <ElCard shadow="never"><div class="text-xs text-orange-500">Total pendente</div><div class="mt-1 text-xl font-semibold text-orange-500">{{ money(reportSummary.total_pendente || 0) }}</div></ElCard>
                        <ElCard shadow="never"><div class="text-xs text-red-600">Total vencido</div><div class="mt-1 text-xl font-semibold text-red-600">{{ money(reportSummary.total_vencido || 0) }}</div></ElCard>
                        <ElCard shadow="never"><div class="text-xs text-emerald-600">Total recebido</div><div class="mt-1 text-xl font-semibold text-emerald-600">{{ money(reportSummary.total_recebido || 0) }}</div></ElCard>
                    </div>
                    <ElCard shadow="never"><div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5"><ElInput v-model="reportFilters.search" :prefix-icon="Search" clearable placeholder="Nome, documento, contato ou cidade" class="xl:col-span-2" /><ElSelect v-model="reportFilters.classificacao"><ElOption label="Todas as classificações" value="todos" /><ElOption label="Inadimplente" value="inadimplente" /><ElOption label="Com pendência" value="com_pendencia" /><ElOption label="Sem pendência" value="sem_pendencia" /></ElSelect><ElSelect v-model="reportFilters.estado"><ElOption label="Todos os estados" value="todos" /><ElOption v-for="state in reportStates" :key="String(state)" :label="String(state)" :value="String(state)" /></ElSelect><ElInputNumber v-model="reportFilters.dias_atraso" :min="0" :step="5" class="!w-full" controls-position="right" /><div class="text-xs text-black/45 md:col-span-2 xl:col-span-5">Filtro mínimo de dias em atraso: {{ reportFilters.dias_atraso }}</div></div></ElCard>
                    <ElCard shadow="never" body-class="!p-0">
                        <ElTable :data="reportClients" stripe empty-text="Nenhum cliente encontrado"><ElTableColumn label="Cliente" min-width="220"><template #default="{ row }"><div class="font-medium">{{ row.nome_lead || 'Sem nome' }}</div><div class="text-xs text-black/50 dark:text-white/50">{{ document(row.cpf_cnpj) }}</div></template></ElTableColumn><ElTableColumn label="Contato / localidade" min-width="190"><template #default="{ row }"><div>{{ row.contato || '-' }}</div><div class="text-xs text-black/50 dark:text-white/50">{{ [row.cidade, row.estado].filter(Boolean).join('/') || '-' }}</div></template></ElTableColumn><ElTableColumn label="Situação" width="140"><template #default="{ row }"><ElTag :type="classificationType(row.classificacao)">{{ classificationLabel(row.classificacao) }}</ElTag></template></ElTableColumn><ElTableColumn label="Pendente" width="135"><template #default="{ row }">{{ money(row.total_pendente) }}</template></ElTableColumn><ElTableColumn label="Vencido" width="135"><template #default="{ row }"><span :class="row.total_vencido ? 'font-semibold text-red-600' : ''">{{ money(row.total_vencido) }}</span></template></ElTableColumn><ElTableColumn label="Atraso" width="120"><template #default="{ row }">{{ row.dias_atraso ? `${row.dias_atraso} dias` : '-' }}</template></ElTableColumn><ElTableColumn label="Detalhes" fixed="right" width="90" align="right"><template #default="{ row }"><ElButton circle size="small" :icon="View" @click="showClient(row)" /></template></ElTableColumn></ElTable>
                        <div class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 dark:border-white/10">
                            <span class="text-xs text-black/50 dark:text-white/50">{{ reportPagination.total }} cliente(s) encontrado(s)</span>
                            <ElPagination background layout="sizes, prev, pager, next" :current-page="reportPagination.page" :page-size="reportPagination.pageSize" :page-sizes="[10, 25, 50, 100]" :total="reportPagination.total" @update:current-page="changeReportPage" @update:page-size="changeReportPageSize" />
                        </div>
                    </ElCard>
                </template>
            </div>
        </ElScrollbar>

        <ElDialog v-model="accountDialog" :title="editingId ? 'Editar lançamento' : 'Novo lançamento'" width="min(680px, 94vw)" destroy-on-close>
            <ElForm label-position="top"><div class="grid grid-cols-1 gap-x-4 md:grid-cols-2"><ElFormItem label="Descrição" class="md:col-span-2" required><ElInput v-model="form.descricao" maxlength="255" /></ElFormItem><ElFormItem v-if="!isReceivable" label="Fornecedor"><ElInput v-model="form.fornecedor" /></ElFormItem><ElFormItem v-else label="Cliente" required><ElSelect v-model="form.lead_id" filterable class="!w-full" placeholder="Selecione um lead"><ElOption v-for="client in clients" :key="client.id" :label="`${client.nome_lead || 'Sem nome'} · ${document(client.cpf_cnpj)}`" :value="client.id" /></ElSelect></ElFormItem><ElFormItem label="Responsável"><ElInput v-model="form.responsavel" /></ElFormItem><ElFormItem label="Valor" required><ElInputNumber v-model="form.valor" :min="0.01" :precision="2" :step="10" class="!w-full" /></ElFormItem><ElFormItem label="Vencimento" required><ElDatePicker v-model="form.data_vencimento" value-format="YYYY-MM-DD" type="date" class="!w-full" /></ElFormItem><ElFormItem :label="isReceivable ? 'Forma de recebimento' : 'Forma de pagamento'"><ElSelect v-model="form.forma" clearable class="!w-full"><ElOption v-for="method in paymentMethods" :key="method[0]" :label="method[1]" :value="method[0]" /></ElSelect></ElFormItem><ElFormItem label="Banco"><ElInput v-model="form.banco" /></ElFormItem><ElFormItem label="Categoria"><ElInput v-model="form.categoria" /></ElFormItem><ElFormItem label="Recorrência"><ElSwitch v-model="form.recorrente" active-text="Gerar próximo mês após a baixa" /></ElFormItem><ElFormItem label="Observações" class="md:col-span-2"><ElInput v-model="form.observacoes" type="textarea" :rows="3" /></ElFormItem></div></ElForm><template #footer><ElButton @click="accountDialog = false">Cancelar</ElButton><ElButton type="primary" :loading="saving" @click="saveAccount">Salvar</ElButton></template>
        </ElDialog>

        <ElDialog v-model="settlementDialog" :title="isReceivable ? 'Confirmar recebimento' : 'Confirmar pagamento'" width="min(500px, 94vw)"><div v-if="selectedAccount" class="mb-4 rounded-lg bg-black/5 p-3 dark:bg-white/5"><div class="font-medium">{{ selectedAccount.descricao }}</div><div class="text-lg font-semibold">{{ money(selectedAccount.valor) }}</div></div><ElForm label-position="top"><ElFormItem :label="isReceivable ? 'Data do recebimento' : 'Data do pagamento'" required><ElDatePicker v-model="settlement.data" value-format="YYYY-MM-DD" type="date" class="!w-full" /></ElFormItem><ElFormItem label="Forma" required><ElSelect v-model="settlement.forma" class="!w-full"><ElOption v-for="method in paymentMethods" :key="method[0]" :label="method[1]" :value="method[0]" /></ElSelect></ElFormItem><ElFormItem label="Banco"><ElInput v-model="settlement.banco" /></ElFormItem></ElForm><template #footer><ElButton @click="settlementDialog = false">Cancelar</ElButton><ElButton type="success" :loading="saving" @click="settleAccount">Confirmar baixa</ElButton></template></ElDialog>

        <ElDialog v-model="detailDialog" title="Situação financeira do cliente" width="min(900px, 96vw)">
            <div v-if="selectedClient" v-loading="detailLoading" class="space-y-4"><div class="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-black/5 p-4 dark:bg-white/5"><div><div class="text-lg font-semibold">{{ selectedClient.nome_lead }}</div><div class="text-sm text-black/55 dark:text-white/55">{{ document(selectedClient.cpf_cnpj) }} · {{ selectedClient.contato || 'Sem contato' }}</div></div><ElTag :type="classificationType(selectedClient.classificacao)" size="large">{{ classificationLabel(selectedClient.classificacao) }}</ElTag></div><div class="grid grid-cols-2 gap-3 md:grid-cols-4"><div class="rounded-lg border p-3"><div class="text-xs text-black/50">Pendente</div><div class="font-semibold text-orange-500">{{ money(selectedClient.total_pendente) }}</div></div><div class="rounded-lg border p-3"><div class="text-xs text-black/50">Vencido</div><div class="font-semibold text-red-600">{{ money(selectedClient.total_vencido) }}</div></div><div class="rounded-lg border p-3"><div class="text-xs text-black/50">Recebido</div><div class="font-semibold text-emerald-600">{{ money(selectedClient.total_recebido) }}</div></div><div class="rounded-lg border p-3"><div class="text-xs text-black/50">Maior atraso</div><div class="font-semibold">{{ selectedClient.dias_atraso }} dias</div></div></div><ElTable :data="selectedClient.contas || []" max-height="360"><ElTableColumn prop="descricao" label="Título" min-width="210" /><ElTableColumn label="Valor" width="125"><template #default="{ row }">{{ money(row.valor) }}</template></ElTableColumn><ElTableColumn label="Vencimento" width="120"><template #default="{ row }">{{ date(row.data_vencimento) }}</template></ElTableColumn><ElTableColumn label="Status" width="115"><template #default="{ row }"><ElTag :type="statusType(row)">{{ statusLabel(row) }}</ElTag></template></ElTableColumn><ElTableColumn label="Forma" min-width="150"><template #default="{ row }">{{ methodLabel(row.forma_recebimento) }}</template></ElTableColumn></ElTable></div>
        </ElDialog>
    </div>
</template>

<style scoped>
:deep(.finance-tabs .el-tabs__header) { margin-bottom: 0; }
:deep(.el-card) { border-color: color-mix(in srgb, currentColor 12%, transparent); }
</style>

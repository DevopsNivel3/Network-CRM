export type LeadGridColumnKey = "nome_lead" | "cpf_cnpj" | "contato" | "responsavel" | "status_lead" | "ultima_interacao" | "proximo_follow_up" | "usuario.nome" | "origem_lead" | "prioridade" | "atividade";
export type LeadGridColumn = { key: LeadGridColumnKey; label: string; width: number; visible: boolean; sortable?: boolean };

export const defaultLeadGridColumns = (): LeadGridColumn[] => [
  { key: "nome_lead", label: "Razão Social", width: 280, visible: true, sortable: true },
  { key: "cpf_cnpj", label: "CNPJ", width: 170, visible: true, sortable: true },
  { key: "contato", label: "Contato", width: 150, visible: true, sortable: true },
  { key: "responsavel", label: "Responsável", width: 180, visible: true },
  { key: "status_lead", label: "Status", width: 160, visible: true },
  { key: "ultima_interacao", label: "Última interação", width: 170, visible: true },
  { key: "proximo_follow_up", label: "Próximo follow-up", width: 170, visible: true },
  { key: "usuario.nome", label: "Dono do lead", width: 170, visible: true },
  { key: "origem_lead", label: "Origem", width: 150, visible: true, sortable: true },
  { key: "prioridade", label: "Prioridade", width: 120, visible: true },
  { key: "atividade", label: "Atividade", width: 180, visible: true },
];

const normalize = (stored: unknown): LeadGridColumn[] => {
  const defaults = defaultLeadGridColumns();
  if (!Array.isArray(stored)) return defaults;
  const byKey = new Map(defaults.map((column) => [column.key, column]));
  const result: LeadGridColumn[] = [];
  for (const raw of stored) {
    const value = raw && typeof raw === "object" ? raw as Partial<LeadGridColumn> : {};
    const base = byKey.get(value.key as LeadGridColumnKey);
    if (!base || result.some((column) => column.key === base.key)) continue;
    result.push({ ...base, visible: value.visible !== false, width: Math.min(600, Math.max(90, Number(value.width) || base.width)) });
  }
  for (const column of defaults) if (!result.some((item) => item.key === column.key)) result.push(column);
  return result;
};

export const useLeadGridPreferences = () => {
  const { user } = useAuthSession();
  const suffix = user.id || "session";
  const columns = useState<LeadGridColumn[]>(`lead-grid-columns-${suffix}`, defaultLeadGridColumns);
  const loaded = useState<boolean>(`lead-grid-loaded-${suffix}`, () => false);
  const saving = useState<boolean>(`lead-grid-saving-${suffix}`, () => false);
  const load = async () => {
    if (loaded.value) return;
    const response = await useApi<{ columns?: LeadGridColumn[] }>("/api/preferencias/lead-grid");
    columns.value = normalize(response.columns); loaded.value = true;
  };
  const save = async () => {
    saving.value = true;
    try {
      const response = await useApi<{ columns: LeadGridColumn[] }>("/api/preferencias/lead-grid", { method: "PATCH", body: { columns: columns.value } });
      columns.value = normalize(response.columns);
    } finally { saving.value = false; }
  };
  const reset = async () => { columns.value = defaultLeadGridColumns(); await save(); };
  return { columns, visibleColumns: computed(() => columns.value.filter((column) => column.visible)), loaded, saving, load, save, reset };
};

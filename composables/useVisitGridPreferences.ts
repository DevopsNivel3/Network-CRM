export type VisitGridColumnKey = "oportunidade.lead.nome_lead" | "localizacao.cidade" | "statusInt" | "data_inicio" | "data_fim";
export type VisitGridColumn = { key: VisitGridColumnKey; label: string; width: number; visible: boolean };

export const defaultVisitGridColumns = (): VisitGridColumn[] => [
  { key: "oportunidade.lead.nome_lead", label: "Lead", width: 260, visible: true },
  { key: "localizacao.cidade", label: "Cidade", width: 180, visible: true },
  { key: "statusInt", label: "Status", width: 150, visible: true },
  { key: "data_inicio", label: "Data de Agendamento", width: 230, visible: true },
  { key: "data_fim", label: "Data de Encerramento", width: 230, visible: true },
];

const normalize = (stored: unknown): VisitGridColumn[] => {
  const defaults = defaultVisitGridColumns();
  if (!Array.isArray(stored)) return defaults;
  const byKey = new Map(defaults.map((column) => [column.key, column]));
  const result: VisitGridColumn[] = [];
  for (const raw of stored) {
    const value = raw && typeof raw === "object" ? raw as Partial<VisitGridColumn> : {};
    const base = byKey.get(value.key as VisitGridColumnKey);
    if (!base || result.some((column) => column.key === base.key)) continue;
    result.push({ ...base, visible: value.visible !== false, width: Math.min(600, Math.max(90, Number(value.width) || base.width)) });
  }
  for (const column of defaults) if (!result.some((item) => item.key === column.key)) result.push(column);
  return result;
};

export const useVisitGridPreferences = () => {
  const { user } = useAuthSession();
  const suffix = user.id || "session";
  const columns = useState<VisitGridColumn[]>(`visit-grid-columns-${suffix}`, defaultVisitGridColumns);
  const loaded = useState<boolean>(`visit-grid-loaded-${suffix}`, () => false);
  const saving = useState<boolean>(`visit-grid-saving-${suffix}`, () => false);
  const load = async () => {
    if (loaded.value) return;
    const response = await useApi<{ columns?: VisitGridColumn[] }>("/api/preferencias/visit-grid");
    columns.value = normalize(response.columns); loaded.value = true;
  };
  const save = async () => {
    saving.value = true;
    try {
      const response = await useApi<{ columns: VisitGridColumn[] }>("/api/preferencias/visit-grid", { method: "PATCH", body: { columns: columns.value } });
      columns.value = normalize(response.columns);
    } finally { saving.value = false; }
  };
  const reset = async () => { columns.value = defaultVisitGridColumns(); await save(); };
  return { columns, visibleColumns: computed(() => columns.value.filter((column) => column.visible)), loaded, saving, load, save, reset };
};

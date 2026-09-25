export const empresaGrupoValues = ["Nivel 3 TI", "Bispo BPO"] as const;

export type EmpresaGrupo = (typeof empresaGrupoValues)[number];

export const empresaGrupoOptions = empresaGrupoValues.map((value) => ({
  label: value,
  value,
}));

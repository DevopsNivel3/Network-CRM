export const getBoardReasonOptions = (board: any): string[] => {
  const options = Array.isArray(board?.motivos)
    ? board.motivos.filter((item: unknown): item is string => typeof item === "string")
    : [];
  if (board?.exigir_obs_outro && !options.some((item: string) => item.toLowerCase() === "outro")) {
    options.push("Outro");
  }
  return options;
};

export const validateBoardReason = (
  board: any,
  motivo?: string | null,
  observacao?: string | null,
) => {
  if (!board?.exige_motivo) return true;
  if (!motivo) {
    ElMessage.warning(`Selecione um motivo para entrar em “${board.titulo}”`);
    return false;
  }
  if (board.exigir_obs_outro && motivo.toLowerCase() === "outro" && !observacao?.trim()) {
    ElMessage.warning("Informe uma observação para o motivo “Outro”");
    return false;
  }
  return true;
};

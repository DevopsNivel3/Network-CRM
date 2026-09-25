import type { PrismaClient } from "@prisma/client";

type BoardReasonClient = Pick<PrismaClient, "boardOportunidade">;

export async function validateBoardMoveReason(
  client: BoardReasonClient,
  input: {
    targetBoardId: number | null | undefined;
    previousBoardId: number | null | undefined;
    empresaId: number;
    motivo?: string | null;
    motivoObservacao?: string | null;
  },
) {
  if (!input.targetBoardId || input.targetBoardId === input.previousBoardId) {
    return { motivo: null, motivoObservacao: null };
  }
  const board = await client.boardOportunidade.findFirst({
    where: { id: input.targetBoardId, empresa_id: input.empresaId },
    select: { titulo: true, exige_motivo: true, motivos: true, exigir_obs_outro: true },
  });
  if (!board) throw new Error("Board de destino não encontrada");
  if (!board.exige_motivo) return { motivo: null, motivoObservacao: null };

  const opcoes = Array.isArray(board.motivos)
    ? board.motivos.filter((item): item is string => typeof item === "string")
    : [];
  if (board.exigir_obs_outro && !opcoes.some((item) => item.toLowerCase() === "outro")) opcoes.push("Outro");
  const informado = input.motivo?.trim();
  const motivo = opcoes.find((item) => item.toLowerCase() === informado?.toLowerCase());
  if (!motivo) throw new Error(`Selecione um motivo válido para mover o card para “${board.titulo}”`);

  const motivoObservacao = input.motivoObservacao?.trim() || null;
  if (board.exigir_obs_outro && motivo.toLowerCase() === "outro" && !motivoObservacao) {
    throw new Error("Informe uma observação para o motivo “Outro”");
  }
  return { motivo, motivoObservacao };
}

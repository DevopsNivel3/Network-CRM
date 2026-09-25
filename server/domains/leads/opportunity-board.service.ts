import type { Prisma } from "@prisma/client";

const boardByClassification = {
  frio: {
    titulo: "Leads - Frios",
    aliases: ["leads frios", "lead frios", "frio", "frios"],
    cor: "#3B82F6",
  },
  morno: {
    titulo: "Leads - Morno",
    aliases: ["leads morno", "lead morno", "morno", "mornos"],
    cor: "#F59E0B",
  },
  quente: {
    titulo: "Quente / 03 dias",
    aliases: ["quente 03 dias", "quente 3 dias", "quente", "leads quente"],
    cor: "#EF4444",
  },
} as const;

export type OpportunityClassification = keyof typeof boardByClassification;

const normalizeBoardTitle = (value?: string | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export async function findOrCreateOpportunityBoard(
  tx: Prisma.TransactionClient,
  companyId: number,
  classification: OpportunityClassification,
) {
  const config = boardByClassification[classification];
  const acceptedTitles = new Set([
    normalizeBoardTitle(config.titulo),
    ...config.aliases.map(normalizeBoardTitle),
  ]);
  const boards = await tx.boardOportunidade.findMany({
    where: { empresa_id: companyId },
    select: { id: true, titulo: true },
  });
  const existingBoard = boards.find((board) =>
    acceptedTitles.has(normalizeBoardTitle(board.titulo)),
  );
  if (existingBoard) return existingBoard;

  const lastBoard = await tx.boardOportunidade.findFirst({
    where: { empresa_id: companyId },
    orderBy: { posicao: "desc" },
    select: { posicao: true },
  });
  return tx.boardOportunidade.create({
    data: {
      titulo: config.titulo,
      descricao: "Board criado automaticamente pelo cadastro de lead.",
      cor: config.cor,
      posicao: lastBoard ? lastBoard.posicao + 0.0001 : 0,
      empresa: { connect: { id: companyId } },
    },
    select: { id: true, titulo: true },
  });
}

import prisma from "../../../lib/prisma";

const CONTENT_BATCH_SIZE = 250;

export async function findInteractionContentByIds(ids: number[]) {
  const contentById = new Map<number, string | null>();
  for (let offset = 0; offset < ids.length; offset += CONTENT_BATCH_SIZE) {
    const rows = await prisma.oportunidadeInteracoes.findMany({
      where: { id: { in: ids.slice(offset, offset + CONTENT_BATCH_SIZE) } },
      select: { id: true, conteudo: true },
    });
    rows.forEach((row) => contentById.set(row.id, row.conteudo));
  }
  return contentById;
}

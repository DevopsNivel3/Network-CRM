import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  const rows = await prisma.$queryRaw<Array<{ preferencias: unknown }>>`SELECT preferencias FROM usuarios WHERE id = ${event.context.auth.id} LIMIT 1`;
  const raw = typeof rows[0]?.preferencias === "string" ? JSON.parse(rows[0].preferencias) : rows[0]?.preferencias;
  const preferences = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const visitGrid = preferences.visitGrid && typeof preferences.visitGrid === "object" ? preferences.visitGrid as Record<string, unknown> : {};
  return { columns: Array.isArray(visitGrid.columns) ? visitGrid.columns : null };
});

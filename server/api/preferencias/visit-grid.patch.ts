import { z } from "zod";
import prisma from "@/lib/prisma";

const keys = ["oportunidade.lead.nome_lead", "localizacao.cidade", "statusInt", "data_inicio", "data_fim"] as const;
const schema = z.object({ columns: z.array(z.object({ key: z.enum(keys), label: z.string().max(80), width: z.number().min(90).max(600), visible: z.boolean() })).length(keys.length) });

export default defineEventHandler(async (event) => {
  const id = event.context.auth.id;
  const body = await readValidatedBody(event, schema.parseAsync);
  if (new Set(body.columns.map((column) => column.key)).size !== keys.length) throw createError({ statusCode: 400, message: "Configuração de colunas inválida." });
  const rows = await prisma.$queryRaw<Array<{ preferencias: unknown }>>`SELECT preferencias FROM usuarios WHERE id = ${id} LIMIT 1`;
  const raw = typeof rows[0]?.preferencias === "string" ? JSON.parse(rows[0].preferencias) : rows[0]?.preferencias;
  const current = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const preferences = JSON.stringify({ ...current, visitGrid: { columns: body.columns } });
  await prisma.$executeRaw`UPDATE usuarios SET preferencias = ${preferences} WHERE id = ${id}`;
  return { columns: body.columns };
});

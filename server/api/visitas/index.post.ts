import prisma from "@/lib/prisma";
import { z } from "zod";

const createVisitaBodySchema = z.object({
  oportunidade_id: z.number({ message: "Id da Oportunidade" }),
  data_inicio: z.string({ message: "Data de início é necessária" }),
  hora_inicio: z.string({ message: "Hora de início é necessária" }),
  data_fim: z.string().nullable().optional(),
  imagem_src: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  statusInt: createNumberSchema("Status").nullable().optional(),
  motivo: z.string().nullable().optional(),
  image: z.any().nullable().optional(),
  localizacao_id: z.number({ message: "Id da Localização" }).optional(),
});

// Rota para criar uma nova Visita
export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.CRIAR_VISITA))
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(event, createVisitaBodySchema.parseAsync);

    const data = await prisma.visita.create({
      data: {
        data_inicio: body.data_inicio,
        hora_inicio: body.hora_inicio,
        localizacao: {
          connect: {
            id: body.localizacao_id,
          },
        },
        oportunidade: {
          connect: {
            id: body.oportunidade_id,
          },
        },
        usuario: {
          connect: {
            id: event.context.auth.id,
          },
        },
      },
    });

    await logger.create(event, JSON.stringify(data));

    return data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao criar a aisita",
    });
  }
});

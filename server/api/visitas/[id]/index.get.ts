import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Rota para buscar uma Visita pelo ID
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_VISITA,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const where: Prisma.VisitaWhereUniqueInput = {
      id,
      oportunidade: { lead: {} },
    };

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (!isGrantAdmin) {
      where.oportunidade!.lead!.empresa_id = event.context.auth.empresa_id;
    }

    if (!isAdmin && !isGrantAdmin) {
      where.usuario_id = event.context.auth.id;
    }

    const data = await prisma.visita.findUnique({
      where,
      select: {
        id: true,
        data_inicio: true,
        hora_inicio: true,
        motivo: true,
        data_fim: true,
        latitude: true,
        longitude: true,
        imagem_src: true,
        statusInt: true,
        criado: true,
        oportunidade: {
          select: {
            id: true,
            lead: {
              select: {
                id: true,
                nome_lead: true,
              },
            },
          },
        },
        localizacao: {
          select: {
            cidade: true,
            estado: true,
            rua: true,
            complemento: true,
            cep: true,
            numero: true,
          },
        },
      },
    });

    if (!data) throw new Error("Visita não encontrada");

    await logger.view(event, JSON.stringify(data));

    return data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar a Oportunidade",
    });
  }
});

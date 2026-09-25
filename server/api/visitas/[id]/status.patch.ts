import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateVisitaStatusBodySchema = z.object({
  statusInt: createNumberSchema("Status").nullable().optional(),
});

// Rota para atualizar o status da Visita
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.EDITAR_VISITA,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      updateVisitaStatusBodySchema.parseAsync,
    );

    const where: Prisma.VisitaWhereUniqueInput = { id };
    const data: Prisma.VisitaUpdateInput = {};

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    const visita = await prisma.visita.findUnique({
      where: { id },
      select: {
        id: true,
        usuario_id: true,
        oportunidade_id: true,
        oportunidade: {
          select: {
            lead: { select: { empresa_id: true } },
          },
        },
      },
    });

    if (!visita) throw new Error("Visita não encontrada");

    if (
      !isGrantAdmin &&
      visita.oportunidade.lead.empresa_id !== event.context.auth.empresa_id
    ) {
      throw new Error("Visita não encontrada");
    }

    if (!isAdmin) {
      const isPrincipal = await prisma.oportunidadeResponsaveis.findFirst({
        where: {
          oportunidade_id: visita.oportunidade_id,
          usuario_id: event.context.auth.id,
          principal: true,
        },
        select: { id: true },
      });

      if (!isPrincipal && visita.usuario_id !== event.context.auth.id)
        throw new Error("Você não tem permissão para editar esta visita");
    }

    if (body.statusInt) data.statusInt = body.statusInt;

    const visitaUpdated = await prisma.visita.update({
      where,
      data,
    });

    await logger.update(event, JSON.stringify(visitaUpdated));

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao atualizar a posição",
    });
  }
});

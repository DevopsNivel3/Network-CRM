import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Rota para deletar um Lead
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.DELETAR_LEAD,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const where: Prisma.LeadWhereUniqueInput = { id };

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (!isGrantAdmin) where.empresa_id = event.context.auth.empresa_id;
    if (!isAdmin && !isGrantAdmin) where.usuario_id = event.context.auth.id;

    const data = await prisma.$transaction(async (tx) => {
      const leadRecord = await tx.lead.findFirst({
        where,
        select: { id: true },
      });

      if (!leadRecord) throw new Error("Lead não encontrado");

      const titulosFinanceiros = await tx.contaReceber.count({
        where: { lead_id: leadRecord.id },
      });

      if (titulosFinanceiros) {
        throw new Error(
          "Este cliente possui contas a receber e não pode ser excluído. Cancele os títulos ou preserve o cadastro para manter o histórico financeiro.",
        );
      }

      const oportunidadesIds = await tx.oportunidade.findMany({
        where: { lead_id: leadRecord.id },
        select: { id: true },
      });

      const oportunidadeIds = oportunidadesIds.map((item) => item.id);

      if (oportunidadeIds.length) {
        await tx.oportunidadeInteracoes.deleteMany({
          where: { oportunidade_id: { in: oportunidadeIds } },
        });
        await tx.oportunidadeHistorico.deleteMany({
          where: { oportunidade_id: { in: oportunidadeIds } },
        });
        await tx.oportunidadeResponsaveis.deleteMany({
          where: { oportunidade_id: { in: oportunidadeIds } },
        });
        await tx.oportunidadeComentarios.deleteMany({
          where: { oportunidade_id: { in: oportunidadeIds } },
        });
        await tx.visita.deleteMany({
          where: { oportunidade_id: { in: oportunidadeIds } },
        });
        await tx.oportunidade.deleteMany({
          where: { id: { in: oportunidadeIds } },
        });
      }

      await tx.leadComentarios.deleteMany({
        where: { lead_id: leadRecord.id },
      });
      await tx.localizacao.deleteMany({
        where: { lead_id: leadRecord.id },
      });
      await tx.leadGrupoVinculo.deleteMany({
        where: { lead_id: leadRecord.id },
      });

      return tx.lead.delete({
        where,
      });
    });

    await logger.delete(event, JSON.stringify(data));

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao deletar o Lead",
    });
  }
});

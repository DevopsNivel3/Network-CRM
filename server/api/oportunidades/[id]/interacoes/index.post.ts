import prisma from "~/lib/prisma";
import { getHtmlLength, sanitizeHtml } from "@/server/utils/sanitizeHtml";
import { normalizeAttachments } from "@/server/utils/normalizeAttachments";
import { canOpportunityGenerateReminders } from "@/server/utils/opportunity-reminders";
import { generateReminderDates, determinePriority } from "@/server/utils/reminders";
import { notifyOpportunityInteraction } from "@/server/utils/opportunity-notifications";
import { z } from "zod";

export const createOportunidadeInteracaoBodySchema = z.object({
  tipo: createNumberSchema("Tipo"),
  status: createNumberSchema("Status"),
  conteudo: z.string().nullable().optional(),
  data: z.string().nullable().optional(),
  oportunidade_id: createNumberSchema("Id da Oportunidade").optional(),
  anexos: z
    .array(
      z.object({
        nome: z.string().optional().nullable(),
        url: z.string(),
        tipo: z.string().optional().nullable(),
        tamanho: z.number().optional().nullable(),
      }),
    )
    .optional()
    .default([]),
});

// Rota para adicionar uma interação a uma oportunidade
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_OPORTUNIDADE,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      createOportunidadeInteracaoBodySchema.parseAsync,
    );

    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id },
      select: { statusInt: true },
    });

    const sanitized = body.conteudo ? sanitizeHtml(body.conteudo) : "";
    const attachments = normalizeAttachments(
      (body.anexos || []).map((a) => ({
        url: a.url,
        nome: a.nome ?? undefined,
        tipo: a.tipo ?? undefined,
        tamanho: a.tamanho ?? undefined,
      }))
    );
    if (sanitized && getHtmlLength(sanitized) > 4096)
      throw new Error("Conteúdo muito grande");

    const interacao = await prisma.oportunidadeInteracoes.create({
      data: {
        tipo: body.tipo,
        conteudo: sanitized || null,
        statusInt: oportunidade?.statusInt || 1,
        status: body.status,
        data: body.data ? new Date(body.data) : new Date(),
        oportunidade_id: id,
        usuario_id: event.context.auth.id,
      },
      select: {
        id: true,
        conteudo: true,
        statusInt: true,
        status: true,
        tipo: true,
        data: true,
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
      },
    });

    // Generate reminders if enabled
    if (await canOpportunityGenerateReminders(prisma, Number(id))) {
      const dataInteracao = interacao.data;
      const lembretesData = generateReminderDates(dataInteracao);

      await prisma.lembrete.updateMany({
        where: {
          oportunidade_id: Number(id),
          status: "Pendente",
          tipo: "Follow-up",
        },
        data: {
          status: "Cancelado",
        }
      });

      await prisma.lembrete.createMany({
        data: lembretesData.map(rem => ({
          oportunidade_id: Number(id),
          usuario_id: event.context.auth.id,
          empresa_id: event.context.auth.empresa_id,
          tipo: "Follow-up",
          descricao: `Follow-up automático de ${rem.dias} dias (Oportunidade)`,
          data_vencimento: rem.data_vencimento,
          prioridade: determinePriority(rem.dias),
          status: "Pendente"
        }))
      });
    }

    if (attachments.length) {
      await prisma.oportunidadeInteracaoAnexo.createMany({
        data: attachments.map((item) => ({
          interacao_id: interacao.id,
          usuario_id: event.context.auth.id,
          nome: item.nome,
          url: item.url,
          tipo: item.tipo || undefined,
          tamanho: item.tamanho ?? undefined,
        })),
      });
    }

    const withAnexos = await prisma.oportunidadeInteracoes.findUnique({
      where: { id: interacao.id },
      select: {
        id: true,
        conteudo: true,
        statusInt: true,
        status: true,
        tipo: true,
        data: true,
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
        anexos: true,
      },
    });

    // Atualiza a data de última interação da oportunidade
    await prisma.oportunidade.update({
      where: { id: Number(id) },
      data: { atualizado: new Date() }
    });

    await notifyOpportunityInteraction(prisma, {
      oportunidadeId: Number(id),
      actorUserId: event.context.auth.id,
      tipo: interacao.tipo,
      status: interacao.status,
      conteudo: interacao.conteudo,
    });

    await logger.create(event, JSON.stringify(interacao));

    return withAnexos || interacao;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao adicionar a interação à oportunidade",
    });
  }
});

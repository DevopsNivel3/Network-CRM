import prisma from "@/lib/prisma";
import {
  getHtmlLength,
  isHtmlEmpty,
  sanitizeHtml,
} from "@/server/utils/sanitizeHtml";
import { normalizeAttachments } from "@/server/utils/normalizeAttachments";
import { generateReminderDates, determinePriority } from "@/server/utils/reminders";
import { z } from "zod";

const createOportunidadeComentarioBodySchema = z.object({
  descricao: createStringSchema("Descrição"),
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

// Rota para criar um comentário na oportunidade
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
      createOportunidadeComentarioBodySchema.parseAsync,
    );

    const sanitized = sanitizeHtml(body.descricao);
    if (getHtmlLength(sanitized) > 8192)
      throw new Error("Comentário muito grande");

    const attachments = normalizeAttachments(
      (body.anexos || []).map((a) => ({
        url: a.url,
        nome: a.nome ?? undefined,
        tipo: a.tipo ?? undefined,
        tamanho: a.tamanho ?? undefined,
      }))
    );
    if ((!sanitized || isHtmlEmpty(sanitized)) && !attachments.length)
      throw new Error("Comentário inválido");
    const data = await prisma.leadComentarios.create({
      data: {
        descricao: sanitized,
        lead: {
          connect: {
            id,
          },
        },
        usuario: {
          connect: {
            id: event.context.auth.id,
          },
        },
      },
      select: {
        id: true,
        descricao: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
        criado: true,
        atualizado: true,
      },
    });

    if (attachments.length) {
      await prisma.leadComentarioAnexo.createMany({
        data: attachments.map((item) => ({
          comentario_id: data.id,
          usuario_id: event.context.auth.id,
          nome: item.nome,
          url: item.url,
          tipo: item.tipo || undefined,
          tamanho: item.tamanho ?? undefined,
        })),
      });
    }

    const withAnexos = await prisma.leadComentarios.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        descricao: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
        criado: true,
        atualizado: true,
        anexos: true,
        lead: {
          select: {
            controle_lembretes: true
          }
        }
      },
    });

    // Generate reminders if enabled
    if (withAnexos?.lead?.controle_lembretes) {
      const dataInteracao = data.criado;
      const lembretesData = generateReminderDates(dataInteracao);

      await prisma.lembrete.updateMany({
        where: {
          lead_id: Number(id),
          status: "Pendente",
          tipo: "Follow-up",
        },
        data: {
          status: "Cancelado",
        }
      });

      await prisma.lembrete.createMany({
        data: lembretesData.map(rem => ({
          lead_id: Number(id),
          usuario_id: event.context.auth.id,
          empresa_id: event.context.auth.empresa_id,
          tipo: "Follow-up",
          descricao: `Follow-up automático de ${rem.dias} dias (Lead)`,
          data_vencimento: rem.data_vencimento,
          prioridade: determinePriority(rem.dias),
          status: "Pendente"
        }))
      });
    }

    // Atualiza a data de última interação do lead
    await prisma.lead.update({
      where: { id: Number(id) },
      data: { atualizado: new Date() }
    });

    if (withAnexos?.lead) {
      // @ts-ignore
      delete withAnexos.lead;
    }

    await logger.create(event, JSON.stringify(data));

    return withAnexos || data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao criar comentário",
    });
  }
});

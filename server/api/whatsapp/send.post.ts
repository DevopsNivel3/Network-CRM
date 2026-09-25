import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  EvolutionApiService,
  normalizePhone,
} from "@/server/utils/evolutionAPI";
import { publishWhatsappStream } from "@/server/utils/whatsappStream";
import { generateReminderDates, determinePriority } from "@/server/utils/reminders";

const sendSchema = z.object({
  phone: z.string().min(1),
  lead_id: z.number().optional(),
  text: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_LEAD,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(event, sendSchema.parseAsync);
    const empresaId = event.context.auth.empresa_id;
    const integracao = await prisma.integracao.findFirst({
      where: { empresa_id: empresaId, tipo: "whatsapp" },
    });
    if (!integracao || !integracao.enabled)
      throw new Error("WhatsApp não configurado para esta empresa");
    const config =
      (
        integracao as {
          config?: {
            instance_id?: string | null;
            instance_name?: string | null;
          };
        }
      ).config || {};

    const phone = normalizePhone(body.phone);
    if (!phone) throw new Error("Telefone inválido");

    const instanceId = config.instance_id || config.instance_name;
    if (!instanceId) throw new Error("Instância do WhatsApp não configurada");
    const api = new EvolutionApiService(instanceId);

    const res: any = await api.sendTextMessage({
      number: phone,
      text: body.text,
    });

    const message = await prisma.whatsappMessage.create({
      data: {
        empresa_id: empresaId,
        lead_id: body.lead_id,
        usuario_id: event.context.auth.id,
        numero: phone,
        direction: "out",
        body: body.text,
        media_type: null,
        media_mime: null,
        media_base64: null,
        media_name: null,
        media_caption: null,
        message_id: res?.key?.id ?? res?.id ?? null,
        timestamp: res?.messageTimestamp
          ? new Date(Number(res.messageTimestamp) * 1000)
          : null,
        raw: res ?? null,
      },
    });

    if (body.lead_id) {
      const dataInteracao = message.criado;
      const lembretesData = generateReminderDates(dataInteracao);

      await prisma.lembrete.updateMany({
        where: {
          lead_id: body.lead_id,
          status: "Pendente",
          tipo: "Follow-up",
        },
        data: {
          status: "Cancelado",
        }
      });

      await prisma.lembrete.createMany({
        data: lembretesData.map(rem => ({
          lead_id: body.lead_id,
          usuario_id: event.context.auth.id,
          empresa_id: empresaId,
          tipo: "Follow-up",
          descricao: `Follow-up automático de ${rem.dias} dias (WhatsApp)`,
          data_vencimento: rem.data_vencimento,
          prioridade: determinePriority(rem.dias),
          status: "Pendente"
        }))
      });
    }

    publishWhatsappStream(empresaId, phone, {
      type: "message",
      message: {
        ...message,
        usuario: {
          id: event.context.auth.id,
          nome: event.context.auth.nome,
          avatar: event.context.auth.avatar,
        },
      },
    });

    const existingContact = await prisma.whatsappContact.findFirst({
      where: { empresa_id: empresaId, numero: phone },
    });
    if (existingContact) {
      await prisma.whatsappContact.update({
        where: { id: existingContact.id },
        data: {
          lead_id: body.lead_id ?? existingContact.lead_id,
          is_whatsapp: true,
          ultimo_check: new Date(),
        },
      });
    } else {
      await prisma.whatsappContact.create({
        data: {
          empresa_id: empresaId,
          lead_id: body.lead_id,
          numero: phone,
          is_whatsapp: true,
          ultimo_check: new Date(),
        },
      });
    }

    return message;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao enviar mensagem do WhatsApp",
    });
  }
});

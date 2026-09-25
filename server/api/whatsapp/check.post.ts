import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  EvolutionApiService,
  getPhoneVariants,
  normalizePhone,
  normalizePhoneFromJid,
} from "@/server/utils/evolutionAPI";

const checkSchema = z.object({
  phone: z.string().min(1),
  lead_id: z.number().optional(),
  contact_name: z.string().nullable().optional(),
});

const isRecent = (date?: Date | null) => {
  if (!date) return false;
  const diff = Date.now() - new Date(date).getTime();
  return diff < 1000 * 60 * 60 * 12;
};

const parseExists = (data: any) => {
  if (!data) return { exists: false, number: null };
  if (Array.isArray(data)) {
    const item = data[0] || {};
    if (item.jid)
      return {
        exists: true,
        number: normalizePhoneFromJid(item.jid),
      };
    if (typeof item.exists === "boolean")
      return { exists: item.exists, number: null };
    if (typeof item.isWhatsapp === "boolean")
      return { exists: item.isWhatsapp, number: null };
  }
  if (data?.numbers?.length) {
    const item = data.numbers[0] || {};
    if (typeof item.exists === "boolean") {
      return {
        exists: item.exists,
        number: item.jid ? normalizePhoneFromJid(item.jid) : null,
      };
    }
  }
  if (typeof data.exists === "boolean")
    return { exists: data.exists, number: null };
  if (typeof data.isWhatsapp === "boolean")
    return { exists: data.isWhatsapp, number: null };
  return { exists: false, number: null };
};

const fetchProfilePic = async (api: EvolutionApiService, phone: string) => {
  try {
    const res: any = await api.fetchProfilePictureUrl(phone);
    return res?.profilePictureUrl || res?.url || res?.pictureUrl || null;
  } catch {
    return null;
  }
};

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_LEAD,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(event, checkSchema.parseAsync);
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

    const cached = await prisma.whatsappContact.findFirst({
      where: { empresa_id: empresaId, numero: phone },
    });

    let exists = cached?.is_whatsapp ?? false;
    let resolvedNumber: string | null = null;
    let fotoUrl = cached?.foto_url ?? null;

    if (!cached || !isRecent(cached.ultimo_check)) {
      const res: any = await api.checkWhatsAppNumber([phone]);
      const parsed = parseExists(res);
      exists = parsed.exists;
      resolvedNumber = parsed.number;

      if (exists) {
        fotoUrl = await fetchProfilePic(api, resolvedNumber || phone);
      }
    }

    const chatNumber = resolvedNumber || phone;
    const variants = getPhoneVariants(chatNumber);

    const contact = cached
      ? await prisma.whatsappContact.update({
          where: { id: cached.id },
          data: {
            lead_id: body.lead_id ?? cached.lead_id,
            nome: body.contact_name ?? cached.nome,
            foto_url: fotoUrl ?? cached.foto_url,
            is_whatsapp: exists,
            ultimo_check: new Date(),
            numero: chatNumber,
          },
        })
      : await prisma.whatsappContact.create({
          data: {
            empresa_id: empresaId,
            lead_id: body.lead_id,
            numero: chatNumber,
            nome: body.contact_name ?? null,
            foto_url: fotoUrl,
            is_whatsapp: exists,
            ultimo_check: new Date(),
          },
        });

    const whereMessages = {
      empresa_id: empresaId,
      numero: { in: variants.length ? variants : [chatNumber] },
    };

    const messages = await prisma.whatsappMessage.findMany({
      where: whereMessages,
      orderBy: { criado: "asc" },
      take: 50,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
      },
    });

    if (body.lead_id) {
      await prisma.whatsappMessage.updateMany({
        where: {
          empresa_id: empresaId,
          numero: chatNumber,
          lead_id: null,
        },
        data: {
          lead_id: body.lead_id,
        },
      });
    }

    const templates = await prisma.whatsappTemplate.findMany({
      where: { empresa_id: empresaId },
      orderBy: { atualizado: "desc" },
    });

    const resolvedForStream =
      messages.length > 0 ? messages[0].numero : chatNumber;

    return {
      exists,
      contact,
      messages,
      templates,
      numero: resolvedForStream,
    };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao verificar WhatsApp",
    });
  }
});

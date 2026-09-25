import prisma from "@/lib/prisma";
import {
  extractMessageText,
  normalizeFromJid,
} from "@/server/utils/evolutionAPI";
import { publishWhatsappStream } from "@/server/utils/whatsappStream";

const pickPayloadMessage = (payload: any) => {
  if (!payload) return null;
  const item = Array.isArray(payload) ? payload[0] : payload;
  if (item?.body?.remoteJid) return item.body;
  if (item?.data?.message) return item.data;
  if (item?.data?.messages?.length) return item.data.messages[0];
  if (item?.messages?.length) return item.messages[0];
  if (item?.message) return item;
  return item;
};

const extractMedia = (message: any) => {
  if (!message) return null;
  const media =
    message.imageMessage ||
    message.videoMessage ||
    message.documentMessage ||
    message.audioMessage ||
    null;
  if (!media) return null;

  const base64 =
    media.base64 || media.media || media.data || media.file || null;

  const mediaType = message.imageMessage
    ? "image"
    : message.videoMessage
      ? "video"
      : message.documentMessage
        ? "document"
        : message.audioMessage
          ? "audio"
          : "unknown";

  return {
    type: mediaType,
    mime: media.mimetype || media.mimeType || null,
    base64,
    name: media.fileName || media.filename || null,
    caption: media.caption || null,
  };
};

export default defineEventHandler(async (event) => {
  try {
    const payload = await readBody(event);

    const webhookId = getQuery(event).id;
    if (!webhookId) return { ok: false };

    const integracoes = await prisma.integracao.findMany({
      where: { tipo: "whatsapp", enabled: true },
    });
    const integracao = integracoes.find((item) => {
      const config = (
        item as { config?: { webhook_id?: string | null } | null }
      ).config;
      return config?.webhook_id === String(webhookId);
    });
    if (!integracao || !integracao.enabled) return { ok: false };

    const messagePayload = pickPayloadMessage(payload);
    const eventName =
      payload?.event ||
      payload?.data?.event ||
      (Array.isArray(payload) ? payload[0]?.body?.event : null);

    const key = messagePayload?.key || messagePayload?.data?.key;
    const remoteJid = key?.remoteJid || messagePayload?.remoteJid;
    const fromMe = key?.fromMe ?? messagePayload?.fromMe ?? false;
    const message = messagePayload?.message || messagePayload?.data?.message;
    const messageId =
      key?.id || messagePayload?.id || messagePayload?.keyId || null;
    const messageTimestamp =
      messagePayload?.messageTimestamp ||
      messagePayload?.data?.messageTimestamp;
    const chatInput = messagePayload?.chatInput;
    const pushName = messagePayload?.pushName;

    const numero = normalizeFromJid(remoteJid || "");
    if (!numero) return { ok: true };

    const media = extractMedia(message);
    const body =
      extractMessageText(message) || chatInput || media?.caption || null;
    const timestamp = messageTimestamp
      ? new Date(Number(messageTimestamp) * 1000)
      : new Date();

    if (fromMe && eventName === "send.message") return { ok: true };

    if (messageId) {
      const exists = await prisma.whatsappMessage.findFirst({
        where: { empresa_id: integracao.empresa_id, message_id: messageId },
        select: { id: true },
      });
      if (exists) return { ok: true };
    }

    const contact = await prisma.whatsappContact.findFirst({
      where: { empresa_id: integracao.empresa_id, numero },
    });

    let leadId = contact?.lead_id ?? null;
    if (!leadId) {
      const candidates = await prisma.lead.findMany({
        where: {
          empresa_id: integracao.empresa_id,
          contato: { contains: numero.slice(-8) },
        },
        select: { id: true, contato: true },
      });
      const matched = candidates.find(
        (item) => item.contato?.replace(/\D/g, "") === numero,
      );
      leadId = matched?.id ?? null;
    }

    const created = await prisma.whatsappMessage.create({
      data: {
        empresa_id: integracao.empresa_id,
        lead_id: leadId,
        usuario_id: null,
        numero,
        direction: fromMe ? "out" : "in",
        body,
        media_type: media?.type || null,
        media_mime: media?.mime || null,
        media_base64: media?.base64 || null,
        media_name: media?.name || null,
        media_caption: media?.caption || null,
        message_id: messageId,
        timestamp,
        raw: payload ?? null,
      },
    });

    if (!fromMe) {
      publishWhatsappStream(integracao.empresa_id, numero, {
        type: "message",
        message: created,
      });
    }

    if (pushName) {
      const existing = await prisma.whatsappContact.findFirst({
        where: { empresa_id: integracao.empresa_id, numero },
      });
      if (existing) {
        await prisma.whatsappContact.update({
          where: { id: existing.id },
          data: { nome: pushName },
        });
      } else {
        await prisma.whatsappContact.create({
          data: {
            empresa_id: integracao.empresa_id,
            lead_id: leadId,
            numero,
            nome: pushName,
            is_whatsapp: true,
            ultimo_check: new Date(),
          },
        });
      }
    }

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false };
  }
});

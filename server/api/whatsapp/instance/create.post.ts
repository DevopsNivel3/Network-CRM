import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  enabled: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(event, createSchema.parseAsync);
    const empresaId = event.context.auth.empresa_id;

    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_TOKEN;
    if (!apiUrl || !apiKey)
      throw new Error(
        "EVOLUTION_API_URL e EVOLUTION_API_TOKEN não configurados",
      );
    const appBaseUrl = useRuntimeConfig().public.APP_BASE_URL;
    const existing = await prisma.integracao.findFirst({
      where: { empresa_id: empresaId, tipo: "whatsapp" },
    });
    const existingConfig =
      (
        existing as {
          config?: {
            instance_id?: string | null;
            instance_name?: string | null;
            webhook_id?: string | null;
          };
        }
      )?.config || {};

    const generatedInstanceId =
      globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

    const instance =
      existingConfig.instance_name || `${empresaId}_${generatedInstanceId}`;

    const webhookId =
      existingConfig.webhook_id ||
      (globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : Math.random().toString(36).slice(2));

    const webhookUrl = `${appBaseUrl}/api/whatsapp/webhook?id=${encodeURIComponent(
      webhookId,
    )}`;

    const api = new EvolutionApiService(instance);

    let created: any = null;
    if (!existingConfig.instance_name) {
      created = await api.createInstance(instance, {
        instanceName: instance,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
        webhook: {
          url: webhookUrl,
          enabled: true,
          byEvents: true,
          base64: true,
          events: ["MESSAGES_UPSERT"],
        },
      });
    }

    await api.setWebhook({
      url: webhookUrl,
      enabled: true,
      byEvents: true,
      base64: true,
      events: ["MESSAGES_UPSERT"],
    });

    const createdInstanceId = created?.instance?.instanceId || null;
    let instanceId = createdInstanceId || null;

    if (!instanceId) {
      try {
        const fetched = await api.fetchInstances({ instanceName: instance });
        if (Array.isArray(fetched) && fetched.length > 0) {
          instanceId =
            fetched[0]?.instanceId ||
            fetched[0]?.instance_id ||
            fetched[0]?.id ||
            null;
        } else if (fetched && typeof fetched === "object") {
          instanceId =
            (fetched as any)?.instanceId ||
            (fetched as any)?.instance_id ||
            (fetched as any)?.id ||
            null;
        }
      } catch (fetchErr) {
        console.error("Falha ao buscar instanceId:", fetchErr);
      }
    }

    const existingInstanceId =
      typeof existingConfig.instance_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        existingConfig.instance_id,
      )
        ? existingConfig.instance_id
        : null;

    const config = {
      ...existingConfig,
      instance_id: instanceId || existingInstanceId || null,
      instance_name: instance,
      webhook_url: webhookUrl,
      webhook_id: webhookId,
    };

    const integracao = await prisma.integracao.upsert({
      where: { empresa_id_tipo: { empresa_id: empresaId, tipo: "whatsapp" } },
      update: {
        enabled: body.enabled,
        config,
      },
      create: {
        empresa_id: empresaId,
        tipo: "whatsapp",
        enabled: body.enabled,
        config,
      },
    });

    return integracao;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao criar instância do WhatsApp",
    });
  }
});

import prisma from "@/lib/prisma";
import { EvolutionApiService } from "@/server/utils/evolutionAPI";

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

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
    const instanceName = config.instance_name || config.instance_id;
    if (!instanceName) throw new Error("Instância do WhatsApp não configurada");
    const api = new EvolutionApiService(instanceName);

    const hasValidInstanceId =
      typeof config.instance_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        config.instance_id,
      );

    if (!hasValidInstanceId) {
      try {
        const fetched = await api.fetchInstances({ instanceName });
        let fetchedId: string | null = null;
        if (Array.isArray(fetched) && fetched.length > 0) {
          fetchedId =
            fetched[0]?.instanceId ||
            fetched[0]?.instance_id ||
            fetched[0]?.id ||
            null;
        } else if (fetched && typeof fetched === "object") {
          fetchedId =
            (fetched as any)?.instanceId ||
            (fetched as any)?.instance_id ||
            (fetched as any)?.id ||
            null;
        }
        if (fetchedId) {
          const currentConfig =
            (integracao as { config?: Record<string, any> | null }).config ||
            {};
          await prisma.integracao.update({
            where: { id: integracao.id },
            data: {
              config: {
                ...currentConfig,
                instance_id: fetchedId,
              },
            },
          });
        }
      } catch (fetchErr) {
        console.error("Falha ao sincronizar instance_id:", fetchErr);
      }
    }

    const status = await api.getInstanceStatus();
    const state =
      status?.instance?.state || (status as any)?.status || (status as any)?.state || null;

    return {
      status: state,
      qrcode: status?.qrcode || null,
      message: (status as any)?.message || null,
    };
  } catch (err: any) {
    console.error(err);
    const message = String(err?.message || "");
    if (message.includes("instance does not exist")) {
      return {
        status: null,
        qrcode: null,
        message: "Instância não existe. Remova e recrie a integração.",
      };
    }
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar status da instância",
    });
  }
});

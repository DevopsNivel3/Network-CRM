import prisma from "@/lib/prisma";
import { EvolutionApiService } from "@/server/utils/evolutionAPI";

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const id = Number(getRouterParam(event, "id"));
    if (!id) throw new Error("ID inválido");

    const empresaId = event.context.auth.empresa_id;

    const integracao = await prisma.integracao.findFirst({
      where: { id, empresa_id: empresaId },
    });
    if (!integracao) throw new Error("Integração não encontrada");

    if (integracao.tipo === "whatsapp") {
      const config =
        (
          integracao as {
            config?: {
              instance_id?: string | null;
              instance_name?: string | null;
            };
          }
        ).config || {};
      const instanceId = config.instance_id || config.instance_name || null;
      if (instanceId) {
        try {
          const api = new EvolutionApiService(instanceId);
          await api.deleteInstance();
        } catch (err) {
          console.error(err);
        }
      }

      await prisma.whatsappTemplate.deleteMany({
        where: { empresa_id: empresaId },
      });
    }

    await prisma.integracao.delete({
      where: { id, empresa_id: empresaId },
    });

    return true;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao remover integração",
    });
  }
});

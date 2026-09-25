import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Rota para buscar um Lead
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_LEAD,
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

    const data = await prisma.lead.findUnique({
      where,
      select: {
        id: true,
        nome_lead: true,
        cpf_cnpj: true,
        responsavel: true,
        contato_nome: true,
        contato: true,
        atividade: true,
        faturamento: true,
        num_funcionarios: true,
        origem_lead: true,
        observacoes: true,
        controle_lembretes: true,
        criado: true,
        atualizado: true,
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
        localizacoes: {
          select: {
            id: true,
            rua: true,
            cidade: true,
            estado: true,
            complemento: true,
            numero: true,
            cep: true,
          },
        },
        grupos: {
          select: {
            grupo: {
              select: {
                id: true,
                nome: true,
                descricao: true,
              },
            },
          },
        },
      },
    });

    if (data) {
      const normalizedLead = {
        ...data,
        grupos: data.grupos.map((item) => item.grupo),
      };
      await logger.view(event, JSON.stringify(normalizedLead));
      return normalizedLead;
    }

    await logger.view(event, JSON.stringify(data));
    return data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar o Lead",
    });
  }
});

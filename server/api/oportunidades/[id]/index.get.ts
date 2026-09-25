import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Rota para buscar oportunidades
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
    const where: Prisma.OportunidadeWhereInput = { id, lead: {} };

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (!isGrantAdmin) where.lead!.empresa_id = event.context.auth.empresa_id;
    if (!isAdmin && !isGrantAdmin) {
      where.responsaveis = { some: { usuario_id: event.context.auth.id } };
    }

    const oportunidade = await prisma.oportunidade.findFirst({
      where,
      select: {
        id: true,
        tipo: true,
        descricao: true,
        statusInt: true,
        board_id: true,
        posicao: true,
        valor_estimado: true,
        faixa_valor: true,
        num_pdvs: true,
        num_lojas: true,
        infraestrutura: true,
        observacoes: true,
        controle_lembretes: true,
        desativado: true,
        criado: true,
        atualizado: true,
        lead: {
          select: {
            id: true,
            nome_lead: true,
            contato_nome: true,
            contato: true,
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
            localizacoes: {
              select: {
                id: true,
                cidade: true,
                estado: true,
                rua: true,
                complemento: true,
                cep: true,
                numero: true,
              },
            },
          },
        },
        comentarios: {
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
          orderBy: {
            criado: "desc",
          },
          take: 3,
        },
        responsaveis: {
          select: {
            principal: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                avatar: true,
              },
            },
          },
          orderBy: [{ principal: "desc" }, { criado: "asc" }],
          take: 3,
        },
        _count: {
          select: {
            responsaveis: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
      },
    });

    const motivoAtual = oportunidade?.board_id
      ? await prisma.oportunidadeHistorico.findFirst({
          where: {
            oportunidade_id: oportunidade.id,
            board_id: oportunidade.board_id,
            motivo: { not: null },
          },
          orderBy: [{ criado: "desc" }, { id: "desc" }],
          select: {
            motivo: true,
            motivo_observacao: true,
            criado: true,
          },
        })
      : null;

    let responsavelAtual = await prisma.oportunidadeResponsaveis.findFirst({
      where: { oportunidade_id: id, usuario_id: event.context.auth.id },
      select: {
        principal: true,
        gerencia_responsaveis: true,
        pode_editar: true,
        pode_interacoes: true,
        pode_visitas: true,
      },
    });

    if (
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GERENCIAR_RESPONSAVEIS,
      )
    ) {
      responsavelAtual = {
        principal: true,
        gerencia_responsaveis: true,
        pode_editar: true,
        pode_interacoes: true,
        pode_visitas: true,
      };
    }

    if (oportunidade?.lead?.grupos) {
      const normalized = {
        ...oportunidade,
        lead: {
          ...oportunidade.lead,
          grupos: oportunidade.lead.grupos.map((item) => item.grupo),
        },
      };
      await logger.view(event, JSON.stringify(normalized));
      return {
        ...normalized,
        responsavel_atual: responsavelAtual,
        motivo_atual: motivoAtual,
      };
    }

    await logger.view(event, JSON.stringify(oportunidade));
    return {
      ...oportunidade,
      responsavel_atual: responsavelAtual,
      motivo_atual: motivoAtual,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar a Oportunidade",
    });
  }
});

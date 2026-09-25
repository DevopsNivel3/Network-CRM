import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const leadsQuerySchema = z.object({
  userId: z.union([z.string(), z.number()]).default("all"),
  city: z.string().default("all"),
  origin: z.string().default("all"),
  status: z.union([z.string(), z.number()]).default("all"),
  withoutInteraction: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
  name: z.string().optional(),
  groupIds: z
    .union([z.string(), z.array(z.string()), z.number(), z.array(z.number())])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interactionStartDate: z.string().optional(),
  interactionEndDate: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
  sortBy: z.string().default("atualizado"),
  sortOrder: z.enum(["ascending", "descending"]).nullable().optional(),
});

const parseGroupIds = (value: unknown): number[] => {
  if (value === undefined || value === null || value === "") return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((item) => String(item).split(","))
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num) && num > 0);
};

const sortColumnMap: Record<string, keyof Prisma.LeadOrderByWithRelationInput> =
  {
    nome_lead: "nome_lead",
    cpf_cnpj: "cpf_cnpj",
    contato: "contato",
    origem_lead: "origem_lead",
    criado: "criado",
    atualizado: "atualizado",
  };

const getLeadPriority = (
  hasInteraction: boolean,
  nextFollowUp?: Date | string | null,
) => {
  if (!hasInteraction) return "alta";
  if (!nextFollowUp) return "normal";

  const followUpDate = new Date(nextFollowUp);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return followUpDate <= tomorrow ? "media" : "normal";
};

// Rota para buscar todos os Leads
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_LEAD,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const query = await getValidatedQuery(event, leadsQuerySchema.parseAsync);
    const where: Prisma.LeadWhereInput = {};
    const groupIds = parseGroupIds(query.groupIds);

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (!isGrantAdmin) {
      where.empresa_id = event.context.auth.empresa_id;
    }

    if (!isAdmin && !isGrantAdmin) {
      where.usuario_id = event.context.auth.id;
    }

    if (query.userId !== "all" && !isNaN(Number(query.userId))) {
      if (isGrantAdmin || isAdmin) {
        where.usuario_id = Number(query.userId);
      }
    }

    if (query.name) {
      where.OR = [
        { nome_lead: { contains: query.name } },
        { contato: { contains: query.name } },
        { contato_nome: { contains: query.name } },
        { responsavel: { contains: query.name } },
        { cpf_cnpj: { contains: query.name } },
      ];
    }

    if (query.city !== "all") {
      where.localizacoes = {
        some: {
          cidade: { equals: query.city },
        },
      };
    }

    if (groupIds.length) {
      where.grupos = {
        some: {
          grupo_id: { in: groupIds },
        },
      };
    }

    if (query.origin !== "all") {
      where.origem_lead = query.origin;
    }

    if (query.status !== "all" && !isNaN(Number(query.status))) {
      where.oportunidades = {
        ...(where.oportunidades as Prisma.OportunidadeListRelationFilter),
        some: {
          ...((where.oportunidades as Prisma.OportunidadeListRelationFilter)
            ?.some as Prisma.OportunidadeWhereInput),
          board_id: Number(query.status),
        },
      };
    }

    if (query.withoutInteraction) {
      where.oportunidades = {
        ...(where.oportunidades as Prisma.OportunidadeListRelationFilter),
        none: {
          interacoes: {
            some: {},
          },
        },
      };
    }

    const isValidDate = (d: string | undefined): boolean => {
      return !!d && !isNaN(new Date(d).getTime());
    };

    const hasValidStart = isValidDate(query.startDate);
    const hasValidEnd = isValidDate(query.endDate);

    if (hasValidStart || hasValidEnd) {
      where.criado = {
        ...(hasValidStart && {
          gte: new Date(new Date(query.startDate!).setUTCHours(3, 0, 0, 0)),
        }),
        ...(hasValidEnd && {
          lte: new Date(new Date(query.endDate!).setUTCHours(26, 59, 59, 999)),
        }),
      };
    }

    const hasValidInteractionStart = isValidDate(query.interactionStartDate);
    const hasValidInteractionEnd = isValidDate(query.interactionEndDate);

    if (hasValidInteractionStart || hasValidInteractionEnd) {
      where.oportunidades = {
        ...(where.oportunidades as Prisma.OportunidadeListRelationFilter),
        some: {
          ...((where.oportunidades as Prisma.OportunidadeListRelationFilter)?.some as Prisma.OportunidadeWhereInput),
          interacoes: {
            some: {
              data: {
                ...(hasValidInteractionStart && {
                  gte: new Date(new Date(query.interactionStartDate!).setUTCHours(3, 0, 0, 0)),
                }),
                ...(hasValidInteractionEnd && {
                  lte: new Date(new Date(query.interactionEndDate!).setUTCHours(26, 59, 59, 999)),
                }),
              },
            },
          },
        },
      };
    }

    const total = await prisma.lead.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const sortColumn = sortColumnMap[query.sortBy] || "atualizado";
    const sortDirection = query.sortOrder === "ascending" ? "asc" : "desc";

    const data = await prisma.lead.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      orderBy: {
        [sortColumn]: sortDirection,
      },
      select: {
        id: true,
        nome_lead: true,
        cpf_cnpj: true,
        contato: true,
        contato_nome: true,
        responsavel: true,
        atividade: true,
        origem_lead: true,
        criado: true,
        atualizado: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
        oportunidades: {
          orderBy: {
            atualizado: "desc",
          },
          select: {
            id: true,
            atualizado: true,
            board: {
              select: {
                titulo: true,
                cor: true,
              },
            },
            interacoes: {
              orderBy: {
                data: "desc",
              },
              take: 1,
              select: {
                data: true,
              },
            },
            visitas: {
              where: {
                statusInt: { notIn: [4, 5] },
                data_inicio: { gte: new Date() },
              },
              orderBy: {
                data_inicio: "asc",
              },
              take: 1,
              select: {
                data_inicio: true,
              },
            },
          },
        },
      },
    });

    const normalizedData = data.map(({ oportunidades, ...lead }) => {
      const latestOpportunity = oportunidades[0];
      const latestInteraction = oportunidades
        .flatMap((oportunidade) => oportunidade.interacoes)
        .sort((a, b) => b.data.getTime() - a.data.getTime())[0];
      const nextFollowUp = oportunidades
        .flatMap((oportunidade) => oportunidade.visitas)
        .sort((a, b) => a.data_inicio.getTime() - b.data_inicio.getTime())[0];
      const hasInteraction = Boolean(latestInteraction);

      return {
        ...lead,
        status_lead: latestOpportunity?.board?.titulo || "Sem oportunidade",
        status_cor: latestOpportunity?.board?.cor || null,
        ultima_interacao: latestInteraction?.data || null,
        proximo_follow_up: nextFollowUp?.data_inicio || null,
        sem_interacao: !hasInteraction,
        prioridade: getLeadPriority(hasInteraction, nextFollowUp?.data_inicio),
      };
    });

    await logger.view(event, JSON.stringify(normalizedData));

    return { data: normalizedData, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar todos os Leads",
    });
  }
});

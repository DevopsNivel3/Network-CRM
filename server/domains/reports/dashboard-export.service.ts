import type { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import dayjs from "dayjs";
import type { DashboardExportQuery } from "./dashboard-export.schema";
import { addDashboardFinalSheets } from "./dashboard-final-sheets";
import { findInteractionContentByIds } from "./interaction-content.repository";
import { createDashboardReportContext } from "./dashboard-report-context";
import {
  formatDate,
  getStatusInteracao,
  getTipoInteracao,
  isValidDate,
  parseDecimal,
  safeExcelText,
  toPlainText,
} from "./dashboard-workbook.utils";

import type { ReportAuth } from "./report.types";

export type DashboardExportAuth = ReportAuth;

const statusOrder = [
  "Enviada",
  "Respondida",
  "Ignorada",
  "Enviado",
  "Respondido",
  "Nao respondido",
  "Atendida",
  "Nao atendida",
  "Ocupado",
];

export async function generateDashboardExport(
  query: DashboardExportQuery,
  auth: DashboardExportAuth,
) {
  try {
    const {
      isGrantAdmin,
      isAdmin,
      selectedUserId,
      selectedBoardIds,
      hasValidInteractionStart,
      hasValidInteractionEnd,
      leadWhere,
      oportunidadesWhere,
      queryYear,
      rangeStart,
      rangeEnd,
      rangeStartDay,
      rangeEndDay,
      totalDays,
    } = createDashboardReportContext(query, auth);

    const [
      leadsInRange,
      oportunidadesInRange,
      interacoesInRange,
      usuariosInScope,
    ] = await Promise.all([
      prisma.lead.findMany({
        where: {
          ...leadWhere,
          criado: {
            gte: new Date(rangeStartDay.toISOString()),
            lt: new Date(rangeEndDay.toISOString()),
          },
        },
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
          usuario_id: true,
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          localizacoes: {
            select: {
              rua: true,
              numero: true,
              cidade: true,
              estado: true,
              cep: true,
            },
          },
          _count: {
            select: {
              oportunidades: true,
            },
          },
          oportunidades: {
            select: {
              id: true,
              criado: true,
              atualizado: true,
              valor_estimado: true,
              desativado: true,
              board: {
                select: {
                  id: true,
                  titulo: true,
                  posicao: true,
                },
              },
            },
            orderBy: { criado: "asc" },
          },
        },
        orderBy: {
          criado: "desc",
        },
      }),
      prisma.oportunidade.findMany({
        where: {
          ...oportunidadesWhere,
          criado: {
            gte: new Date(rangeStartDay.toISOString()),
            lt: new Date(rangeEndDay.toISOString()),
          },
        },
        select: {
          id: true,
          descricao: true,
          status: true,
          valor_estimado: true,
          faixa_valor: true,
          num_pdvs: true,
          num_lojas: true,
          infraestrutura: true,
          desativado: true,
          controle_lembretes: true,
          criado: true,
          atualizado: true,
          usuario_id: true,
          lead_id: true,
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              nome_lead: true,
              contato_nome: true,
            },
          },
          board: {
            select: {
              id: true,
              titulo: true,
              posicao: true,
            },
          },
          responsaveis: {
            select: {
              principal: true,
              gerencia_responsaveis: true,
              pode_editar: true,
              pode_interacoes: true,
              pode_visitas: true,
              usuario: {
                select: {
                  nome: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              interacoes: true,
              visitas: true,
            },
          },
        },
        orderBy: {
          criado: "desc",
        },
      }),
      prisma.oportunidadeInteracoes.findMany({
        where: {
          oportunidade: {
            ...oportunidadesWhere,
            desativado: false,
          },
          data: {
            gte: new Date(rangeStartDay.toISOString()),
            lt: new Date(rangeEndDay.toISOString()),
          },
        },
        select: {
          id: true,
          tipo: true,
          status: true,
          data: true,
          conteudo: true,
          oportunidade_id: true,
          usuario_id: true,
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          oportunidade: {
            select: {
              id: true,
              status: true,
              usuario_id: true,
              board: {
                select: {
                  id: true,
                  titulo: true,
                },
              },
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
              lead: {
                select: {
                  id: true,
                  nome_lead: true,
                  contato_nome: true,
                },
              },
            },
          },
        },
        orderBy: {
          data: "desc",
        },
      }),
      prisma.usuario.findMany({
        where: {
          ...(isGrantAdmin ? {} : { empresa_id: auth.empresa_id }),
          ...(!isAdmin && !isGrantAdmin ? { id: auth.id } : {}),
          ...(selectedUserId && (isAdmin || isGrantAdmin)
            ? { id: selectedUserId }
            : {}),
        },
        select: {
          id: true,
          nome: true,
          email: true,
          contato: true,
          desativado: true,
          criado: true,
          boards_atribuicao: {
            select: {
              id: true,
              titulo: true,
            },
          },
        },
        orderBy: {
          nome: "asc",
        },
      }),
    ]);

    // Retrato operacional das pranchetas. Esta consulta replica a fonte usada
    // pela aba "Interacoes" do card: cards atuais por board e todo o historico
    // de OportunidadeInteracoes por oportunidade_id, sem recorte de data.
    const allBoardsForReport = await prisma.boardOportunidade.findMany({
      where: {
        ...(isGrantAdmin ? {} : { empresa_id: auth.empresa_id }),
      },
      select: {
        id: true,
        titulo: true,
        posicao: true,
        cor: true,
        exige_motivo: true,
        grupo_motivos: true,
        motivos: true,
        exigir_obs_outro: true,
      },
      orderBy: [{ posicao: "asc" }, { id: "asc" }],
    });
    const boardsForReport = selectedBoardIds.length
      ? allBoardsForReport.filter((board) =>
          selectedBoardIds.includes(board.id),
        )
      : allBoardsForReport;
    const boardIdsForReport = boardsForReport.map((board) => board.id);
    const firstBoardIdForReport = allBoardsForReport[0]?.id || null;
    const includeUnassignedCards =
      !!firstBoardIdForReport &&
      boardIdsForReport.includes(firstBoardIdForReport);

    const boardCardsAccessWhere: Prisma.OportunidadeWhereInput = {
      desativado: false,
      ...(isGrantAdmin ? {} : { lead: { empresa_id: auth.empresa_id } }),
      ...(!isAdmin && !isGrantAdmin
        ? { responsaveis: { some: { usuario_id: auth.id } } }
        : {}),
      ...(selectedUserId && (isAdmin || isGrantAdmin)
        ? { responsaveis: { some: { usuario_id: selectedUserId } } }
        : {}),
    };
    const boardCardsBase = boardIdsForReport.length
      ? await prisma.oportunidade.findMany({
          where: {
            AND: [
              boardCardsAccessWhere,
              {
                OR: [
                  { board_id: { in: boardIdsForReport } },
                  ...(includeUnassignedCards ? [{ board_id: null }] : []),
                ],
              },
            ],
          },
          select: {
            id: true,
            status: true,
            statusInt: true,
            descricao: true,
            criado: true,
            atualizado: true,
            valor_estimado: true,
            posicao: true,
            board_id: true,
            board: {
              select: {
                id: true,
                titulo: true,
                posicao: true,
                cor: true,
              },
            },
            lead: {
              select: {
                id: true,
                nome_lead: true,
                contato_nome: true,
                contato: true,
              },
            },
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            responsaveis: {
              select: {
                principal: true,
                usuario: {
                  select: {
                    id: true,
                    nome: true,
                    email: true,
                  },
                },
              },
              orderBy: [{ principal: "desc" }, { criado: "asc" }],
            },
            interacoes: {
              orderBy: [{ data: "asc" }, { id: "asc" }],
              select: {
                id: true,
                statusInt: true,
                status: true,
                tipo: true,
                data: true,
                usuario: {
                  select: {
                    id: true,
                    nome: true,
                    email: true,
                  },
                },
                anexos: {
                  select: {
                    nome: true,
                    url: true,
                    tipo: true,
                    tamanho: true,
                  },
                },
              },
            },
          },
          orderBy: [{ board_id: "asc" }, { posicao: "asc" }, { id: "asc" }],
        })
      : [];

    // LongText de interacoes pode ultrapassar o limite de conversao do engine
    // do Prisma quando todo o historico e materializado numa unica consulta.
    // Busca o conteudo em lotes e o agrega ao retrato dos cards em memoria.
    const interactionIds = boardCardsBase.flatMap((card) =>
      card.interacoes.map((interaction) => interaction.id),
    );
    const interactionContent =
      await findInteractionContentByIds(interactionIds);
    const boardCardsForReport = boardCardsBase.map((card) => ({
      ...card,
      interacoes: card.interacoes.map((interaction) => ({
        ...interaction,
        conteudo: interactionContent.get(interaction.id) ?? null,
      })),
    }));

    // Fluxo historico independente do retrato atual. Busca toda oportunidade
    // que entrou/passou pela prancheta no periodo, mesmo que hoje esteja em
    // outra etapa. O agrupamento em oportunidade unica e feito na exportacao.
    const boardPassagesInPeriod = boardIdsForReport.length
      ? await prisma.oportunidadeHistorico.findMany({
          where: {
            criado: {
              gte: rangeStartDay.toDate(),
              lte: rangeEndDay.toDate(),
            },
            OR: [
              { board_id: { in: boardIdsForReport } },
              ...(includeUnassignedCards ? [{ board_id: null }] : []),
            ],
            oportunidade: {
              ...(isGrantAdmin
                ? {}
                : { lead: { empresa_id: auth.empresa_id } }),
              ...(!isAdmin && !isGrantAdmin
                ? {
                    responsaveis: {
                      some: { usuario_id: auth.id },
                    },
                  }
                : {}),
              ...(selectedUserId && (isAdmin || isGrantAdmin)
                ? {
                    responsaveis: {
                      some: { usuario_id: selectedUserId },
                    },
                  }
                : {}),
            },
          },
          select: {
            id: true,
            board_id: true,
            criado: true,
            acao: true,
            descricao: true,
            motivo: true,
            motivo_observacao: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            oportunidade: {
              select: {
                id: true,
                status: true,
                statusInt: true,
                valor_estimado: true,
                criado: true,
                atualizado: true,
                desativado: true,
                board_id: true,
                board: {
                  select: {
                    id: true,
                    titulo: true,
                  },
                },
                lead: {
                  select: {
                    nome_lead: true,
                    contato_nome: true,
                    contato: true,
                  },
                },
                responsaveis: {
                  select: {
                    principal: true,
                    usuario: {
                      select: {
                        id: true,
                        nome: true,
                        email: true,
                      },
                    },
                  },
                  orderBy: [{ principal: "desc" }, { criado: "asc" }],
                },
              },
            },
          },
          orderBy: [{ criado: "asc" }, { id: "asc" }],
        })
      : [];

    const oportunidadeIdsParaHistorico = [
      ...new Set([
        ...oportunidadesInRange.map((item) => item.id),
        ...interacoesInRange.map((item) => item.oportunidade_id),
      ]),
    ];

    const historicosInteracoes = oportunidadeIdsParaHistorico.length
      ? await prisma.oportunidadeHistorico.findMany({
          where: {
            oportunidade_id: { in: oportunidadeIdsParaHistorico },
            criado: {
              lte: new Date(rangeEndDay.toISOString()),
            },
          },
          select: {
            oportunidade_id: true,
            board_id: true,
            criado: true,
            acao: true,
            descricao: true,
            motivo: true,
            motivo_observacao: true,
            usuario: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
          orderBy: [{ oportunidade_id: "asc" }, { criado: "asc" }],
        })
      : [];

    const boardIdsHistorico = historicosInteracoes
      .map((item) => item.board_id)
      .filter((item): item is number => typeof item === "number");
    const boardIdsAtuais = interacoesInRange
      .map((item) => item.oportunidade.board?.id)
      .filter((item): item is number => typeof item === "number");
    oportunidadesInRange.forEach((item) => {
      if (typeof item.board?.id === "number")
        boardIdsAtuais.push(item.board.id);
    });
    const boardsMap = new Map<number, string>();

    if (
      boardIdsHistorico.length ||
      boardIdsAtuais.length ||
      selectedBoardIds.length
    ) {
      const boards = await prisma.boardOportunidade.findMany({
        where: {
          id: {
            in: [
              ...new Set([
                ...boardIdsHistorico,
                ...boardIdsAtuais,
                ...selectedBoardIds,
              ]),
            ],
          },
        },
        select: {
          id: true,
          titulo: true,
        },
      });

      boards.forEach((board) => boardsMap.set(board.id, board.titulo));
    }

    const historicosPorOportunidade = new Map<
      number,
      { board_id: number | null; criado: Date }[]
    >();
    historicosInteracoes.forEach((item) => {
      const current = historicosPorOportunidade.get(item.oportunidade_id) || [];
      current.push({ board_id: item.board_id, criado: item.criado });
      historicosPorOportunidade.set(item.oportunidade_id, current);
    });

    const resolverBoardNaData = (
      oportunidadeId: number,
      data: Date,
      fallback?: string | null,
    ) => {
      const historico = historicosPorOportunidade.get(oportunidadeId) || [];
      let boardTitulo: string | null = null;

      for (let index = historico.length - 1; index >= 0; index--) {
        const item = historico[index];
        if (item.criado <= data) {
          boardTitulo =
            (item.board_id ? boardsMap.get(item.board_id) : null) || null;
          break;
        }
      }

      return boardTitulo || fallback || "";
    };

    const previousRangeEnd = rangeStartDay.subtract(1, "day").endOf("day");
    const previousRangeStart = previousRangeEnd
      .subtract(totalDays - 1, "day")
      .startOf("day");

    const [
      previousLeadsTotal,
      previousConvertedLeadsTotal,
      previousOportunidadesAgg,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          ...leadWhere,
          criado: {
            gte: new Date(previousRangeStart.toISOString()),
            lt: new Date(previousRangeEnd.toISOString()),
          },
        },
      }),
      prisma.lead.count({
        where: {
          AND: [
            leadWhere,
            {
              criado: {
                gte: new Date(previousRangeStart.toISOString()),
                lt: new Date(previousRangeEnd.toISOString()),
              },
            },
            { oportunidades: { some: {} } },
          ],
        },
      }),
      prisma.oportunidade.aggregate({
        where: {
          ...oportunidadesWhere,
          criado: {
            gte: new Date(previousRangeStart.toISOString()),
            lt: new Date(previousRangeEnd.toISOString()),
          },
        },
        _count: {
          _all: true,
        },
        _sum: {
          valor_estimado: true,
        },
      }),
    ]);

    const labels: string[] = [];
    const dayMap = new Map<string, number>();
    const oppDayMap = new Map<string, number>();
    const interacoesDayMap = new Map<string, number>();
    const pipelineDayMap = new Map<string, number>();

    for (let i = 0; i < totalDays; i++) {
      const current = rangeStartDay.add(i, "day");
      const key = current.format("YYYY-MM-DD");
      labels.push(current.format("DD/MM/YYYY"));
      dayMap.set(key, 0);
      oppDayMap.set(key, 0);
      interacoesDayMap.set(key, 0);
      pipelineDayMap.set(key, 0);
    }

    const leadsByStateMap = new Map<string, number>();
    const interacoesPorTipoMap = new Map<string, number>();
    const interacoesDetalhadasPorTipoMap = {
      mensagem: new Map<string, number>(),
      email: new Map<string, number>(),
      telefone: new Map<string, number>(),
    };
    const interacoesCountByOpportunity = new Map<number, number>();
    const interacoesCountByLead = new Map<number, number>();
    const ultimaInteracaoByOpportunity = new Map<
      number,
      {
        data: Date;
        tipo: string;
        status: string;
        usuario: string;
        boardNaData: string;
      }
    >();
    const ultimaInteracaoByLead = new Map<
      number,
      {
        data: Date;
        tipo: string;
        status: string;
      }
    >();

    const usersMetrics = new Map<
      number,
      {
        id: number;
        nome: string;
        email: string;
        contato: string;
        desativado: boolean;
        boardsAtribuidas: string[];
        leads: number;
        oportunidades: number;
        pipeline: number;
        interacoes: number;
        mensagens: number;
        emails: number;
        telefones: number;
        oportunidadesComInteracao: Set<number>;
        ultimaInteracao: Date | null;
      }
    >();

    const ensureUserMetric = (
      userId: number,
      fallback?: Partial<{
        nome: string;
        email: string;
        contato: string;
        desativado: boolean;
        boardsAtribuidas: string[];
      }>,
    ) => {
      if (!usersMetrics.has(userId)) {
        usersMetrics.set(userId, {
          id: userId,
          nome: fallback?.nome || `Usuario ${userId}`,
          email: fallback?.email || "",
          contato: fallback?.contato || "",
          desativado: fallback?.desativado || false,
          boardsAtribuidas: fallback?.boardsAtribuidas || [],
          leads: 0,
          oportunidades: 0,
          pipeline: 0,
          interacoes: 0,
          mensagens: 0,
          emails: 0,
          telefones: 0,
          oportunidadesComInteracao: new Set<number>(),
          ultimaInteracao: null,
        });
      }

      return usersMetrics.get(userId)!;
    };

    usuariosInScope.forEach((usuario) => {
      ensureUserMetric(usuario.id, {
        nome: usuario.nome,
        email: usuario.email,
        contato: usuario.contato,
        desativado: usuario.desativado,
        boardsAtribuidas: usuario.boards_atribuicao.map(
          (board) => board.titulo,
        ),
      });
    });

    leadsInRange.forEach((lead) => {
      const key = dayjs(lead.criado).format("YYYY-MM-DD");
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) || 0) + 1);

      lead.localizacoes.forEach((localizacao) => {
        const estado = localizacao.estado || "Nao informado";
        leadsByStateMap.set(estado, (leadsByStateMap.get(estado) || 0) + 1);
      });

      const metric = ensureUserMetric(lead.usuario_id, {
        nome: lead.usuario.nome,
        email: lead.usuario.email,
      });
      metric.leads += 1;
    });

    oportunidadesInRange.forEach((oportunidade) => {
      const key = dayjs(oportunidade.criado).format("YYYY-MM-DD");
      const valor = parseDecimal(oportunidade.valor_estimado ?? 0);

      if (oppDayMap.has(key)) oppDayMap.set(key, (oppDayMap.get(key) || 0) + 1);
      if (pipelineDayMap.has(key)) {
        pipelineDayMap.set(key, (pipelineDayMap.get(key) || 0) + valor);
      }

      const metric = ensureUserMetric(oportunidade.usuario_id, {
        nome: oportunidade.usuario.nome,
        email: oportunidade.usuario.email,
      });
      metric.oportunidades += 1;
      metric.pipeline += valor;
    });

    interacoesInRange.forEach((interacao) => {
      const tipoNumero = Number(interacao.tipo || 0);
      const statusNumero = Number(interacao.status || 0);
      const tipo = getTipoInteracao(tipoNumero);
      const status = getStatusInteracao(tipoNumero, statusNumero);
      const key = dayjs(interacao.data).format("YYYY-MM-DD");
      const boardNaData = resolverBoardNaData(
        interacao.oportunidade_id,
        interacao.data,
        interacao.oportunidade.board?.titulo || interacao.oportunidade.status,
      );

      interacoesPorTipoMap.set(tipo, (interacoesPorTipoMap.get(tipo) || 0) + 1);
      interacoesDayMap.set(key, (interacoesDayMap.get(key) || 0) + 1);
      interacoesCountByOpportunity.set(
        interacao.oportunidade_id,
        (interacoesCountByOpportunity.get(interacao.oportunidade_id) || 0) + 1,
      );
      interacoesCountByLead.set(
        interacao.oportunidade.lead.id,
        (interacoesCountByLead.get(interacao.oportunidade.lead.id) || 0) + 1,
      );

      if (!ultimaInteracaoByOpportunity.has(interacao.oportunidade_id)) {
        ultimaInteracaoByOpportunity.set(interacao.oportunidade_id, {
          data: interacao.data,
          tipo,
          status,
          usuario: interacao.usuario.nome,
          boardNaData,
        });
      }

      if (!ultimaInteracaoByLead.has(interacao.oportunidade.lead.id)) {
        ultimaInteracaoByLead.set(interacao.oportunidade.lead.id, {
          data: interacao.data,
          tipo,
          status,
        });
      }

      if (tipoNumero === 1) {
        interacoesDetalhadasPorTipoMap.mensagem.set(
          status,
          (interacoesDetalhadasPorTipoMap.mensagem.get(status) || 0) + 1,
        );
      }
      if (tipoNumero === 2) {
        interacoesDetalhadasPorTipoMap.email.set(
          status,
          (interacoesDetalhadasPorTipoMap.email.get(status) || 0) + 1,
        );
      }
      if (tipoNumero === 3) {
        interacoesDetalhadasPorTipoMap.telefone.set(
          status,
          (interacoesDetalhadasPorTipoMap.telefone.get(status) || 0) + 1,
        );
      }

      const metric = ensureUserMetric(interacao.usuario_id, {
        nome: interacao.usuario.nome,
        email: interacao.usuario.email,
      });
      metric.interacoes += 1;
      metric.ultimaInteracao = metric.ultimaInteracao || interacao.data;
      metric.oportunidadesComInteracao.add(interacao.oportunidade_id);
      if (tipoNumero === 1) metric.mensagens += 1;
      if (tipoNumero === 2) metric.emails += 1;
      if (tipoNumero === 3) metric.telefones += 1;

      const ownerMetric = ensureUserMetric(interacao.oportunidade.usuario_id);
      ownerMetric.oportunidadesComInteracao.add(interacao.oportunidade_id);
    });

    const totalLeads = leadsInRange.length;
    const leadsConvertidos = leadsInRange.filter(
      (lead) => lead.oportunidades.length > 0,
    ).length;
    const totalOportunidades = oportunidadesInRange.length;
    const totalInteracoes = interacoesInRange.length;
    const totalPipeline = Array.from(pipelineDayMap.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    const ticketMedio =
      totalOportunidades > 0 ? totalPipeline / totalOportunidades : 0;
    const averageLeadsPerDay = totalDays > 0 ? totalLeads / totalDays : 0;
    const averageOportunidadesPerDay =
      totalDays > 0 ? totalOportunidades / totalDays : 0;
    const conversionRate = totalLeads > 0 ? leadsConvertidos / totalLeads : 0;

    const previousOportunidadesTotal =
      previousOportunidadesAgg._count._all || 0;
    const previousPipelineValue = parseDecimal(
      previousOportunidadesAgg._sum.valor_estimado ?? 0,
    );
    const previousConversionRate =
      previousLeadsTotal > 0
        ? previousConvertedLeadsTotal / previousLeadsTotal
        : 0;

    const oportunidadesComInteracao = new Set(
      interacoesInRange.map((item) => item.oportunidade_id),
    ).size;
    const coberturaOportunidades =
      totalOportunidades > 0
        ? oportunidadesComInteracao / totalOportunidades
        : 0;

    const leadsChange =
      previousLeadsTotal > 0
        ? (totalLeads - previousLeadsTotal) / previousLeadsTotal
        : 0;
    const oportunidadesChange =
      previousOportunidadesTotal > 0
        ? (totalOportunidades - previousOportunidadesTotal) /
          previousOportunidadesTotal
        : 0;
    const pipelineChange =
      previousPipelineValue > 0
        ? (totalPipeline - previousPipelineValue) / previousPipelineValue
        : 0;
    const conversionChange =
      previousConversionRate > 0
        ? (conversionRate - previousConversionRate) / previousConversionRate
        : 0;

    const coberturaPorBoardMap = new Map<
      string,
      { total: number; comInteracao: number }
    >();
    oportunidadesInRange.forEach((oportunidade) => {
      const board = oportunidade.board?.titulo || "Sem etapa";
      const current = coberturaPorBoardMap.get(board) || {
        total: 0,
        comInteracao: 0,
      };
      current.total += 1;
      if (interacoesCountByOpportunity.has(oportunidade.id))
        current.comInteracao += 1;
      coberturaPorBoardMap.set(board, current);
    });

    const leadsByStateRows = Array.from(leadsByStateMap.entries())
      .map(([estado, total]) => ({ estado, total }))
      .sort((a, b) => b.total - a.total);

    const cadastrosPorDiaRows = labels.map((label, index) => {
      const key = rangeStartDay.add(index, "day").format("YYYY-MM-DD");
      return {
        data: label,
        leads: dayMap.get(key) || 0,
        oportunidades: oppDayMap.get(key) || 0,
        interacoes: interacoesDayMap.get(key) || 0,
        pipeline_dia: pipelineDayMap.get(key) || 0,
      };
    });

    let pipelineAcumulado = 0;
    cadastrosPorDiaRows.forEach((row) => {
      pipelineAcumulado += row.pipeline_dia;
      (row as any).pipeline_acumulado = pipelineAcumulado;
    });

    const interacoesByTipoRows = Array.from(interacoesPorTipoMap.entries())
      .map(([tipo, total]) => ({ tipo, total }))
      .sort((a, b) => b.total - a.total);

    const resultadosIntegracaoRows = [
      {
        tipo: "Mensagem",
        valores: interacoesDetalhadasPorTipoMap.mensagem,
      },
      {
        tipo: "E-mail",
        valores: interacoesDetalhadasPorTipoMap.email,
      },
      {
        tipo: "Telefone",
        valores: interacoesDetalhadasPorTipoMap.telefone,
      },
    ].map((item) => {
      const row: Record<string, any> = {
        tipo: item.tipo,
        total: Array.from(item.valores.values()).reduce(
          (sum, value) => sum + value,
          0,
        ),
      };

      statusOrder.forEach((status) => {
        row[status] = item.valores.get(status) || 0;
      });

      return row;
    });

    const usuariosRows = Array.from(usersMetrics.values())
      .map((item) => ({
        id: item.id,
        nome: item.nome,
        email: item.email,
        contato: item.contato,
        desativado: item.desativado ? "Sim" : "Nao",
        boards_atribuicao_qtd: item.boardsAtribuidas.length,
        boards_atribuicao: item.boardsAtribuidas.join(", "),
        leads: item.leads,
        oportunidades: item.oportunidades,
        pipeline: item.pipeline,
        ticket_medio:
          item.oportunidades > 0 ? item.pipeline / item.oportunidades : 0,
        interacoes: item.interacoes,
        mensagens: item.mensagens,
        emails: item.emails,
        telefones: item.telefones,
        oportunidades_com_interacao: item.oportunidadesComInteracao.size,
        cobertura_interacao:
          item.oportunidades > 0
            ? item.oportunidadesComInteracao.size / item.oportunidades
            : 0,
        ultima_interacao: item.ultimaInteracao ? item.ultimaInteracao : null,
      }))
      .sort((a, b) => b.interacoes - a.interacoes || b.pipeline - a.pipeline);

    const interacoesPorResponsavelRows = usuariosRows
      .filter((item) => item.interacoes > 0)
      .map((item) => ({
        usuario: item.nome,
        interacoes: item.interacoes,
        mensagens: item.mensagens,
        emails: item.emails,
        telefones: item.telefones,
        ultima_interacao: item.ultima_interacao,
      }));

    const coberturaBoardRows = Array.from(coberturaPorBoardMap.entries())
      .map(([board, dados]) => ({
        board,
        oportunidades_total: dados.total,
        oportunidades_com_interacao: dados.comInteracao,
        cobertura: dados.total > 0 ? dados.comInteracao / dados.total : 0,
      }))
      .sort((a, b) => b.cobertura - a.cobertura);

    const conversaoLeadsRows = leadsInRange
      .map((lead) => {
        const primeiraOportunidade = lead.oportunidades[0];
        const pipeline = lead.oportunidades.reduce(
          (total, oportunidade) =>
            total + parseDecimal(oportunidade.valor_estimado ?? 0),
          0,
        );
        const diasConversao = primeiraOportunidade
          ? Math.max(
              0,
              dayjs(primeiraOportunidade.criado).diff(
                dayjs(lead.criado),
                "day",
              ),
            )
          : null;

        return {
          lead_id: lead.id,
          lead: lead.nome_lead || "",
          contato: lead.contato_nome || lead.contato || "",
          origem: lead.origem_lead || "Nao informado",
          responsavel: lead.usuario.nome,
          criado: lead.criado,
          converteu: primeiraOportunidade ? "Sim" : "Nao",
          primeira_oportunidade_id: primeiraOportunidade?.id || null,
          primeira_oportunidade: primeiraOportunidade?.criado || null,
          dias_para_converter: diasConversao,
          oportunidades: lead.oportunidades.length,
          boards_atuais: [
            ...new Set(
              lead.oportunidades.map(
                (oportunidade) => oportunidade.board?.titulo || "Sem etapa",
              ),
            ),
          ].join(" | "),
          pipeline,
          interacoes_periodo: interacoesCountByLead.get(lead.id) || 0,
        };
      })
      .sort((a, b) =>
        a.converteu === b.converteu
          ? a.responsavel.localeCompare(b.responsavel)
          : a.converteu === "Sim"
            ? -1
            : 1,
      );

    const buildConversionSummary = (key: "origem" | "responsavel") => {
      const grouped = new Map<
        string,
        {
          leads: number;
          convertidos: number;
          oportunidades: number;
          pipeline: number;
          dias: number[];
        }
      >();

      conversaoLeadsRows.forEach((row) => {
        const name = String(row[key] || "Nao informado");
        const current = grouped.get(name) || {
          leads: 0,
          convertidos: 0,
          oportunidades: 0,
          pipeline: 0,
          dias: [],
        };
        current.leads += 1;
        current.oportunidades += row.oportunidades;
        current.pipeline += row.pipeline;
        if (row.converteu === "Sim") current.convertidos += 1;
        if (typeof row.dias_para_converter === "number") {
          current.dias.push(row.dias_para_converter);
        }
        grouped.set(name, current);
      });

      return Array.from(grouped.entries())
        .map(([nome, item]) => ({
          nome,
          leads: item.leads,
          convertidos: item.convertidos,
          nao_convertidos: item.leads - item.convertidos,
          taxa_conversao: item.leads ? item.convertidos / item.leads : 0,
          oportunidades: item.oportunidades,
          oportunidades_por_convertido: item.convertidos
            ? item.oportunidades / item.convertidos
            : 0,
          tempo_medio_conversao: item.dias.length
            ? item.dias.reduce((sum, value) => sum + value, 0) /
              item.dias.length
            : null,
          pipeline: item.pipeline,
        }))
        .sort(
          (a, b) => b.taxa_conversao - a.taxa_conversao || b.leads - a.leads,
        );
    };

    const conversaoOrigemRows = buildConversionSummary("origem");
    const conversaoResponsavelRows = buildConversionSummary("responsavel");

    const performanceBoardMap = new Map<
      string,
      {
        oportunidades: number;
        leads: Set<number>;
        pipeline: number;
        comInteracao: number;
        interacoes: number;
        paradas: number;
        desativadas: number;
        idadeTotal: number;
      }
    >();

    oportunidadesInRange.forEach((oportunidade) => {
      const board = oportunidade.board?.titulo || "Sem etapa";
      const current = performanceBoardMap.get(board) || {
        oportunidades: 0,
        leads: new Set<number>(),
        pipeline: 0,
        comInteracao: 0,
        interacoes: 0,
        paradas: 0,
        desativadas: 0,
        idadeTotal: 0,
      };
      const interacoes = interacoesCountByOpportunity.get(oportunidade.id) || 0;
      const diasSemMovimento = Math.max(
        0,
        rangeEndDay.diff(dayjs(oportunidade.atualizado), "day"),
      );
      current.oportunidades += 1;
      current.leads.add(oportunidade.lead.id);
      current.pipeline += parseDecimal(oportunidade.valor_estimado ?? 0);
      current.interacoes += interacoes;
      current.idadeTotal += Math.max(
        0,
        rangeEndDay.diff(dayjs(oportunidade.criado), "day"),
      );
      if (interacoes > 0) current.comInteracao += 1;
      if (diasSemMovimento > 7) current.paradas += 1;
      if (oportunidade.desativado) current.desativadas += 1;
      performanceBoardMap.set(board, current);
    });

    const performanceBoardRows = Array.from(performanceBoardMap.entries())
      .map(([board, item]) => ({
        board,
        oportunidades: item.oportunidades,
        leads_unicos: item.leads.size,
        pipeline: item.pipeline,
        participacao_pipeline: totalPipeline
          ? item.pipeline / totalPipeline
          : 0,
        com_interacao: item.comInteracao,
        sem_interacao: item.oportunidades - item.comInteracao,
        cobertura_interacao: item.oportunidades
          ? item.comInteracao / item.oportunidades
          : 0,
        interacoes: item.interacoes,
        media_interacoes: item.oportunidades
          ? item.interacoes / item.oportunidades
          : 0,
        idade_media_dias: item.oportunidades
          ? item.idadeTotal / item.oportunidades
          : 0,
        paradas_mais_7_dias: item.paradas,
        desativadas: item.desativadas,
      }))
      .sort(
        (a, b) => b.pipeline - a.pipeline || b.oportunidades - a.oportunidades,
      );

    const interacoesOrdenadas = [...interacoesInRange].sort(
      (a, b) =>
        a.oportunidade_id - b.oportunidade_id ||
        a.data.getTime() - b.data.getTime(),
    );
    const sequenciaPorOportunidade = new Map<
      number,
      { sequencia: number; data: Date | null }
    >();
    const interacoesBoardRows = interacoesOrdenadas.map((item) => {
      const previous = sequenciaPorOportunidade.get(item.oportunidade_id) || {
        sequencia: 0,
        data: null,
      };
      const result = {
        board_na_data: resolverBoardNaData(
          item.oportunidade_id,
          item.data,
          item.oportunidade.board?.titulo || item.oportunidade.status,
        ),
        board_atual:
          item.oportunidade.board?.titulo || item.oportunidade.status || "",
        oportunidade_id: item.oportunidade_id,
        lead: item.oportunidade.lead.nome_lead || "",
        contato: item.oportunidade.lead.contato_nome || "",
        sequencia: previous.sequencia + 1,
        data: item.data,
        dias_desde_anterior: previous.data
          ? dayjs(item.data).diff(dayjs(previous.data), "day")
          : null,
        tipo: getTipoInteracao(Number(item.tipo || 0)),
        resultado: getStatusInteracao(
          Number(item.tipo || 0),
          Number(item.status || 0),
        ),
        usuario: item.usuario.nome,
        conteudo: toPlainText(item.conteudo),
      };
      sequenciaPorOportunidade.set(item.oportunidade_id, {
        sequencia: result.sequencia,
        data: item.data,
      });
      return result;
    });

    const oportunidadeNomeMap = new Map<number, string>();
    oportunidadesInRange.forEach((item) =>
      oportunidadeNomeMap.set(item.id, item.lead.nome_lead || ""),
    );
    interacoesInRange.forEach((item) =>
      oportunidadeNomeMap.set(
        item.oportunidade_id,
        item.oportunidade.lead.nome_lead || "",
      ),
    );

    const movimentacoesBoardRows: Array<Record<string, any>> = [];
    const transicoesMap = new Map<
      string,
      {
        origem: string;
        destino: string;
        movimentos: number;
        oportunidades: Set<number>;
        dias: number[];
      }
    >();

    historicosPorOportunidade.forEach((historicoBase, oportunidadeId) => {
      const historicoCompleto = historicosInteracoes
        .filter((item) => item.oportunidade_id === oportunidadeId)
        .sort((a, b) => a.criado.getTime() - b.criado.getTime());

      let boardAnterior = "Entrada";
      let dataAnterior: Date | null = null;
      historicoCompleto.forEach((item) => {
        const boardDestino = item.board_id
          ? boardsMap.get(item.board_id) || `Board ${item.board_id}`
          : "Sem etapa";
        const diasNaEtapa = dataAnterior
          ? Math.max(0, dayjs(item.criado).diff(dayjs(dataAnterior), "day"))
          : null;

        if (
          item.criado >= rangeStartDay.toDate() &&
          item.criado <= rangeEndDay.toDate()
        ) {
          movimentacoesBoardRows.push({
            data: item.criado,
            oportunidade_id: oportunidadeId,
            lead: oportunidadeNomeMap.get(oportunidadeId) || "",
            board_origem: boardAnterior,
            board_destino: boardDestino,
            dias_board_anterior: diasNaEtapa,
            acao: item.acao,
            usuario: item.usuario.nome,
            motivo: item.motivo || "",
            observacao_motivo: item.motivo_observacao || "",
            descricao: item.descricao || "",
          });

          const transitionKey = `${boardAnterior} -> ${boardDestino}`;
          const transition = transicoesMap.get(transitionKey) || {
            origem: boardAnterior,
            destino: boardDestino,
            movimentos: 0,
            oportunidades: new Set<number>(),
            dias: [],
          };
          transition.movimentos += 1;
          transition.oportunidades.add(oportunidadeId);
          if (typeof diasNaEtapa === "number")
            transition.dias.push(diasNaEtapa);
          transicoesMap.set(transitionKey, transition);
        }

        boardAnterior = boardDestino;
        dataAnterior = item.criado;
      });
    });

    const transicoesBoardRows = Array.from(transicoesMap.values())
      .map((item) => ({
        board_origem: item.origem,
        board_destino: item.destino,
        movimentos: item.movimentos,
        oportunidades_unicas: item.oportunidades.size,
        tempo_medio_origem: item.dias.length
          ? item.dias.reduce((sum, value) => sum + value, 0) / item.dias.length
          : null,
      }))
      .sort((a, b) => b.movimentos - a.movimentos);

    const listaInteracoesRows = interacoesInRange.map((item) => ({
      id: item.id,
      data: item.data,
      tipo: getTipoInteracao(Number(item.tipo || 0)),
      resultado: getStatusInteracao(
        Number(item.tipo || 0),
        Number(item.status || 0),
      ),
      usuario: item.usuario.nome,
      lead: item.oportunidade.lead.nome_lead || "",
      contato: item.oportunidade.lead.contato_nome || "",
      oportunidade_id: item.oportunidade_id,
      board_na_data: resolverBoardNaData(
        item.oportunidade_id,
        item.data,
        item.oportunidade.board?.titulo || item.oportunidade.status,
      ),
      board_atual:
        item.oportunidade.board?.titulo || item.oportunidade.status || "",
      conteudo: item.conteudo || "",
    }));

    const leadsDetalhadosRows = leadsInRange.map((lead) => {
      const ultimaInteracao = ultimaInteracaoByLead.get(lead.id);
      return {
        id: lead.id,
        nome_lead: lead.nome_lead || "",
        contato_nome: lead.contato_nome || "",
        contato: lead.contato || "",
        cpf_cnpj: lead.cpf_cnpj || "",
        responsavel: lead.responsavel || "",
        usuario: lead.usuario.nome,
        usuario_email: lead.usuario.email,
        origem_lead: lead.origem_lead || "",
        atividade: lead.atividade || "",
        faturamento: lead.faturamento || "",
        num_funcionarios: lead.num_funcionarios || 0,
        localizacoes: lead.localizacoes
          .map((loc) => [loc.cidade, loc.estado].filter(Boolean).join("/"))
          .filter(Boolean)
          .join(" | "),
        enderecos: lead.localizacoes
          .map((loc) =>
            [loc.rua, loc.numero, loc.cep].filter(Boolean).join(", "),
          )
          .filter(Boolean)
          .join(" | "),
        oportunidades: lead._count.oportunidades,
        interacoes: interacoesCountByLead.get(lead.id) || 0,
        ultima_interacao: ultimaInteracao?.data || null,
        ultimo_tipo_interacao: ultimaInteracao?.tipo || "",
        ultimo_resultado: ultimaInteracao?.status || "",
        controle_lembretes: lead.controle_lembretes ? "Sim" : "Nao",
        criado: lead.criado,
        atualizado: lead.atualizado,
        observacoes: lead.observacoes || "",
      };
    });

    const oportunidadesDetalhadasRows = oportunidadesInRange.map(
      (oportunidade) => {
        const ultimaInteracao = ultimaInteracaoByOpportunity.get(
          oportunidade.id,
        );
        return {
          id: oportunidade.id,
          lead_id: oportunidade.lead.id,
          lead: oportunidade.lead.nome_lead || "",
          contato_lead: oportunidade.lead.contato_nome || "",
          usuario: oportunidade.usuario.nome,
          usuario_email: oportunidade.usuario.email,
          board_atual: oportunidade.board?.titulo || "",
          status_atual: oportunidade.status || "",
          valor_estimado: parseDecimal(oportunidade.valor_estimado ?? 0),
          faixa_valor: oportunidade.faixa_valor || "",
          num_lojas: oportunidade.num_lojas || 0,
          num_pdvs: oportunidade.num_pdvs || 0,
          infraestrutura: oportunidade.infraestrutura || "",
          controle_lembretes: oportunidade.controle_lembretes ? "Sim" : "Nao",
          desativado: oportunidade.desativado ? "Sim" : "Nao",
          responsaveis: oportunidade.responsaveis
            .map((responsavel) => {
              const flags = [
                responsavel.principal ? "principal" : "",
                responsavel.gerencia_responsaveis ? "gerencia" : "",
                responsavel.pode_editar ? "edita" : "",
                responsavel.pode_interacoes ? "interacoes" : "",
                responsavel.pode_visitas ? "visitas" : "",
              ].filter(Boolean);

              return `${responsavel.usuario.nome}${flags.length ? ` (${flags.join(", ")})` : ""}`;
            })
            .join(" | "),
          interacoes: oportunidade._count.interacoes,
          visitas: oportunidade._count.visitas,
          ultima_interacao: ultimaInteracao?.data || null,
          ultimo_tipo_interacao: ultimaInteracao?.tipo || "",
          ultimo_resultado: ultimaInteracao?.status || "",
          ultimo_usuario_interacao: ultimaInteracao?.usuario || "",
          board_na_ultima_interacao: ultimaInteracao?.boardNaData || "",
          criado: oportunidade.criado,
          atualizado: oportunidade.atualizado,
          descricao: oportunidade.descricao || "",
        };
      },
    );

    const interacoesDetalhadasRows = interacoesInRange.map((item) => ({
      id: item.id,
      data: item.data,
      tipo: getTipoInteracao(Number(item.tipo || 0)),
      resultado: getStatusInteracao(
        Number(item.tipo || 0),
        Number(item.status || 0),
      ),
      usuario: item.usuario.nome,
      usuario_email: item.usuario.email,
      oportunidade_id: item.oportunidade_id,
      lead_id: item.oportunidade.lead.id,
      lead: item.oportunidade.lead.nome_lead || "",
      contato_lead: item.oportunidade.lead.contato_nome || "",
      board_na_data: resolverBoardNaData(
        item.oportunidade_id,
        item.data,
        item.oportunidade.board?.titulo || item.oportunidade.status,
      ),
      board_atual:
        item.oportunidade.board?.titulo || item.oportunidade.status || "",
      usuario_oportunidade_id: item.oportunidade.usuario_id,
      conteudo: item.conteudo || "",
    }));

    const filtrosRows = [
      { campo: "Gerado em", valor: formatDate(new Date()) },
      { campo: "Gerado por", valor: auth.nome || `Usuario ${auth.id}` },
      { campo: "Ano base", valor: String(queryYear) },
      {
        campo: "Periodo de criacao",
        valor: `${rangeStartDay.format("DD/MM/YYYY")} ate ${rangeEndDay.format("DD/MM/YYYY")}`,
      },
      {
        campo: "Periodo de ultima interacao",
        valor:
          hasValidInteractionStart || hasValidInteractionEnd
            ? `${hasValidInteractionStart ? dayjs(query.interactionStartDate).format("DD/MM/YYYY") : "-"} ate ${hasValidInteractionEnd ? dayjs(query.interactionEndDate).format("DD/MM/YYYY") : "-"}`
            : "Nao aplicado",
      },
      {
        campo: "Usuario filtrado",
        valor: selectedUserId ? String(selectedUserId) : "Todos os permitidos",
      },
      {
        campo: "Boards filtrados",
        valor: selectedBoardIds.length
          ? selectedBoardIds
              .map((boardId) => boardsMap.get(boardId) || `Board ${boardId}`)
              .join(", ")
          : "Todos os boards permitidos",
      },
      {
        campo: "Escopo",
        valor: isGrantAdmin
          ? "Grant Admin"
          : isAdmin
            ? "Admin da empresa"
            : "Usuario logado",
      },
    ];

    const resumoRows = [
      { indicador: "Usuarios considerados", valor: usuariosRows.length },
      { indicador: "Leads no periodo", valor: totalLeads },
      { indicador: "Leads que geraram oportunidade", valor: leadsConvertidos },
      {
        indicador: "Leads sem oportunidade",
        valor: totalLeads - leadsConvertidos,
      },
      { indicador: "Oportunidades no periodo", valor: totalOportunidades },
      { indicador: "Interacoes no periodo", valor: totalInteracoes },
      { indicador: "Pipeline no periodo", valor: totalPipeline },
      { indicador: "Ticket medio", valor: ticketMedio },
      { indicador: "Media de leads por dia", valor: averageLeadsPerDay },
      {
        indicador: "Media de oportunidades por dia",
        valor: averageOportunidadesPerDay,
      },
      { indicador: "Conversao real de leads", valor: conversionRate },
      {
        indicador: "Oportunidades com interacao",
        valor: oportunidadesComInteracao,
      },
      {
        indicador: "Cobertura de oportunidades",
        valor: coberturaOportunidades,
      },
      { indicador: "Variacao leads vs periodo anterior", valor: leadsChange },
      {
        indicador: "Variacao oportunidades vs periodo anterior",
        valor: oportunidadesChange,
      },
      {
        indicador: "Variacao pipeline vs periodo anterior",
        valor: pipelineChange,
      },
      {
        indicador: "Variacao conversao vs periodo anterior",
        valor: conversionChange,
      },
      { indicador: "Leads periodo anterior", valor: previousLeadsTotal },
      {
        indicador: "Leads convertidos periodo anterior",
        valor: previousConvertedLeadsTotal,
      },
      {
        indicador: "Oportunidades periodo anterior",
        valor: previousOportunidadesTotal,
      },
      {
        indicador: "Pipeline periodo anterior",
        valor: previousPipelineValue,
      },
    ];

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.default.Workbook();
    workbook.creator = "TRAE";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.company = "N3TWORK";
    workbook.subject = "Exportacao do dashboard CRM";
    workbook.title = "Dashboard CRM";

    // Geracao consolidada: somente as seis abas finais do relatorio.
    const interactionPeriodStart = hasValidInteractionStart
      ? dayjs(query.interactionStartDate).startOf("day")
      : rangeStartDay;
    const interactionPeriodEnd = hasValidInteractionEnd
      ? dayjs(query.interactionEndDate).endOf("day")
      : rangeEndDay;
    const interactionIsInPeriod = (date: Date) => {
      const value = dayjs(date);
      return (
        !value.isBefore(interactionPeriodStart) &&
        !value.isAfter(interactionPeriodEnd)
      );
    };
    const getBoardForCard = (
      oportunidade: (typeof boardCardsForReport)[number],
    ) =>
      oportunidade.board ||
      boardsForReport.find((board) => board.id === firstBoardIdForReport) ||
      null;
    const getResponsibleUsers = (
      oportunidade: (typeof boardCardsForReport)[number],
    ) =>
      oportunidade.responsaveis.length
        ? oportunidade.responsaveis.map((item) => item.usuario)
        : [oportunidade.usuario];
    const getResponsibleNames = (
      oportunidade: (typeof boardCardsForReport)[number],
    ) =>
      getResponsibleUsers(oportunidade)
        .map((usuario) => usuario.nome)
        .filter(Boolean)
        .join(", ");

    const cardsReportRows = boardCardsForReport
      .map((oportunidade) => {
        const board = getBoardForCard(oportunidade);
        const periodInteractions = oportunidade.interacoes.filter(
          (interaction) => interactionIsInPeriod(interaction.data),
        );
        const lastInteraction = oportunidade.interacoes.at(-1) || null;
        const referenceDate = lastInteraction?.data || oportunidade.atualizado;
        return {
          board: safeExcelText(board?.titulo || "Sem prancheta"),
          oportunidade_id: oportunidade.id,
          lead: safeExcelText(oportunidade.lead.nome_lead || "Lead sem nome"),
          contato: safeExcelText(
            oportunidade.lead.contato_nome || oportunidade.lead.contato || "",
          ),
          responsaveis: safeExcelText(getResponsibleNames(oportunidade)),
          status: safeExcelText(
            oportunidade.status || `Status ${oportunidade.statusInt || ""}`,
          ),
          valor: parseDecimal(oportunidade.valor_estimado),
          criado: oportunidade.criado,
          atualizado: oportunidade.atualizado,
          interacoes_periodo: periodInteractions.length,
          interacoes_historico: oportunidade.interacoes.length,
          ultima_interacao: lastInteraction?.data || null,
          dias_sem_interacao: Math.max(
            0,
            dayjs().diff(dayjs(referenceDate), "day"),
          ),
          ultimo_responsavel: safeExcelText(
            lastInteraction?.usuario.nome || "",
          ),
          descricao: safeExcelText(toPlainText(oportunidade.descricao)),
        };
      })
      .sort(
        (a, b) =>
          a.board.localeCompare(b.board) || a.lead.localeCompare(b.lead),
      );

    const interactionReportRows = boardCardsForReport
      .flatMap((oportunidade) => {
        const board = getBoardForCard(oportunidade);
        const responsibleNames = getResponsibleNames(oportunidade);
        return oportunidade.interacoes.map((interaction, index) => ({
          board_id: board?.id || "",
          board: safeExcelText(board?.titulo || "Sem prancheta"),
          oportunidade_id: oportunidade.id,
          lead: safeExcelText(oportunidade.lead.nome_lead || "Lead sem nome"),
          contato: safeExcelText(
            oportunidade.lead.contato_nome || oportunidade.lead.contato || "",
          ),
          responsaveis: safeExcelText(responsibleNames),
          sequencia: index + 1,
          data: interaction.data,
          no_periodo: interactionIsInPeriod(interaction.data) ? "Sim" : "Nao",
          tipo: getTipoInteracao(Number(interaction.tipo || 0)),
          resultado: getStatusInteracao(
            Number(interaction.tipo || 0),
            Number(interaction.status || 0),
          ),
          usuario: safeExcelText(interaction.usuario.nome),
          conteudo: safeExcelText(toPlainText(interaction.conteudo)),
          anexos: safeExcelText(
            interaction.anexos
              .map((attachment) =>
                [attachment.nome, attachment.url].filter(Boolean).join(" - "),
              )
              .join("\n"),
          ),
        }));
      })
      .sort((a, b) => b.data.getTime() - a.data.getTime());

    type TeamPerformance = {
      id: number;
      nome: string;
      email: string;
      cardsAssigned: Set<number>;
      cardsTouched: Set<number>;
      interactions: number;
      messages: number;
      emails: number;
      calls: number;
      lastInteraction: Date | null;
    };
    const teamPerformance = new Map<number, TeamPerformance>();
    const ensureTeamMember = (usuario: {
      id: number;
      nome: string;
      email?: string | null;
    }) => {
      if (!teamPerformance.has(usuario.id)) {
        teamPerformance.set(usuario.id, {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email || "",
          cardsAssigned: new Set<number>(),
          cardsTouched: new Set<number>(),
          interactions: 0,
          messages: 0,
          emails: 0,
          calls: 0,
          lastInteraction: null,
        });
      }
      return teamPerformance.get(usuario.id)!;
    };

    boardCardsForReport.forEach((oportunidade) => {
      getResponsibleUsers(oportunidade).forEach((usuario) => {
        ensureTeamMember(usuario).cardsAssigned.add(oportunidade.id);
      });
      oportunidade.interacoes
        .filter((interaction) => interactionIsInPeriod(interaction.data))
        .forEach((interaction) => {
          const metric = ensureTeamMember(interaction.usuario);
          metric.cardsTouched.add(oportunidade.id);
          metric.interactions += 1;
          if (interaction.tipo === 1) metric.messages += 1;
          if (interaction.tipo === 2) metric.emails += 1;
          if (interaction.tipo === 3) metric.calls += 1;
          if (
            !metric.lastInteraction ||
            interaction.data > metric.lastInteraction
          ) {
            metric.lastInteraction = interaction.data;
          }
        });
    });

    const teamReportRows = Array.from(teamPerformance.values())
      .map((metric) => ({
        usuario: safeExcelText(metric.nome),
        email: safeExcelText(metric.email),
        oportunidades_responsavel: metric.cardsAssigned.size,
        oportunidades_interagidas: metric.cardsTouched.size,
        cobertura:
          metric.cardsAssigned.size > 0
            ? metric.cardsTouched.size / metric.cardsAssigned.size
            : 0,
        interacoes: metric.interactions,
        media_por_oportunidade:
          metric.cardsTouched.size > 0
            ? metric.interactions / metric.cardsTouched.size
            : 0,
        mensagens: metric.messages,
        emails: metric.emails,
        ligacoes: metric.calls,
        ultima_interacao: metric.lastInteraction,
      }))
      .sort(
        (a, b) =>
          b.interacoes - a.interacoes || a.usuario.localeCompare(b.usuario),
      );

    const boardReportRows = boardsForReport.map((board) => {
      const cards = boardCardsForReport.filter(
        (oportunidade) => getBoardForCard(oportunidade)?.id === board.id,
      );
      const periodInteractions = cards.flatMap((oportunidade) =>
        oportunidade.interacoes.filter((interaction) =>
          interactionIsInPeriod(interaction.data),
        ),
      );
      const touchedCards = cards.filter((oportunidade) =>
        oportunidade.interacoes.some((interaction) =>
          interactionIsInPeriod(interaction.data),
        ),
      );
      const historicalInteractions = cards.flatMap(
        (oportunidade) => oportunidade.interacoes,
      );
      const lastInteraction = historicalInteractions.reduce<Date | null>(
        (last, interaction) =>
          !last || interaction.data > last ? interaction.data : last,
        null,
      );
      return {
        board: safeExcelText(board.titulo),
        oportunidades: cards.length,
        com_interacao_periodo: touchedCards.length,
        sem_interacao_periodo: cards.length - touchedCards.length,
        cobertura: cards.length > 0 ? touchedCards.length / cards.length : 0,
        interacoes_periodo: periodInteractions.length,
        media_por_oportunidade:
          cards.length > 0 ? periodInteractions.length / cards.length : 0,
        interacoes_historico: historicalInteractions.length,
        ultima_interacao: lastInteraction,
        pipeline: cards.reduce(
          (total, oportunidade) =>
            total + parseDecimal(oportunidade.valor_estimado),
          0,
        ),
      };
    });

    const periodTotalInteractions = teamReportRows.reduce(
      (total, row) => total + row.interacoes,
      0,
    );
    const touchedCardsInPeriod = boardCardsForReport.filter((oportunidade) =>
      oportunidade.interacoes.some((interaction) =>
        interactionIsInPeriod(interaction.data),
      ),
    ).length;
    type BoardPassageGroup = {
      boardId: number;
      oportunidadeId: number;
      passages: Array<(typeof boardPassagesInPeriod)[number]>;
    };
    const uniqueBoardPassages = new Map<string, BoardPassageGroup>();
    boardPassagesInPeriod.forEach((passage) => {
      // Assim como na tela, registros sem board_id pertencem a primeira board.
      const passageBoardId = passage.board_id || firstBoardIdForReport;
      if (!passageBoardId || !boardIdsForReport.includes(passageBoardId))
        return;
      const key = `${passageBoardId}:${passage.oportunidade.id}`;
      const group = uniqueBoardPassages.get(key) || {
        boardId: passageBoardId,
        oportunidadeId: passage.oportunidade.id,
        passages: [],
      };
      group.passages.push(passage);
      uniqueBoardPassages.set(key, group);
    });

    const boardFlowDetailRows = Array.from(uniqueBoardPassages.values())
      .map((group) => {
        const passages = [...group.passages].sort(
          (a, b) => a.criado.getTime() - b.criado.getTime(),
        );
        const firstPassage = passages[0];
        const lastPassage = passages.at(-1)!;
        const oportunidade = firstPassage.oportunidade;
        const currentBoardId = oportunidade.board_id || firstBoardIdForReport;
        const currentBoardTitle =
          oportunidade.board?.titulo ||
          boardsForReport.find((board) => board.id === currentBoardId)
            ?.titulo ||
          "Sem prancheta";
        const responsibleUsers = oportunidade.responsaveis.length
          ? oportunidade.responsaveis.map((item) => item.usuario)
          : [oportunidade.usuario];
        const registeredReasons = [
          ...new Set(
            passages
              .map((passage) => passage.motivo?.trim())
              .filter((reason): reason is string => !!reason),
          ),
        ];
        const reasonNotes = passages
          .map((passage) => passage.motivo_observacao?.trim())
          .filter((note): note is string => !!note);
        const movementUsers = [
          ...new Set(passages.map((passage) => passage.usuario.nome)),
        ];
        return {
          board_id: group.boardId,
          board: safeExcelText(
            boardsForReport.find((board) => board.id === group.boardId)
              ?.titulo || `Board ${group.boardId}`,
          ),
          oportunidade_id: oportunidade.id,
          lead: safeExcelText(oportunidade.lead.nome_lead || "Lead sem nome"),
          contato: safeExcelText(
            oportunidade.lead.contato_nome || oportunidade.lead.contato || "",
          ),
          responsaveis: safeExcelText(
            responsibleUsers.map((usuario) => usuario.nome).join(", "),
          ),
          primeira_passagem: firstPassage.criado,
          ultima_passagem: lastPassage.criado,
          registros_movimentacao: passages.length,
          usuario_movimentacao: safeExcelText(movementUsers.join(", ")),
          acao_entrada: safeExcelText(firstPassage.acao),
          motivo: safeExcelText(registeredReasons.join(" | ")),
          observacao_motivo: safeExcelText(reasonNotes.join(" | ")),
          board_atual: safeExcelText(currentBoardTitle),
          permanece_board: currentBoardId === group.boardId ? "Sim" : "Nao",
          seguiu_para_outra: currentBoardId !== group.boardId ? "Sim" : "Nao",
          status_atual: safeExcelText(
            oportunidade.status || `Status ${oportunidade.statusInt || ""}`,
          ),
          valor: parseDecimal(oportunidade.valor_estimado),
          desativada: oportunidade.desativado ? "Sim" : "Nao",
        };
      })
      .sort(
        (a, b) =>
          a.board.localeCompare(b.board) ||
          a.primeira_passagem.getTime() - b.primeira_passagem.getTime(),
      );

    const configuredReasonsText = (board: (typeof boardsForReport)[number]) => {
      if (Array.isArray(board.motivos)) {
        return safeExcelText(
          board.motivos.map((reason) => String(reason)).join(" | "),
        );
      }
      if (typeof board.motivos === "string") {
        return safeExcelText(board.motivos);
      }
      return "";
    };
    const boardConfiguration = new Map(
      boardsForReport.map((board) => [
        board.id,
        {
          exige_motivo: board.exige_motivo ? "Sim" : "Nao",
          grupo_motivos: safeExcelText(board.grupo_motivos || ""),
          motivos_configurados: configuredReasonsText(board),
          exige_observacao_outro: board.exigir_obs_outro ? "Sim" : "Nao",
        },
      ]),
    );
    const consolidatedBoardRows = boardReportRows.map((row, index) => ({
      ...row,
      ...(boardConfiguration.get(boardsForReport[index]?.id) || {
        exige_motivo: "Nao",
        grupo_motivos: "",
        motivos_configurados: "",
        exige_observacao_outro: "Nao",
      }),
    }));
    const consolidatedOpportunityRows = cardsReportRows.map((row) => {
      const passages = boardFlowDetailRows.filter(
        (passage) => passage.oportunidade_id === row.oportunidade_id,
      );
      return {
        ...row,
        pranchetas_visitadas_periodo: safeExcelText(
          [...new Set(passages.map((passage) => passage.board))].join(" | "),
        ),
        motivos_movimentacao_periodo: safeExcelText(
          [
            ...new Set(
              passages
                .flatMap((passage) => String(passage.motivo || "").split(" | "))
                .map((reason) => reason.trim())
                .filter(Boolean),
            ),
          ].join(" | "),
        ),
      };
    });
    const consolidatedFlowDataRows = boardFlowDetailRows.map((row) => ({
      ...row,
      ...(boardConfiguration.get(row.board_id) || {
        exige_motivo: "Nao",
        grupo_motivos: "",
        motivos_configurados: "",
        exige_observacao_outro: "Nao",
      }),
    }));
    const boardsWithoutFlowRows = boardsForReport
      .filter(
        (board) =>
          !consolidatedFlowDataRows.some((row) => row.board_id === board.id),
      )
      .map((board) => ({
        board_id: board.id,
        board: safeExcelText(board.titulo),
        oportunidade_id: "",
        lead: "Sem movimentacoes no periodo selecionado",
        contato: "",
        responsaveis: "",
        primeira_passagem: null,
        ultima_passagem: null,
        registros_movimentacao: 0,
        usuario_movimentacao: "",
        motivo: "",
        observacao_motivo: "",
        ...(boardConfiguration.get(board.id) || {
          exige_motivo: "Nao",
          grupo_motivos: "",
          motivos_configurados: "",
          exige_observacao_outro: "Nao",
        }),
        board_atual: "",
        permanece_board: "",
        seguiu_para_outra: "",
        status_atual: "Sem movimentacoes no periodo",
        valor: 0,
        desativada: "",
      }));
    const consolidatedFlowRows = [
      ...consolidatedFlowDataRows,
      ...boardsWithoutFlowRows,
    ];
    const uniqueFlowOpportunities = new Set(
      boardFlowDetailRows.map((row) => row.oportunidade_id),
    ).size;
    const recordedReasonsCount = boardPassagesInPeriod.filter(
      (passage) => !!passage.motivo?.trim(),
    ).length;

    const finalSummaryRows = [
      {
        indicador: "Periodo analisado",
        valor: `${rangeStartDay.format("DD/MM/YYYY")} a ${rangeEndDay.format("DD/MM/YYYY")}`,
      },
      { indicador: "Pranchetas analisadas", valor: boardsForReport.length },
      { indicador: "Oportunidades atuais", valor: boardCardsForReport.length },
      {
        indicador: "Oportunidades interagidas no periodo",
        valor: touchedCardsInPeriod,
      },
      {
        indicador: "Cobertura de interacoes no periodo",
        valor:
          boardCardsForReport.length > 0
            ? touchedCardsInPeriod / boardCardsForReport.length
            : 0,
      },
      { indicador: "Interacoes no periodo", valor: periodTotalInteractions },
      {
        indicador: "Interacoes historicas nos cards atuais",
        valor: interactionReportRows.length,
      },
      {
        indicador: "Membros com atividade no periodo",
        valor: teamReportRows.filter((row) => row.interacoes > 0).length,
      },
      {
        indicador: "Oportunidades que passaram por boards no periodo",
        valor: uniqueFlowOpportunities,
      },
      {
        indicador: "Passagens unicas por oportunidade e board",
        valor: boardFlowDetailRows.length,
      },
      {
        indicador: "Movimentacoes registradas no periodo",
        valor: boardPassagesInPeriod.length,
      },
      {
        indicador: "Movimentacoes com motivo informado",
        valor: recordedReasonsCount,
      },
    ];
    addDashboardFinalSheets({
      workbook,
      summaryRows: finalSummaryRows,
      teamRows: teamReportRows,
      boardRows: consolidatedBoardRows,
      opportunityRows: consolidatedOpportunityRows,
      interactionRows: interactionReportRows,
      flowRows: consolidatedFlowRows,
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `dashboard_crm_${rangeStartDay.format("YYYY-MM-DD")}_${rangeEndDay.format("YYYY-MM-DD")}.xlsx`;

    return { buffer, filename };
  } catch (err: any) {
    console.error(err);
    throw new Error(err?.message || "Ocorreu um erro ao exportar o dashboard");
  }
}

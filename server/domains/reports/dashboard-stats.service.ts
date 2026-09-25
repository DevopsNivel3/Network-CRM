import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import dayjs from "dayjs";
import { createDashboardStatsContext } from "./dashboard-stats.context";
import { buildDashboardTimeSeries } from "./dashboard-metrics";
import { getDashboardLeadMetrics } from "./dashboard-lead-metrics";
import type { DashboardStatsQuery } from "./dashboard-stats.schema";
import type { ReportAuth } from "./report.types";
import {
  getStatusInteracao,
  getTipoInteracao,
  parseDecimal,
} from "./dashboard-workbook.utils";

// Rota para buscar os dados do gráfico
export async function getDashboardStats(
  query: DashboardStatsQuery,
  auth: ReportAuth,
) {
  try {
    const {
      where,
      queryDate,
      dashboardOpportunityFilters,
      isGrantAdmin,
      isAdmin,
      hasValidInteractionStart,
      hasValidInteractionEnd,
      startOfYear,
      endOfYear,
      rangeStart,
      rangeEnd,
    } = createDashboardStatsContext(query, auth);

    const leadMetrics = await getDashboardLeadMetrics({
      where,
      queryDate,
      startOfYear,
      endOfYear,
      rangeStart,
      rangeEnd,
      groupMonthsByCompany:
        query.userId === "all" &&
        hasUserPermission(auth.permissoes, UserPermissions.ADMIN),
    });
    const leadsInRange = await prisma.lead.findMany({
      where: {
        ...where,
        criado: {
          gte: new Date(rangeStart.startOf("day").toISOString()),
          lt: new Date(rangeEnd.endOf("day").toISOString()),
        },
      },
      select: {
        criado: true,
      },
    });

    const oportunidadesWhereParts: Prisma.OportunidadeWhereInput[] = [];
    if (!isGrantAdmin) {
      oportunidadesWhereParts.push({
        lead: { empresa_id: auth.empresa_id! },
      });
    }
    if (!isAdmin && !isGrantAdmin) {
      oportunidadesWhereParts.push({ usuario_id: auth.id });
    }
    if (query.userId !== "all" && !isNaN(Number(query.userId))) {
      if (isGrantAdmin || isAdmin) {
        oportunidadesWhereParts.push({ usuario_id: Number(query.userId) });
      }
    }
    oportunidadesWhereParts.push(...dashboardOpportunityFilters);
    const oportunidadesWhere: Prisma.OportunidadeWhereInput =
      oportunidadesWhereParts.length ? { AND: oportunidadesWhereParts } : {};

    const oportunidadesInRange = await prisma.oportunidade.findMany({
      where: {
        ...oportunidadesWhere,
        criado: {
          gte: new Date(rangeStart.startOf("day").toISOString()),
          lt: new Date(rangeEnd.endOf("day").toISOString()),
        },
      },
      select: {
        id: true,
        criado: true,
        valor_estimado: true,
        board: {
          select: {
            titulo: true,
          },
        },
      },
    });

    const interacoesWhere: Prisma.OportunidadeInteracoesWhereInput = {
      oportunidade: {
        ...oportunidadesWhere,
        desativado: false,
      },
      data: {
        gte: new Date(rangeStart.startOf("day").toISOString()),
        lt: new Date(rangeEnd.endOf("day").toISOString()),
      },
    };
    const interactionPerPage = Math.min(
      Math.max(Number(query.interactionPerPage), 10),
      100,
    );
    const interactionPage = Math.max(Number(query.interactionPage), 1);

    const interacoesInRange = await prisma.oportunidadeInteracoes.findMany({
      where: interacoesWhere,
      select: {
        tipo: true,
        status: true,
        data: true,
        oportunidade_id: true,
      },
    });

    const totalInteractionPages = Math.max(
      Math.ceil(interacoesInRange.length / interactionPerPage),
      1,
    );
    const currentInteractionPage = Math.min(
      interactionPage,
      totalInteractionPages,
    );
    const interacoesPaginadas = await prisma.oportunidadeInteracoes.findMany({
      where: interacoesWhere,
      skip: (currentInteractionPage - 1) * interactionPerPage,
      take: interactionPerPage,
      select: {
        id: true,
        tipo: true,
        data: true,
        oportunidade_id: true,
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
        oportunidade: {
          select: {
            status: true,
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
              },
            },
          },
        },
      },
      orderBy: [{ data: "desc" }, { id: "desc" }],
    });

    const oportunidadeIdsComInteracoes = [
      ...new Set(interacoesPaginadas.map((item) => item.oportunidade_id)),
    ];

    // O conteudo e LONGTEXT e pode conter HTML/base64 com varios megabytes.
    // O dashboard exibe apenas uma previa; limite a leitura no proprio MySQL
    // para nao transportar blobs inteiros em cada abertura da tela.
    const interactionIds = interacoesPaginadas.map((item) => item.id);
    const interactionPreviews = interactionIds.length
      ? await prisma.$queryRaw<Array<{ id: number; conteudo: string | null }>>(
          Prisma.sql`
            SELECT id, LEFT(conteudo, 1000) AS conteudo
            FROM oportunidade_interacoes
            WHERE id IN (${Prisma.join(interactionIds)})
          `,
        )
      : [];
    const interactionPreviewMap = new Map(
      interactionPreviews.map((item) => [item.id, item.conteudo]),
    );

    const historicosInteracoes = oportunidadeIdsComInteracoes.length
      ? await prisma.oportunidadeHistorico.findMany({
          where: {
            oportunidade_id: {
              in: oportunidadeIdsComInteracoes,
            },
            criado: {
              lte: new Date(rangeEnd.endOf("day").toISOString()),
            },
          },
          select: {
            oportunidade_id: true,
            board_id: true,
            criado: true,
          },
          orderBy: [{ oportunidade_id: "asc" }, { criado: "asc" }],
        })
      : [];

    const boardIdsHistorico = historicosInteracoes
      .map((item) => item.board_id)
      .filter((item): item is number => typeof item === "number");
    const boardIdsAtuais = interacoesPaginadas
      .map((item) => item.oportunidade.board?.id)
      .filter((item): item is number => typeof item === "number");
    const boardIds = [...new Set([...boardIdsHistorico, ...boardIdsAtuais])];

    const boards = boardIds.length
      ? await prisma.boardOportunidade.findMany({
          where: {
            id: {
              in: boardIds,
            },
          },
          select: {
            id: true,
            titulo: true,
          },
        })
      : [];

    const boardsMap = new Map(boards.map((board) => [board.id, board.titulo]));
    const historicosPorOportunidade = new Map<
      number,
      { board_id: number | null; criado: Date }[]
    >();

    historicosInteracoes.forEach((item) => {
      const current = historicosPorOportunidade.get(item.oportunidade_id) || [];
      current.push({
        board_id: item.board_id,
        criado: item.criado,
      });
      historicosPorOportunidade.set(item.oportunidade_id, current);
    });

    const listaInteracoes = interacoesPaginadas.map((item) => {
      const boardTituloNaData = (() => {
        const historico =
          historicosPorOportunidade.get(item.oportunidade_id) || [];
        let resolvedBoardTitulo: string | null = null;

        for (let index = historico.length - 1; index >= 0; index--) {
          const entry = historico[index];
          if (entry.criado <= item.data) {
            resolvedBoardTitulo =
              (entry.board_id ? boardsMap.get(entry.board_id) : null) || null;
            break;
          }
        }

        if (!resolvedBoardTitulo) {
          resolvedBoardTitulo =
            item.oportunidade.board?.titulo || item.oportunidade.status || null;
        }

        return resolvedBoardTitulo;
      })();

      return {
        id: item.id,
        tipo: getTipoInteracao(Number(item.tipo || 0)),
        data: item.data.toISOString(),
        conteudo: interactionPreviewMap.get(item.id) ?? null,
        oportunidade_id: item.oportunidade_id,
        usuario: {
          nome: item.usuario.nome,
          avatar: item.usuario.avatar,
        },
        lead: {
          nome_lead: item.oportunidade.lead.nome_lead,
          contato_nome: item.oportunidade.lead.contato_nome,
        },
        oportunidade: {
          status: boardTituloNaData,
        },
      };
    });

    const {
      labels,
      startCursor,
      totalDays,
      rangeStartDay,
      rangeEndDay,
      leadsByDay,
      pipelineValueByDay,
      pipelineValueTotal,
      totalLeadsInRange,
      totalOportunidadesInRange,
      averageLeadsPerDay,
      averageOportunidadesPerDay,
      conversionRate,
    } = buildDashboardTimeSeries(
      rangeStart,
      rangeEnd,
      leadsInRange,
      oportunidadesInRange,
    );

    const interacoesPorTipoMap = new Map<string, number>();
    const interacoesPorStatusMap = new Map<string, number>();
    const interacoesPorDiaMap = new Map<string, number>();
    const interacoesPorDiaTipoMap = new Map<string, Map<string, number>>();
    const interacoesDetalhadasPorTipoMap = {
      mensagem: new Map<string, number>(),
      email: new Map<string, number>(),
      telefone: new Map<string, number>(),
    };

    interacoesInRange.forEach((interacao) => {
      const tipoNumero = Number(interacao.tipo || 0);
      const statusNumero = Number(interacao.status || 0);
      const tipo = getTipoInteracao(tipoNumero);
      const status = getStatusInteracao(tipoNumero, statusNumero);
      const dayKey = dayjs(interacao.data).format("YYYY-MM-DD");

      interacoesPorTipoMap.set(tipo, (interacoesPorTipoMap.get(tipo) || 0) + 1);
      interacoesPorStatusMap.set(
        status,
        (interacoesPorStatusMap.get(status) || 0) + 1,
      );
      interacoesPorDiaMap.set(
        dayKey,
        (interacoesPorDiaMap.get(dayKey) || 0) + 1,
      );

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

      if (!interacoesPorDiaTipoMap.has(dayKey)) {
        interacoesPorDiaTipoMap.set(dayKey, new Map<string, number>());
      }
      const dayTipos = interacoesPorDiaTipoMap.get(dayKey)!;
      dayTipos.set(tipo, (dayTipos.get(tipo) || 0) + 1);
    });

    const interacoesByTipo = Array.from(interacoesPorTipoMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const interacoesByStatus = Array.from(interacoesPorStatusMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const interacoesDetalhadasPorTipo = {
      mensagem: Array.from(interacoesDetalhadasPorTipoMap.mensagem.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      email: Array.from(interacoesDetalhadasPorTipoMap.email.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      telefone: Array.from(interacoesDetalhadasPorTipoMap.telefone.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };

    const topInteracoesPorResponsavel =
      await prisma.oportunidadeInteracoes.groupBy({
        by: ["usuario_id"],
        where: {
          oportunidade: {
            ...oportunidadesWhere,
            desativado: false,
          },
          data: {
            gte: new Date(rangeStart.startOf("day").toISOString()),
            lt: new Date(rangeEnd.endOf("day").toISOString()),
          },
        },
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            usuario_id: "desc",
          },
        },
        take: 10,
      });

    const responsavelIds = topInteracoesPorResponsavel.map(
      (item) => item.usuario_id,
    );
    const responsaveis = responsavelIds.length
      ? await prisma.usuario.findMany({
          where: { id: { in: responsavelIds } },
          select: { id: true, nome: true },
        })
      : [];
    const responsavelMap = new Map(
      responsaveis.map((item) => [item.id, item.nome]),
    );

    const interacoesByResponsavel = topInteracoesPorResponsavel.map((item) => ({
      name: responsavelMap.get(item.usuario_id) || "Usuário desconhecido",
      value: item._count._all,
    }));

    const interacoesByDay = {
      categories: labels,
      series: [
        {
          name: "Interações",
          data: labels.map((_, index) => {
            const key = startCursor.add(index, "day").format("YYYY-MM-DD");
            return interacoesPorDiaMap.get(key) || 0;
          }),
        },
      ],
    };

    const interacoesTiposOrdenados = interacoesByTipo.map((item) => item.name);
    const interacoesByTipoOverTime = {
      categories: labels,
      series: interacoesTiposOrdenados.map((tipo) => ({
        name: tipo,
        data: labels.map((_, index) => {
          const key = startCursor.add(index, "day").format("YYYY-MM-DD");
          const dayTipos = interacoesPorDiaTipoMap.get(key);
          return dayTipos?.get(tipo) || 0;
        }),
      })),
    };

    const interacoesOportunidadeIds = new Set(
      interacoesInRange.map((item) => item.oportunidade_id),
    );
    const coberturaPorBoardMap = new Map<
      string,
      { total: number; comInteracao: number }
    >();
    oportunidadesInRange.forEach((oportunidade) => {
      const nomeBoard = oportunidade.board?.titulo || "Sem etapa";
      const current = coberturaPorBoardMap.get(nomeBoard) || {
        total: 0,
        comInteracao: 0,
      };
      current.total += 1;
      if (interacoesOportunidadeIds.has(oportunidade.id))
        current.comInteracao += 1;
      coberturaPorBoardMap.set(nomeBoard, current);
    });

    const coberturaOportunidadesByBoard = Array.from(
      coberturaPorBoardMap.entries(),
    )
      .map(([name, item]) => ({
        name,
        value:
          item.total > 0
            ? Number(((item.comInteracao / item.total) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const oportunidadesComInteracao = oportunidadesInRange.filter((item) =>
      interacoesOportunidadeIds.has(item.id),
    ).length;
    const coberturaOportunidadesPercent =
      totalOportunidadesInRange > 0
        ? Number(
            (
              (oportunidadesComInteracao / totalOportunidadesInRange) *
              100
            ).toFixed(2),
          )
        : 0;

    const previousRangeEnd = rangeStartDay.subtract(1, "day").endOf("day");
    const previousRangeStart = previousRangeEnd
      .subtract(totalDays - 1, "day")
      .startOf("day");

    const previousLeadsTotal = await prisma.lead.count({
      where: {
        ...where,
        criado: {
          gte: new Date(previousRangeStart.toISOString()),
          lt: new Date(previousRangeEnd.toISOString()),
        },
      },
    });

    const previousOportunidadesAgg = await prisma.oportunidade.aggregate({
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
    });

    const previousOportunidadesTotal =
      previousOportunidadesAgg._count._all || 0;
    const previousPipelineValue = parseDecimal(
      previousOportunidadesAgg._sum.valor_estimado ?? 0,
    );
    const previousConversionRate =
      previousLeadsTotal > 0
        ? (previousOportunidadesTotal / previousLeadsTotal) * 100
        : 0;

    const leadsPercentageChange =
      previousLeadsTotal > 0
        ? ((totalLeadsInRange - previousLeadsTotal) / previousLeadsTotal) * 100
        : 0;
    const oportunidadesPercentageChange =
      previousOportunidadesTotal > 0
        ? ((totalOportunidadesInRange - previousOportunidadesTotal) /
            previousOportunidadesTotal) *
          100
        : 0;
    const pipelinePercentageChange =
      previousPipelineValue > 0
        ? ((pipelineValueTotal - previousPipelineValue) /
            previousPipelineValue) *
          100
        : 0;
    const conversionPercentageChange =
      previousConversionRate > 0
        ? ((conversionRate - previousConversionRate) / previousConversionRate) *
          100
        : 0;

    // O dashboard representa o motivo atual de cada card, nao todas as entradas
    // historicas. Assim, ao sair da board o card deixa de ser contabilizado e,
    // ao retornar, apenas a entrada mais recente permanece.
    const motivosHistorico = await prisma.oportunidadeHistorico.findMany({
      where: {
        board_id: { not: null },
        motivo: { not: null },
        criado: {
          gte: new Date(rangeStart.startOf("day").toISOString()),
          lt: new Date(rangeEnd.endOf("day").toISOString()),
        },
        oportunidade: oportunidadesWhere,
      },
      orderBy: [{ criado: "desc" }, { id: "desc" }],
      select: {
        id: true,
        board_id: true,
        motivo: true,
        motivo_observacao: true,
        criado: true,
        oportunidade_id: true,
        oportunidade: {
          select: {
            board_id: true,
            descricao: true,
            lead: { select: { nome_lead: true } },
          },
        },
      },
    });

    const motivosVistos = new Set<string>();
    const motivosVigentes = motivosHistorico.filter((item) => {
      if (item.board_id !== item.oportunidade.board_id) return false;
      const key = `${item.oportunidade_id}:${item.board_id}`;
      if (motivosVistos.has(key)) return false;
      motivosVistos.add(key);
      return true;
    });
    const motivoRangeEnd = new Date(rangeEnd.endOf("day").toISOString());
    const motivosAtuais = motivosVigentes.filter(
      (item) => item.criado < motivoRangeEnd,
    );
    const motivoBoardIds = [
      ...new Set(
        motivosAtuais
          .map((item) => item.board_id)
          .filter((id): id is number => typeof id === "number"),
      ),
    ];
    // Mantem no dashboard as pranchetas configuradas com motivos mesmo quando
    // o periodo ainda nao possui movimentacoes. Antes a secao inteira sumia.
    const motivoBoards = await prisma.boardOportunidade.findMany({
      where: {
        ...(isGrantAdmin ? {} : { empresa_id: auth.empresa_id }),
        ...(query.boardId ? { id: query.boardId } : {}),
        OR: [
          { exige_motivo: true },
          ...(motivoBoardIds.length ? [{ id: { in: motivoBoardIds } }] : []),
        ],
      },
      select: { id: true, titulo: true, grupo_motivos: true },
      orderBy: [{ posicao: "asc" }, { id: "asc" }],
    });
    const motivosMovimentacao = motivoBoards.map((board) => {
      const boardItems = motivosAtuais.filter(
        (item) => item.board_id === board.id && item.motivo,
      );
      const grouped = new Map<string, typeof boardItems>();
      boardItems.forEach((item) => {
        const key = item.motivo!;
        grouped.set(key, [...(grouped.get(key) || []), item]);
      });

      return {
        boardId: board.id,
        boardTitulo: board.titulo,
        grupo: board.grupo_motivos,
        items: [...grouped.entries()]
          .map(([name, entries]) => ({
            name,
            value: entries.length,
            details: entries.map((entry) => ({
              oportunidadeId: entry.oportunidade_id,
              leadNome: entry.oportunidade.lead.nome_lead || "Lead sem nome",
              descricao: entry.oportunidade.descricao,
              observacao: entry.motivo_observacao,
              data: entry.criado,
            })),
          }))
          .sort((a, b) => b.value - a.value),
      };
    });

    return {
      total: leadMetrics.total,
      leadsByState: leadMetrics.leadsByState,
      leadsByDay,
      pipelineValueByDay,
      period: {
        start: rangeStartDay.format("YYYY-MM-DD"),
        end: rangeEndDay.format("YYYY-MM-DD"),
        totalLeads: totalLeadsInRange,
        totalOportunidades: totalOportunidadesInRange,
        pipelineValue: pipelineValueTotal,
        averageLeadsPerDay: Number(averageLeadsPerDay.toFixed(2)),
        averageOportunidadesPerDay: Number(
          averageOportunidadesPerDay.toFixed(2),
        ),
        conversionRate: Number(conversionRate.toFixed(2)),
        totalInteracoes: interacoesInRange.length,
        oportunidadesComInteracao,
        coberturaOportunidadesPercent,
        leadsPercentageChange: leadsPercentageChange.toFixed(2),
        oportunidadesPercentageChange: oportunidadesPercentageChange.toFixed(2),
        pipelinePercentageChange: pipelinePercentageChange.toFixed(2),
        conversionPercentageChange: conversionPercentageChange.toFixed(2),
      },
      interacoes: {
        total: interacoesInRange.length,
        byTipo: interacoesByTipo,
        byStatus: interacoesByStatus,
        detalhamentoPorTipo: interacoesDetalhadasPorTipo,
        byResponsavel: interacoesByResponsavel,
        byDia: interacoesByDay,
        byTipoOverTime: interacoesByTipoOverTime,
        coberturaOportunidadesByBoard,
        lista: listaInteracoes,
        pagination: {
          page: currentInteractionPage,
          perPage: interactionPerPage,
          total: interacoesInRange.length,
          totalPages: totalInteractionPages,
        },
      },
      motivosMovimentacao,
      year: {
        number: query.year.toString(),
        ...leadMetrics.year,
        percentageChange: leadMetrics.year.percentageChange.toFixed(2),
      },
      month: {
        number: queryDate.month() + 1,
        ...leadMetrics.month,
        percentageChange: leadMetrics.month.percentageChange.toFixed(2),
      },
      day: {
        number: queryDate.date(),
        ...leadMetrics.day,
        percentageChange: leadMetrics.day.percentageChange.toFixed(2),
      },
    };
  } catch (err: any) {
    console.error(err);
    throw new Error(err?.message || "Ocorreu um erro ao buscar o gráfico");
  }
}

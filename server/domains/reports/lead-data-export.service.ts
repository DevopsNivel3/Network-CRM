import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const fieldMapping: Record<string, string> = {
  id: "ID",
  nome_lead: "LEAD_NOME",
  cpf_cnpj: "CPF/CNPJ",
  responsavel: "RESPONSAVEL",
  contato_nome: "CONTATO_NOME",
  contato: "CONTATO_TELEFONE",
  atividade: "ATIVIDADE",
  faturamento: "FATURAMENTO",
  num_funcionarios: "NUM_FUNCIONARIOS",
  observacoes: "OBSERVACOES",
  usuario_id: "USUARIO_ID",
  usuario_nome: "USUARIO_NOME",
  criado: "CRIADO",
  atualizado: "ATUALIZADO",
  // Oportunidades
  oportunidade_id: "OPORTUNIDADE_ID",
  valor_estimado: "VALOR_ESTIMADO",
  faixa_valor: "FAIXA_VALOR",
  descricao: "DESCRICAO",
  board_id: "BOARD_ID",
  board_nome: "BOARD_NOME",
  // Localizações
  localizacao_id: "LOCALIZACAO_ID",
  rua: "RUA",
  numero: "NUMERO",
  cidade: "CIDADE",
  complemento: "COMPLEMENTO",
  estado: "ESTADO",
  cep: "CEP",
};

export interface LeadDataExportAuth {
  id: number;
  permissoes: number;
  empresa_id: number | null;
}

export interface LeadDataExportResult {
  body: unknown;
  contentType?: string;
  filename?: string;
}

export async function generateLeadDataExport(
  query: import("./lead-data-export.schema").LeadDataExportInput,
  auth: LeadDataExportAuth,
): Promise<LeadDataExportResult> {
  if (
    (query as any)?.options?.oportunidades_interacoes &&
    !(query as any).options.interacoes
  ) {
    (query as any).options.interacoes = (
      query as any
    ).options.oportunidades_interacoes;
  }
  const where: Prisma.LeadWhereInput = {};

  const isGrantAdmin = hasUserPermission(
    auth.permissoes,
    UserPermissions.GRANT_ADMIN,
  );
  const isAdmin = hasUserPermission(auth.permissoes, UserPermissions.ADMIN);

  if (!isGrantAdmin) {
    if (auth.empresa_id === null) {
      throw new Error("Usuário sem empresa vinculada");
    }
    where.empresa_id = auth.empresa_id;
  }

  if (!isAdmin && !isGrantAdmin) {
    where.usuario_id = auth.id;
  }

  if (query.userId !== "all" && !isNaN(Number(query.userId))) {
    if (isGrantAdmin || isAdmin) {
      where.usuario_id = Number(query.userId);
    }
  }

  if (query.city !== "all") {
    where.localizacoes = {
      some: {
        cidade: { equals: query.city },
      },
    };
  }

  if (query.state !== "all") {
    where.localizacoes = {
      some: {
        ...(where.localizacoes?.some && where.localizacoes.some),
        estado: { equals: query.state },
      },
    };
  }

  if (query.dateBetween && query.dateBetween.length === 2) {
    const start = new Date(query.dateBetween[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date(query.dateBetween[1]);
    end.setHours(23, 59, 59, 999);
    const range = { gte: start, lte: end };

    if ((query as any).dateEntity === "oportunidade") {
      where.oportunidades = {
        some: {
          ...((where.oportunidades as any)?.some || {}),
          [query.dateField || "criado"]: range,
        },
      } as any;
    } else if ((query as any).dateEntity === "interacao") {
      where.oportunidades = {
        some: {
          ...((where.oportunidades as any)?.some || {}),
          interacoes: {
            some: {
              data: range,
            },
          },
        },
      } as any;
    } else {
      const field = query.dateField || "criado";
      (where as any)[field] = range;
    }
  }

  const leadSelect: any = {};
  if (query.options.leads.includes("ID")) leadSelect.id = true;
  if (query.options.leads.includes("LEAD_NOME")) leadSelect.nome_lead = true;
  if (query.options.leads.includes("CPF/CNPJ")) leadSelect.cpf_cnpj = true;
  if (query.options.leads.includes("RESPONSAVEL"))
    leadSelect.responsavel = true;
  if (query.options.leads.includes("CONTATO_NOME"))
    leadSelect.contato_nome = true;
  if (query.options.leads.includes("CONTATO_TELEFONE"))
    leadSelect.contato = true;
  if (query.options.leads.includes("ATIVIDADE")) leadSelect.atividade = true;
  if (query.options.leads.includes("FATURAMENTO"))
    leadSelect.faturamento = true;
  if (query.options.leads.includes("NUM_FUNCIONARIOS"))
    leadSelect.num_funcionarios = true;
  if (query.options.leads.includes("OBSERVACOES"))
    leadSelect.observacoes = true;
  if (query.options.leads.includes("USUARIO_ID")) leadSelect.usuario_id = true;
  if (query.options.leads.includes("USUARIO_NOME")) {
    leadSelect.usuario = {
      select: { nome: true },
    };
  }
  if (query.options.leads.includes("CRIADO")) leadSelect.criado = true;
  if (query.options.leads.includes("ATUALIZADO")) leadSelect.atualizado = true;

  if (
    query.options.oportunidades.length > 0 ||
    (query.options as any).interacoes?.length > 0
  ) {
    const oportunidadeSelect: any = {};
    if (query.options.oportunidades.includes("ID"))
      oportunidadeSelect.id = true;
    if (query.options.oportunidades.includes("VALOR_ESTIMADO"))
      oportunidadeSelect.valor_estimado = true;
    if (query.options.oportunidades.includes("FAIXA_VALOR"))
      oportunidadeSelect.faixa_valor = true;
    if (query.options.oportunidades.includes("DESCRICAO"))
      oportunidadeSelect.descricao = true;
    if (query.options.oportunidades.includes("BOARD_ID"))
      oportunidadeSelect.board_id = true;
    if (query.options.oportunidades.includes("BOARD_NOME")) {
      oportunidadeSelect.board = {
        select: { titulo: true },
      };
    }
    if (query.options.oportunidades.includes("USUARIO_ID"))
      oportunidadeSelect.usuario_id = true;
    if (query.options.oportunidades.includes("USUARIO_NOME")) {
      oportunidadeSelect.usuario = {
        select: { nome: true },
      };
    }
    if (query.options.oportunidades.includes("CRIADO"))
      oportunidadeSelect.criado = true;
    if (query.options.oportunidades.includes("ATUALIZADO"))
      oportunidadeSelect.atualizado = true;

    if ((query.options as any).interacoes?.length > 0) {
      const interacaoSelect: any = {};
      const intOpts = (query.options as any).interacoes as string[];
      if (intOpts.includes("ID")) interacaoSelect.id = true;
      if (intOpts.includes("USUARIO_ID")) interacaoSelect.usuario_id = true;
      if (intOpts.includes("USUARIO_NOME")) {
        interacaoSelect.usuario = { select: { nome: true } };
      }
      if (intOpts.includes("STATUS")) interacaoSelect.status = true;
      if (intOpts.includes("TIPO")) interacaoSelect.tipo = true;
      if (intOpts.includes("CONTEUDO")) interacaoSelect.conteudo = true;
      if (intOpts.includes("DATA")) interacaoSelect.data = true;
      oportunidadeSelect.interacoes = { select: interacaoSelect };
    }

    leadSelect.oportunidades = {
      select: oportunidadeSelect,
    };
  }

  if (query.options.localizacoes.length > 0) {
    const localizacaoSelect: any = {};
    if (query.options.localizacoes.includes("ID")) localizacaoSelect.id = true;
    if (query.options.localizacoes.includes("RUA"))
      localizacaoSelect.rua = true;
    if (query.options.localizacoes.includes("NUMERO"))
      localizacaoSelect.numero = true;
    if (query.options.localizacoes.includes("CIDADE"))
      localizacaoSelect.cidade = true;
    if (query.options.localizacoes.includes("COMPLEMENTO"))
      localizacaoSelect.complemento = true;
    if (query.options.localizacoes.includes("ESTADO"))
      localizacaoSelect.estado = true;
    if (query.options.localizacoes.includes("CEP"))
      localizacaoSelect.cep = true;
    if (query.options.localizacoes.includes("CRIADO"))
      localizacaoSelect.criado = true;
    if (query.options.localizacoes.includes("ATUALIZADO"))
      localizacaoSelect.atualizado = true;

    leadSelect.localizacoes = {
      select: localizacaoSelect,
    };
  }

  const data = await prisma.lead.findMany({
    where,
    select: leadSelect,
  });

  const filename = `leads_export_${new Date().toISOString().split("T")[0]}`;
  if (query.export_type === "json") {
    const mappedData = data.map((lead) => {
      const mappedLead: any = {};

      Object.keys(lead).forEach((key) => {
        if (key === "usuario" && (lead as any).usuario)
          mappedLead[fieldMapping["usuario_nome"]] = (lead as any).usuario.nome;
        else if (
          key === "oportunidades" &&
          Array.isArray((lead as any).oportunidades)
        ) {
          mappedLead["OPORTUNIDADES"] = (lead as any).oportunidades.map(
            (opp: any) => {
              const mappedOpp: any = {};
              Object.keys(opp).forEach((oppKey) => {
                if (oppKey === "usuario" && opp.usuario)
                  mappedOpp[fieldMapping["usuario_nome"]] = opp.usuario.nome;
                else if (oppKey === "board" && opp.board)
                  mappedOpp[fieldMapping["board_nome"]] = opp.board.titulo;
                else if (oppKey !== "interacoes") {
                  const mappedOppKey =
                    fieldMapping[oppKey] || oppKey.toUpperCase();
                  mappedOpp[mappedOppKey] = opp[oppKey];
                }
              });

              if (
                (query.options as any).interacoes?.length > 0 &&
                Array.isArray(opp.interacoes)
              ) {
                mappedOpp["INTERACOES"] = opp.interacoes.map((int: any) => {
                  const mappedInt: any = {};
                  Object.keys(int).forEach((intKey) => {
                    if (intKey === "usuario" && int.usuario) {
                      mappedInt[fieldMapping["usuario_nome"]] =
                        int.usuario.nome;
                    } else {
                      let mappedIntKey = intKey.toUpperCase();
                      if (intKey === "id") mappedIntKey = "INTERACAO_ID";
                      if (intKey === "status") mappedIntKey = "STATUS";
                      if (intKey === "tipo") mappedIntKey = "TIPO";
                      if (intKey === "conteudo") mappedIntKey = "CONTEUDO";
                      if (intKey === "data") mappedIntKey = "DATA";
                      mappedInt[mappedIntKey] = int[intKey];
                    }
                  });
                  return mappedInt;
                });
              }

              return mappedOpp;
            },
          );
        } else if (
          key === "localizacoes" &&
          Array.isArray((lead as any).localizacoes) &&
          (query.options.oportunidades.length > 0 ||
            (query.options as any).interacoes?.length > 0)
        ) {
          mappedLead["LOCALIZACOES"] = (lead as any).localizacoes.map(
            (loc: any) => {
              const mappedLoc: any = {};
              Object.keys(loc).forEach((locKey) => {
                const mappedLocKey =
                  fieldMapping[locKey] || locKey.toUpperCase();
                mappedLoc[mappedLocKey] = loc[locKey];
              });
              return mappedLoc;
            },
          );
        } else {
          const mappedKey = fieldMapping[key] || key.toUpperCase();
          mappedLead[mappedKey] = (lead as any)[key];
        }
      });

      return mappedLead;
    });

    return {
      body: JSON.stringify(mappedData, null, 2),
      contentType: "application/json",
      filename: `${filename}.json`,
    };
  }

  if (query.export_type === "csv") {
    const flattenedData = data.map((lead) => {
      const flattened: any = {};

      Object.keys(lead).forEach((key) => {
        if (key === "usuario" && (lead as any).usuario)
          flattened[fieldMapping["usuario_nome"]] = (lead as any).usuario.nome;
        else if (
          key === "oportunidades" &&
          Array.isArray((lead as any).oportunidades) &&
          (query.options.oportunidades.length > 0 ||
            (query.options as any).interacoes?.length > 0)
        ) {
          const maxOpps = Math.max(
            ...data.map((l) => (l as any).oportunidades?.length || 0),
          );

          for (let i = 0; i < maxOpps; i++) {
            const opp = (lead as any).oportunidades[i];
            if (query.options.oportunidades.includes("ID"))
              flattened[`OPORTUNIDADE_${i + 1}_ID`] = opp?.id || "";
            if (query.options.oportunidades.includes("VALOR_ESTIMADO"))
              flattened[`OPORTUNIDADE_${i + 1}_VALOR_ESTIMADO`] =
                opp?.valor_estimado || "";
            if (query.options.oportunidades.includes("FAIXA_VALOR"))
              flattened[`OPORTUNIDADE_${i + 1}_FAIXA_VALOR`] =
                opp?.faixa_valor || "";
            if (query.options.oportunidades.includes("DESCRICAO"))
              flattened[`OPORTUNIDADE_${i + 1}_DESCRICAO`] =
                opp?.descricao || "";
            if (query.options.oportunidades.includes("BOARD_ID"))
              flattened[`OPORTUNIDADE_${i + 1}_BOARD_ID`] = opp?.board_id || "";
            if (query.options.oportunidades.includes("BOARD_NOME"))
              flattened[`OPORTUNIDADE_${i + 1}_BOARD_NOME`] =
                opp?.board?.titulo || "";
            if (query.options.oportunidades.includes("USUARIO_ID"))
              flattened[`OPORTUNIDADE_${i + 1}_USUARIO_ID`] =
                opp?.usuario_id || "";
            if (query.options.oportunidades.includes("USUARIO_NOME"))
              flattened[`OPORTUNIDADE_${i + 1}_USUARIO_NOME`] =
                opp?.usuario?.nome || "";
            if (query.options.oportunidades.includes("CRIADO"))
              flattened[`OPORTUNIDADE_${i + 1}_CRIADO`] = opp?.criado || "";
            if (query.options.oportunidades.includes("ATUALIZADO"))
              flattened[`OPORTUNIDADE_${i + 1}_ATUALIZADO`] =
                opp?.atualizado || "";

            if ((query.options as any).interacoes?.length > 0) {
              const intOpts = (query.options as any).interacoes as string[];
              const maxInts = Math.max(
                ...data.map((l) =>
                  ((l as any).oportunidades || []).reduce(
                    (acc: number, o: any) =>
                      Math.max(acc, o?.interacoes?.length || 0),
                    0,
                  ),
                ),
              );
              for (let j = 0; j < maxInts; j++) {
                const int = opp?.interacoes?.[j];
                if (intOpts.includes("ID"))
                  flattened[`OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_ID`] =
                    int?.id || "";
                if (intOpts.includes("USUARIO_ID"))
                  flattened[
                    `OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_USUARIO_ID`
                  ] = int?.usuario_id || "";
                if (intOpts.includes("USUARIO_NOME"))
                  flattened[
                    `OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_USUARIO_NOME`
                  ] = int?.usuario?.nome || "";
                if (intOpts.includes("STATUS"))
                  flattened[`OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_STATUS`] =
                    int?.status || "";
                if (intOpts.includes("TIPO"))
                  flattened[`OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_TIPO`] =
                    int?.tipo || "";
                if (intOpts.includes("CONTEUDO"))
                  flattened[
                    `OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_CONTEUDO`
                  ] = int?.conteudo || "";
                if (intOpts.includes("DATA"))
                  flattened[`OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_DATA`] =
                    int?.data || "";
              }
            }
          }
        } else if (
          key === "localizacoes" &&
          Array.isArray((lead as any).localizacoes) &&
          query.options.localizacoes.length > 0
        ) {
          const maxLocs = Math.max(
            ...data.map((l) => (l as any).localizacoes?.length || 0),
          );

          for (let i = 0; i < maxLocs; i++) {
            const loc = (lead as any).localizacoes[i];
            if (query.options.localizacoes.includes("ID"))
              flattened[`LOCALIZACAO_${i + 1}_ID`] = loc?.id || "";
            if (query.options.localizacoes.includes("RUA"))
              flattened[`LOCALIZACAO_${i + 1}_RUA`] = loc?.rua || "";
            if (query.options.localizacoes.includes("NUMERO"))
              flattened[`LOCALIZACAO_${i + 1}_NUMERO`] = loc?.numero || "";
            if (query.options.localizacoes.includes("CIDADE"))
              flattened[`LOCALIZACAO_${i + 1}_CIDADE`] = loc?.cidade || "";
            if (query.options.localizacoes.includes("COMPLEMENTO"))
              flattened[`LOCALIZACAO_${i + 1}_COMPLEMENTO`] =
                loc?.complemento || "";
            if (query.options.localizacoes.includes("ESTADO"))
              flattened[`LOCALIZACAO_${i + 1}_ESTADO`] = loc?.estado || "";
            if (query.options.localizacoes.includes("CEP"))
              flattened[`LOCALIZACAO_${i + 1}_CEP`] = loc?.cep || "";
            if (query.options.localizacoes.includes("CRIADO"))
              flattened[`LOCALIZACAO_${i + 1}_CRIADO`] = loc?.criado || "";
            if (query.options.localizacoes.includes("ATUALIZADO"))
              flattened[`LOCALIZACAO_${i + 1}_ATUALIZADO`] =
                loc?.atualizado || "";
          }
        } else if (key !== "oportunidades" && key !== "localizacoes") {
          const mappedKey = fieldMapping[key] || key.toUpperCase();
          flattened[mappedKey] = (lead as any)[key];
        }
      });

      return flattened;
    });

    if (!flattenedData || flattenedData.length === 0) {
      throw new Error(
        "Nenhum dado encontrado para exportar com os filtros aplicados",
      );
    }

    const fields = Object.keys(flattenedData[0]);
    const { Parser } = await import("json2csv");
    const parser = new Parser({
      delimiter: ";",
      fields: fields,
    });
    const csv = parser.parse(flattenedData);

    return {
      body: csv,
      contentType: "text/csv; charset=utf-8",
      filename: `${filename}.csv`,
    };
  }

  if (query.export_type === "xlsx") {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.default.Workbook();
    const worksheet = workbook.addWorksheet("Leads");

    if (data.length > 0) {
      const sampleLead = data[0];
      const headers: string[] = [];

      Object.keys(sampleLead).forEach((key) => {
        if (key === "usuario" && (sampleLead as any).usuario) {
          headers.push(fieldMapping["usuario_nome"]);
        } else if (
          key === "oportunidades" &&
          Array.isArray((sampleLead as any).oportunidades) &&
          (query.options.oportunidades.length > 0 ||
            (query.options as any).interacoes?.length > 0)
        ) {
          const maxOpps = Math.max(
            ...data.map((lead) => (lead as any).oportunidades?.length || 0),
          );
          for (let i = 0; i < maxOpps; i++) {
            if (query.options.oportunidades.includes("ID"))
              headers.push(`OPORTUNIDADE_${i + 1}_ID`);
            if (query.options.oportunidades.includes("VALOR_ESTIMADO"))
              headers.push(`OPORTUNIDADE_${i + 1}_VALOR_ESTIMADO`);
            if (query.options.oportunidades.includes("FAIXA_VALOR"))
              headers.push(`OPORTUNIDADE_${i + 1}_FAIXA_VALOR`);
            if (query.options.oportunidades.includes("DESCRICAO"))
              headers.push(`OPORTUNIDADE_${i + 1}_DESCRICAO`);
            if (query.options.oportunidades.includes("BOARD_ID"))
              headers.push(`OPORTUNIDADE_${i + 1}_BOARD_ID`);
            if (query.options.oportunidades.includes("BOARD_NOME"))
              headers.push(`OPORTUNIDADE_${i + 1}_BOARD_NOME`);
            if (query.options.oportunidades.includes("USUARIO_ID"))
              headers.push(`OPORTUNIDADE_${i + 1}_USUARIO_ID`);
            if (query.options.oportunidades.includes("USUARIO_NOME"))
              headers.push(`OPORTUNIDADE_${i + 1}_USUARIO_NOME`);
            if (query.options.oportunidades.includes("CRIADO"))
              headers.push(`OPORTUNIDADE_${i + 1}_CRIADO`);
            if (query.options.oportunidades.includes("ATUALIZADO"))
              headers.push(`OPORTUNIDADE_${i + 1}_ATUALIZADO`);

            if ((query.options as any).interacoes?.length > 0) {
              const intOpts = (query.options as any).interacoes as string[];
              const maxInts = Math.max(
                ...data.map((l) =>
                  ((l as any).oportunidades || []).reduce(
                    (acc: number, o: any) =>
                      Math.max(acc, o?.interacoes?.length || 0),
                    0,
                  ),
                ),
              );
              for (let j = 0; j < maxInts; j++) {
                if (intOpts.includes("ID"))
                  headers.push(`OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_ID`);
                if (intOpts.includes("USUARIO_ID"))
                  headers.push(
                    `OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_USUARIO_ID`,
                  );
                if (intOpts.includes("USUARIO_NOME"))
                  headers.push(
                    `OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_USUARIO_NOME`,
                  );
                if (intOpts.includes("STATUS"))
                  headers.push(
                    `OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_STATUS`,
                  );
                if (intOpts.includes("TIPO"))
                  headers.push(`OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_TIPO`);
                if (intOpts.includes("CONTEUDO"))
                  headers.push(
                    `OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_CONTEUDO`,
                  );
                if (intOpts.includes("DATA"))
                  headers.push(`OPORTUNIDADE_${i + 1}_INTERACAO_${j + 1}_DATA`);
              }
            }
          }
        } else if (
          key === "localizacoes" &&
          Array.isArray((sampleLead as any).localizacoes) &&
          query.options.localizacoes.length > 0
        ) {
          const maxLocs = Math.max(
            ...data.map((lead) => (lead as any).localizacoes?.length || 0),
          );
          for (let i = 0; i < maxLocs; i++) {
            if (query.options.localizacoes.includes("ID"))
              headers.push(`LOCALIZACAO_${i + 1}_ID`);
            if (query.options.localizacoes.includes("RUA"))
              headers.push(`LOCALIZACAO_${i + 1}_RUA`);
            if (query.options.localizacoes.includes("NUMERO"))
              headers.push(`LOCALIZACAO_${i + 1}_NUMERO`);
            if (query.options.localizacoes.includes("CIDADE"))
              headers.push(`LOCALIZACAO_${i + 1}_CIDADE`);
            if (query.options.localizacoes.includes("COMPLEMENTO"))
              headers.push(`LOCALIZACAO_${i + 1}_COMPLEMENTO`);
            if (query.options.localizacoes.includes("ESTADO"))
              headers.push(`LOCALIZACAO_${i + 1}_ESTADO`);
            if (query.options.localizacoes.includes("CEP"))
              headers.push(`LOCALIZACAO_${i + 1}_CEP`);
            if (query.options.localizacoes.includes("CRIADO"))
              headers.push(`LOCALIZACAO_${i + 1}_CRIADO`);
            if (query.options.localizacoes.includes("ATUALIZADO"))
              headers.push(`LOCALIZACAO_${i + 1}_ATUALIZADO`);
          }
        } else if (key !== "oportunidades" && key !== "localizacoes") {
          const mappedKey = fieldMapping[key] || key.toUpperCase();
          headers.push(mappedKey);
        }
      });

      worksheet.addRow(headers);

      data.forEach((lead) => {
        const row: any[] = [];

        Object.keys(sampleLead).forEach((key) => {
          if (key === "usuario" && (lead as any).usuario) {
            row.push((lead as any).usuario.nome);
          } else if (
            key === "oportunidades" &&
            Array.isArray((lead as any).oportunidades) &&
            (query.options.oportunidades.length > 0 ||
              (query.options as any).interacoes?.length > 0)
          ) {
            const maxOpps = Math.max(
              ...data.map((l) => (l as any).oportunidades?.length || 0),
            );
            for (let i = 0; i < maxOpps; i++) {
              const opp = (lead as any).oportunidades[i];
              if (query.options.oportunidades.includes("ID"))
                row.push(opp?.id || "");
              if (query.options.oportunidades.includes("VALOR_ESTIMADO"))
                row.push(opp?.valor_estimado || "");
              if (query.options.oportunidades.includes("FAIXA_VALOR"))
                row.push(opp?.faixa_valor || "");
              if (query.options.oportunidades.includes("DESCRICAO"))
                row.push(opp?.descricao || "");
              if (query.options.oportunidades.includes("BOARD_ID"))
                row.push(opp?.board_id || "");
              if (query.options.oportunidades.includes("BOARD_NOME"))
                row.push(opp?.board?.titulo || "");
              if (query.options.oportunidades.includes("USUARIO_ID"))
                row.push(opp?.usuario_id || "");
              if (query.options.oportunidades.includes("USUARIO_NOME"))
                row.push(opp?.usuario?.nome || "");
              if (query.options.oportunidades.includes("CRIADO"))
                row.push(opp?.criado || "");
              if (query.options.oportunidades.includes("ATUALIZADO"))
                row.push(opp?.atualizado || "");

              if ((query.options as any).interacoes?.length > 0) {
                const intOpts = (query.options as any).interacoes as string[];
                const maxInts = Math.max(
                  ...data.map((l) =>
                    ((l as any).oportunidades || []).reduce(
                      (acc: number, o: any) =>
                        Math.max(acc, o?.interacoes?.length || 0),
                      0,
                    ),
                  ),
                );
                for (let j = 0; j < maxInts; j++) {
                  const int = opp?.interacoes?.[j];
                  if (intOpts.includes("ID")) row.push(int?.id || "");
                  if (intOpts.includes("USUARIO_ID"))
                    row.push(int?.usuario_id || "");
                  if (intOpts.includes("USUARIO_NOME"))
                    row.push(int?.usuario?.nome || "");
                  if (intOpts.includes("STATUS")) row.push(int?.status || "");
                  if (intOpts.includes("TIPO")) row.push(int?.tipo || "");
                  if (intOpts.includes("CONTEUDO"))
                    row.push(int?.conteudo || "");
                  if (intOpts.includes("DATA")) row.push(int?.data || "");
                }
              }
            }
          } else if (
            key === "localizacoes" &&
            Array.isArray((lead as any).localizacoes) &&
            query.options.localizacoes.length > 0
          ) {
            const maxLocs = Math.max(
              ...data.map((l) => (l as any).localizacoes?.length || 0),
            );
            for (let i = 0; i < maxLocs; i++) {
              const loc = (lead as any).localizacoes[i];
              if (query.options.localizacoes.includes("ID"))
                row.push(loc?.id || "");
              if (query.options.localizacoes.includes("RUA"))
                row.push(loc?.rua || "");
              if (query.options.localizacoes.includes("NUMERO"))
                row.push(loc?.numero || "");
              if (query.options.localizacoes.includes("CIDADE"))
                row.push(loc?.cidade || "");
              if (query.options.localizacoes.includes("COMPLEMENTO"))
                row.push(loc?.complemento || "");
              if (query.options.localizacoes.includes("ESTADO"))
                row.push(loc?.estado || "");
              if (query.options.localizacoes.includes("CEP"))
                row.push(loc?.cep || "");
              if (query.options.localizacoes.includes("CRIADO"))
                row.push(loc?.criado || "");
              if (query.options.localizacoes.includes("ATUALIZADO"))
                row.push(loc?.atualizado || "");
            }
          } else if (key !== "oportunidades" && key !== "localizacoes") {
            row.push((lead as any)[key]);
          }
        });

        worksheet.addRow(row);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      body: buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  return {
    body: { data, export_type: query.export_type, total: data.length },
  };
}

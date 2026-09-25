import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireFinancialAccess } from "@/server/utils/financeiro";

type Row = Record<string, string | number | bigint | Date | null>;
const num = (value: unknown) => Number(value || 0);

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const query = getQuery(event);
  const page = Math.max(1, Number.parseInt(String(query.page || 1), 10) || 1);
  const pageSize = Math.min(100, Math.max(10, Number.parseInt(String(query.page_size || 25), 10) || 25));
  const search = String(query.search || "").trim();
  const classification = ["inadimplente", "com_pendencia", "sem_pendencia"].includes(String(query.classificacao)) ? String(query.classificacao) : "todos";
  const state = String(query.estado || "todos").trim();
  const lateDays = Math.max(0, Number.parseInt(String(query.dias_atraso || 0), 10) || 0);

  const where: Prisma.Sql[] = [Prisma.sql`l.empresa_id = ${companyId}`];
  if (search) {
    const text = `%${search}%`;
    const digits = search.replace(/\D/g, "");
    where.push(Prisma.sql`(l.nome_lead LIKE ${text} OR l.contato LIKE ${text} OR l.contato_nome LIKE ${text} OR loc.cidade LIKE ${text} OR loc.estado LIKE ${text} ${digits ? Prisma.sql`OR l.cpf_cnpj LIKE ${`%${digits}%`}` : Prisma.empty})`);
  }
  if (state !== "todos") where.push(Prisma.sql`loc.estado = ${state}`);

  const classificationSql = Prisma.sql`CASE WHEN SUM(CASE WHEN cr.status = 'pendente' AND cr.data_vencimento < CURDATE() THEN 1 ELSE 0 END) > 0 THEN 'inadimplente' WHEN SUM(CASE WHEN cr.status = 'pendente' THEN 1 ELSE 0 END) > 0 THEN 'com_pendencia' ELSE 'sem_pendencia' END`;
  const having: Prisma.Sql[] = [];
  if (classification !== "todos") having.push(Prisma.sql`${classificationSql} = ${classification}`);
  if (lateDays > 0) having.push(Prisma.sql`COALESCE(DATEDIFF(CURDATE(), MIN(CASE WHEN cr.status = 'pendente' AND cr.data_vencimento < CURDATE() THEN cr.data_vencimento END)), 0) >= ${lateDays}`);

  const fromSql = Prisma.sql`FROM leads l
    LEFT JOIN localizacoes loc ON loc.id = (SELECT MIN(loc2.id) FROM localizacoes loc2 WHERE loc2.lead_id = l.id)
    LEFT JOIN contas_receber cr ON cr.lead_id = l.id AND cr.empresa_id = ${companyId} AND cr.status <> 'cancelado'
    WHERE ${Prisma.join(where, " AND ")}
    GROUP BY l.id, l.nome_lead, l.cpf_cnpj, l.contato, l.contato_nome, l.responsavel, l.atividade, l.criado, loc.cidade, loc.estado, loc.cep
    ${having.length ? Prisma.sql`HAVING ${Prisma.join(having, " AND ")}` : Prisma.empty}`;

  const rowsSql = Prisma.sql`SELECT l.id, l.nome_lead, l.cpf_cnpj, l.contato, l.contato_nome, l.responsavel, l.atividade, l.criado, loc.cidade, loc.estado, loc.cep,
    ${classificationSql} AS classificacao,
    SUM(CASE WHEN cr.id IS NOT NULL THEN 1 ELSE 0 END) AS titulos_total,
    SUM(CASE WHEN cr.status = 'pendente' THEN 1 ELSE 0 END) AS titulos_pendentes,
    SUM(CASE WHEN cr.status = 'pendente' AND cr.data_vencimento < CURDATE() THEN 1 ELSE 0 END) AS titulos_vencidos,
    SUM(CASE WHEN cr.status = 'recebido' THEN 1 ELSE 0 END) AS titulos_recebidos,
    COALESCE(SUM(CASE WHEN cr.status = 'pendente' THEN cr.valor ELSE 0 END), 0) AS total_pendente,
    COALESCE(SUM(CASE WHEN cr.status = 'pendente' AND cr.data_vencimento < CURDATE() THEN cr.valor ELSE 0 END), 0) AS total_vencido,
    COALESCE(SUM(CASE WHEN cr.status = 'recebido' THEN cr.valor ELSE 0 END), 0) AS total_recebido,
    MIN(CASE WHEN cr.status = 'pendente' AND cr.data_vencimento < CURDATE() THEN cr.data_vencimento END) AS vencimento_mais_antigo,
    COALESCE(DATEDIFF(CURDATE(), MIN(CASE WHEN cr.status = 'pendente' AND cr.data_vencimento < CURDATE() THEN cr.data_vencimento END)), 0) AS dias_atraso
    ${fromSql} ORDER BY l.nome_lead ASC, l.id ASC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

  const summarySql = Prisma.sql`SELECT COUNT(*) total_clientes,
    SUM(classificacao = 'inadimplente') clientes_inadimplentes, SUM(classificacao = 'com_pendencia') clientes_com_pendencia,
    SUM(classificacao = 'sem_pendencia') clientes_sem_pendencia, COALESCE(SUM(total_pendente),0) total_pendente,
    COALESCE(SUM(total_vencido),0) total_vencido, COALESCE(SUM(total_recebido),0) total_recebido FROM (
      SELECT l.id, ${classificationSql} classificacao,
      SUM(CASE WHEN cr.status='pendente' THEN cr.valor ELSE 0 END) total_pendente,
      SUM(CASE WHEN cr.status='pendente' AND cr.data_vencimento<CURDATE() THEN cr.valor ELSE 0 END) total_vencido,
      SUM(CASE WHEN cr.status='recebido' THEN cr.valor ELSE 0 END) total_recebido
      FROM leads l LEFT JOIN contas_receber cr ON cr.lead_id=l.id AND cr.empresa_id=${companyId} AND cr.status<>'cancelado'
      WHERE l.empresa_id=${companyId} GROUP BY l.id) totals`;

  const [rows, countRows, summaryRows, stateRows] = await Promise.all([
    prisma.$queryRaw<Row[]>(rowsSql),
    prisma.$queryRaw<Row[]>(Prisma.sql`SELECT COUNT(*) total FROM (SELECT l.id ${fromSql}) filtered`),
    prisma.$queryRaw<Row[]>(summarySql),
    prisma.$queryRaw<Row[]>(Prisma.sql`SELECT DISTINCT loc.estado FROM localizacoes loc INNER JOIN leads l ON l.id=loc.lead_id WHERE l.empresa_id=${companyId} AND loc.estado IS NOT NULL AND loc.estado<>'' ORDER BY loc.estado`),
  ]);
  const raw = summaryRows[0] || {};
  const total = num(countRows[0]?.total);
  const summary = {
    total_clientes: num(raw.total_clientes), clientes_inadimplentes: num(raw.clientes_inadimplentes),
    clientes_com_pendencia: num(raw.clientes_com_pendencia), clientes_sem_pendencia: num(raw.clientes_sem_pendencia),
    total_pendente: num(raw.total_pendente), total_vencido: num(raw.total_vencido), total_recebido: num(raw.total_recebido),
    inadimplencia_percentual: num(raw.total_clientes) ? Number((num(raw.clientes_inadimplentes) / num(raw.total_clientes) * 100).toFixed(1)) : 0,
  };
  const clients = rows.map((row) => ({ ...row, titulos_total: num(row.titulos_total), titulos_pendentes: num(row.titulos_pendentes), titulos_vencidos: num(row.titulos_vencidos), titulos_recebidos: num(row.titulos_recebidos), total_pendente: num(row.total_pendente), total_vencido: num(row.total_vencido), total_recebido: num(row.total_recebido), dias_atraso: num(row.dias_atraso) }));
  await logger.view(event, JSON.stringify({ modulo: "financeiro", relatorio: "inadimplencia_clientes", page, pageSize, total }));
  return { summary, clients, states: stateRows.map((row) => String(row.estado)), pagination: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } };
});

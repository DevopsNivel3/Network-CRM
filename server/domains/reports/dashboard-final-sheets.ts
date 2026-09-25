import { interactionColumns } from "./dashboard-interaction-sheets";
import {
  addTableSheet,
  currencyStyle,
  dateStyle,
  decimalStyle,
  integerStyle,
  percentStyle,
} from "./dashboard-workbook.utils";

type Row = Record<string, any>;

interface DashboardFinalSheetsInput {
  workbook: any;
  summaryRows: Row[];
  teamRows: Row[];
  boardRows: Row[];
  opportunityRows: Row[];
  interactionRows: Row[];
  flowRows: Row[];
}

const teamColumns = [
  { header: "Usuario", key: "usuario", width: 28 },
  { header: "E-mail", key: "email", width: 32 },
  {
    header: "Oportunidades atribuidas",
    key: "oportunidades_responsavel",
    width: 23,
    style: integerStyle,
  },
  {
    header: "Oportunidades trabalhadas",
    key: "oportunidades_interagidas",
    width: 25,
    style: integerStyle,
  },
  { header: "Cobertura", key: "cobertura", width: 14, style: percentStyle },
  { header: "Interacoes", key: "interacoes", width: 14, style: integerStyle },
  {
    header: "Media por oportunidade",
    key: "media_por_oportunidade",
    width: 23,
    style: decimalStyle,
  },
  { header: "Mensagens", key: "mensagens", width: 14, style: integerStyle },
  { header: "E-mails", key: "emails", width: 14, style: integerStyle },
  { header: "Ligacoes", key: "ligacoes", width: 14, style: integerStyle },
  {
    header: "Ultima interacao",
    key: "ultima_interacao",
    width: 22,
    style: dateStyle,
  },
];

const boardColumns = [
  { header: "Prancheta", key: "board", width: 30 },
  {
    header: "Oportunidades atuais",
    key: "oportunidades",
    width: 21,
    style: integerStyle,
  },
  {
    header: "Com interacao no periodo",
    key: "com_interacao_periodo",
    width: 24,
    style: integerStyle,
  },
  {
    header: "Sem interacao no periodo",
    key: "sem_interacao_periodo",
    width: 24,
    style: integerStyle,
  },
  { header: "Cobertura", key: "cobertura", width: 14, style: percentStyle },
  {
    header: "Interacoes no periodo",
    key: "interacoes_periodo",
    width: 21,
    style: integerStyle,
  },
  {
    header: "Media por oportunidade",
    key: "media_por_oportunidade",
    width: 23,
    style: decimalStyle,
  },
  {
    header: "Interacoes historicas",
    key: "interacoes_historico",
    width: 21,
    style: integerStyle,
  },
  {
    header: "Ultima interacao",
    key: "ultima_interacao",
    width: 22,
    style: dateStyle,
  },
  { header: "Pipeline", key: "pipeline", width: 18, style: currencyStyle },
  { header: "Exige motivo", key: "exige_motivo", width: 15 },
  { header: "Grupo de motivos", key: "grupo_motivos", width: 28 },
  { header: "Motivos configurados", key: "motivos_configurados", width: 48 },
  {
    header: "Exige observacao em Outro",
    key: "exige_observacao_outro",
    width: 27,
  },
];

const opportunityColumns = [
  { header: "Prancheta atual", key: "board", width: 28 },
  {
    header: "Oportunidade ID",
    key: "oportunidade_id",
    width: 16,
    style: integerStyle,
  },
  { header: "Lead", key: "lead", width: 30 },
  { header: "Contato", key: "contato", width: 24 },
  { header: "Responsaveis", key: "responsaveis", width: 32 },
  { header: "Status", key: "status", width: 18 },
  { header: "Valor", key: "valor", width: 18, style: currencyStyle },
  { header: "Criada", key: "criado", width: 22, style: dateStyle },
  { header: "Atualizada", key: "atualizado", width: 22, style: dateStyle },
  {
    header: "Interacoes no periodo",
    key: "interacoes_periodo",
    width: 21,
    style: integerStyle,
  },
  {
    header: "Interacoes historicas",
    key: "interacoes_historico",
    width: 21,
    style: integerStyle,
  },
  {
    header: "Ultima interacao",
    key: "ultima_interacao",
    width: 22,
    style: dateStyle,
  },
  {
    header: "Dias sem interacao",
    key: "dias_sem_interacao",
    width: 19,
    style: integerStyle,
  },
  { header: "Autor da ultima interacao", key: "ultimo_responsavel", width: 26 },
  {
    header: "Pranchetas visitadas no periodo",
    key: "pranchetas_visitadas_periodo",
    width: 38,
  },
  {
    header: "Motivos no periodo",
    key: "motivos_movimentacao_periodo",
    width: 44,
  },
  { header: "Descricao", key: "descricao", width: 50 },
];

const flowColumns = [
  { header: "Prancheta visitada", key: "board", width: 30 },
  {
    header: "Oportunidade ID",
    key: "oportunidade_id",
    width: 16,
    style: integerStyle,
  },
  { header: "Lead", key: "lead", width: 30 },
  { header: "Contato", key: "contato", width: 24 },
  { header: "Responsaveis atuais", key: "responsaveis", width: 32 },
  {
    header: "Primeira passagem",
    key: "primeira_passagem",
    width: 22,
    style: dateStyle,
  },
  {
    header: "Ultima passagem",
    key: "ultima_passagem",
    width: 22,
    style: dateStyle,
  },
  {
    header: "Movimentacoes",
    key: "registros_movimentacao",
    width: 16,
    style: integerStyle,
  },
  { header: "Movimentado por", key: "usuario_movimentacao", width: 26 },
  { header: "Motivos registrados", key: "motivo", width: 42 },
  { header: "Observacoes dos motivos", key: "observacao_motivo", width: 50 },
  { header: "Exige motivo", key: "exige_motivo", width: 15 },
  { header: "Grupo de motivos", key: "grupo_motivos", width: 28 },
  { header: "Motivos configurados", key: "motivos_configurados", width: 48 },
  { header: "Prancheta atual", key: "board_atual", width: 28 },
  { header: "Permanece nela", key: "permanece_board", width: 17 },
  { header: "Seguiu para outra", key: "seguiu_para_outra", width: 19 },
  { header: "Status atual", key: "status_atual", width: 18 },
  { header: "Valor", key: "valor", width: 18, style: currencyStyle },
  { header: "Desativada", key: "desativada", width: 14 },
];

export function addDashboardFinalSheets(input: DashboardFinalSheetsInput) {
  const summary = addTableSheet(
    input.workbook,
    "01 Resumo",
    [
      { header: "Indicador", key: "indicador", width: 49 },
      { header: "Valor", key: "valor", width: 29 },
    ],
    input.summaryRows,
  );
  summary.getCell("B6").numFmt = "0.00%";
  addTableSheet(input.workbook, "02 Equipe", teamColumns, input.teamRows);
  addTableSheet(input.workbook, "03 Pranchetas", boardColumns, input.boardRows);
  addTableSheet(
    input.workbook,
    "04 Oportunidades",
    opportunityColumns,
    input.opportunityRows,
  );
  addTableSheet(
    input.workbook,
    "05 Interacoes",
    interactionColumns,
    input.interactionRows,
  );
  addTableSheet(
    input.workbook,
    "06 Fluxo e Motivos",
    flowColumns,
    input.flowRows,
  );
}

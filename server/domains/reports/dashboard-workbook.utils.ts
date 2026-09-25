import dayjs from "dayjs";

export const currencyStyle = { numFmt: '"R$"#,##0.00' };
export const percentStyle = { numFmt: "0.00%" };
export const integerStyle = { numFmt: "0" };
export const decimalStyle = { numFmt: "0.00" };
export const dateStyle = { numFmt: "dd/mm/yyyy hh:mm" };

export function parseDecimal(raw: any) {
  if (raw && typeof raw === "object" && typeof raw.toNumber === "function") {
    try {
      return raw.toNumber();
    } catch {
      return Number(String(raw)) || 0;
    }
  }
  if (typeof raw === "string") {
    return parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return Number(raw) || 0;
}

export const isValidDate = (value?: string) =>
  Boolean(value && !Number.isNaN(new Date(value).getTime()));

const interactionTypes: Record<number, string> = {
  1: "Mensagem",
  2: "E-mail",
  3: "Telefone",
};

export const getTipoInteracao = (tipo: number) =>
  interactionTypes[tipo] || `Tipo ${tipo}`;

export function getStatusInteracao(tipo: number, status: number) {
  const statusPorTipo: Record<number, Record<number, string>> = {
    1: { 1: "Enviada", 2: "Respondida", 3: "Ignorada" },
    2: { 4: "Enviado", 5: "Respondido", 6: "Nao respondido" },
    3: { 7: "Atendida", 8: "Nao atendida", 9: "Ocupado" },
  };
  return statusPorTipo[tipo]?.[status] || `Status ${status}`;
}

export const formatDate = (value?: Date | string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "";

export const toPlainText = (value?: string | null) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const safeExcelText = (value: unknown, maxLength = 30000) =>
  String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .slice(0, maxLength);

export function addTableSheet(
  workbook: any,
  name: string,
  columns: Array<{
    header: string;
    key: string;
    width?: number;
    style?: Record<string, any>;
  }>,
  rows: Array<Record<string, any>>,
) {
  const worksheet = workbook.addWorksheet(name);
  worksheet.columns = columns;
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  if (rows.length) {
    rows.forEach((row) => worksheet.addRow(row));
  } else {
    worksheet.addRow(
      Object.fromEntries(
        columns.map((column, index) => [
          column.key,
          index === 0 ? "Sem dados para os filtros aplicados" : "",
        ]),
      ),
    );
  }

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  worksheet.eachRow((row: any, rowNumber: number) => {
    row.alignment = { vertical: "top", wrapText: true };
    if (rowNumber <= 1) return;
    row.eachCell((cell: any) => {
      cell.border = Object.fromEntries(
        ["top", "left", "bottom", "right"].map((side) => [
          side,
          { style: "thin", color: { argb: "FFE5E7EB" } },
        ]),
      );
    });
  });
  return worksheet;
}

import {
  addTableSheet,
  dateStyle,
  integerStyle,
  safeExcelText,
} from "./dashboard-workbook.utils";

export const interactionColumns = [
  { header: "Prancheta", key: "board", width: 28 },
  {
    header: "Oportunidade ID",
    key: "oportunidade_id",
    width: 16,
    style: integerStyle,
  },
  { header: "Lead", key: "lead", width: 30 },
  { header: "Contato", key: "contato", width: 24 },
  { header: "Responsaveis", key: "responsaveis", width: 30 },
  { header: "Sequencia", key: "sequencia", width: 12, style: integerStyle },
  { header: "Data", key: "data", width: 22, style: dateStyle },
  { header: "No periodo", key: "no_periodo", width: 14 },
  { header: "Tipo", key: "tipo", width: 16 },
  { header: "Resultado", key: "resultado", width: 20 },
  { header: "Usuario", key: "usuario", width: 26 },
  { header: "Conteudo", key: "conteudo", width: 65 },
  { header: "Anexos", key: "anexos", width: 45 },
];

export function addBoardInteractionSheets(
  workbook: any,
  boards: Array<{ id: number; titulo: string }>,
  rows: Array<Record<string, any> & { board_id: number }>,
) {
  const usedNames = new Set(
    workbook.worksheets.map((sheet: any) => sheet.name),
  );
  const uniqueName = (board: { id: number; titulo: string }) => {
    const title = safeExcelText(board.titulo, 22)
      .replace(/[\\/?*\[\]:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const base = `B${board.id} ${title}`.slice(0, 31) || `Board ${board.id}`;
    let name = base;
    let sequence = 2;
    while (usedNames.has(name)) {
      const suffix = ` ${sequence++}`;
      name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    }
    usedNames.add(name);
    return name;
  };

  boards.forEach((board) =>
    addTableSheet(
      workbook,
      uniqueName(board),
      interactionColumns,
      rows.filter((row) => row.board_id === board.id),
    ),
  );
}

export type LeadImportRow = Record<string, unknown>;

const readFile = (file: File, mode: "text" | "arrayBuffer") =>
  new Promise<string | ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string | ArrayBuffer);
    reader.onerror = () =>
      reject(reader.error || new Error("Falha ao ler arquivo"));
    if (mode === "text") reader.readAsText(file, "UTF-8");
    else reader.readAsArrayBuffer(file);
  });

const flattenObject = (
  value: Record<string, unknown>,
  prefix = "",
  separator = ".",
): LeadImportRow => {
  const flattened: LeadImportRow = {};
  Object.entries(value).forEach(([key, item]) => {
    const path = prefix ? `${prefix}${separator}${key}` : key;
    if (Array.isArray(item)) {
      item.forEach((child, index) => {
        const childPath = `${path}[${index}]`;
        if (child && typeof child === "object") {
          Object.assign(
            flattened,
            flattenObject(
              child as Record<string, unknown>,
              childPath,
              separator,
            ),
          );
        } else flattened[childPath] = child;
      });
    } else if (item && typeof item === "object") {
      Object.assign(
        flattened,
        flattenObject(item as Record<string, unknown>, path, separator),
      );
    } else flattened[path] = item;
  });
  return flattened;
};

const parseCsv = async (file: File): Promise<LeadImportRow[]> => {
  const csv = String(await readFile(file, "text"));
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) throw new Error("Arquivo CSV vazio");

  const firstLine = lines[0];
  const separator =
    (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
      ? ";"
      : ",";
  const clean = (field: string) => field.trim().replace(/^"|"$/g, "");
  const headers = firstLine.split(separator).map(clean);
  return lines.slice(1).map((line) => {
    const values = line.split(separator).map(clean);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] || ""]),
    );
  });
};

const parseJson = async (file: File): Promise<LeadImportRow[]> => {
  const parsed = JSON.parse(String(await readFile(file, "text")));
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return rows.map((row) => flattenObject(row));
};

const parseSpreadsheet = async (file: File): Promise<LeadImportRow[]> => {
  const XLSX = await import("xlsx");
  const data = new Uint8Array(
    (await readFile(file, "arrayBuffer")) as ArrayBuffer,
  );
  const workbook = XLSX.read(data, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<LeadImportRow>(worksheet);
};

export async function parseLeadImportFile(
  file: File,
): Promise<LeadImportRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") return parseCsv(file);
  if (extension === "json") return parseJson(file);
  if (extension === "xlsx" || extension === "xls") {
    return parseSpreadsheet(file);
  }
  throw new Error("Formato de arquivo não suportado");
}

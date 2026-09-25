import path from "path";

export type AttachmentInput = {
  nome?: string | null;
  url?: string | null;
  tipo?: string | null;
  tamanho?: number | null;
};

export const normalizeAttachments = (anexos: AttachmentInput[] = []) =>
  (anexos || [])
    .map((item) => {
      const url = item?.url || "";
      const fallbackName = url ? path.basename(url) : "arquivo";
      return {
        nome: item?.nome || fallbackName,
        url,
        tipo: item?.tipo || undefined,
        tamanho: item?.tamanho ?? undefined,
      };
    })
    .filter((item) => item.nome && item.url);

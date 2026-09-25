import fs from "fs";
import path from "path";

const safeUnlink = (fullPath: string) => {
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (err) {
    console.error("Falha ao remover arquivo:", fullPath, err);
  }
};

const resolveUploadPath = (uploadsDir: string, url: string) => {
  if (!url) return null;
  const base = "/uploads/";
  const idx = url.indexOf(base);
  if (idx === -1) return null;
  const relative = url.slice(idx + base.length);
  const safePath = path.join(uploadsDir, relative);
  const fullPath = path.resolve(safePath);
  if (!fullPath.startsWith(uploadsDir)) return null;
  return { relative, fullPath };
};

export const deleteAttachmentFiles = (
  uploadsDir: string,
  urls: string[],
  empresaId?: number | null,
) => {
  for (const url of urls) {
    const resolved = resolveUploadPath(uploadsDir, url);
    if (!resolved) continue;
    if (empresaId && resolved.relative.startsWith("files/")) {
      const allowedPrefix = `files/${empresaId}/`;
      if (!resolved.relative.startsWith(allowedPrefix)) continue;
    }
    safeUnlink(resolved.fullPath);
  }
};

import type { ServerFile } from "nuxt-file-storage";
import { readMultipartFormData } from "h3";

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event);
    const file = form?.find((item) => item.name === "file");

    if (!file || !file.data)
      throw createError({
        statusCode: 400,
        message: "Arquivo não enviado",
      });

    const mime = file.type || "application/octet-stream";
    const base64 = Buffer.from(file.data).toString("base64");
    const content = `data:${mime};base64,${base64}`;

    const stored: ServerFile = {
      name: file.filename || "arquivo",
      content,
      size: String(file.data.length),
      type: mime,
      lastModified: Date.now().toString(),
    };

    const empresaId = event.context.auth.empresa_id;
    const filePath = await storeFileLocally(stored, 24, `/files/${empresaId}`);

    return {
      url: `/uploads/files/${empresaId}/${filePath}`,
      name: stored.name,
      type: stored.type,
      size: Number(stored.size),
    };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao enviar arquivo",
    });
  }
});

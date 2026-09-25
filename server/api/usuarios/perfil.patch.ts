import type { ServerFile } from "nuxt-file-storage";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { z } from "zod";

const updateProfileBodySchema = z.object({
  nome: createStringSchema("Nome").optional(),
  email: emailSchema.optional(),
  contato: createStringSchema("Contato").optional(),
  image: z.any().nullable().optional(),
  removeAvatar: z.boolean().default(false),
});

// Rota para atualizar os dados de perfil do usuário autenticado
export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      updateProfileBodySchema.parseAsync,
    );

    const where: Prisma.UsuarioWhereUniqueInput = {
      id: event.context.auth.id,
      empresa_id: event.context.auth.empresa_id,
    };

    const currentUser = await prisma.usuario.findUnique({
      where,
      select: { avatar: true },
    });

    if (!currentUser) throw new Error("Usuário não encontrado");

    const data: Prisma.UsuarioUpdateInput = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.email !== undefined) data.email = body.email;
    if (body.contato !== undefined) data.contato = body.contato;

    if (body.image && body.image !== null) {
      if (currentUser.avatar) {
        const uploadsDir = useRuntimeConfig().public.fileStorage.mount;
        const oldAvatarPath = path.join(uploadsDir, currentUser.avatar);
        if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
      }

      const { binaryString } = parseDataUrl(body.image.content);
      const optimizedBuffer = await sharp(binaryString)
        .resize({ width: 512, height: 512, fit: "cover" })
        .toFormat("webp", { quality: 50 })
        .toBuffer();
      const optimizedBase64 = `data:image/webp;base64,${optimizedBuffer.toString("base64")}`;

      const file: ServerFile = {
        name: `${body.image.uid}.webp`,
        content: optimizedBase64,
        size: optimizedBuffer.length.toString(),
        type: "image/webp",
        lastModified: Date.now().toString(),
      };
      const filePath = await storeFileLocally(
        file,
        `${body.image.uid}`,
        "/profiles",
      );

      data.avatar = `/profiles/${filePath}`;
    } else if (body.removeAvatar && currentUser.avatar) {
      const uploadsDir = useRuntimeConfig().public.fileStorage.mount;
      const oldAvatarPath = path.join(uploadsDir, currentUser.avatar);
      if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
      data.avatar = null;
    }

    const updatedUser = await prisma.usuario.update({
      where,
      data,
      select: {
        id: true,
        nome: true,
        contato: true,
        email: true,
        avatar: true,
        criado: true,
        atualizado: true,
      },
    });

    await logger.update(event, JSON.stringify(updatedUser));

    return updatedUser;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao atualizar o perfil",
    });
  }
});

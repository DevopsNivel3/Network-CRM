import type { ServerFile } from "nuxt-file-storage";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";
import sharp from "sharp";
import { z } from "zod";
import {
  getAllowedPermissionsBitfield,
  normalizePermissionModules,
  type PermissionModule,
} from "@/utils/permissions";

const createUserBodySchema = z.object({
  nome: createStringSchema("Nome"),
  email: emailSchema,
  cpf: cpfSchema,
  senha: senhaSchema,
  contato: createStringSchema("Contato"),
  avatar: z.any().nullable().optional(),
  image: z.any().nullable().optional(),
  permissoes: z
    .array(z.number())
    .default([])
    .transform((perm) => {
      return grantUserPermission(...perm);
    }),
});

// Rota para criar um usuário
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.CRIAR_USUARIO,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(
      event,
      createUserBodySchema.parseAsync,
    );

    const empresa = await prisma.empresa.findUnique({
      where: { id: event.context.auth.empresa_id },
      select: { modulos: true },
    });
    const allowedModules = normalizePermissionModules(
      (empresa?.modulos as PermissionModule[] | null) || null,
    );
    const allowedBitfield = getAllowedPermissionsBitfield(allowedModules);
    if ((body.permissoes & ~allowedBitfield) !== 0)
      throw new Error("Permissões fora dos módulos liberados para a empresa");

    const existingUser = await prisma.usuario.findUnique({
      where: { email: body.email },
    });
    if (existingUser) throw new Error("Este e-mail já está registrado");

    const isTryingToGrantAdmin = hasUserPermission(
      body.permissoes,
      UserPermissions.ADMIN,
    );
    const requesterIsAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );
    if (isTryingToGrantAdmin && !requesterIsAdmin)
      throw new Error("Você não tem acesso a essa permissão");

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(body.senha, salt);

    const data: Prisma.UsuarioCreateInput = {
      email: body.email,
      cpf: body.cpf,
      senha: hash,
      nome: body.nome,
      contato: body.contato,
      permissoes: body.permissoes,
      usuario_id: event.context.auth.id,
      empresa: {
        connect: {
          id: event.context.auth.empresa_id,
        },
      },
    };

    if (body.image && body.image !== null) {
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
    }

    const userCreated = await prisma.usuario.create({
      data,
    });

    await logger.create(event, JSON.stringify({ ...userCreated, senha: null }));

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao criar o Usuário",
    });
  }
});

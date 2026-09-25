import type { ServerFile } from "nuxt-file-storage";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import sharp from "sharp";
import { z } from "zod";
import {
  getAllowedPermissionsBitfield,
  normalizePermissionModules,
  type PermissionModule,
} from "@/utils/permissions";
import path from "path";
import fs from "fs";

const updateUserBodySchema = z.object({
  nome: createStringSchema("Nome"),
  email: emailSchema,
  cpf: cpfSchema,
  contato: createStringSchema("Contato"),
  avatar: z.any().nullable().optional(),
  permissoes: z
    .array(z.number())
    .default([])
    .transform((perm) => {
      return grantUserPermission(...perm);
    }),
  senha: senhaSchema.nullable().optional(),
  desativado: z.string().default("false"),
  image: z.any().nullable().optional(),
});

// Rota para atualizar um usuário pelo ID
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.EDITAR_USUARIO,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const where: Prisma.UsuarioWhereUniqueInput = { id };

    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      )
    )
      where.empresa_id = event.context.auth.empresa_id;

    const body = await readValidatedBody(
      event,
      updateUserBodySchema.parseAsync,
    );

    const targetUser = await prisma.usuario.findUnique({
      where,
      select: { id: true, permissoes: true, empresa_id: true },
    });

    if (!targetUser) throw new Error("Usuário não encontrado");

    const targetIsAdmin =
      targetUser &&
      hasUserPermission(targetUser.permissoes, UserPermissions.ADMIN);
    const requesterIsAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (targetIsAdmin && !requesterIsAdmin)
      throw new Error("Você não pode editar um administrador");

    const isTryingToGrantAdmin = hasUserPermission(
      body.permissoes,
      UserPermissions.ADMIN,
    );
    const userHasAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );
    if (isTryingToGrantAdmin && !userHasAdmin)
      throw new Error("Você não tem acesso a essa permissão");

    if (body.permissoes !== undefined) {
      const empresaId = targetUser?.empresa_id ?? event.context.auth.empresa_id;
      const empresa = empresaId
        ? await prisma.empresa.findUnique({
            where: { id: empresaId },
            select: { modulos: true },
          })
        : null;
      const allowedModules = normalizePermissionModules(
        (empresa?.modulos as PermissionModule[] | null) || null,
      );
      const allowedBitfield = getAllowedPermissionsBitfield(allowedModules);
      if ((body.permissoes & ~allowedBitfield) !== 0)
        throw new Error("Permissões fora dos módulos liberados para a empresa");

      const requesterPerms = event.context.auth.permissoes;
      if (!hasUserPermission(requesterPerms, UserPermissions.ADMIN)) {
        const extraPerms = body.permissoes & ~requesterPerms;
        if (extraPerms !== 0)
          throw new Error(
            "Você não pode conceder permissões maiores que as suas",
          );
        if (targetUser) {
          const changedOutside =
            (targetUser.permissoes ^ body.permissoes) & ~requesterPerms;
          if (changedOutside !== 0)
            throw new Error(
              "Você não pode remover permissões maiores que as suas",
            );
        }
      }
    }

    const data: Prisma.UsuarioUpdateInput = {};

    if (body.nome) data.nome = body.nome;
    if (body.email) data.email = body.email;
    if (body.cpf !== undefined) data.cpf = body.cpf;
    if (body.contato) data.contato = body.contato;
    if (body.desativado)
      data.desativado = String(body.desativado) === "true" ? true : false;
    if (body.permissoes !== undefined) data.permissoes = body.permissoes;
    if (body.senha) {
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(body.senha, salt);
      data.senha = hash;
    }

    if (body.image && body.image !== null) {
      const userActualData = await prisma.usuario.findUnique({
        where,
      });
      if (userActualData?.avatar) {
        const uploadsDir = useRuntimeConfig().public.fileStorage.mount;
        const oldAvatarPath = path.join(uploadsDir, userActualData.avatar);
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
    }

    const select: Prisma.UsuarioSelect = {
      id: true,
      nome: true,
      cpf: true,
      contato: true,
      desativado: true,
      permissoes: true,
      email: true,
      criado: true,
      atualizado: true,
      avatar: true,
      _count: {
        select: {
          leads: true,
          oportunidades: true,
          visitas: true,
        },
      },
    };

    if (
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      )
    ) {
      select.empresa = {
        select: {
          id: true,
          nome: true,
          desativado: true,
        },
      };
    }

    const user = await prisma.usuario.update({
      where,
      data,
      select,
    });

    await logger.update(event, JSON.stringify(user));

    return user;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao atualizar o Usuário",
    });
  }
});

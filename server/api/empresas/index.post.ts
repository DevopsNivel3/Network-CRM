import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  allPermissionModules,
  getAllowedPermissionsBitfield,
  normalizePermissionModules,
  permissionModules,
  type PermissionModule,
} from "@/utils/permissions";
import { empresaGrupoValues } from "@/utils/empresaGrupos";

const createEmpresaBodySchema = z.object({
  nome: createStringSchema("Nome"),
  grupo: z.enum(empresaGrupoValues).nullable().optional(),
  contato: createStringSchema("Contato"),
  email: emailSchema,
  senha: senhaSchema,
  modulos: z
    .array(
      z.enum(
        Object.keys(permissionModules) as [
          PermissionModule,
          ...PermissionModule[],
        ],
      ),
    )
    .default(allPermissionModules),
  permissoes: z
    .array(z.number())
    .default([])
    .transform((perm) => {
      return grantUserPermission(...perm);
    }),
});

// Rota para criar uma Empresa
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(
      event,
      createEmpresaBodySchema.parseAsync,
    );

    const existingUser = await prisma.usuario.findUnique({
      where: {
        email: body.email,
      },
    });
    if (existingUser) throw new Error("Este e-mail já está registrado");

    const allowedModules = normalizePermissionModules(
      body.modulos as PermissionModule[],
    );
    const allowedBitfield = getAllowedPermissionsBitfield(allowedModules);
    if ((body.permissoes & ~allowedBitfield) !== 0)
      throw new Error("Permissões fora dos módulos liberados para a empresa");

    const empresa = await prisma.empresa.create({
      data: {
        nome: body.nome,
        grupo: body.grupo,
        contato: body.contato,
        email: body.email,
        usuario_id: event.context.auth.id,
        modulos: allowedModules,
      },
    });

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(body.senha, salt);
    body.senha = hash;

    await prisma.usuario.create({
      data: {
        nome: empresa.nome,
        email: empresa.email,
        senha: body.senha,
        contato: empresa.contato,
        permissoes: body.permissoes,
        usuario_id: event.context.auth.id,
        empresa: {
          connect: {
            id: empresa.id,
          },
        },
      },
    });

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao criar a Empresa",
    });
  }
});

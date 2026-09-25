import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { permissionModules, type PermissionModule } from "@/utils/permissions";
import { empresaGrupoValues } from "@/utils/empresaGrupos";

const updateEmpresaBodySchema = z.object({
  nome: createStringSchema("Nome"),
  grupo: z.enum(empresaGrupoValues).nullable().optional(),
  contato: createStringSchema("Contato"),
  email: emailSchema,
  desativado: z.string().default("false"),
  modulos: z
    .array(
      z.enum(
        Object.keys(permissionModules) as [
          PermissionModule,
          ...PermissionModule[],
        ],
      ),
    )
    .optional(),
});

// Rota para atualizar uma Empresa
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      updateEmpresaBodySchema.parseAsync,
    );

    const data: Prisma.EmpresaUpdateInput = {};
    if (body.nome) data.nome = body.nome;
    if (body.grupo !== undefined) data.grupo = body.grupo;
    if (body.email) data.email = body.email;
    if (body.contato) data.contato = body.contato;
    if (body.desativado)
      data.desativado = String(body.desativado) === "true" ? true : false;
    if (body.modulos !== undefined) data.modulos = body.modulos;

    const user = await prisma.empresa.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        grupo: true,
        contato: true,
        desativado: true,
        email: true,
        criado: true,
        atualizado: true,
        usuario_id: true,
        modulos: true,
        _count: {
          select: {
            usuarios: true,
            leads: true,
          },
        },
      },
    });

    return user;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao atualizar a Empresa",
    });
  }
});

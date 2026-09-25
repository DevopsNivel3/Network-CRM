import type { ServerFile } from "nuxt-file-storage";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import sharp from "sharp";
import { z } from "zod";

const updateVisitaBodySchema = z.object({
  data_inicio: z.string().optional(),
  hora_inicio: z.string().optional(),
  data_fim: z.string().nullable().optional(),
  imagem_src: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  statusInt: createNumberSchema("Status").nullable().optional(),
  motivo: z.string().nullable().optional(),
  image: z.any().nullable().optional(),
});

// Rota de atualização de visita
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.EDITAR_VISITA,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const where: Prisma.VisitaWhereUniqueInput = { id };
    const body = await readValidatedBody(
      event,
      updateVisitaBodySchema.parseAsync,
    );

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    const visitaAtual = await prisma.visita.findUnique({
      where: { id },
      select: {
        id: true,
        usuario_id: true,
        oportunidade_id: true,
        oportunidade: {
          select: {
            lead: { select: { empresa_id: true } },
          },
        },
      },
    });

    if (!visitaAtual) throw new Error("Visita não encontrada");

    if (
      !isGrantAdmin &&
      visitaAtual.oportunidade.lead.empresa_id !== event.context.auth.empresa_id
    ) {
      throw new Error("Visita não encontrada");
    }

    if (!isAdmin) {
      const isPrincipal = await prisma.oportunidadeResponsaveis.findFirst({
        where: {
          oportunidade_id: visitaAtual.oportunidade_id,
          usuario_id: event.context.auth.id,
          principal: true,
        },
        select: { id: true },
      });

      if (!isPrincipal && visitaAtual.usuario_id !== event.context.auth.id)
        throw new Error("Você não tem permissão para editar esta visita");
    }

    const data: Prisma.VisitaUpdateInput = {};
    if (body.statusInt) data.statusInt = body.statusInt;
    if (body.latitude) data.latitude = body.latitude;
    if (body.longitude) data.longitude = body.longitude;
    if (body.data_fim) data.data_fim = body.data_fim;
    if (body.motivo) data.motivo = body.motivo;

    // Status: 3 - Reagendado
    if (body.statusInt === 3) {
      data.statusInt = body.statusInt;
      data.data_inicio = body.data_inicio;
      data.hora_inicio = body?.hora_inicio?.slice(0, 5);
    }

    if (body.image) {
      const { binaryString } = parseDataUrl(body.image.content);

      const optimizedBuffer = await sharp(binaryString)
        .resize({ width: 1024, height: 1024, fit: "contain" })
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
        "/visitas",
      );

      data.imagem_src = `/visitas/${filePath}`;
    }

    const visita = await prisma.visita.update({
      where,
      data,
      select: {
        id: true,
        data_inicio: true,
        hora_inicio: true,
        motivo: true,
        data_fim: true,
        latitude: true,
        longitude: true,
        imagem_src: true,
        statusInt: true,
        criado: true,
        oportunidade: {
          select: {
            id: true,
            lead: {
              select: {
                id: true,
                nome_lead: true,
              },
            },
          },
        },
        localizacao: {
          select: {
            cidade: true,
            estado: true,
            rua: true,
            complemento: true,
            cep: true,
            numero: true,
          },
        },
      },
    });

    await logger.update(event, JSON.stringify(visita));

    return visita;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message:
        err?.message || "Ocorreu um erro ao atualizar o status da visita",
    });
  }
});

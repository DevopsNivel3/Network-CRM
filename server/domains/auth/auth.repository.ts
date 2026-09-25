import prisma from "../../../lib/prisma";

const mobileCompanySelect = {
  nome: true,
  modulos: true,
  desativado: true,
} as const;

export const findWebLoginUser = (email: string) =>
  prisma.usuario.findUnique({
    where: { email },
    include: { empresa: { select: { desativado: true } } },
  });

export const findMobileLoginUser = (email: string) =>
  prisma.usuario.findUnique({
    where: { email },
    include: { empresa: { select: mobileCompanySelect } },
  });

export const findAuthenticatedUser = (id: number) =>
  prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      contato: true,
      desativado: true,
      permissoes: true,
      avatar: true,
      empresa_id: true,
      empresa: { select: mobileCompanySelect },
    },
  });

export const findMobileSession = (tokenHash: string) =>
  prisma.mobileSession.findUnique({
    where: { token_hash: tokenHash },
    include: {
      usuario: {
        include: { empresa: { select: mobileCompanySelect } },
      },
    },
  });

export const createMobileSession = (input: {
  tokenHash: string;
  userId: number;
  device?: string;
  platform?: string;
  expiresAt: Date;
}) =>
  prisma.mobileSession.create({
    data: {
      token_hash: input.tokenHash,
      usuario_id: input.userId,
      dispositivo: input.device,
      plataforma: input.platform,
      expira_em: input.expiresAt,
    },
  });

export const rotateMobileSession = (
  id: string,
  tokenHash: string,
  expiresAt: Date,
) =>
  prisma.mobileSession.update({
    where: { id },
    data: { token_hash: tokenHash, expira_em: expiresAt },
  });

export const revokeMobileSession = (tokenHash: string) =>
  prisma.mobileSession.updateMany({
    where: { token_hash: tokenHash, revogado_em: null },
    data: { revogado_em: new Date() },
  });

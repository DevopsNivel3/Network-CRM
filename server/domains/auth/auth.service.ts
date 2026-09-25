import bcrypt from "bcrypt";
import {
  createMobileSession,
  findAuthenticatedUser,
  findMobileLoginUser,
  findMobileSession,
  findWebLoginUser,
  revokeMobileSession,
  rotateMobileSession,
} from "./auth.repository";
import {
  createMobileAccessToken,
  createRefreshToken,
  createWebAccessToken,
  hashRefreshToken,
  refreshTokenExpiration,
  verifyAccessToken,
} from "./token.service";

export class AuthenticationError extends Error {}

const isUserActive = (user: {
  desativado: boolean;
  empresa: { desativado: boolean } | null;
}) => !user.desativado && !user.empresa?.desativado;

export async function authenticateWeb(email: string, password: string) {
  const user = await findWebLoginUser(email);
  if (
    !user ||
    !isUserActive(user) ||
    !(await bcrypt.compare(password, user.senha))
  ) {
    throw new AuthenticationError("E-mail ou senha incorretos.");
  }
  return { user, accessToken: createWebAccessToken(user) };
}

export async function authenticateMobile(input: {
  email: string;
  password: string;
  device?: string;
  platform?: string;
}) {
  const user = await findMobileLoginUser(input.email);
  if (
    !user ||
    !isUserActive(user) ||
    !(await bcrypt.compare(input.password, user.senha))
  ) {
    throw new AuthenticationError("E-mail ou senha incorretos.");
  }

  const refreshToken = createRefreshToken();
  await createMobileSession({
    tokenHash: hashRefreshToken(refreshToken),
    userId: user.id,
    device: input.device,
    platform: input.platform,
    expiresAt: refreshTokenExpiration(),
  });

  return {
    accessToken: createMobileAccessToken(user),
    refreshToken,
    user: serializeMobileUser(user),
  };
}

export async function refreshMobileSession(currentRefreshToken: string) {
  const session = await findMobileSession(hashRefreshToken(currentRefreshToken));
  if (
    !session ||
    session.revogado_em ||
    session.expira_em <= new Date() ||
    !isUserActive(session.usuario)
  ) {
    throw new AuthenticationError("Sessão expirada.");
  }

  const refreshToken = createRefreshToken();
  await rotateMobileSession(
    session.id,
    hashRefreshToken(refreshToken),
    refreshTokenExpiration(),
  );

  return {
    accessToken: createMobileAccessToken(session.usuario),
    refreshToken,
    user: serializeMobileUser(session.usuario),
  };
}

export const logoutMobile = (refreshToken: string) =>
  revokeMobileSession(hashRefreshToken(refreshToken));

export async function resolveAuthenticatedUser(token: string) {
  const payload = verifyAccessToken(token);
  const user = await findAuthenticatedUser(payload.id);
  if (!user || !isUserActive(user)) {
    throw new AuthenticationError("Usuário não encontrado ou desativado.");
  }
  return user;
}

function serializeMobileUser(user: {
  id: number;
  nome: string;
  email: string;
  permissoes: number;
  avatar: string | null;
  empresa: { nome: string; modulos: unknown } | null;
}) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    permissoes: user.permissoes,
    avatar: user.avatar,
    empresa_nome: user.empresa?.nome ?? null,
    empresa_modulos: user.empresa?.modulos ?? [],
  };
}

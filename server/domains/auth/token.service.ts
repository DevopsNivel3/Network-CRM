import crypto from "node:crypto";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import {
  AUTH_ISSUER,
  MOBILE_ACCESS_TOKEN_TTL,
  MOBILE_AUTH_AUDIENCE,
  MOBILE_REFRESH_TOKEN_DAYS,
  WEB_ACCESS_TOKEN_TTL,
  WEB_AUTH_AUDIENCE,
} from "./auth.constants";
import type { AuthTokenPayload } from "./auth.types";

function jwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return secret;
}

function signAccessToken(
  payload: Pick<AuthTokenPayload, "id" | "name" | "client">,
  audience: string,
  expiresIn: SignOptions["expiresIn"],
) {
  return jwt.sign(payload, jwtSecret(), {
    expiresIn,
    issuer: AUTH_ISSUER,
    audience,
  });
}

export function createWebAccessToken(user: { id: number; nome: string }) {
  return signAccessToken(
    { id: user.id, name: user.nome },
    WEB_AUTH_AUDIENCE,
    WEB_ACCESS_TOKEN_TTL,
  );
}

export function createMobileAccessToken(user: { id: number; nome: string }) {
  return signAccessToken(
    { id: user.id, name: user.nome, client: "mobile" },
    MOBILE_AUTH_AUDIENCE,
    MOBILE_ACCESS_TOKEN_TTL,
  );
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, jwtSecret(), {
    issuer: AUTH_ISSUER,
    audience: [WEB_AUTH_AUDIENCE, MOBILE_AUTH_AUDIENCE],
  });
  if (typeof decoded === "string" || typeof decoded.id !== "number") {
    throw new Error("Token inválido");
  }
  return decoded as AuthTokenPayload;
}

export const createRefreshToken = () =>
  crypto.randomBytes(48).toString("base64url");

export const hashRefreshToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refreshTokenExpiration = () =>
  new Date(Date.now() + MOBILE_REFRESH_TOKEN_DAYS * 86_400_000);

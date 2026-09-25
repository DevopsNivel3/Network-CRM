import { resolveAuthenticatedUser } from "@/server/domains/auth/auth.service";

const publicApiPrefixes = [
  "/api/auth/login",
  "/api/mobile/auth/login",
  "/api/mobile/auth/refresh",
  "/api/mobile/auth/logout",
  "/api/auth/resetar/senha",
  "/api/whatsapp/webhook",
  "/api/whatsapp/stream",
  "/api/oportunidades/board/stream",
];

const isProtectedApiRoute = (path: string) =>
  path.startsWith("/api") &&
  !publicApiPrefixes.some((prefix) => path.startsWith(prefix));

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (!isProtectedApiRoute(path)) return;

  try {
    const authorization = getHeader(event, "Authorization");
    const cookie = getCookie(event, "auth.token");
    const token = (authorization ?? cookie)?.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Token de autenticação não fornecido");

    event.context.auth = await resolveAuthenticatedUser(token);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    throw createError({ statusCode: 401, message: "Acesso não autorizado." });
  }
});

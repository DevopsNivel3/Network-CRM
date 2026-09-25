import { normalizePhone } from "@/server/utils/evolutionAPI";
import { subscribeWhatsappStream } from "@/server/utils/whatsappStream";
import jwt, { type Secret, type JwtPayload } from "jsonwebtoken";
import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const tokenParam = getQuery(event).token;
    const rawToken = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
    const token = String(rawToken || "").replace("Bearer ", "");
    if (!token) throw new Error("Token de autenticação não fornecido");

    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as Secret,
      ) as JwtPayload;
      if (!decodedToken || !decodedToken.id) throw new Error("Token inválido");
    } catch {
      throw new Error("Token inválido ou expirado");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: decodedToken.id },
      select: {
        id: true,
        permissoes: true,
        empresa_id: true,
        desativado: true,
        empresa: { select: { desativado: true } },
      },
    });

    if (!usuario || usuario.empresa?.desativado || usuario.desativado)
      throw new Error("Usuário não encontrado ou desativado");

    if (!hasUserPermission(usuario.permissoes, UserPermissions.VER_LEAD))
      throw new Error("Você não tem permissão suficiente");

    const empresaId = usuario.empresa_id;
    const numeroRaw = getQuery(event).numero;
    const numero = normalizePhone(String(numeroRaw || ""));
    if (!numero) throw new Error("Número inválido");

    setHeader(event, "Content-Type", "text/event-stream");
    setHeader(event, "Cache-Control", "no-cache");
    setHeader(event, "Connection", "keep-alive");

    const send = (payload: any) => {
      event.node.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    send({ type: "connected" });

    const unsubscribe = subscribeWhatsappStream(empresaId as number, numero, (payload) =>
      send(payload),
    );

    const heartbeat = setInterval(() => {
      event.node.res.write(`event: ping\ndata: {}\n\n`);
    }, 25000);

    event.node.req.on("close", () => {
      unsubscribe();
      clearInterval(heartbeat);
      event.node.res.end();
    });

    return event.node.res;
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao abrir stream do WhatsApp",
    });
  }
});

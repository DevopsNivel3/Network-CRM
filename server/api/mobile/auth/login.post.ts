import { z } from "zod";
import { authenticateMobile } from "@/server/domains/auth/auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
  dispositivo: z.string().max(180).optional(),
  plataforma: z.string().max(30).optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parseAsync);
  try {
    const result = await authenticateMobile({
      email: body.email,
      password: body.senha,
      device: body.dispositivo,
      platform: body.plataforma,
    });
    await logger.view(event, JSON.stringify({
      modulo: "mobile",
      tipo: "login",
      usuario_id: result.user.id,
    }));
    return result;
  } catch {
    throw createError({ statusCode: 401, message: "E-mail ou senha incorretos." });
  }
});

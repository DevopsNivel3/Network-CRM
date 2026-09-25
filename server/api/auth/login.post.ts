import { z } from "zod";
import { authenticateWeb } from "@/server/domains/auth/auth.service";

const loginUserBodySchema = z.object({ email: emailSchema, senha: senhaSchema });

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, loginUserBodySchema.parseAsync);
    const { user, accessToken } = await authenticateWeb(body.email, body.senha);
    event.context.auth = user;
    await logger.view(event, "Login realizado com sucesso");
    return { token: accessToken };
  } catch (error) {
    console.error(error);
    throw createError({ statusCode: 401, message: "E-mail ou senha incorretos" });
  }
});

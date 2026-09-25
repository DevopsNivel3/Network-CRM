import { z } from "zod";
import { refreshMobileSession } from "@/server/domains/auth/auth.service";

const refreshSchema = z.object({ refreshToken: z.string().min(20) });

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, refreshSchema.parseAsync);
  try {
    return await refreshMobileSession(body.refreshToken);
  } catch {
    throw createError({ statusCode: 401, message: "Sessão expirada." });
  }
});

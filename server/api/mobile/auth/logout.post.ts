import { z } from "zod";
import { logoutMobile } from "@/server/domains/auth/auth.service";

const logoutSchema = z.object({ refreshToken: z.string().min(20) });

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, logoutSchema.parseAsync);
  await logoutMobile(body.refreshToken);
  return { ok: true };
});

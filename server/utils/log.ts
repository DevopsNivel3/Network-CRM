import { H3Event, getRequestIP, getHeader } from "h3";
import prisma from "@/lib/prisma";

export enum LogAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  VIEW = "VIEW",
}

export interface LogOptions {
  message: string;
  action: LogAction;
  event: H3Event;
}

export async function log({
  event,
  action,
  message,
}: LogOptions): Promise<void> {
  try {
    event.context.auditLogged = true;
    const requestIP = getRequestIP(event) || "unknown";
    const userAgent = getHeader(event, "user-agent") || "unknown";
    const auth = event.context.auth as
      | { id?: number; empresa_id?: number }
      | undefined;
    await prisma.auditLog.create({
      data: {
        operacao: action,
        descricao: message,
        ip: requestIP,
        agent: userAgent,
        user_id: auth?.id ?? null,
        empresa_id: auth?.empresa_id ?? null,
      },
    });
  } catch (err) {
    console.error(err);
  }
}

export const logger = {
  create: (event: H3Event, message: string) =>
    log({ event, action: LogAction.CREATE, message }),
  update: (event: H3Event, message: string) =>
    log({ event, action: LogAction.UPDATE, message }),
  delete: (event: H3Event, message: string) =>
    log({ event, action: LogAction.DELETE, message }),
  view: (event: H3Event, message: string) =>
    log({ event, action: LogAction.VIEW, message }),
};

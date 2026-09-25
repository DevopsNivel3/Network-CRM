import DailyRotateFile from "winston-daily-rotate-file";
import winston from "winston";
import path from "path";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";
const rootDir = isProd ? path.resolve(process.cwd(), "../") : process.cwd();
const logsDir = path.join(rootDir, "logs");

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
      ({ timestamp, level, message, stack, ip }) =>
        `[${timestamp}] ${level.toUpperCase()} - IP: ${ip || "N/A"}: ${message}\n${
          stack ? `STACK:\n${stack}\n` : ""
        }`
    )
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, "%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
    }),
  ],
});

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", (error, { event }) => {
    if (error.message.includes("Arquivo não encontrado")) return;
    const ip =
      event?.node?.req?.headers["x-forwarded-for"] || event?.node?.req?.socket?.remoteAddress;
    logger.error({ message: `Error: ${error.message}`, stack: error.stack, ip });
  });

  process.on("uncaughtException", (error) => {
    logger.error({ message: `Uncaught Exception: ${error.message}`, stack: error.stack });
  });

  process.on("unhandledRejection", (reason: any) => {
    logger.error({
      message: `Unhandled Promise Rejection: ${reason?.message || reason}`,
      stack: reason?.stack || "",
    });
  });
});

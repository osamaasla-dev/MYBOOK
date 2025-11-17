// lib/logger.ts
import pino, { Logger } from "pino";

// Avoid creating multiple instances in Next.js dev with HMR
declare global {
  var logger: Logger | undefined;
}

function createLogger(): Logger {
  const isProd = process.env.NODE_ENV === "production";
  const level = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");

  const commonOptions: pino.LoggerOptions = {
    level,
    redact: {
      paths: [
        "req.headers.authorization",
        "headers.authorization",
        "authorization",
        "password",
        "confirmPassword",
        "accessToken",
        "refreshToken",
        "cookie",
        "cookies",
      ],
      censor: "[REDACTED]",
    },
    // human-readable timestamp in dev pretty, epoch in prod by default
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (isProd) {
    return pino(commonOptions);
  }

  return pino({
    ...commonOptions,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
        singleLine: false,
      },
    },
  });
}

export const logger: Logger = global.logger ?? createLogger();

if (process.env.NODE_ENV !== "production") {
  global.logger = logger;
}

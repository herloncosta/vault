import pino from "pino";
import winston from "winston";
import env from "../config/env.js";

const isDev = env.nodeEnv !== "production";

export const logger = isDev
  ? pino({
      transport: { target: "pino-pretty" },
      level: "debug",
    })
  : winston.createLogger({
      level: "info",
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

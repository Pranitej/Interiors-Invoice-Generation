import winston from "winston";
import config from "../config.js";

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length
    ? " | " + Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(" | ")
    : "";
  const stackStr = stack ? `\n${stack}` : "";
  return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}${stackStr}`;
});

const logger = winston.createLogger({
  level: config.server.isProduction ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat,
  ),
  transports: [new winston.transports.Console()],
});

export default logger;

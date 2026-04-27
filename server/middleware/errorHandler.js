// server/middleware/errorHandler.js
// Operational errors (AppError instances) have a statusCode — expose their message.
// Unknown errors (DB failures, bugs) do not — hide internals, log server-side.
import { sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

export default function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] ?? "field";
    return sendError(res, 400, `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(", ");
    return sendError(res, 400, message);
  }
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal Server Error";

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ${statusCode} — ${err.message}\n${err.stack}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} ${statusCode} — ${err.message}`);
  }

  sendError(res, statusCode, message);
}

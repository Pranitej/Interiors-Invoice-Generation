// server/middleware/errorHandler.js
// Operational errors (AppError instances) have a statusCode — expose their message.
// Unknown errors (DB failures, bugs) do not — hide internals, log server-side.
import { sendError } from "../utils/response.js";

export default function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] ?? "field";
    return sendError(res, 400, `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
  }
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal Server Error";
  if (!err.statusCode) console.error(err);
  sendError(res, statusCode, message);
}

// server/middleware/errorHandler.js
import { sendError } from "../utils/response.js";

export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal Server Error";
  if (!err.statusCode) console.error(err);
  sendError(res, statusCode, message);
}

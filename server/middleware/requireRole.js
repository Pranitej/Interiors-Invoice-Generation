// server/middleware/requireRole.js
import { sendError } from "../utils/response.js";

export default function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 401, "Not authenticated");
    if (!roles.includes(req.user.role)) return sendError(res, 403, "Forbidden");
    next();
  };
}

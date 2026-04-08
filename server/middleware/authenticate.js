// server/middleware/authenticate.js
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";
import config from "../config.js";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId,
    };
    next();
  } catch {
    return sendError(res, 401, "Invalid or expired token");
  }
}

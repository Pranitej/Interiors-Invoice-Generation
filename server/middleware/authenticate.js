// server/middleware/authenticate.js
import jwt from "jsonwebtoken";
import config from "../config.js";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
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
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

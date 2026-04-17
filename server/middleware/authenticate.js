import jwt from "jsonwebtoken";
import Company from "../models/Company.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";

export default async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return next(new AppError(401, "No token provided"));
    let decoded;
    try {
      decoded = jwt.verify(token, config.auth.jwtSecret);
    } catch {
      return next(new AppError(401, "Invalid or expired token"));
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId,
    };

    if (decoded.companyId && decoded.role !== config.roles.SUPER_ADMIN) {
      const company = await Company.findById(decoded.companyId)
        .select("loginBlocked isActive")
        .lean();
      if (!company) return next(new AppError(401, "Your company account no longer exists"));
      if (company.loginBlocked) return next(new AppError(403, "Login has been disabled for your account. Please contact Administrator."));
    }

    next();
  } catch (err) {
    next(err);
  }
}

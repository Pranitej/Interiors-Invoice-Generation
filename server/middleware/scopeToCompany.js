// server/middleware/scopeToCompany.js
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;

export default function scopeToCompany(req, res, next) {
  if (req.user.role === SUPER_ADMIN) {
    req.companyId = null; // super admin sees all data
  } else {
    req.companyId = req.user.companyId;
  }
  next();
}

// server/middleware/checkSubscription.js
import Company from "../models/Company.js";
import { sendError } from "../utils/response.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;

export async function requireInvoiceAccess(req, res, next) {
  if (req.user?.role === SUPER_ADMIN) return next();

  const companyId = req.user?.companyId;
  if (!companyId)
    return sendError(res, 403, "No company associated with your account");

  const company = await Company.findById(companyId).lean();
  if (!company) return sendError(res, 404, "Company not found");

  if (company.invoicesBlocked) {
    return sendError(
      res,
      403,
      "Invoice creation and editing has been disabled for your account. Please contact Administrator.",
    );
  }

  next();
}

export async function requireDownloadAccess(req, res, next) {
  if (req.user?.role === SUPER_ADMIN) return next();

  const companyId = req.user?.companyId;
  if (!companyId)
    return sendError(res, 403, "No company associated with your account");

  const company = await Company.findById(companyId).lean();
  if (!company) return sendError(res, 404, "Company not found");

  if (company.downloadsBlocked) {
    return sendError(
      res,
      403,
      "Invoice downloads have been disabled for your account. Please contact your administrator.",
    );
  }

  next();
}

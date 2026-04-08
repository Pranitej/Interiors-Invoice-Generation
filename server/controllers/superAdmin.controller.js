// server/controllers/superAdmin.controller.js
import * as SuperAdminService from "../services/superAdmin.service.js";

export async function getPlatformStats(req, res, next) {
  try {
    const stats = await SuperAdminService.getPlatformStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getCompanyInvoices(req, res, next) {
  try {
    const invoices = await SuperAdminService.getCompanyInvoices(req.params.id);
    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
}

export async function getCompanyUsers(req, res, next) {
  try {
    const users = await SuperAdminService.getCompanyUsers(req.params.id);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

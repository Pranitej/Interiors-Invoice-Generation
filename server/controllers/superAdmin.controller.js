// server/controllers/superAdmin.controller.js
import * as SuperAdminService from "../services/superAdmin.service.js";
import { sendSuccess } from "../utils/response.js";

export async function getPlatformStats(req, res, next) {
  try {
    const stats = await SuperAdminService.getPlatformStats();
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyInvoices(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await SuperAdminService.getCompanyInvoices(req.params.id, { page, limit });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyUsers(req, res, next) {
  try {
    const users = await SuperAdminService.getCompanyUsers(req.params.id);
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}

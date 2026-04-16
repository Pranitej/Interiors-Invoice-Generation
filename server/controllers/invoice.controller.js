// server/controllers/invoice.controller.js
import * as InvoiceService from "../services/invoice.service.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import config from "../config.js";

const { defaultPage, defaultLimit, maxLimit } = config.invoice;

export async function createInvoice(req, res, next) {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Object.keys(req.body).length === 0
    )
      throw new AppError(400, "Request body is required");

    const invoice = await InvoiceService.createInvoice({
      body: req.body,
      companyId: req.companyId,
      userId: req.user.userId,
    });
    sendSuccess(res, invoice, 201);
  } catch (err) {
    next(err);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const { q, sortBy, order } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || defaultPage);
    const limit = Math.min(
      maxLimit,
      parseInt(req.query.limit, 10) || defaultLimit,
    );
    const isCompanyUser = req.user.role === config.roles.COMPANY_USER;
    const { invoices, total } = await InvoiceService.listInvoices({
      companyId: req.companyId,
      createdBy: isCompanyUser ? req.user.userId : null,
      q,
      sortBy,
      order,
      page,
      limit,
    });
    sendSuccess(res, { invoices, total });
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const isCompanyUser = req.user.role === config.roles.COMPANY_USER;
    const invoice = await InvoiceService.getInvoiceById(
      req.params.id,
      req.companyId,
      isCompanyUser ? req.user.userId : null,
    );
    sendSuccess(res, invoice);
  } catch (err) {
    next(err);
  }
}

export async function updateInvoice(req, res, next) {
  try {
    const isCompanyUser = req.user.role === config.roles.COMPANY_USER;
    if (isCompanyUser && !config.permissions.companyUser.canEditOwnInvoices)
      throw new AppError(403, "Forbidden");
    const ownerId = isCompanyUser ? req.user.userId : null;
    const invoice = await InvoiceService.updateInvoice(
      req.params.id,
      req.companyId,
      req.body,
      ownerId,
    );
    sendSuccess(res, invoice);
  } catch (err) {
    next(err);
  }
}

export async function deleteInvoice(req, res, next) {
  try {
    await InvoiceService.deleteInvoice(req.params.id, req.companyId);
    sendSuccess(res, null, 200, "Invoice deleted successfully");
  } catch (err) {
    next(err);
  }
}

export async function listTrash(req, res, next) {
  try {
    const invoices = await InvoiceService.listTrash(req.companyId);
    sendSuccess(res, invoices);
  } catch (err) {
    next(err);
  }
}

export async function restoreInvoice(req, res, next) {
  try {
    const invoice = await InvoiceService.restoreInvoice(
      req.params.id,
      req.companyId,
    );
    sendSuccess(res, invoice, 200, "Invoice restored");
  } catch (err) {
    next(err);
  }
}

export async function permanentDeleteInvoice(req, res, next) {
  try {
    await InvoiceService.permanentDelete(req.params.id, req.companyId);
    sendSuccess(res, null, 200, "Invoice permanently deleted");
  } catch (err) {
    next(err);
  }
}

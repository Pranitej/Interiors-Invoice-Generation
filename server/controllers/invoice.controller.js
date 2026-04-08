// server/controllers/invoice.controller.js
import * as InvoiceService from "../services/invoice.service.js";
import AppError from "../utils/AppError.js";

export async function createInvoice(req, res, next) {
  try {
    if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length === 0)
      throw new AppError(400, "Request body is required");

    const invoice = await InvoiceService.createInvoice({
      body: req.body,
      companyId: req.companyId,
      userId: req.user.userId,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const { q, sortBy, order } = req.query;
    const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const { invoices, total } = await InvoiceService.listInvoices({
      companyId: req.companyId,
      q,
      sortBy,
      order,
      page,
      limit,
    });
    res.json({ success: true, data: invoices, total });
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const invoice = await InvoiceService.getInvoiceById(
      req.params.id,
      req.companyId
    );
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function updateInvoice(req, res, next) {
  try {
    const invoice = await InvoiceService.updateInvoice(
      req.params.id,
      req.companyId,
      req.body
    );
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function deleteInvoice(req, res, next) {
  try {
    await InvoiceService.deleteInvoice(req.params.id, req.companyId);
    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// server/controllers/subscription.controller.js
import * as SubscriptionService from "../services/subscription.service.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";

// GET /api/subscription/platform-settings
export async function getPlatformSettings(req, res, next) {
  try {
    const settings = await SubscriptionService.getPlatformSettings();
    sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
}

// PUT /api/subscription/platform-settings
export async function updatePlatformSettings(req, res, next) {
  try {
    const { subscriptionAmount } = req.body;
    if (subscriptionAmount === undefined)
      throw new AppError(400, "subscriptionAmount is required");
    if (typeof subscriptionAmount !== "number" || subscriptionAmount < 0)
      throw new AppError(400, "subscriptionAmount must be a non-negative number");

    const settings = await SubscriptionService.updatePlatformSettings({
      subscriptionAmount,
      performedBy: req.user.userId,
    });
    sendSuccess(res, settings, 200, "Platform subscription amount updated");
  } catch (err) {
    next(err);
  }
}

// POST /api/subscription/platform-settings/qr
export async function updateUpiQr(req, res, next) {
  try {
    if (!req.file) throw new AppError(400, "No file uploaded");
    const settings = await SubscriptionService.updatePlatformSettings({
      upiQrFile: req.file.filename,
      performedBy: req.user.userId,
    });
    sendSuccess(res, settings, 200, "UPI QR code updated");
  } catch (err) {
    if (req.file) {
      const { unlink } = await import("fs/promises");
      await unlink(req.file.path).catch(() => {});
    }
    next(err);
  }
}

// GET /api/subscription/status  (company admin + company user — own company)
export async function getMySubscriptionStatus(req, res, next) {
  try {
    const status = await SubscriptionService.getCompanySubscriptionStatus(req.user.companyId);
    sendSuccess(res, status);
  } catch (err) {
    next(err);
  }
}

// GET /api/subscription/my/transactions  (company admin — own company)
export async function getMyTransactions(req, res, next) {
  try {
    const transactions = await SubscriptionService.getTransactionHistory(req.user.companyId);
    sendSuccess(res, transactions);
  } catch (err) {
    next(err);
  }
}

// GET /api/subscription/companies/:id/status  (super admin)
export async function getCompanySubscriptionStatus(req, res, next) {
  try {
    const status = await SubscriptionService.getCompanySubscriptionStatus(req.params.id);
    sendSuccess(res, status);
  } catch (err) {
    next(err);
  }
}

// POST /api/subscription/companies/:id/activate  (super admin)
export async function activateSubscription(req, res, next) {
  try {
    const { expiryDate, amount, modeOfPayment, remarks } = req.body;
    if (!modeOfPayment || !["Cash", "UPI", "Bank Transfer", "Cheque"].includes(modeOfPayment))
      throw new AppError(400, "modeOfPayment is required and must be one of: Cash, UPI, Bank Transfer, Cheque");
    const company = await SubscriptionService.activateSubscription({
      companyId: req.params.id,
      expiryDate,
      amount,
      modeOfPayment,
      remarks,
      performedBy: req.user.userId,
    });
    sendSuccess(res, company, 200, "Subscription activated successfully");
  } catch (err) {
    next(err);
  }
}

// PATCH /api/subscription/companies/:id/deactivate  (super admin)
export async function deactivateCompany(req, res, next) {
  try {
    const { remarks } = req.body;
    const company = await SubscriptionService.deactivateCompany({
      companyId: req.params.id,
      remarks,
      performedBy: req.user.userId,
    });
    sendSuccess(res, company, 200, "Company deactivated");
  } catch (err) {
    next(err);
  }
}

// PATCH /api/subscription/companies/:id/toggle-downloads  (super admin)
export async function toggleDownloads(req, res, next) {
  try {
    const company = await SubscriptionService.toggleDownloads({
      companyId: req.params.id,
      performedBy: req.user.userId,
    });
    const msg = company.downloadsBlocked
      ? "Invoice downloads blocked for this company"
      : "Invoice downloads unblocked for this company";
    sendSuccess(res, company, 200, msg);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/subscription/companies/:id/amount  (super admin)
export async function updateCompanySubscriptionAmount(req, res, next) {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount === null)
      throw new AppError(400, "amount is required");
    const company = await SubscriptionService.updateCompanySubscriptionAmount({
      companyId: req.params.id,
      amount,
      performedBy: req.user.userId,
    });
    sendSuccess(res, company, 200, "Subscription amount updated");
  } catch (err) {
    next(err);
  }
}

// GET /api/subscription/companies/:id/transactions  (super admin)
export async function getTransactionHistory(req, res, next) {
  try {
    const transactions = await SubscriptionService.getTransactionHistory(req.params.id);
    sendSuccess(res, transactions);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/subscription/companies/:id/activate-company  (super admin)
export async function activateCompanyManually(req, res, next) {
  try {
    const { remarks } = req.body;
    const company = await SubscriptionService.activateCompanyManually({
      companyId: req.params.id,
      remarks,
      performedBy: req.user.userId,
    });
    sendSuccess(res, company, 200, "Company activated");
  } catch (err) {
    next(err);
  }
}

// PATCH /api/subscription/companies/:id/toggle-invoices  (super admin)
export async function toggleInvoices(req, res, next) {
  try {
    const company = await SubscriptionService.toggleInvoices({
      companyId: req.params.id,
    });
    const msg = company.invoicesBlocked
      ? "Invoice creation and editing blocked for this company"
      : "Invoice creation and editing unblocked for this company";
    sendSuccess(res, company, 200, msg);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/subscription/transactions/:txId  (super admin)
export async function deleteTransaction(req, res, next) {
  try {
    await SubscriptionService.deleteTransaction(req.params.txId);
    sendSuccess(res, null, 200, "Transaction deleted");
  } catch (err) {
    next(err);
  }
}

// PATCH /api/subscription/companies/:id/toggle-login  (super admin)
export async function toggleLogin(req, res, next) {
  try {
    const company = await SubscriptionService.toggleLogin({
      companyId: req.params.id,
    });
    const msg = company.loginBlocked
      ? "Login blocked for company admin and users"
      : "Login unblocked for company admin and users";
    sendSuccess(res, company, 200, msg);
  } catch (err) {
    next(err);
  }
}

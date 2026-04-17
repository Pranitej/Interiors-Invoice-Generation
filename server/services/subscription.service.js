// server/services/subscription.service.js
import mongoose from "mongoose";
import Company from "../models/Company.js";
import SubscriptionTransaction from "../models/SubscriptionTransaction.js";
import PlatformSettings from "../models/PlatformSettings.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";

const { warningDaysBeforeExpiry } = config.subscription;

// ─── Helpers ────────────────────────────────────────────────────────────────

// subscriptionState describes the subscription expiry, independent of isActive.
// canCreateInvoices = isActive && !invoicesBlocked (both must be true; cron sets both on expiry).
// canDownloadInvoices = !downloadsBlocked (manual super-admin toggle only).
function computeSubscriptionStatus(company) {
  const now = new Date();
  const expiry = company.subscriptionExpiryDate;

  let subscriptionState = "no_subscription";
  let daysUntilExpiry = null;

  if (expiry) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffMs = expiry.getTime() - now.getTime();
    daysUntilExpiry = Math.ceil(diffMs / msPerDay);

    if (daysUntilExpiry > warningDaysBeforeExpiry) {
      subscriptionState = "active";
    } else if (daysUntilExpiry > 0) {
      subscriptionState = "warning";
    } else {
      subscriptionState = "expired";
    }
  }

  return {
    subscriptionState,
    daysUntilExpiry,
    canCreateInvoices: company.isActive,
    canDownloadInvoices: !company.downloadsBlocked,
  };
}

// ─── Platform Settings ───────────────────────────────────────────────────────

export async function getPlatformSettings() {
  let settings = await PlatformSettings.findOne({ key: "global" });
  if (!settings) settings = await PlatformSettings.create({ key: "global" });
  return settings;
}

export async function updatePlatformSettings({ subscriptionAmount, upiQrFile, performedBy }) {
  const settings = await getPlatformSettings();
  if (subscriptionAmount !== undefined) settings.subscriptionAmount = subscriptionAmount;
  if (upiQrFile !== undefined) settings.upiQrFile = upiQrFile;
  settings.updatedBy = performedBy;
  await settings.save();
  return settings;
}

// ─── Subscription Status ─────────────────────────────────────────────────────

export async function getCompanySubscriptionStatus(companyId) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");

  const [company, platformSettings] = await Promise.all([
    Company.findById(companyId),
    getPlatformSettings(),
  ]);

  if (!company) throw new AppError(404, "Company not found");

  return {
    companyId: company._id,
    companyName: company.name,
    isActive: company.isActive,
    downloadsBlocked: company.downloadsBlocked,
    subscriptionExpiryDate: company.subscriptionExpiryDate,
    subscriptionAmount: company.subscriptionAmount,
    inactiveRemarks: company.inactiveRemarks,
    platformAmount: platformSettings.subscriptionAmount,
    upiQrFile: platformSettings.upiQrFile,
    ...computeSubscriptionStatus(company),
  };
}

// ─── Activate Subscription ───────────────────────────────────────────────────
// Sets subscription dates + amount, and re-activates the company.

export async function activateSubscription({ companyId, expiryDate, amount, modeOfPayment, remarks, performedBy }) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");
  if (!expiryDate) throw new AppError(400, "expiryDate is required");

  const parsedExpiry = new Date(expiryDate);
  if (isNaN(parsedExpiry.getTime())) throw new AppError(400, "Invalid expiryDate");
  if (parsedExpiry <= new Date()) throw new AppError(400, "expiryDate must be in the future");

  const company = await Company.findById(companyId);
  if (!company) throw new AppError(404, "Company not found");

  company.isActive = true;
  company.invoicesBlocked = false;
  company.subscriptionExpiryDate = parsedExpiry;
  company.inactiveRemarks = "";
  if (amount !== undefined && amount !== null) company.subscriptionAmount = amount;

  await company.save();

  await SubscriptionTransaction.create({
    companyId,
    type: "activated",
    amount: company.subscriptionAmount,
    expiryDate: parsedExpiry,
    modeOfPayment,
    remarks: remarks || "",
    performedBy,
  });

  return company;
}

// ─── Deactivate Company ───────────────────────────────────────────────────────
// Independent of subscription — super admin can deactivate any time with a reason.

export async function deactivateCompany({ companyId, remarks, performedBy }) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");
  if (!remarks || !remarks.trim())
    throw new AppError(400, "remarks are required when deactivating a company");

  const company = await Company.findById(companyId);
  if (!company) throw new AppError(404, "Company not found");

  company.isActive = false;
  company.inactiveRemarks = remarks.trim();
  await company.save();

  return company;
}

// ─── Activate Company Manually ────────────────────────────────────────────────
// Super admin manually reactivates a company without touching subscription or toggles.

export async function activateCompanyManually({ companyId, remarks, performedBy }) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");
  const company = await Company.findById(companyId);
  if (!company) throw new AppError(404, "Company not found");

  company.isActive = true;
  company.inactiveRemarks = "";
  await company.save();

  return company;
}

// ─── Toggle Downloads ─────────────────────────────────────────────────────────
// Super admin can block / unblock invoice downloads independently.

export async function toggleDownloads({ companyId, performedBy }) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");

  const company = await Company.findById(companyId);
  if (!company) throw new AppError(404, "Company not found");

  company.downloadsBlocked = !company.downloadsBlocked;
  await company.save();

  return company;
}

// ─── Toggle Invoices ──────────────────────────────────────────────────────────
// Super admin can block / unblock invoice create, edit, and compare independently.

export async function toggleInvoices({ companyId }) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");

  const company = await Company.findById(companyId);
  if (!company) throw new AppError(404, "Company not found");

  company.invoicesBlocked = !company.invoicesBlocked;
  await company.save();

  return company;
}

// ─── Toggle Login ─────────────────────────────────────────────────────────────
// Super admin can block / unblock login for company admin and company users.

export async function toggleLogin({ companyId }) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");

  const company = await Company.findById(companyId);
  if (!company) throw new AppError(404, "Company not found");

  company.loginBlocked = !company.loginBlocked;
  await company.save();

  return company;
}

// ─── Update Subscription Amount ───────────────────────────────────────────────

export async function updateCompanySubscriptionAmount({ companyId, amount, performedBy }) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");
  if (amount === undefined || amount === null || amount < 0)
    throw new AppError(400, "Valid amount is required");

  const company = await Company.findById(companyId);
  if (!company) throw new AppError(404, "Company not found");

  company.subscriptionAmount = amount;
  await company.save();

  await SubscriptionTransaction.create({
    companyId,
    type: "amount_changed",
    amount,
    expiryDate: company.subscriptionExpiryDate,
    remarks: `Subscription amount updated to ₹${amount}`,
    performedBy,
  });

  return company;
}

// ─── Transaction History ──────────────────────────────────────────────────────

export async function getTransactionHistory(companyId) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");

  return SubscriptionTransaction.find({ companyId, type: "activated" })
    .populate("performedBy", "username role")
    .sort({ createdAt: -1 });
}

// ─── Cron: Auto-expire subscriptions ─────────────────────────────────────────
// Deactivates companies whose subscription has expired. Downloads remain unaffected.

export async function runExpiryCheck() {
  const now = new Date();
  const expired = await Company.find({
    isActive: true,
    subscriptionExpiryDate: { $ne: null, $lte: now },
  });

  if (expired.length === 0) return { processed: 0 };

  const ids = expired.map((c) => c._id);
  const remark = "Subscription expired — access suspended by system";

  await Company.updateMany(
    { _id: { $in: ids } },
    { $set: { isActive: false, invoicesBlocked: true, inactiveRemarks: remark } }
  );

  console.log(`[Cron] Auto-expired ${expired.length} subscription(s)`);
  return { processed: expired.length };
}

// ─── Cron: Clean up old trashed invoices ─────────────────────────────────────

export async function runTrashCleanup() {
  const { default: Invoice } = await import("../models/Invoice.js");
  const cutoff = new Date(
    Date.now() - config.invoice.trashRetentionDays * 24 * 60 * 60 * 1000
  );
  const result = await Invoice.deleteMany({ deletedAt: { $ne: null, $lte: cutoff } });
  console.log(`[Cron] Permanently deleted ${result.deletedCount} trashed invoice(s)`);
  return { deleted: result.deletedCount };
}

export { computeSubscriptionStatus };

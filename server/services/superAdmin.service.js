// server/services/superAdmin.service.js
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import config from "../config.js";
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

export async function getPlatformStats() {
  const [totalCompanies, activeCompanies, totalUsers, totalInvoices] =
    await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $ne: config.roles.SUPER_ADMIN } }),
      Invoice.countDocuments({ deletedAt: null }),
    ]);
  return { totalCompanies, activeCompanies, totalUsers, totalInvoices };
}

export async function getCompanyInvoices(companyId, { page = 1, limit = 50 } = {}) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");
  const exists = await Company.exists({ _id: companyId });
  if (!exists) throw new AppError(404, "Company not found");

  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;

  const [invoices, total] = await Promise.all([
    Invoice.find({ companyId, deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Invoice.countDocuments({ companyId, deletedAt: null }),
  ]);
  return { invoices, total };
}

export async function getCompanyUsers(companyId) {
  if (!mongoose.Types.ObjectId.isValid(companyId))
    throw new AppError(400, "Invalid company ID");
  const exists = await Company.exists({ _id: companyId });
  if (!exists) throw new AppError(404, "Company not found");
  return User.find({ companyId }).select("-password");
}

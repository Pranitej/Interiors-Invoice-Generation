// server/services/superAdmin.service.js
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import config from "../config.js";

export async function getPlatformStats() {
  const [totalCompanies, activeCompanies, totalUsers, totalInvoices] =
    await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $ne: config.roles.SUPER_ADMIN } }),
      Invoice.countDocuments(),
    ]);
  return { totalCompanies, activeCompanies, totalUsers, totalInvoices };
}

export async function getCompanyInvoices(companyId) {
  return Invoice.find({ companyId }).sort({ createdAt: -1 });
}

export async function getCompanyUsers(companyId) {
  return User.find({ companyId }).select("-password");
}

// server/services/company.service.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

const { COMPANY_ADMIN } = config.roles;
const { maxTerms } = config.company;

export async function createCompany({
  name,
  logoFile,
  tagline,
  registeredOffice,
  industryAddress,
  phones,
  email,
  website,
  adminUsername,
  adminPassword,
}) {
  const company = await Company.create({
    name,
    logoFile: logoFile ?? "",
    tagline: tagline ?? "",
    registeredOffice: registeredOffice ?? "",
    industryAddress: industryAddress ?? "",
    phones: phones ?? [],
    email: email ?? "",
    website: website ?? "",
  });

  const hashedPassword = await bcrypt.hash(adminPassword, config.auth.bcryptRounds);
  const adminUser = await User.create({
    username: adminUsername,
    password: hashedPassword,
    role: COMPANY_ADMIN,
    companyId: company._id,
  });

  return {
    company,
    adminUser: {
      _id: adminUser._id,
      username: adminUser.username,
      role: adminUser.role,
    },
  };
}

export async function listCompanies() {
  return Company.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "companyId",
        as: "_users",
      },
    },
    {
      $lookup: {
        from: "invoices",
        let: { cid: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [
            { $eq: ["$companyId", "$$cid"] },
            { $eq: ["$deletedAt", null] }
          ] } } },
        ],
        as: "_invoices",
      },
    },
    {
      $addFields: {
        userCount: { $size: "$_users" },
        invoiceCount: { $size: "$_invoices" },
      },
    },
    { $project: { _users: 0, _invoices: 0 } },
  ]);
}

export async function getCompanyById(id) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid company ID");
  const company = await Company.findById(id);
  if (!company) throw new AppError(404, "Company not found");
  return company;
}

export async function updateCompany(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid company ID");
  const { isActive, _id, __v, ...safeData } = data;
  const company = await Company.findByIdAndUpdate(id, safeData, {
    new: true,
    runValidators: true,
  });
  if (!company) throw new AppError(404, "Company not found");
  return company;
}

// toggleCompanyActive removed — use subscription service activate/deactivate instead

export async function updateCompanyLogo(companyId, newFilename) {
  const company = await Company.findById(companyId);
  if (!company) throw new AppError(404, "Company not found");

  const oldFile = company.logoFile;
  company.logoFile = newFilename;
  await company.save();

  // Clean up old logo file (fire-and-forget)
  if (oldFile) {
    const oldPath = path.join(PUBLIC_DIR, oldFile);
    fs.unlink(oldPath, (err) => {
      if (err && err.code !== "ENOENT")
        console.warn(`[Logo] Failed to delete old logo ${oldFile}:`, err.message);
    });
  }

  return company;
}

export async function updateMyCompany(companyId, data) {
  // Strip fields the company admin must not change
  const { isActive, _id, __v, logoFile, ...safeData } = data;

  // Validate termsAndConditions length (strip blank entries first)
  if (safeData.termsAndConditions !== undefined) {
    if (!Array.isArray(safeData.termsAndConditions))
      throw new AppError(400, "termsAndConditions must be an array");
    safeData.termsAndConditions = safeData.termsAndConditions.filter(t => t.trim() !== "");
    if (safeData.termsAndConditions.length > maxTerms)
      throw new AppError(400, `Maximum ${maxTerms} terms and conditions allowed`);
  }

  const company = await Company.findByIdAndUpdate(companyId, safeData, {
    new: true,
    runValidators: true,
  });
  if (!company) throw new AppError(404, "Company not found");
  return company;
}

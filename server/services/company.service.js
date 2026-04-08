// server/services/company.service.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";

const { COMPANY_ADMIN } = config.roles;

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

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
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
  const companies = await Company.find().sort({ createdAt: -1 });
  return Promise.all(
    companies.map(async (company) => {
      const [userCount, invoiceCount] = await Promise.all([
        User.countDocuments({ companyId: company._id }),
        Invoice.countDocuments({ companyId: company._id }),
      ]);
      return { ...company.toObject(), userCount, invoiceCount };
    })
  );
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

export async function deleteCompany(id) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid company ID");
  const company = await Company.findByIdAndDelete(id);
  if (!company) throw new AppError(404, "Company not found");
  await Promise.all([
    User.deleteMany({ companyId: id }),
    Invoice.deleteMany({ companyId: id }),
  ]);
}

export async function toggleCompanyActive(id) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid company ID");
  const company = await Company.findById(id);
  if (!company) throw new AppError(404, "Company not found");
  company.isActive = !company.isActive;
  await company.save();
  return company;
}

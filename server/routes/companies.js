// server/routes/companies.js
import express from "express";
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import config from "../config.js";

const { SUPER_ADMIN, COMPANY_ADMIN } = config.roles;
const router = express.Router();

// All company routes require super admin
router.use(authenticate, requireRole(SUPER_ADMIN));

/* ================= CREATE COMPANY + FIRST ADMIN ================= */
router.post("/", async (req, res) => {
  const {
    // Company fields
    name,
    logoFile,
    tagline,
    registeredOffice,
    industryAddress,
    phones,
    email,
    website,
    // First admin fields
    adminUsername,
    adminPassword,
  } = req.body;

  if (!name || !adminUsername || !adminPassword) {
    return res.status(400).json({
      success: false,
      message: "name, adminUsername, and adminPassword are required",
    });
  }

  try {
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

    return res.status(201).json({
      success: true,
      company,
      adminUser: {
        _id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create company" });
  }
});

/* ================= LIST ALL COMPANIES ================= */
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    // Attach user and invoice counts
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const [userCount, invoiceCount] = await Promise.all([
          User.countDocuments({ companyId: company._id }),
          Invoice.countDocuments({ companyId: company._id }),
        ]);
        return { ...company.toObject(), userCount, invoiceCount };
      })
    );

    return res.json({ success: true, companies: companiesWithCounts });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch companies" });
  }
});

/* ================= GET SINGLE COMPANY ================= */
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    return res.json({ success: true, company });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch company" });
  }
});

/* ================= UPDATE COMPANY ================= */
router.put("/:id", async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    return res.json({ success: true, company });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update company" });
  }
});

/* ================= DELETE COMPANY ================= */
router.delete("/:id", async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    // Cascade delete all users and invoices for this company
    await Promise.all([
      User.deleteMany({ companyId: req.params.id }),
      Invoice.deleteMany({ companyId: req.params.id }),
    ]);

    return res.json({ success: true, message: "Company deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete company" });
  }
});

/* ================= TOGGLE ACTIVE ================= */
router.patch("/:id/toggle-active", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    company.isActive = !company.isActive;
    await company.save();

    return res.json({ success: true, company });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle company status" });
  }
});

export default router;

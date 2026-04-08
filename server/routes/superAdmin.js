// server/routes/superAdmin.js
import express from "express";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, requireRole(SUPER_ADMIN));

/* ================= PLATFORM STATS ================= */
router.get("/stats", async (req, res) => {
  try {
    const [totalCompanies, activeCompanies, totalUsers, totalInvoices] =
      await Promise.all([
        Company.countDocuments(),
        Company.countDocuments({ isActive: true }),
        User.countDocuments({ role: { $ne: "super_admin" } }),
        Invoice.countDocuments(),
      ]);

    return res.json({
      success: true,
      stats: { totalCompanies, activeCompanies, totalUsers, totalInvoices },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch stats" });
  }
});

/* ================= INVOICES FOR A COMPANY ================= */
router.get("/companies/:id/invoices", async (req, res) => {
  try {
    const invoices = await Invoice.find({ companyId: req.params.id }).sort({
      createdAt: -1,
    });
    return res.json({ success: true, invoices });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch invoices" });
  }
});

/* ================= USERS FOR A COMPANY ================= */
router.get("/companies/:id/users", async (req, res) => {
  try {
    const users = await User.find({ companyId: req.params.id }).select(
      "-password"
    );
    return res.json({ success: true, users });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch users" });
  }
});

export default router;

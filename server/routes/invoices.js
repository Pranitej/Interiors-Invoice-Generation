// server/routes/invoices.js
import express from "express";
import Invoice from "../models/Invoice.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import config from "../config.js";

const { COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN } = config.roles;
const router = express.Router();

// All invoice routes require authentication + company scoping
router.use(authenticate, scopeToCompany);

/* ================= CREATE ================= */
router.post(
  "/",
  requireRole(COMPANY_USER, COMPANY_ADMIN),
  async (req, res) => {
    try {
      const invoice = new Invoice({
        ...req.body,
        companyId: req.companyId,
        createdBy: req.user.userId,
      });
      await invoice.save();
      res.status(201).json(invoice);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  }
);

/* ================= READ LIST ================= */
router.get("/", async (req, res) => {
  try {
    const {
      q,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    const baseFilter = req.companyId ? { companyId: req.companyId } : {};

    const searchFilter = q
      ? {
          $or: [
            { "client.name": { $regex: q, $options: "i" } },
            { "client.mobile": { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const query = { ...baseFilter, ...searchFilter };

    const invoices = await Invoice.find(query)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Invoice.countDocuments(query);

    res.json({ data: invoices, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

/* ================= READ SINGLE ================= */
router.get("/:id", async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.companyId) filter.companyId = req.companyId;

    const invoice = await Invoice.findOne(filter);
    if (!invoice) return res.status(404).json({ error: "Not found" });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

/* ================= UPDATE ================= */
router.put(
  "/:id",
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const filter = { _id: req.params.id };
      if (req.companyId) filter.companyId = req.companyId;

      const updatedInvoice = await Invoice.findOneAndUpdate(filter, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updatedInvoice)
        return res.status(404).json({ message: "Invoice not found" });
      res.json(updatedInvoice);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  }
);

/* ================= DELETE ================= */
router.delete(
  "/:id",
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const filter = { _id: req.params.id };
      if (req.companyId) filter.companyId = req.companyId;

      const deletedInvoice = await Invoice.findOneAndDelete(filter);
      if (!deletedInvoice)
        return res.status(404).json({ message: "Invoice not found" });
      res.json({ message: "Invoice deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  }
);

export default router;

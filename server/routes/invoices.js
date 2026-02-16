import express from "express";
import Invoice from "../models/Invoice.js";

const router = express.Router();

/* ================= CREATE ================= */
router.post("/", async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

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

    const query = q
      ? {
          $or: [
            { "client.name": { $regex: q, $options: "i" } },
            { "client.mobile": { $regex: q, $options: "i" } },
            { _id: { $regex: q, $options: "i" } },
          ],
        }
      : {};

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
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Not found" });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

/* ================= UPDATE ================= */
router.put("/:id", async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedInvoice)
      return res.status(404).json({ message: "Invoice not found" });
    res.json(updatedInvoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update invoice" });
  }
});

/* ================= DELETE ================= */
router.delete("/:id", async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice)
      return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete invoice" });
  }
});

export default router;

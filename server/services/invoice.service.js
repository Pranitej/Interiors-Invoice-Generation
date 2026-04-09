// server/services/invoice.service.js
import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";

export async function createInvoice({ body, companyId, userId }) {
  const invoice = new Invoice({ ...body, companyId, createdBy: userId });
  await invoice.save();
  return invoice;
}

export async function listInvoices({
  companyId,
  q,
  sortBy = "createdAt",
  order = "desc",
  page = 1,
  limit = 50,
}) {
  const ALLOWED_SORT_FIELDS = new Set(["createdAt", "updatedAt", "client.name", "grandTotalBeforeDiscount"]);
  const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
  const baseFilter = companyId
    ? { companyId, deletedAt: null }
    : { deletedAt: null };
  const searchFilter = q
    ? {
        $or: [
          { "client.name": { $regex: q, $options: "i" } },
          { "client.mobile": { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const query = { ...baseFilter, ...searchFilter };

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .sort({ [safeSortBy]: order === "asc" ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Invoice.countDocuments(query),
  ]);

  return { invoices, total };
}

export async function getInvoiceById(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOne(filter);
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}

export async function updateInvoice(id, companyId, data) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const { companyId: _c, createdBy: _u, _id: _i, ...safeData } = data;
  const filter = { _id: id, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndUpdate(filter, safeData, {
    new: true,
    runValidators: true,
  });
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}

export async function deleteInvoice(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndUpdate(
    filter,
    { deletedAt: new Date() },
    { new: true }
  );
  if (!invoice) throw new AppError(404, "Invoice not found");
}

export async function listTrash(companyId) {
  const cutoff = new Date(Date.now() - config.invoice.trashRetentionDays * 24 * 60 * 60 * 1000);
  const filter = companyId ? { companyId } : {};
  await Invoice.deleteMany({ ...filter, deletedAt: { $lt: cutoff } });
  return Invoice.find({ ...filter, deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
}

export async function restoreInvoice(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: { $ne: null } };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndUpdate(
    filter,
    { deletedAt: null },
    { new: true }
  );
  if (!invoice) throw new AppError(404, "Invoice not found in trash");
  return invoice;
}

export async function permanentDelete(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: { $ne: null } };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndDelete(filter);
  if (!invoice) throw new AppError(404, "Invoice not found in trash");
}

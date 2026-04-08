// server/services/invoice.service.js
import Invoice from "../models/Invoice.js";
import AppError from "../utils/AppError.js";

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
  const baseFilter = companyId ? { companyId } : {};
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
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit)),
    Invoice.countDocuments(query),
  ]);

  return { invoices, total };
}

export async function getInvoiceById(id, companyId) {
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOne(filter);
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}

export async function updateInvoice(id, companyId, data) {
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndUpdate(filter, data, {
    new: true,
    runValidators: true,
  });
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}

export async function deleteInvoice(id, companyId) {
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndDelete(filter);
  if (!invoice) throw new AppError(404, "Invoice not found");
}

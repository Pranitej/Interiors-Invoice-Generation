// server/routes/invoice.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import * as InvoiceController from "../controllers/invoice.controller.js";
import config from "../config.js";

const { COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, scopeToCompany);

router.post("/", requireRole(COMPANY_USER, COMPANY_ADMIN), InvoiceController.createInvoice);
router.get("/trash", InvoiceController.listTrash);
router.get("/", InvoiceController.listInvoices);
router.get("/:id", InvoiceController.getInvoice);
router.put("/:id", requireRole(COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN), InvoiceController.updateInvoice);
router.delete("/:id", requireRole(COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN), InvoiceController.deleteInvoice);
router.patch("/:id/restore", InvoiceController.restoreInvoice);
router.delete("/:id/permanent", requireRole(COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN), InvoiceController.permanentDeleteInvoice);

export default router;

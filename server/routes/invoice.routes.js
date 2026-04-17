// server/routes/invoice.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import {
  requireInvoiceAccess,
  requireDownloadAccess,
} from "../middleware/checkSubscription.js";
import * as InvoiceController from "../controllers/invoice.controller.js";
import config from "../config.js";

const { COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, scopeToCompany);

// Create/update require active subscription
router.post(
  "/",
  requireRole(COMPANY_USER, COMPANY_ADMIN),
  requireInvoiceAccess,
  InvoiceController.createInvoice
);

router.post(
  "/compare",
  requireRole(COMPANY_USER, COMPANY_ADMIN),
  requireInvoiceAccess,
  InvoiceController.compareInvoices
);

router.get("/trash", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.listTrash);
router.get("/", InvoiceController.listInvoices);
router.get("/:id", InvoiceController.getInvoice);

router.put(
  "/:id",
  requireRole(COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN),
  requireInvoiceAccess,
  InvoiceController.updateInvoice
);

router.delete("/:id", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.deleteInvoice);
router.patch("/:id/restore", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.restoreInvoice);
router.delete("/:id/permanent", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.permanentDeleteInvoice);

export default router;

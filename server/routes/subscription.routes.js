// server/routes/subscription.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as SubscriptionController from "../controllers/subscription.controller.js";
import { sendError } from "../utils/response.js";
import config from "../config.js";

const { SUPER_ADMIN, COMPANY_ADMIN, COMPANY_USER } = config.roles;
const { allowedMimeTypes, maxFileSizeMb, destination } = config.upload;

const router = express.Router();

// --- Multer for UPI QR upload ---
const storage = multer.diskStorage({
  destination,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `qr-${Date.now()}${ext}`);
  },
});

const allowedMimeSet = new Set(allowedMimeTypes);
const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeSet.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed for QR code"));
  },
});

router.use((err, _req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return sendError(res, 400, `File exceeds ${maxFileSizeMb} MB limit`);
  if (err instanceof multer.MulterError || (err.message && !err.status))
    return sendError(res, 400, err.message);
  next(err);
});

// ─── Company-side routes (company admin + company user) ──────────────────────

// Own company subscription status (company admin + user)
router.get(
  "/status",
  authenticate,
  requireRole(COMPANY_ADMIN, COMPANY_USER),
  SubscriptionController.getMySubscriptionStatus
);

// Own company transaction history (company admin only)
router.get(
  "/my/transactions",
  authenticate,
  requireRole(COMPANY_ADMIN),
  SubscriptionController.getMyTransactions
);

// ─── Platform settings (all authenticated can read, super admin can write) ───
router.get(
  "/platform-settings",
  authenticate,
  SubscriptionController.getPlatformSettings
);

router.put(
  "/platform-settings",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.updatePlatformSettings
);

router.post(
  "/platform-settings/qr",
  authenticate,
  requireRole(SUPER_ADMIN),
  upload.single("qr"),
  SubscriptionController.updateUpiQr
);

// ─── Company-specific management (super admin only) ──────────────────────────

router.get(
  "/companies/:id/status",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.getCompanySubscriptionStatus
);

router.post(
  "/companies/:id/activate",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.activateSubscription
);

router.patch(
  "/companies/:id/deactivate",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.deactivateCompany
);

router.patch(
  "/companies/:id/activate-company",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.activateCompanyManually
);

router.patch(
  "/companies/:id/toggle-invoices",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.toggleInvoices
);

router.patch(
  "/companies/:id/toggle-login",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.toggleLogin
);

router.patch(
  "/companies/:id/toggle-downloads",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.toggleDownloads
);

router.patch(
  "/companies/:id/amount",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.updateCompanySubscriptionAmount
);

router.get(
  "/companies/:id/transactions",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.getTransactionHistory
);

router.delete(
  "/transactions/:txId",
  authenticate,
  requireRole(SUPER_ADMIN),
  SubscriptionController.deleteTransaction
);

export default router;

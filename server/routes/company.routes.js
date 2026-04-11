// server/routes/company.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as CompanyController from "../controllers/company.controller.js";
import { sendError } from "../utils/response.js";
import config from "../config.js";

const { SUPER_ADMIN, COMPANY_ADMIN } = config.roles;
const { allowedMimeTypes, maxFileSizeMb, destination } = config.upload;

const router = express.Router();

// --- Multer setup for logo upload (same config as upload.routes.js) ---
const storage = multer.diskStorage({
  destination,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const allowedMimeSet = new Set(allowedMimeTypes);
const allowedLabel = allowedMimeTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ");

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeSet.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Only ${allowedLabel} images are allowed`));
  },
});

// --- Company-admin logo upload (before super-admin guard) ---
router.post(
  "/my/logo",
  authenticate,
  requireRole(COMPANY_ADMIN),
  upload.single("logo"),
  CompanyController.updateLogo,
);

// Multer error handler for this route
router.use((err, _req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return sendError(res, 400, `File exceeds ${maxFileSizeMb} MB limit`);
  if (err.message && err instanceof multer.MulterError)
    return sendError(res, 400, err.message);
  // Non-multer errors with a message (e.g. file filter rejection)
  if (err.message && !err.status)
    return sendError(res, 400, err.message);
  next(err);
});

// --- Super-admin-only company management routes ---
router.use(authenticate, requireRole(SUPER_ADMIN));

router.post("/", CompanyController.createCompany);
router.get("/", CompanyController.listCompanies);
router.get("/:id", CompanyController.getCompany);
router.put("/:id", CompanyController.updateCompany);
router.delete("/:id", CompanyController.deleteCompany);
router.patch("/:id/toggle-active", CompanyController.toggleActive);

export default router;

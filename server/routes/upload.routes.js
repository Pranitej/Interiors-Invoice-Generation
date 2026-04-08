// server/routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as UploadController from "../controllers/upload.controller.js";
import { sendError } from "../utils/response.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const { allowedMimeTypes, maxFileSizeMb, destination } = config.upload;
const router = express.Router();

const storage = multer.diskStorage({
  destination,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const allowedMimeSet = new Set(allowedMimeTypes);

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeSet.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
  },
});

router.post(
  "/logo",
  authenticate,
  requireRole(SUPER_ADMIN),
  upload.single("logo"),
  UploadController.uploadLogo
);

router.use((err, _req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return sendError(res, 400, `File exceeds ${maxFileSizeMb} MB limit`);
  if (err.message)
    return sendError(res, 400, err.message);
  next(err);
});

export default router;

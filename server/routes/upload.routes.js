// server/routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as UploadController from "../controllers/upload.controller.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const router = express.Router();

const storage = multer.diskStorage({
  destination: "public/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
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

// Handle multer errors (file size, type rejection) with a JSON response
router.use((err, _req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ success: false, message: "File exceeds 2 MB limit" });
  if (err.message)
    return res.status(400).json({ success: false, message: err.message });
  next(err);
});

export default router;

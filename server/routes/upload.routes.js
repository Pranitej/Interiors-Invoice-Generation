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

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.post(
  "/logo",
  authenticate,
  requireRole(SUPER_ADMIN),
  upload.single("logo"),
  UploadController.uploadLogo
);

export default router;

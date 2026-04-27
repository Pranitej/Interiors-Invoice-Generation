// server/routes/pdf.routes.js
import express from "express";
import { renderState, MAX_HTML_BYTES } from "../services/pdf.service.js";
import * as PdfController from "../controllers/pdf.controller.js";
import authenticate from "../middleware/authenticate.js";
import { requireDownloadAccess } from "../middleware/checkSubscription.js";
import { sendError, sendSuccess } from "../utils/response.js";
import logger from "../utils/logger.js";

const router = express.Router();

const validatePayload = (req, res, next) => {
  const bytes = parseInt(req.headers["content-length"] || "0", 10);
  if (bytes > MAX_HTML_BYTES)
    return sendError(res, 413, "Payload too large");

  const { html } = req.body;
  if (!html || typeof html !== "string" || html.trim().length === 0)
    return sendError(res, 400, "html is required");

  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES)
    return sendError(res, 413, "HTML content too large");

  next();
};

const concurrencyGuard = (req, res, next) => {
  if (renderState.isBusy()) {
    logger.warn(`[PDF] Rejected — active: ${renderState.active}/${renderState.maxConcurrent}`);
    return res.status(429).json({
      success: false,
      message: "PDF generation in progress, please try again in a moment",
      data: { activeRenders: renderState.active, maxConcurrent: renderState.maxConcurrent },
    });
  }
  next();
};

router.get("/status", PdfController.getStatus);
router.post(
  "/render",
  authenticate,
  requireDownloadAccess,
  validatePayload,
  concurrencyGuard,
  PdfController.renderPdf
);

export default router;

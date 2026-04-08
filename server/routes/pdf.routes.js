// server/routes/pdf.routes.js
import express from "express";
import { renderState, MAX_HTML_BYTES } from "../services/pdf.service.js";
import * as PdfController from "../controllers/pdf.controller.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

const validatePayload = (req, res, next) => {
  const bytes = parseInt(req.headers["content-length"] || "0", 10);
  if (bytes > MAX_HTML_BYTES)
    return res.status(413).json({ error: "Payload too large" });

  const { html } = req.body;
  if (!html || typeof html !== "string" || html.trim().length === 0)
    return res.status(400).json({ error: "html is required" });

  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES)
    return res.status(413).json({ error: "HTML content too large" });

  next();
};

const concurrencyGuard = (req, res, next) => {
  if (renderState.isBusy()) {
    console.warn(`[PDF] Rejected — active: ${renderState.active}/${renderState.maxConcurrent}`);
    return res.status(429).json({
      error: "PDF generation in progress, please try again in a moment",
      activeRenders: renderState.active,
      maxConcurrent: renderState.maxConcurrent,
    });
  }
  next();
};

router.get("/status", PdfController.getStatus);
router.post("/render", authenticate, validatePayload, concurrencyGuard, PdfController.renderPdf);

export default router;

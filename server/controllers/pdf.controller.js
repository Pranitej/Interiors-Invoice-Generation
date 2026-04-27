// server/controllers/pdf.controller.js
import crypto from "crypto";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  renderState,
  generatePDFWithTimeout,
  SLOT_LEASE_MS,
} from "../services/pdf.service.js";
import logger from "../utils/logger.js";

export function getStatus(req, res) {
  sendSuccess(res, {
    activeRenders: renderState.active,
    maxConcurrent: renderState.maxConcurrent,
    available: renderState.maxConcurrent - renderState.active,
  });
}

export async function renderPdf(req, res) {
  const requestId = crypto.randomUUID();
  renderState.increment();

  const leaseTimer = setTimeout(() => {
    logger.error(`[PDF] SAFETY RESET — slot leaked for ${requestId}`);
    renderState.decrement();
  }, SLOT_LEASE_MS);

  logger.info(`[PDF] Start ${requestId} | active: ${renderState.active}/${renderState.maxConcurrent}`);

  try {
    const pdfBuffer = await generatePDFWithTimeout(req.body.html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("X-Request-Id", requestId);
    res.end(pdfBuffer);

    logger.info(`[PDF] Done ${requestId} | ${pdfBuffer.length} bytes`);
  } catch (err) {
    logger.error(`[PDF] Failed ${requestId} — ${err.message}`);
    if (!res.headersSent) {
      res.setHeader("X-Request-Id", requestId);
      sendError(res, 500, "PDF generation failed");
    }
  } finally {
    clearTimeout(leaseTimer);
    renderState.decrement();
    logger.info(`[PDF] Released ${requestId} | active: ${renderState.active}/${renderState.maxConcurrent}`);
  }
}

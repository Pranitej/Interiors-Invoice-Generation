// server/controllers/pdf.controller.js
import crypto from "crypto";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  renderState,
  generatePDFWithTimeout,
  SLOT_LEASE_MS,
} from "../services/pdf.service.js";

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
    console.error(`[PDF] SAFETY RESET — slot leaked for ${requestId}`);
    renderState.decrement();
  }, SLOT_LEASE_MS);

  console.log(
    `[PDF] Start ${requestId} | active: ${renderState.active}/${renderState.maxConcurrent}`
  );

  try {
    const pdfBuffer = await generatePDFWithTimeout(req.body.html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("X-Request-Id", requestId);
    res.end(pdfBuffer);

    console.log(`[PDF] Done ${requestId} | ${pdfBuffer.length} bytes`);
  } catch (err) {
    console.error(`[PDF] Failed ${requestId}: ${err.message}`);
    if (!res.headersSent) {
      sendError(res, 500, "PDF generation failed");
    }
  } finally {
    clearTimeout(leaseTimer);
    renderState.decrement();
    console.log(
      `[PDF] Released ${requestId} | active: ${renderState.active}/${renderState.maxConcurrent}`
    );
  }
}

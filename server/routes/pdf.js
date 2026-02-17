import express from "express";
import puppeteer from "puppeteer";
import crypto from "crypto";

const router = express.Router();

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_CONCURRENT = 2;
const MAX_HTML_BYTES = 512_000;
const PDF_TIMEOUT_MS = 45_000;
const BROWSER_TIMEOUT_MS = 60_000;
const RETRY_COUNT = 2;
const SLOT_LEASE_MS = PDF_TIMEOUT_MS + 10_000; // 55s safety reset

// ─── Concurrency tracker ──────────────────────────────────────────────────────
const renderState = {
  active: 0,
  increment() {
    this.active = Math.min(this.active + 1, MAX_CONCURRENT + 10);
  },
  decrement() {
    this.active = Math.max(this.active - 1, 0);
  },
  isBusy() {
    return this.active >= MAX_CONCURRENT;
  },
};

// ─── PDF generation ───────────────────────────────────────────────────────────
async function generatePDF(html, retries = RETRY_COUNT) {
  let browser = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        timeout: BROWSER_TIMEOUT_MS,
      });

      const page = await browser.newPage();
      page.setDefaultTimeout(PDF_TIMEOUT_MS);
      page.setDefaultNavigationTimeout(PDF_TIMEOUT_MS);

      await page.setContent(
        `<!DOCTYPE html>
         <html>
           <head>
             <meta charset="utf-8"/>
             <style>
               * {
                 -webkit-print-color-adjust: exact !important;
                 print-color-adjust: exact !important;
                 box-sizing: border-box;
               }
               @page { margin: 0; }
               html, body {
                 margin: 0;
                 padding: 0;
                 font-family: Arial, Helvetica, sans-serif;
               }
               tr  { page-break-inside: avoid; }
               img { max-width: 100%; }
             </style>
           </head>
           <body>${html}</body>
         </html>`,
        // networkidle0 waits for the logo image to fully load before capturing
        { waitUntil: "networkidle0", timeout: PDF_TIMEOUT_MS },
      );

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();
      browser = null;
      return pdfBuffer;
    } catch (err) {
      console.error(
        `[PDF] Attempt ${attempt}/${retries} failed: ${err.message}`,
      );
      if (browser) {
        try {
          await browser.close();
        } catch (_) {}
        browser = null;
      }
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, attempt * 600));
    }
  }
}

// Hard wall-clock timeout — frees the slot even if Puppeteer hangs internally
function generatePDFWithTimeout(html) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`PDF generation timed out after ${PDF_TIMEOUT_MS}ms`));
    }, PDF_TIMEOUT_MS);

    generatePDF(html)
      .then((buf) => {
        clearTimeout(timer);
        resolve(buf);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ─── Middleware ────────────────────────────────────────────────────────────────
const validatePayload = (req, res, next) => {
  const bytes = parseInt(req.headers["content-length"] || "0", 10);
  if (bytes > MAX_HTML_BYTES) {
    return res.status(413).json({ error: "Payload too large" });
  }
  const { html } = req.body;
  if (!html || typeof html !== "string" || html.trim().length === 0) {
    return res.status(400).json({ error: "html is required" });
  }
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    return res.status(413).json({ error: "HTML content too large" });
  }
  next();
};

const concurrencyGuard = (req, res, next) => {
  if (renderState.isBusy()) {
    console.warn(
      `[PDF] Rejected — active: ${renderState.active}/${MAX_CONCURRENT}`,
    );
    return res.status(429).json({
      error: "PDF generation in progress, please try again in a moment",
      activeRenders: renderState.active,
      maxConcurrent: MAX_CONCURRENT,
    });
  }
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/pdf/status — check if counter is stuck in production
router.get("/status", (_req, res) => {
  res.json({
    activeRenders: renderState.active,
    maxConcurrent: MAX_CONCURRENT,
    available: MAX_CONCURRENT - renderState.active,
  });
});

// POST /api/pdf/render
router.post("/render", validatePayload, concurrencyGuard, async (req, res) => {
  const requestId = crypto.randomUUID();
  renderState.increment();

  // Safety lease — force releases slot if finally block never runs
  // (OOM kill, uncaught exception in Puppeteer internals, SIGTERM, etc.)
  const leaseTimer = setTimeout(() => {
    console.error(`[PDF] SAFETY RESET — slot leaked for ${requestId}`);
    renderState.decrement();
  }, SLOT_LEASE_MS);

  console.log(
    `[PDF] Start ${requestId} | active: ${renderState.active}/${MAX_CONCURRENT}`,
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
      res.status(500).json({ error: "PDF generation failed", requestId });
    }
  } finally {
    clearTimeout(leaseTimer);
    renderState.decrement();
    console.log(
      `[PDF] Released ${requestId} | active: ${renderState.active}/${MAX_CONCURRENT}`,
    );
  }
});

export default router;

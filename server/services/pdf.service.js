// server/services/pdf.service.js
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

const {
  maxConcurrent,
  pdfTimeoutSec,
  browserTimeoutSec,
  retryCount,
  retryDelayBaseMs,
  maxHtmlBytes,
  slotLeaseBufferSec,
} = config.pdf;

const PDF_TIMEOUT_MS = pdfTimeoutSec * 1000;
const BROWSER_TIMEOUT_MS = browserTimeoutSec * 1000;

export { maxHtmlBytes as MAX_HTML_BYTES };
export const SLOT_LEASE_MS = PDF_TIMEOUT_MS + slotLeaseBufferSec * 1000;

export const renderState = {
  active: 0,
  increment() {
    this.active = Math.min(this.active + 1, maxConcurrent + 10);
  },
  decrement() {
    this.active = Math.max(this.active - 1, 0);
  },
  isBusy() {
    return this.active >= maxConcurrent;
  },
  get maxConcurrent() {
    return maxConcurrent;
  },
};

// Replace /public/... image URLs with base64 data URIs so Puppeteer
// doesn't need to make network requests back to the server.
function embedLocalImages(html) {
  const extToMime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp" };
  return html.replace(
    /https?:\/\/[^"']+?\/public\/([^"'\s]+)/g,
    (match, filename) => {
      try {
        const filePath = path.join(PUBLIC_DIR, filename);
        if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) return match;
        if (!fs.existsSync(filePath)) return match;
        const ext = path.extname(filename).toLowerCase();
        const mime = extToMime[ext] || "application/octet-stream";
        const base64 = fs.readFileSync(filePath).toString("base64");
        return `data:${mime};base64,${base64}`;
      } catch (_) {
        return match;
      }
    },
  );
}

async function generatePDF(html, retries = retryCount) {
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

      const readyHtml = embedLocalImages(html);

      await page.setContent(
        `<!DOCTYPE html>
         <html>
           <head>
             <meta charset="utf-8"/>
             <style>
               * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
               @page { margin: 0; }
               html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
               tr { page-break-inside: avoid; }
               img { max-width: 100%; }
             </style>
           </head>
           <body>${readyHtml}</body>
         </html>`,
        { waitUntil: "networkidle0", timeout: PDF_TIMEOUT_MS }
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
      console.error(`[PDF] Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (browser) {
        try { await browser.close(); } catch (_) {}
        browser = null;
      }
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, attempt * retryDelayBaseMs));
    }
  }
}

export function generatePDFWithTimeout(html) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`PDF generation timed out after ${PDF_TIMEOUT_MS}ms`)),
      PDF_TIMEOUT_MS
    );
    generatePDF(html)
      .then((buf) => { clearTimeout(timer); resolve(buf); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

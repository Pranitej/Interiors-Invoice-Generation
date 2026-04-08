// server/services/pdf.service.js
import puppeteer from "puppeteer";

const MAX_CONCURRENT = 2;
const PDF_TIMEOUT_MS = 45_000;
const BROWSER_TIMEOUT_MS = 60_000;
const RETRY_COUNT = 2;

export const MAX_HTML_BYTES = 512_000;
export const SLOT_LEASE_MS = PDF_TIMEOUT_MS + 10_000; // 55s safety reset

export const renderState = {
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
  get maxConcurrent() {
    return MAX_CONCURRENT;
  },
};

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
               * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
               @page { margin: 0; }
               html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
               tr { page-break-inside: avoid; }
               img { max-width: 100%; }
             </style>
           </head>
           <body>${html}</body>
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
      await new Promise((r) => setTimeout(r, attempt * 600));
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

import express from "express";
import puppeteer from "puppeteer";

const router = express.Router();

router.post("/render", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) return res.sendStatus(400);

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(
      `<!DOCTYPE html>
       <html>
       <head>
         <meta charset="utf-8"/>
         <script src="https://cdn.tailwindcss.com"></script>
       </head>
       <body>${html}</body>
       </html>`,
      { waitUntil: "networkidle0" }
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    res.contentType("application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.end(pdf);
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("PDF generation failed");
  }
});

export default router;

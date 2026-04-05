# PDF Logo Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a house SVG fallback instead of alt text in downloaded PDFs when the configured logo file is missing.

**Architecture:** Pre-fetch the logo URL in the browser before `renderToStaticMarkup`. If found, embed as a base64 data URI (Puppeteer needs no network call). If missing, pass `null` so the invoice component renders the fallback SVG inline. Browser preview is unchanged — it still uses the URL + existing `onError` handler.

**Tech Stack:** React (forwardRef components), `react-dom/server` (`renderToStaticMarkup`), native `fetch` + `FileReader` for base64 conversion, Puppeteer (server-side, no changes needed)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `client/src/components/FallbackLogo.jsx` | Shared 64×64 house SVG — rendered inline for missing logos |
| Modify | `client/src/components/AdminInvoice.jsx` | Accept `logoSrc` prop; conditional render |
| Modify | `client/src/components/ClientInvoice.jsx` | Accept `logoSrc` prop; conditional render |
| Modify | `client/src/components/CompareInvoices.jsx` | Accept `logoSrc` on `InvoiceComparisonReport`; conditional render |
| Modify | `client/src/pages/History.jsx` | Pre-fetch logo before `renderToStaticMarkup`; pass `logoSrc` |
| Modify | `client/src/pages/Compare.jsx` | Pre-fetch logo before `renderToStaticMarkup`; pass `logoSrc` |

---

## Task 1: Create `FallbackLogo` component

**Files:**
- Create: `client/src/components/FallbackLogo.jsx`

This component renders the 64×64 house SVG that was previously buried in `onError` innerHTML strings. Extracting it means all four components share a single source of truth.

- [ ] **Step 1: Create the file**

`client/src/components/FallbackLogo.jsx`:
```jsx
// client/src/components/FallbackLogo.jsx
export default function FallbackLogo() {
  return (
    <div
      style={{
        width: "64px",
        height: "64px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file exists**

```bash
ls client/src/components/FallbackLogo.jsx
```
Expected: file listed with no error.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/FallbackLogo.jsx
git commit -m "feat: add shared FallbackLogo component"
```

---

## Task 2: Update `AdminInvoice` — accept `logoSrc` prop

**Files:**
- Modify: `client/src/components/AdminInvoice.jsx:6` (function signature)
- Modify: `client/src/components/AdminInvoice.jsx:527-536` (logo render block)

`logoSrc` behaviour:
- `string` (base64 data URI) → `<img src={logoSrc}>`, no `onError` needed
- `null` → render `<FallbackLogo />` inline (PDF, no logo file)
- `undefined` (prop not passed) → existing: `<img src={logoURL} onError=…>` (browser preview)

- [ ] **Step 1: Add `FallbackLogo` import**

At the top of `client/src/components/AdminInvoice.jsx`, after the existing imports, add:
```js
import FallbackLogo from "./FallbackLogo";
```

- [ ] **Step 2: Update function signature**

Change line 6 from:
```js
const AdminInvoice = forwardRef(function AdminInvoice({ invoice }, ref) {
```
to:
```js
const AdminInvoice = forwardRef(function AdminInvoice({ invoice, logoSrc }, ref) {
```

- [ ] **Step 3: Replace the logo render block**

Find this block (around line 526–536):
```jsx
<div style={s.logoContainer}>
  <img
    src={logoURL}
    alt={`${companyConfig.name} Logo`}
    style={s.logoImg}
    onError={(e) => {
      e.currentTarget.style.display = "none";
      const parent = e.currentTarget.parentElement;
      parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
    }}
  />
</div>
```

Replace with:
```jsx
<div style={s.logoContainer}>
  {logoSrc === null ? (
    <FallbackLogo />
  ) : (
    <img
      src={logoSrc !== undefined ? logoSrc : logoURL}
      alt={`${companyConfig.name} Logo`}
      style={s.logoImg}
      onError={
        logoSrc === undefined
          ? (e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
            }
          : undefined
      }
    />
  )}
</div>
```

- [ ] **Step 4: Verify in browser**

Start the dev server (`npm run dev` in `client/`). Open any invoice preview page. The logo should still display normally (browser preview passes no `logoSrc` → falls through to URL + `onError`).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AdminInvoice.jsx
git commit -m "feat: AdminInvoice accepts logoSrc prop for PDF fallback"
```

---

## Task 3: Update `ClientInvoice` — accept `logoSrc` prop

**Files:**
- Modify: `client/src/components/ClientInvoice.jsx:6` (function signature)
- Modify: `client/src/components/ClientInvoice.jsx:542-551` (logo render block)

- [ ] **Step 1: Add `FallbackLogo` import**

At the top of `client/src/components/ClientInvoice.jsx`, after existing imports:
```js
import FallbackLogo from "./FallbackLogo";
```

- [ ] **Step 2: Update function signature**

Change line 6 from:
```js
const ClientInvoice = forwardRef(({ invoice }, ref) => {
```
to:
```js
const ClientInvoice = forwardRef(({ invoice, logoSrc }, ref) => {
```

- [ ] **Step 3: Replace the logo render block**

Find this block (around line 541–551):
```jsx
<div style={s.logoContainer}>
  <img
    src={`${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`}
    alt={`${companyConfig.name} Logo`}
    style={s.logoImg}
    onError={(e) => {
      e.currentTarget.style.display = "none";
      const parent = e.currentTarget.parentElement;
      parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
    }}
  />
</div>
```

Replace with:
```jsx
<div style={s.logoContainer}>
  {logoSrc === null ? (
    <FallbackLogo />
  ) : (
    <img
      src={
        logoSrc !== undefined
          ? logoSrc
          : `${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`
      }
      alt={`${companyConfig.name} Logo`}
      style={s.logoImg}
      onError={
        logoSrc === undefined
          ? (e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
            }
          : undefined
      }
    />
  )}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ClientInvoice.jsx
git commit -m "feat: ClientInvoice accepts logoSrc prop for PDF fallback"
```

---

## Task 4: Update `InvoiceComparisonReport` — accept `logoSrc` prop

**Files:**
- Modify: `client/src/components/CompareInvoices.jsx:126` (function signature)
- Modify: `client/src/components/CompareInvoices.jsx:271-284` (logo render block)

`InvoiceComparisonReport` is the inner function used by `Compare.jsx` for PDF rendering. `CompareInvoices` (the default export, used for browser display) does NOT need the prop.

- [ ] **Step 1: Add `FallbackLogo` import**

At the top of `client/src/components/CompareInvoices.jsx`, after existing imports:
```js
import FallbackLogo from "./FallbackLogo";
```

- [ ] **Step 2: Update `InvoiceComparisonReport` signature**

Change line 126 from:
```js
function InvoiceComparisonReport({ invoiceA, invoiceB }, ref) {
```
to:
```js
function InvoiceComparisonReport({ invoiceA, invoiceB, logoSrc }, ref) {
```

- [ ] **Step 3: Replace the logo render block**

Find this block (around line 263–285) inside `InvoiceComparisonReport`:
```jsx
{/* Logo Container */}
<div
  style={{
    width: "64px",
    height: "64px",
    flexShrink: 0,
    marginTop: "4px",
  }}
>
  <img
    src={`${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`}
    alt={`${companyConfig.name} Logo`}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "contain",
    }}
    onError={(e) => {
      e.currentTarget.style.display = "none";
      const parent = e.currentTarget.parentElement;
      parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
    }}
  />
</div>
```

Replace with:
```jsx
{/* Logo Container */}
<div
  style={{
    width: "64px",
    height: "64px",
    flexShrink: 0,
    marginTop: "4px",
  }}
>
  {logoSrc === null ? (
    <FallbackLogo />
  ) : (
    <img
      src={
        logoSrc !== undefined
          ? logoSrc
          : `${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`
      }
      alt={`${companyConfig.name} Logo`}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
      onError={
        logoSrc === undefined
          ? (e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
            }
          : undefined
      }
    />
  )}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/CompareInvoices.jsx
git commit -m "feat: InvoiceComparisonReport accepts logoSrc prop for PDF fallback"
```

---

## Task 5: Update `History.jsx` — pre-fetch logo, pass `logoSrc`

**Files:**
- Modify: `client/src/pages/History.jsx:156-191` (`handleDownload` function)

- [ ] **Step 1: Replace `handleDownload`**

Find the full `handleDownload` function (lines 156–191):
```js
const handleDownload = async (id, type) => {
  try {
    setIsDownloading(true);
    setActiveInvoice(id);

    const invoice = (await api.get(`/invoices/${id}`)).data;
    const Component = type === "admin" ? AdminInvoice : ClientInvoice;

    // Only send the component HTML — no wrapping document needed.
    // pdf.js wraps it in a full HTML document with correct styles.
    const html = renderToStaticMarkup(<Component invoice={invoice} />);

    const res = await api.post(
      "/pdf/render",
      { html },
      { responseType: "blob" },
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${companyConfig.name}-${type}-Invoice-${id.slice(-6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("PDF generation failed");
  } finally {
    setIsDownloading(false);
    setActiveInvoice(null);
  }
};
```

Replace with:
```js
const handleDownload = async (id, type) => {
  try {
    setIsDownloading(true);
    setActiveInvoice(id);

    const invoice = (await api.get(`/invoices/${id}`)).data;
    const Component = type === "admin" ? AdminInvoice : ClientInvoice;

    // Pre-fetch logo so Puppeteer gets a base64 data URI instead of a URL.
    // renderToStaticMarkup strips onError handlers, so we resolve the logo
    // here in the browser before generating static HTML.
    const logoURL = `${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`;
    let logoSrc = null;
    try {
      const logoRes = await fetch(logoURL);
      if (logoRes.ok) {
        const blob = await logoRes.blob();
        logoSrc = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Logo unreachable — SVG fallback will render inline
    }

    const html = renderToStaticMarkup(
      <Component invoice={invoice} logoSrc={logoSrc} />,
    );

    const res = await api.post(
      "/pdf/render",
      { html },
      { responseType: "blob" },
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${companyConfig.name}-${type}-Invoice-${id.slice(-6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("PDF generation failed");
  } finally {
    setIsDownloading(false);
    setActiveInvoice(null);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/History.jsx
git commit -m "feat: pre-fetch logo as base64 before PDF generation in History"
```

---

## Task 6: Update `Compare.jsx` — pre-fetch logo, pass `logoSrc`

**Files:**
- Modify: `client/src/pages/Compare.jsx:47-99` (`handleDownload` function)

- [ ] **Step 1: Add `companyConfig` import**

Check line 1–16 of `client/src/pages/Compare.jsx`. If `companyConfig` is not already imported, add it after the existing imports:
```js
import companyConfig from "../config.js";
```

- [ ] **Step 2: Replace `handleDownload`**

Find the full `handleDownload` function (lines 47–99):
```js
const handleDownload = async () => {
  if (!invoiceAData || !invoiceBData) {
    alert("Please select and load both invoices before downloading");
    return;
  }

  setDownloading(true);
  try {
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            @page { margin: 0mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body class="p-0 m-0">
        ${renderToStaticMarkup(
          <InvoiceComparisonReport
            invoiceA={invoiceAData}
            invoiceB={invoiceBData}
          />,
        )}
      </body>
    </html>`;

    const res = await API.post(
      "/pdf/render",
      { html },
      { responseType: "blob" },
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-Comparison-${invoiceAData.invoiceNumber || invoiceAId.slice(-6)}-${invoiceBData.invoiceNumber || invoiceBId.slice(-6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setDownloading(false);
  }
};
```

Replace with:
```js
const handleDownload = async () => {
  if (!invoiceAData || !invoiceBData) {
    alert("Please select and load both invoices before downloading");
    return;
  }

  setDownloading(true);
  try {
    // Pre-fetch logo so Puppeteer gets a base64 data URI instead of a URL.
    const logoURL = `${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`;
    let logoSrc = null;
    try {
      const logoRes = await fetch(logoURL);
      if (logoRes.ok) {
        const blob = await logoRes.blob();
        logoSrc = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Logo unreachable — SVG fallback will render inline
    }

    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            @page { margin: 0mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body class="p-0 m-0">
        ${renderToStaticMarkup(
          <InvoiceComparisonReport
            invoiceA={invoiceAData}
            invoiceB={invoiceBData}
            logoSrc={logoSrc}
          />,
        )}
      </body>
    </html>`;

    const res = await API.post(
      "/pdf/render",
      { html },
      { responseType: "blob" },
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-Comparison-${invoiceAData.invoiceNumber || invoiceAId.slice(-6)}-${invoiceBData.invoiceNumber || invoiceBId.slice(-6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setDownloading(false);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Compare.jsx
git commit -m "feat: pre-fetch logo as base64 before PDF generation in Compare"
```

---

## Task 7: Manual verification (local + VPS)

### Local verification

- [ ] **Step 1: Start both servers**

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

- [ ] **Step 2: Test — logo present**

1. Confirm `server/public/<logoFile>` exists (e.g. `server/public/logo1.png`)
2. Open History page → download Admin Invoice PDF
3. Open the PDF — logo image should appear in the header

- [ ] **Step 3: Test — logo missing (fallback)**

1. Temporarily rename the logo file:
   ```bash
   mv server/public/logo1.png server/public/logo1.png.bak
   ```
2. Download Admin Invoice PDF again
3. Open the PDF — the header should show the house SVG icon instead of alt text
4. Download Client Invoice PDF — same result
5. Download Comparison PDF — same result
6. Restore the logo:
   ```bash
   mv server/public/logo1.png.bak server/public/logo1.png
   ```

- [ ] **Step 4: Test — browser preview unchanged**

Open any invoice preview in the browser (not download). With logo missing, the browser should still show the house SVG via the existing `onError` handler (not via `logoSrc`).

---

### VPS deployment notes

- [ ] **Step 5: Build the client for production**

```bash
cd client
VITE_API_BASE=https://your-api-domain.com npm run build
# dist/ folder is produced
```

- [ ] **Step 6: Upload files to VPS**

```bash
# Upload client build
scp -r client/dist user@your-vps-ip:/var/www/interiors/client/dist

# Upload server
scp -r server user@your-vps-ip:/var/www/interiors/server

# Upload logo (if not committed to repo)
scp server/public/logo1.png user@your-vps-ip:/var/www/interiors/server/public/
```

- [ ] **Step 7: Install Puppeteer system dependencies on VPS (one-time)**

SSH into VPS and run:
```bash
sudo apt-get update && sudo apt-get install -y \
  ca-certificates fonts-liberation libappindicator3-1 libasound2 \
  libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  lsb-release wget xdg-utils
```

- [ ] **Step 8: Start the server on VPS**

```bash
cd /var/www/interiors/server
npm install
NODE_ENV=production node server.js
# Or with pm2: pm2 start server.js --name interiors-api
```

- [ ] **Step 9: Set server env variables**

Create `/var/www/interiors/server/.env`:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
PORT=5000
```

- [ ] **Step 10: Verify PDF download on VPS**

Hit the deployed frontend, download an Admin Invoice PDF. Logo should appear (or show house SVG if not uploaded).

---

## Self-Review Checklist

- [x] Spec requirement "pre-fetch logo before renderToStaticMarkup" → Task 5 + Task 6
- [x] Spec requirement "logoSrc = null → inline SVG" → Tasks 2, 3, 4
- [x] Spec requirement "logoSrc = undefined → browser preview unchanged" → Tasks 2, 3, 4
- [x] Spec requirement "base64 embed removes Puppeteer URL dependency" → Task 5 + 6
- [x] `FallbackLogo` extracted as shared component (DRY) → Task 1
- [x] VPS deployment steps covered → Task 7 Steps 5–10
- [x] `companyConfig` already imported in History.jsx (line 6) — no extra import needed
- [x] `Compare.jsx` needs `companyConfig` import check (Task 6 Step 1)
- [x] `InvoiceComparisonReport` is the inner function used for PDF, not `CompareInvoices` default export — correctly targeted in Task 4

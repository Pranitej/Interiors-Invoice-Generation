# Dynamic Company Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded Skanda Industries identity data with two config files so the project can be redeployed for any company by editing one file and dropping in a logo.

**Architecture:** `client/src/config.js` is the single source of truth for all client-side company data (name, tagline, addresses, phones, email, logo filename). `server/config.js` covers the server health-check message. All 8 affected files import from their respective config and use the values directly — no context providers, no API calls, no env vars.

**Tech Stack:** React 19, Vite, Express 5, plain ES module imports

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `client/src/config.js` | All client-side company identity |
| Create | `server/config.js` | Server-side company name |
| Rename | `server/public/skanda-logo.png` → `server/public/logo.png` | Logo asset |
| Modify | `client/index.html` | Static title fallback |
| Modify | `client/src/main.jsx` | Set document.title dynamically |
| Modify | `client/src/components/Header.jsx` | Company name in nav |
| Modify | `client/src/pages/Login.jsx` | Company name + tagline on login |
| Modify | `client/src/components/AdminInvoice.jsx` | Logo, name, addresses, phones, email, footer |
| Modify | `client/src/components/ClientInvoice.jsx` | Same + thank-you message |
| Modify | `client/src/components/ClientInvoiceTemp.jsx` | Same + thank-you message |
| Modify | `client/src/components/CompareInvoices.jsx` | Logo, name, addresses, phones, email, footer |
| Modify | `client/src/pages/History.jsx` | PDF download filename |
| Modify | `server/server.js` | Health-check message |

---

## Task 1: Create config files and rename logo

**Files:**
- Create: `client/src/config.js`
- Create: `server/config.js`
- Rename: `server/public/skanda-logo.png` → `server/public/logo.png`

- [ ] **Step 1: Create `client/src/config.js`**

```js
// client/src/config.js
// ─────────────────────────────────────────────────────────────────
// Edit this file to rebrand the app for a different company.
// Place the company logo at server/public/<logoFile>.
// ─────────────────────────────────────────────────────────────────

const companyConfig = {
  name: "SKANDA INDUSTRIES",
  tagline: "Your Dream, Our Design",
  registeredOffice:
    "H.No: 24-7-225-15/A/2, Pragathi nagar Phase - II, Near Euro Kids, Subedari, Hanamkonda",
  industryAddress:
    "Sy No. 138/A/1 & 138/2, Elkurthi Road, Grama Panchayat Office, Dharmasagar, Elkurthy PD, Hanumakonda, Telangana - 506142",
  phones: ["9700360963", "9866565057", "9246893307", "7799677762"],
  email: "industry.skanda@gmail.com",
  website: "", // leave empty to hide
  logoFile: "logo.png", // filename served from server/public/
};

export default companyConfig;
```

- [ ] **Step 2: Create `server/config.js`**

```js
// server/config.js
const companyConfig = {
  name: "Skanda Industries",
};

export default companyConfig;
```

- [ ] **Step 3: Rename the logo file**

```bash
cd server/public
mv skanda-logo.png logo.png
```

- [ ] **Step 4: Commit**

```bash
git add client/src/config.js server/config.js
git add -A server/public/
git commit -m "feat: add company config files and rename logo asset"
```

---

## Task 2: Update page title (index.html + main.jsx)

**Files:**
- Modify: `client/index.html`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Update `client/index.html` — replace hardcoded title**

Replace:
```html
    <title>Skanda Industries</title>
```
With:
```html
    <title>Invoice System</title>
```

- [ ] **Step 2: Update `client/src/main.jsx` — set title dynamically from config**

Replace the entire file content with:
```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import companyConfig from "./config.js";

document.title = companyConfig.name;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 3: Verify** — start the dev server (`npm run dev` in `client/`), open the browser, check the tab title shows `SKANDA INDUSTRIES`.

- [ ] **Step 4: Commit**

```bash
git add client/index.html client/src/main.jsx
git commit -m "feat: set page title dynamically from company config"
```

---

## Task 3: Update Header

**Files:**
- Modify: `client/src/components/Header.jsx`

- [ ] **Step 1: Add config import at the top of `Header.jsx`**

After the existing imports (line 4), add:
```js
import companyConfig from "../config.js";
```

- [ ] **Step 2: Replace hardcoded company name (line 109)**

Replace:
```jsx
                  Skanda Industries
```
With:
```jsx
                  {companyConfig.name}
```

- [ ] **Step 3: Verify** — open the app, check the header shows the correct company name.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Header.jsx
git commit -m "feat: use company config in Header"
```

---

## Task 4: Update Login page

**Files:**
- Modify: `client/src/pages/Login.jsx`

- [ ] **Step 1: Add config import at the top of `Login.jsx`**

After the existing imports, add:
```js
import companyConfig from "../config.js";
```

- [ ] **Step 2: Replace the icon initial (line 72) — use first letter of config name**

Replace:
```jsx
            <span className="text-3xl font-bold text-white">S</span>
```
With:
```jsx
            <span className="text-3xl font-bold text-white">{companyConfig.name[0]}</span>
```

- [ ] **Step 3: Replace company name heading (line 74-75)**

Replace:
```jsx
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Skanda Industries
          </h1>
```
With:
```jsx
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {companyConfig.name}
          </h1>
```

- [ ] **Step 4: Replace subtitle with config tagline (lines 77-79)**

Replace:
```jsx
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Professional quoting system
          </p>
```
With:
```jsx
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {companyConfig.tagline}
          </p>
```

- [ ] **Step 5: Verify** — open the login page, confirm company name, first-letter icon, and tagline are correct.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Login.jsx
git commit -m "feat: use company config in Login page"
```

---

## Task 5: Update AdminInvoice

**Files:**
- Modify: `client/src/components/AdminInvoice.jsx`

- [ ] **Step 1: Add config import**

After line 2 (`import { formatINR } from "../utils/calculations";`), add:
```js
import companyConfig from "../config.js";
```

- [ ] **Step 2: Replace hardcoded logoURL (line 8)**

Replace:
```js
  const logoURL = `${import.meta.env.VITE_API_BASE}/public/skanda-logo.png`;
```
With:
```js
  const logoURL = `${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`;
```

- [ ] **Step 3: Replace logo img tag (lines 526-539)**

Replace:
```jsx
              <img
                src={logoURL}
                alt="Skanda Industries Logo"
                style={s.logoImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `
                    <div style="width:64px;height:64px;border:1px solid #d1d5db;background:#f3f4f6;display:flex;align-items:center;justify-content:center;">
                      <span style="font-size:10px;font-weight:700;color:#374151;">SKANDA</span>
                    </div>
                  `;
                }}
              />
```
With:
```jsx
              <img
                src={logoURL}
                alt={`${companyConfig.name} Logo`}
                style={s.logoImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #d1d5db;background:#f3f4f6;display:flex;align-items:center;justify-content:center;"><span style="font-size:10px;font-weight:700;color:#374151;">No Logo</span></div>`;
                }}
              />
```

- [ ] **Step 4: Replace company header block (lines 543-559)**

Replace:
```jsx
              <h1 style={s.companyName}>SKANDA INDUSTRIES</h1>
              <p style={s.companyAddressLine}>
                <span style={s.infoLabel}>Regd Office:</span> H.No:
                24-7-225-15/A/2, Pragathi nagar Phase - II, Near Euro Kids,
                Subedari, Hanamkonda
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Industry:</span> Sy No. 138/A/1 &amp;
                138/2, Elkurthi Road, Grama Panchayat Office, Dharmasagar,
                Elkurthy PD, Hanumakonda, Telangana - 506142
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Contact: </span>
                9700360963, 9866565057, 9246893307, 7799677762 |{" "}
                <span style={s.infoLabel}>Email: </span>
                industry.skanda@gmail.com
              </p>
```
With:
```jsx
              <h1 style={s.companyName}>{companyConfig.name}</h1>
              <p style={s.companyAddressLine}>
                <span style={s.infoLabel}>Regd Office:</span>{" "}
                {companyConfig.registeredOffice}
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Industry:</span>{" "}
                {companyConfig.industryAddress}
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Contact: </span>
                {companyConfig.phones.join(", ")} |{" "}
                <span style={s.infoLabel}>Email: </span>
                {companyConfig.email}
              </p>
```

- [ ] **Step 5: Replace footer company name (line 1117)**

Replace:
```jsx
            <p style={s.footerLabel}>For Skanda Industries</p>
```
With:
```jsx
            <p style={s.footerLabel}>For {companyConfig.name}</p>
```

- [ ] **Step 6: Verify** — open an invoice in Admin view, confirm logo, name, addresses, phones, email, and footer are all correct.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/AdminInvoice.jsx
git commit -m "feat: use company config in AdminInvoice"
```

---

## Task 6: Update ClientInvoice

**Files:**
- Modify: `client/src/components/ClientInvoice.jsx`

- [ ] **Step 1: Add config import**

After the existing imports at the top of `ClientInvoice.jsx`, add:
```js
import companyConfig from "../config.js";
```

- [ ] **Step 2: Replace logo img tag (lines 541-554)**

Replace:
```jsx
                <img
                  src={`${import.meta.env.VITE_API_BASE}/public/skanda-logo.png`}
                  alt="Skanda Industries Logo"
                  style={s.logoImg}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    parent.innerHTML = `
                      <div style="width:64px;height:64px;border:1px solid #d1d5db;background:#f3f4f6;display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:10px;font-weight:700;color:#374151;">SKANDA</span>
                      </div>
                    `;
                  }}
                />
```
With:
```jsx
                <img
                  src={`${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`}
                  alt={`${companyConfig.name} Logo`}
                  style={s.logoImg}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #d1d5db;background:#f3f4f6;display:flex;align-items:center;justify-content:center;"><span style="font-size:10px;font-weight:700;color:#374151;">No Logo</span></div>`;
                  }}
                />
```

- [ ] **Step 3: Replace company header block (lines 558-574)**

Replace:
```jsx
              <h1 style={s.companyName}>SKANDA INDUSTRIES</h1>
              <p style={s.companyAddressLine}>
                <span style={s.infoLabel}>Regd Office:</span> H.No:
                24-7-225-15/A/2, Pragathi nagar Phase - II, Near Euro Kids,
                Subedari, Hanamkonda
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Industry:</span> Sy No. 138/A/1 &amp;
                138/2, Elkurthi Road, Grama Panchayat Office, Dharmasagar,
                Elkurthy PD, Hanumakonda, Telangana - 506142
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Contact: </span>
                9700360963, 9866565057, 9246893307, 7799677762 |{" "}
                <span style={s.infoLabel}>Email: </span>
                industry.skanda@gmail.com
              </p>
```
With:
```jsx
              <h1 style={s.companyName}>{companyConfig.name}</h1>
              <p style={s.companyAddressLine}>
                <span style={s.infoLabel}>Regd Office:</span>{" "}
                {companyConfig.registeredOffice}
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Industry:</span>{" "}
                {companyConfig.industryAddress}
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Contact: </span>
                {companyConfig.phones.join(", ")} |{" "}
                <span style={s.infoLabel}>Email: </span>
                {companyConfig.email}
              </p>
```

- [ ] **Step 4: Replace footer contact block (lines 968-971)**

Replace:
```jsx
            <p style={{ margin: 0 }}>
              9700360963 | 9866565057 | 9246893307 | 7799677762
            </p>
            <p style={{ margin: 0 }}>interior.skanda@gmail.com</p>
```
With:
```jsx
            <p style={{ margin: 0 }}>{companyConfig.phones.join(" | ")}</p>
            <p style={{ margin: 0 }}>{companyConfig.email}</p>
```

- [ ] **Step 5: Replace thank-you message (line 984)**

Replace:
```jsx
            Thank you for considering Skanda Industries. We look forward to
            serving you.
```
With:
```jsx
            Thank you for considering {companyConfig.name}. We look forward to
            serving you.
```

- [ ] **Step 6: Verify** — open an invoice in Client view, confirm all fields are driven from config.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/ClientInvoice.jsx
git commit -m "feat: use company config in ClientInvoice"
```

---

## Task 7: Update ClientInvoiceTemp

**Files:**
- Modify: `client/src/components/ClientInvoiceTemp.jsx`

- [ ] **Step 1: Add config import**

After the existing imports at the top of `ClientInvoiceTemp.jsx`, add:
```js
import companyConfig from "../config.js";
```

- [ ] **Step 2: Replace logo img tag (lines 115-129)**

Replace:
```jsx
              <img
                src={`${import.meta.env.VITE_API_BASE}/public/skanda-logo.png`}
                alt="Skanda Industries Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if logo fails to load
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `
              <div class="w-16 h-16 border border-gray-300 bg-gray-100 flex items-center justify-center">
                <span class="text-xs font-bold text-gray-700">SKANDA</span>
              </div>
            `;
                }}
              />
```
With:
```jsx
              <img
                src={`${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`}
                alt={`${companyConfig.name} Logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `<div class="w-16 h-16 border border-gray-300 bg-gray-100 flex items-center justify-center"><span class="text-xs font-bold text-gray-700">No Logo</span></div>`;
                }}
              />
```

- [ ] **Step 3: Replace company header block (lines 133-151)**

Replace:
```jsx
              <h1 className="text-2xl font-bold tracking-tight">
                SKANDA INDUSTRIES
              </h1>
              <p className="text-[10px] text-gray-600 leading-tight mt-1">
                <span className="font-medium">Regd Office:</span> H.No:
                24-7-225-15/A/2, Pragathi nagar Phase - II, Near Euro Kids,
                Subedari, Hanamkonda
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="font-medium">Industry:</span> Sy No. 138/A/1 &
                138/2, Elkurthi Road, Grama Panchayat Office, Dharmasagar,
                Elkurthy PD, Hanumakonda, Telangana - 506142
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="font-medium">Contact: </span>
                9700360963, 9866565057, 9246893307, 7799677762 |{" "}
                <span className="font-medium">Email: </span>
                industry.skanda@gmail.com
              </p>
```
With:
```jsx
              <h1 className="text-2xl font-bold tracking-tight">
                {companyConfig.name}
              </h1>
              <p className="text-[10px] text-gray-600 leading-tight mt-1">
                <span className="font-medium">Regd Office:</span>{" "}
                {companyConfig.registeredOffice}
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="font-medium">Industry:</span>{" "}
                {companyConfig.industryAddress}
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="font-medium">Contact: </span>
                {companyConfig.phones.join(", ")} |{" "}
                <span className="font-medium">Email: </span>
                {companyConfig.email}
              </p>
```

- [ ] **Step 4: Replace footer contact block (lines 553-555)**

Replace:
```jsx
            <p>9700360963 | 9866565057 | 9246893307 | 7799677762</p>
            <p>interior.skanda@gmail.com</p>
```
With:
```jsx
            <p>{companyConfig.phones.join(" | ")}</p>
            <p>{companyConfig.email}</p>
```

- [ ] **Step 5: Replace thank-you message (lines 567-569)**

Replace:
```jsx
            Thank you for considering Skanda Industries. We look forward to
            serving you.
```
With:
```jsx
            Thank you for considering {companyConfig.name}. We look forward to
            serving you.
```

- [ ] **Step 6: Verify** — open invoice temp view, confirm all company fields are from config.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/ClientInvoiceTemp.jsx
git commit -m "feat: use company config in ClientInvoiceTemp"
```

---

## Task 8: Update CompareInvoices

**Files:**
- Modify: `client/src/components/CompareInvoices.jsx`

- [ ] **Step 1: Add config import**

After the existing imports at the top of `CompareInvoices.jsx`, add:
```js
import companyConfig from "../config.js";
```

- [ ] **Step 2: Replace logo img tag (lines 270-287)**

Replace:
```jsx
              <img
                src={`${import.meta.env.VITE_API_BASE}/public/skanda-logo.png`}
                alt="Skanda Industries Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `
                    <div style="width: 64px; height: 64px; border: 1px solid #d1d5db; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 12px; font-weight: bold; color: #374151;">SKANDA</span>
                    </div>
                  `;
                }}
              />
```
With:
```jsx
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
                  parent.innerHTML = `<div style="width: 64px; height: 64px; border: 1px solid #d1d5db; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;"><span style="font-size: 12px; font-weight: bold; color: #374151;">No Logo</span></div>`;
                }}
              />
```

- [ ] **Step 3: Replace company name heading (line 299)**

Replace:
```jsx
                SKANDA INDUSTRIES
```
With:
```jsx
                {companyConfig.name}
```

- [ ] **Step 4: Replace address block (lines 310-334)**

Replace:
```jsx
                <span style={{ fontWeight: "500" }}>Regd Office:</span> H.No:
                24-7-225-15/A/2, Pragathi nagar Phase - II, Near Euro Kids,
                Subedari, Hanamkonda
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#4b5563",
                  marginBottom: "2px",
                }}
              >
                <span style={{ fontWeight: "500" }}>Industry:</span> Sy No.
                138/A/1 & 138/2, Elkurthi Road, Grama Panchayat Office,
                Dharmasagar, Elkurthy PD, Hanumakonda, Telangana - 506142
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#4b5563",
                }}
              >
                <span style={{ fontWeight: "500" }}>Contact: </span>
                9700360963, 9866565057, 9246893307, 7799677762 |{" "}
                <span style={{ fontWeight: "500" }}>Email: </span>
                industry.skanda@gmail.com
```
With:
```jsx
                <span style={{ fontWeight: "500" }}>Regd Office:</span>{" "}
                {companyConfig.registeredOffice}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#4b5563",
                  marginBottom: "2px",
                }}
              >
                <span style={{ fontWeight: "500" }}>Industry:</span>{" "}
                {companyConfig.industryAddress}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#4b5563",
                }}
              >
                <span style={{ fontWeight: "500" }}>Contact: </span>
                {companyConfig.phones.join(", ")} |{" "}
                <span style={{ fontWeight: "500" }}>Email: </span>
                {companyConfig.email}
```

- [ ] **Step 5: Replace footer phones (line 1809)**

Replace:
```jsx
              9700360963 | 9866565057 | 9246893307 | 7799677762
```
With:
```jsx
              {companyConfig.phones.join(" | ")}
```

- [ ] **Step 6: Replace footer email (line 1817)**

Replace:
```jsx
              industry.skanda@gmail.com
```
With:
```jsx
              {companyConfig.email}
```

- [ ] **Step 7: Replace footer report note (lines 1867-1868)**

Replace:
```jsx
            This is an automated comparison report generated by Skanda
            Industries Invoice System
```
With:
```jsx
            This is an automated comparison report generated by{" "}
            {companyConfig.name} Invoice System
```

- [ ] **Step 8: Verify** — open Compare view, confirm logo, name, addresses, phones, email, and footer note are from config.

- [ ] **Step 9: Commit**

```bash
git add client/src/components/CompareInvoices.jsx
git commit -m "feat: use company config in CompareInvoices"
```

---

## Task 9: Update History (PDF filename) and server health check

**Files:**
- Modify: `client/src/pages/History.jsx`
- Modify: `server/server.js`

- [ ] **Step 1: Add config import to `History.jsx`**

After the existing imports at the top of `History.jsx`, add:
```js
import companyConfig from "../config.js";
```

- [ ] **Step 2: Replace PDF filename (line 178)**

Replace:
```js
      a.download = `Skanda-${type}-Invoice-${id.slice(-6)}.pdf`;
```
With:
```js
      a.download = `${companyConfig.name}-${type}-Invoice-${id.slice(-6)}.pdf`;
```

- [ ] **Step 3: Add config import to `server/server.js`**

After the existing imports (after line 8), add:
```js
import companyConfig from "./config.js";
```

- [ ] **Step 4: Replace health-check message (line 29)**

Replace:
```js
  res.send({ ok: true, message: "Skanda Industries API" })
```
With:
```js
  res.send({ ok: true, message: `${companyConfig.name} API` })
```

- [ ] **Step 5: Verify PDF filename** — go to History, download a PDF, confirm the filename starts with `SKANDA INDUSTRIES-`.

- [ ] **Step 6: Verify server** — with server running, visit `http://localhost:5000/` and confirm the message field matches config name.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/History.jsx server/server.js
git commit -m "feat: use company config in History PDF filename and server health check"
```

---

## Final Verification Checklist

Run through this after all tasks are complete:

- [ ] Login page shows `companyConfig.name` and `companyConfig.tagline`
- [ ] Browser tab title matches `companyConfig.name`
- [ ] Header shows `companyConfig.name`
- [ ] Admin invoice — logo, name, addresses, phones, email, footer all from config
- [ ] Client invoice — same + thank-you message uses config name
- [ ] ClientInvoiceTemp — same + thank-you message uses config name
- [ ] CompareInvoices — logo, name, addresses, phones, email, footer from config
- [ ] Downloaded PDF filename starts with config name
- [ ] `GET http://localhost:5000/` returns config name in message
- [ ] **Logo fallback test** — temporarily rename `server/public/logo.png` to something else, reload an invoice, confirm "No Logo" placeholder appears instead of broken image. Rename it back.
- [ ] Change `companyConfig.name` to `"TEST COMPANY"`, reload — confirm every location updates. Revert.

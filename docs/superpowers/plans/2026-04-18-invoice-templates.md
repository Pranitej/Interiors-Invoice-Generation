# Invoice Template Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each company choose from 3 invoice theme templates (Classic, Executive Navy, Modern Teal); preference saved per company and auto-applied on every PDF download.

**Architecture:** Option A — 9 separate component files (one per template × invoice type). Company model gets 3 new fields (`adminInvoiceTemplate`, `clientInvoiceTemplate`, `compareInvoiceTemplate`, default 1). Download handlers resolve the component via a lookup map. Settings UI added to `CompanyProfileTab`.

**Tech Stack:** React (JSX, inline styles, `forwardRef`), Mongoose, existing `PUT /companies/:id` route, `renderToStaticMarkup` + `pdf.service.js` for PDF.

---

## File Map

| Action | File |
|--------|------|
| Modify | `server/models/Company.js` |
| Create | `client/src/components/AdminInvoiceT1.jsx` |
| Create | `client/src/components/AdminInvoiceT2.jsx` |
| Create | `client/src/components/AdminInvoiceT3.jsx` |
| Create | `client/src/components/ClientInvoiceT1.jsx` |
| Create | `client/src/components/ClientInvoiceT2.jsx` |
| Create | `client/src/components/ClientInvoiceT3.jsx` |
| Create | `client/src/components/CompareInvoicesT1.jsx` |
| Create | `client/src/components/CompareInvoicesT2.jsx` |
| Create | `client/src/components/CompareInvoicesT3.jsx` |
| Modify | `client/src/pages/History.jsx` |
| Modify | `client/src/pages/Compare.jsx` |
| Modify | `client/src/components/CompanyProfileTab.jsx` |
| Delete | `client/src/components/AdminInvoice.jsx` |
| Delete | `client/src/components/ClientInvoice.jsx` |
| Delete | `client/src/components/CompareInvoices.jsx` |

---

## Task 1: Add template fields to Company model

**Files:**
- Modify: `server/models/Company.js`

- [ ] **Step 1: Add 3 fields to the schema**

In `server/models/Company.js`, add the three fields inside `CompanySchema` after the `inactiveRemarks` field:

```js
// after: inactiveRemarks: { type: String, default: "" },
adminInvoiceTemplate:   { type: Number, enum: [1, 2, 3], default: 1 },
clientInvoiceTemplate:  { type: Number, enum: [1, 2, 3], default: 1 },
compareInvoiceTemplate: { type: Number, enum: [1, 2, 3], default: 1 },
```

- [ ] **Step 2: Verify the fields are returned by the company API**

Start the server (`npm run dev` in `server/`). In a browser or Postman, log in as an admin and call `GET /api/companies/:id`. Confirm the response JSON includes:
```json
"adminInvoiceTemplate": 1,
"clientInvoiceTemplate": 1,
"compareInvoiceTemplate": 1
```

- [ ] **Step 3: Verify the fields are writable via PUT**

Send `PUT /api/companies/:id` with body `{ "adminInvoiceTemplate": 2 }`. Confirm the response returns `adminInvoiceTemplate: 2`. Then reset it back to `1`.

- [ ] **Step 4: Commit**

```bash
git add server/models/Company.js
git commit -m "feat: add adminInvoiceTemplate, clientInvoiceTemplate, compareInvoiceTemplate to Company model"
```

---

## Task 2: Create T1 template files (copies of current components)

**Files:**
- Create: `client/src/components/AdminInvoiceT1.jsx`
- Create: `client/src/components/ClientInvoiceT1.jsx`
- Create: `client/src/components/CompareInvoicesT1.jsx`

These are exact copies of the current working components. No visual change.

- [ ] **Step 1: Copy AdminInvoice → AdminInvoiceT1**

Copy `client/src/components/AdminInvoice.jsx` to `client/src/components/AdminInvoiceT1.jsx`.
Change the internal function name from `AdminInvoice` to `AdminInvoiceT1` (the `forwardRef` call and export):

```js
// line 4 — change:
const AdminInvoiceT1 = forwardRef(function AdminInvoiceT1({ invoice, company }, ref) {
// ...
export default AdminInvoiceT1;
```

- [ ] **Step 2: Copy ClientInvoice → ClientInvoiceT1**

Copy `client/src/components/ClientInvoice.jsx` to `client/src/components/ClientInvoiceT1.jsx`.
Change internal name:

```js
const ClientInvoiceT1 = forwardRef(({ invoice, company }, ref) => {
// ...
export default ClientInvoiceT1;
```

- [ ] **Step 3: Copy CompareInvoices → CompareInvoicesT1**

Copy `client/src/components/CompareInvoices.jsx` to `client/src/components/CompareInvoicesT1.jsx`.
The file has two exports — keep both, just rename the internal default:

```js
// default export (page display component) — rename:
const CompareInvoicesT1 = forwardRef(
  ({ invoiceAId, invoiceBId, onLoadedA, onLoadedB, company }, ref) => {
// ...
export default CompareInvoicesT1;

// named export stays exactly the same:
export { InvoiceComparisonReport };
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AdminInvoiceT1.jsx client/src/components/ClientInvoiceT1.jsx client/src/components/CompareInvoicesT1.jsx
git commit -m "feat: add T1 invoice template files (copies of current components)"
```

---

## Task 3: AdminInvoiceT2 — Executive Navy

**Files:**
- Create: `client/src/components/AdminInvoiceT2.jsx`

Same data and JSX structure as `AdminInvoiceT1.jsx`. Only the style constants object `s` changes, plus a structural difference in the header (company info sits inside a navy band).

- [ ] **Step 1: Create AdminInvoiceT2.jsx**

Copy `AdminInvoiceT1.jsx` to `AdminInvoiceT2.jsx`. Change the component name to `AdminInvoiceT2`.

- [ ] **Step 2: Replace the style constants object `s`**

Replace the entire `const s = { ... }` block (lines ~98–513 in the original) with:

```js
const s = {
  root: { backgroundColor: "#ffffff", padding: "0", fontSize: "12px", color: "#000000", width: "100%", maxWidth: "210mm", minWidth: "100%", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" },

  // Navy header band
  header: { borderBottom: "3px solid #0f172a", paddingBottom: "0", marginBottom: "16px" },
  headerBand: { backgroundColor: "#0f172a", padding: "12px 16px" },
  headerInner: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { display: "flex", alignItems: "flex-start", gap: "12px" },
  logoContainer: { width: "64px", height: "64px", flexShrink: 0, marginTop: "4px", backgroundColor: "#ffffff", borderRadius: "6px", padding: "4px" },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  companyName: { fontSize: "24px", fontWeight: "700", letterSpacing: "-0.025em", margin: 0, color: "#ffffff" },
  companyAddressLine: { fontSize: "10px", color: "#cbd5e1", lineHeight: "1.25", marginTop: "4px", marginBottom: 0 },
  companyInfoLine: { fontSize: "10px", color: "#cbd5e1", margin: 0 },
  infoLabel: { fontWeight: "500", color: "#fbbf24" },

  sectionBlock: { marginBottom: "16px", padding: "0 16px" },
  sectionBlockSm: { marginBottom: "12px", padding: "0 16px" },

  table: { width: "100%", borderCollapse: "collapse", fontSize: "11px" },
  tableXs: { width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "4px" },

  // Amber section headers
  theadGray100: { backgroundColor: "#d97706" },
  theadGray50: { backgroundColor: "#1e293b" },

  thSectionHeader: { padding: "6px", textAlign: "left", fontWeight: "700", border: "1px solid #92400e", color: "#ffffff" },
  tdLabel: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500" },
  tdValue: { padding: "6px", border: "1px solid #e2e8f0" },
  tdValueSemibold: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "600" },

  thColLeft: { padding: "4px", border: "1px solid #334155", textAlign: "left", fontWeight: "500", color: "#ffffff" },
  thColCenter: { padding: "4px", border: "1px solid #334155", textAlign: "center", fontWeight: "500", color: "#ffffff" },

  tdAlignTop: { padding: "4px", border: "1px solid #e2e8f0", verticalAlign: "top" },
  tdCenter: { padding: "4px", border: "1px solid #e2e8f0", textAlign: "center" },
  tdRight: { padding: "4px", border: "1px solid #e2e8f0", textAlign: "right" },
  tdAlignTopRightSemibold: { padding: "4px", border: "1px solid #e2e8f0", verticalAlign: "top", textAlign: "right", fontWeight: "600" },
  tdRightMedium: { padding: "4px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "500" },
  tdPlain: { padding: "4px", border: "1px solid #e2e8f0" },
  tdPricingCenter: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "center" },
  tdPricingNote: { padding: "6px", border: "1px solid #e2e8f0", fontSize: "10px", color: "#64748b" },

  invoiceTypeBadge: { marginLeft: "4px", fontSize: "10px", fontWeight: "500", color: "#64748b" },
  locationLink: { color: "#374151", textDecoration: "underline" },

  // Navy room header
  roomHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", backgroundColor: "#0f172a", padding: "6px" },
  roomTitle: { fontWeight: "700", fontSize: "11px", color: "#ffffff" },
  roomDesc: { fontSize: "10px", color: "#94a3b8", marginLeft: "8px" },
  roomRates: { display: "flex", gap: "16px", fontSize: "10px", color: "#ffffff" },
  roomRatesRight: { textAlign: "right" },
  roomTotal: { textAlign: "right", fontSize: "11px", fontWeight: "700", marginTop: "4px" },
  // Amber pill for room/extras totals
  roomTotalChip: { display: "inline-block", backgroundColor: "#d97706", color: "#ffffff", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },

  rowEven: { backgroundColor: "#ffffff" },
  rowOdd: { backgroundColor: "#f8fafc" },

  extrasHeader: { backgroundColor: "#0f172a", padding: "6px", marginBottom: "4px" },
  extrasSectionTitle: { fontWeight: "700", fontSize: "11px", color: "#ffffff" },
  extraItem: { marginBottom: "8px" },
  extraLabel: { fontSize: "10px", fontWeight: "500", marginBottom: "2px" },
  serviceTotal: { textAlign: "right", fontSize: "10px", fontWeight: "500", marginBottom: "4px" },
  extrasTotal: { textAlign: "right", fontSize: "11px", fontWeight: "700", marginTop: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "4px" },

  summarySection: { marginTop: "16px", padding: "0 16px" },
  summaryFlex: { display: "flex", justifyContent: "flex-end" },
  summaryTable: { width: "256px", borderCollapse: "collapse", fontSize: "11px" },
  summaryRowPlain: {
    label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500" },
    value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right" },
  },
  summaryRowGray50: {
    label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500", backgroundColor: "#f8fafc" },
    value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "500", backgroundColor: "#f8fafc" },
  },
  summaryRowDiscount: {
    label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500", color: "#dc2626" },
    value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "500", color: "#dc2626" },
  },
  summaryRowFinal: {
    label: { padding: "6px", border: "1px solid #0f172a", fontWeight: "700", backgroundColor: "#0f172a", color: "#ffffff" },
    value: { padding: "6px", border: "1px solid #0f172a", textAlign: "right", fontWeight: "700", fontSize: "16px", backgroundColor: "#0f172a", color: "#ffffff" },
  },

  footer: { marginTop: "24px", paddingTop: "16px", borderTop: "3px solid #0f172a", fontSize: "10px", color: "#4b5563", padding: "16px" },
  footerGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  footerLabel: { fontWeight: "500", marginBottom: "4px", color: "#0f172a" },
  footerList: { listStyleType: "disc", paddingLeft: "16px", margin: 0 },
  footerListItem: { marginBottom: "2px" },
  footerRight: { textAlign: "right" },
  footerMt2: { marginTop: "8px" },
  footerSignatureBox: { marginTop: "16px", borderTop: "1px solid #e2e8f0", paddingTop: "4px" },
};
```

- [ ] **Step 3: Update the header JSX to use the navy band**

In the render section, replace the header block:

```jsx
{/* Header */}
<div style={s.header}>
  <div style={s.headerBand}>
    <div style={s.headerInner}>
      <div style={s.headerLeft}>
        <div style={s.logoContainer}>
          <img
            src={logoURL}
            alt={`${company?.name} Logo`}
            style={s.logoImg}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              parent.innerHTML = `<div style="width:64px;height:64px;background:#1e293b;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
            }}
          />
        </div>
        <div>
          <h1 style={s.companyName}>{company?.name}</h1>
          <p style={s.companyAddressLine}>
            <span style={s.infoLabel}>Regd Office:</span> {company?.registeredOffice}
          </p>
          {company?.industryAddress && (
            <p style={s.companyInfoLine}>
              <span style={s.infoLabel}>Industry:</span> {company.industryAddress}
            </p>
          )}
          <p style={s.companyInfoLine}>
            <span style={s.infoLabel}>Contact: </span>
            {company?.phones.join(", ")} |{" "}
            <span style={s.infoLabel}>Email: </span>
            {company?.email}
          </p>
          {company?.website && (
            <p style={s.companyInfoLine}>
              <span style={s.infoLabel}>Website: </span>
              {company.website}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
```

Also wrap `sectionBlock` and `sectionBlockSm` divs — they already use `s.sectionBlock` / `s.sectionBlockSm` which now include `padding: "0 16px"`. The summary section uses `s.summarySection` (also padded). The footer uses `s.footer` (padded). No other structural changes needed.

- [ ] **Step 4: Update room total to use an amber pill (same pattern as T3's teal chip)**

In the rooms map, replace:
```jsx
<div style={s.roomTotal}>Room Total: {formatINR(roomTotal)}</div>
```
with:
```jsx
<div style={s.roomTotal}>
  Room Total: <span style={s.roomTotalChip}>{formatINR(roomTotal)}</span>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AdminInvoiceT2.jsx
git commit -m "feat: add AdminInvoiceT2 Executive Navy template"
```

---

## Task 4: AdminInvoiceT3 — Modern Teal

**Files:**
- Create: `client/src/components/AdminInvoiceT3.jsx`

- [ ] **Step 1: Create AdminInvoiceT3.jsx**

Copy `AdminInvoiceT1.jsx` to `AdminInvoiceT3.jsx`. Change component name to `AdminInvoiceT3`.

- [ ] **Step 2: Replace the style constants object `s`**

```js
const s = {
  root: { backgroundColor: "#ffffff", padding: "16px", fontSize: "12px", color: "#000000", width: "100%", maxWidth: "210mm", minWidth: "100%", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" },

  header: { borderBottom: "2px solid #0d9488", paddingBottom: "12px", marginBottom: "16px" },
  headerInner: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { display: "flex", alignItems: "flex-start", gap: "0" },
  accentBar: { width: "4px", backgroundColor: "#0d9488", alignSelf: "stretch", marginRight: "12px", borderRadius: "2px", minHeight: "64px" },
  logoContainer: { width: "64px", height: "64px", flexShrink: 0, marginTop: "4px", marginRight: "12px" },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  companyName: { fontSize: "24px", fontWeight: "700", letterSpacing: "-0.025em", margin: 0, color: "#0d9488" },
  companyAddressLine: { fontSize: "10px", color: "#4b5563", lineHeight: "1.25", marginTop: "4px", marginBottom: 0 },
  companyInfoLine: { fontSize: "10px", color: "#4b5563", margin: 0 },
  infoLabel: { fontWeight: "500", color: "#0f766e" },

  sectionBlock: { marginBottom: "16px" },
  sectionBlockSm: { marginBottom: "12px" },

  table: { width: "100%", borderCollapse: "collapse", fontSize: "11px" },
  tableXs: { width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "4px" },

  // Teal section headers
  theadGray100: { backgroundColor: "#0d9488" },
  theadGray50: { backgroundColor: "#f0fdfa" },

  thSectionHeader: { padding: "6px", textAlign: "left", fontWeight: "700", border: "1px solid #0f766e", color: "#ffffff" },
  tdLabel: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500" },
  tdValue: { padding: "6px", border: "1px solid #ccfbf1" },
  tdValueSemibold: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "600" },

  thColLeft: { padding: "4px", border: "1px solid #0f766e", textAlign: "left", fontWeight: "500", color: "#ffffff" },
  thColCenter: { padding: "4px", border: "1px solid #0f766e", textAlign: "center", fontWeight: "500", color: "#ffffff" },

  tdAlignTop: { padding: "4px", border: "1px solid #ccfbf1", verticalAlign: "top" },
  tdCenter: { padding: "4px", border: "1px solid #ccfbf1", textAlign: "center" },
  tdRight: { padding: "4px", border: "1px solid #ccfbf1", textAlign: "right" },
  tdAlignTopRightSemibold: { padding: "4px", border: "1px solid #ccfbf1", verticalAlign: "top", textAlign: "right", fontWeight: "600" },
  tdRightMedium: { padding: "4px", border: "1px solid #ccfbf1", textAlign: "right", fontWeight: "500" },
  tdPlain: { padding: "4px", border: "1px solid #ccfbf1" },
  tdPricingCenter: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "center" },
  tdPricingNote: { padding: "6px", border: "1px solid #ccfbf1", fontSize: "10px", color: "#4b5563" },

  invoiceTypeBadge: { marginLeft: "4px", fontSize: "10px", fontWeight: "500", color: "#4b5563" },
  locationLink: { color: "#0d9488", textDecoration: "underline" },

  // Teal room header
  roomHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", backgroundColor: "#0d9488", padding: "6px" },
  roomTitle: { fontWeight: "700", fontSize: "11px", color: "#ffffff" },
  roomDesc: { fontSize: "10px", color: "#ccfbf1", marginLeft: "8px" },
  roomRates: { display: "flex", gap: "16px", fontSize: "10px", color: "#ffffff" },
  roomRatesRight: { textAlign: "right" },
  roomTotal: { textAlign: "right", fontSize: "11px", fontWeight: "700", marginTop: "4px" },
  // Teal chip for room total (use inline in JSX: <span style={s.roomTotalChip}>)
  roomTotalChip: { display: "inline-block", backgroundColor: "#0d9488", color: "#ffffff", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },

  rowEven: { backgroundColor: "#ffffff" },
  rowOdd: { backgroundColor: "#f0fdfa" },

  extrasHeader: { backgroundColor: "#0d9488", padding: "6px", marginBottom: "4px" },
  extrasSectionTitle: { fontWeight: "700", fontSize: "11px", color: "#ffffff" },
  extraItem: { marginBottom: "8px" },
  extraLabel: { fontSize: "10px", fontWeight: "500", marginBottom: "2px" },
  serviceTotal: { textAlign: "right", fontSize: "10px", fontWeight: "500", marginBottom: "4px" },
  extrasTotal: { textAlign: "right", fontSize: "11px", fontWeight: "700", marginTop: "8px", borderTop: "1px solid #99f6e4", paddingTop: "4px" },

  summarySection: { marginTop: "16px" },
  summaryFlex: { display: "flex", justifyContent: "flex-end" },
  summaryTable: { width: "256px", borderCollapse: "collapse", fontSize: "11px" },
  summaryRowPlain: {
    label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500" },
    value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right" },
  },
  summaryRowGray50: {
    label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500", backgroundColor: "#f0fdfa" },
    value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right", fontWeight: "500", backgroundColor: "#f0fdfa" },
  },
  summaryRowDiscount: {
    label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500", color: "#dc2626" },
    value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right", fontWeight: "500", color: "#dc2626" },
  },
  summaryRowFinal: {
    label: { padding: "6px", border: "1px solid #0d9488", fontWeight: "700", backgroundColor: "#0d9488", color: "#ffffff" },
    value: { padding: "6px", border: "1px solid #0d9488", textAlign: "right", fontWeight: "700", fontSize: "16px", backgroundColor: "#0d9488", color: "#ffffff" },
  },

  footer: { marginTop: "24px", paddingTop: "16px", borderTop: "2px solid #0d9488", fontSize: "10px", color: "#4b5563" },
  footerGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  footerLabel: { fontWeight: "500", marginBottom: "4px", color: "#0d9488" },
  footerList: { listStyleType: "disc", paddingLeft: "16px", margin: 0 },
  footerListItem: { marginBottom: "2px" },
  footerRight: { textAlign: "right" },
  footerMt2: { marginTop: "8px" },
  footerSignatureBox: { marginTop: "16px", borderTop: "1px solid #99f6e4", paddingTop: "4px" },
};
```

- [ ] **Step 3: Update the header JSX to add the teal accent bar**

Replace the header block:

```jsx
{/* Header */}
<div style={s.header}>
  <div style={s.headerInner}>
    <div style={s.headerLeft}>
      <div style={s.accentBar} />
      <div style={s.logoContainer}>
        <img
          src={logoURL}
          alt={`${company?.name} Logo`}
          style={s.logoImg}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const parent = e.currentTarget.parentElement;
            parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #99f6e4;background:#f0fdfa;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#0d9488' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
          }}
        />
      </div>
      <div>
        <h1 style={s.companyName}>{company?.name}</h1>
        <p style={s.companyAddressLine}>
          <span style={s.infoLabel}>Regd Office:</span> {company?.registeredOffice}
        </p>
        {company?.industryAddress && (
          <p style={s.companyInfoLine}>
            <span style={s.infoLabel}>Industry:</span> {company.industryAddress}
          </p>
        )}
        <p style={s.companyInfoLine}>
          <span style={s.infoLabel}>Contact: </span>
          {company?.phones.join(", ")} |{" "}
          <span style={s.infoLabel}>Email: </span>
          {company?.email}
        </p>
        {company?.website && (
          <p style={s.companyInfoLine}>
            <span style={s.infoLabel}>Website: </span>
            {company.website}
          </p>
        )}
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Update the room total to use a teal chip**

In the rooms map, replace:
```jsx
<div style={s.roomTotal}>Room Total: {formatINR(roomTotal)}</div>
```
with:
```jsx
<div style={s.roomTotal}>
  Room Total: <span style={s.roomTotalChip}>{formatINR(roomTotal)}</span>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AdminInvoiceT3.jsx
git commit -m "feat: add AdminInvoiceT3 Modern Teal template"
```

---

## Task 5: ClientInvoiceT2 — Executive Navy

**Files:**
- Create: `client/src/components/ClientInvoiceT2.jsx`

`ClientInvoiceT1` uses Tailwind classes (copied from existing). T2 and T3 switch to inline styles (same as AdminInvoice pattern) for reliable PDF rendering and full theme control. The data is the same as T1 (aggregated room totals, not per-item).

- [ ] **Step 1: Create ClientInvoiceT2.jsx**

Create `client/src/components/ClientInvoiceT2.jsx` with the content below. This file has the same logic as `ClientInvoiceT1.jsx` but uses the Executive Navy inline styles and is structured with a centralized `s` object:

```jsx
// src/components/ClientInvoiceT2.jsx
import { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const ClientInvoiceT2 = forwardRef(({ invoice, company }, ref) => {
  if (!invoice) return null;

  const client = invoice.client || {};
  const rooms = Array.isArray(invoice.rooms) ? invoice.rooms : [];
  const extras = Array.isArray(invoice.extras) ? invoice.extras : [];
  const pricing = invoice.pricing || {};
  const discount = Number(invoice.discount || 0);
  const finalPayableFromApi = Number(invoice.finalPayable || 0);

  const frameworkRate = typeof pricing.frameRate === "number" ? pricing.frameRate : 0;
  const boxRate = typeof pricing.boxRate === "number" ? pricing.boxRate : frameworkRate * 1.4;

  const safeInputs = (inputs) => ({
    surfaces: inputs?.surfaces || [],
    electricalWiring: inputs?.electricalWiring ?? 0,
    electricianCharges: inputs?.electricianCharges ?? 0,
    ceilingLights: inputs?.ceilingLights ?? 0,
    profileLights: inputs?.profileLights ?? 0,
    ceilingPaintingArea: inputs?.ceilingPaintingArea ?? 0,
    ceilingPaintingUnitPrice: inputs?.ceilingPaintingUnitPrice ?? 0,
    ceilingPaintingPrice: inputs?.ceilingPaintingPrice ?? 0,
    area: inputs?.area ?? 0,
    unitPrice: inputs?.unitPrice ?? 0,
    price: inputs?.price ?? 0,
  });

  const calcRoomAggregates = (room = {}) => {
    const items = room.items || [];
    const accessories = room.accessories || [];
    let frameAreaTotal = 0, boxAreaTotal = 0, framePriceTotal = 0, boxPriceTotal = 0;
    items.forEach((item) => {
      frameAreaTotal += Number(item.frame?.area || 0);
      boxAreaTotal += Number(item.box?.area || 0);
      framePriceTotal += Number(item.frame?.price || 0);
      boxPriceTotal += Number(item.box?.price || 0);
    });
    const accessoriesTotal = accessories.reduce((sum, a) => sum + Number(a.price || 0) * Number(a.qty || 0), 0);
    const itemsTotal = framePriceTotal + boxPriceTotal;
    return { frameAreaTotal, boxAreaTotal, framePriceTotal, boxPriceTotal, accessoriesTotal, itemsTotal, roomTotal: itemsTotal + accessoriesTotal, accessories };
  };

  const roomsTotals = rooms.map((room) => calcRoomAggregates(room));
  const roomsTotal = roomsTotals.reduce((sum, r) => sum + r.roomTotal, 0);
  const extrasTotal = extras.reduce((sum, ex) => sum + Number(ex.total || 0), 0);
  const grandTotal = typeof invoice.grandTotal === "number" ? invoice.grandTotal : roomsTotal + extrasTotal;
  const safeDiscount = Math.min(discount, grandTotal);
  const finalPayable = finalPayableFromApi > 0 ? finalPayableFromApi : grandTotal - safeDiscount;

  const invoiceDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const invoiceIdShort = invoice._id ? `INV-${String(invoice._id).slice(-6).toUpperCase()}` : "";

  const s = {
    root: { backgroundColor: "#ffffff", padding: "0", fontSize: "12px", color: "#000000", width: "800px", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" },
    headerBand: { backgroundColor: "#0f172a", padding: "16px" },
    companyName: { fontSize: "22px", fontWeight: "700", margin: 0, color: "#ffffff" },
    companyInfo: { fontSize: "10px", color: "#cbd5e1", marginTop: "4px", margin: 0 },
    infoLabel: { fontWeight: "500", color: "#fbbf24" },
    body: { padding: "16px" },
    sectionTitle: { fontSize: "13px", fontWeight: "700", marginBottom: "8px", marginTop: "16px", borderBottom: "2px solid #d97706", paddingBottom: "4px", color: "#0f172a" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "8px" },
    theadAmber: { backgroundColor: "#d97706" },
    theadNavy: { backgroundColor: "#1e293b" },
    thSection: { padding: "6px", textAlign: "left", fontWeight: "700", border: "1px solid #92400e", color: "#ffffff" },
    thCol: { padding: "4px", border: "1px solid #334155", textAlign: "left", fontWeight: "500", color: "#ffffff" },
    thColRight: { padding: "4px", border: "1px solid #334155", textAlign: "right", fontWeight: "500", color: "#ffffff" },
    tdLabel: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500" },
    tdValue: { padding: "6px", border: "1px solid #e2e8f0" },
    tdLeft: { padding: "4px", border: "1px solid #e2e8f0" },
    tdRight: { padding: "4px", border: "1px solid #e2e8f0", textAlign: "right" },
    tdBold: { padding: "4px", border: "1px solid #e2e8f0", fontWeight: "700" },
    tdBoldRight: { padding: "4px", border: "1px solid #e2e8f0", fontWeight: "700", textAlign: "right" },
    rowEven: { backgroundColor: "#ffffff" },
    rowOdd: { backgroundColor: "#f8fafc" },
    subtotalRow: { backgroundColor: "#1e293b" },
    subtotalLabel: { padding: "4px", border: "1px solid #334155", fontWeight: "700", color: "#ffffff" },
    subtotalValue: { padding: "4px", border: "1px solid #334155", fontWeight: "700", textAlign: "right", color: "#ffffff" },
    summaryFinal: {
      label: { padding: "6px", border: "1px solid #0f172a", fontWeight: "700", backgroundColor: "#0f172a", color: "#ffffff" },
      value: { padding: "6px", border: "1px solid #0f172a", textAlign: "right", fontWeight: "700", fontSize: "15px", backgroundColor: "#0f172a", color: "#ffffff" },
    },
    summaryGray: {
      label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500", backgroundColor: "#f8fafc" },
      value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right", backgroundColor: "#f8fafc" },
    },
    summaryPlain: {
      label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500" },
      value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right" },
    },
    summaryDiscount: {
      label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500", color: "#dc2626" },
      value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right", color: "#dc2626" },
    },
    footer: { borderTop: "3px solid #0f172a", padding: "12px 16px", fontSize: "10px", color: "#4b5563", marginTop: "8px" },
    footerGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    footerLabel: { fontWeight: "500", color: "#0f172a", marginBottom: "4px" },
  };

  const logoURL = company?.logoFile ? `${import.meta.env.VITE_API_BASE}/public/${company.logoFile}` : null;

  return (
    <div ref={ref} style={s.root}>
      {/* Navy header band */}
      <div style={s.headerBand}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {logoURL && (
            <div style={{ width: "56px", height: "56px", flexShrink: 0, backgroundColor: "#ffffff", borderRadius: "6px", padding: "4px" }}>
              <img src={logoURL} alt={company?.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          )}
          <div>
            <h1 style={s.companyName}>{company?.name}</h1>
            <p style={s.companyInfo}><span style={s.infoLabel}>Regd Office:</span> {company?.registeredOffice}</p>
            {company?.industryAddress && <p style={s.companyInfo}><span style={s.infoLabel}>Industry:</span> {company.industryAddress}</p>}
            <p style={s.companyInfo}><span style={s.infoLabel}>Contact:</span> {company?.phones?.join(", ")} | <span style={s.infoLabel}>Email:</span> {company?.email}</p>
          </div>
        </div>
      </div>

      <div style={s.body}>
        {/* Client & Invoice Details */}
        <div style={s.sectionTitle}>CLIENT &amp; INVOICE DETAILS</div>
        <table style={s.table}>
          <tbody>
            <tr>
              <td style={s.tdLabel} width="25%">Client Name</td>
              <td style={s.tdValue} width="25%">
                {client.name || "—"}
                {invoice.invoiceType && <span style={{ marginLeft: "4px", fontSize: "10px", color: "#64748b" }}>({invoice.invoiceType})</span>}
              </td>
              <td style={s.tdLabel} width="25%">Invoice No</td>
              <td style={{ ...s.tdValue, fontWeight: "600" }} width="25%">{invoiceIdShort || "—"}</td>
            </tr>
            <tr>
              <td style={s.tdLabel}>Mobile</td>
              <td style={s.tdValue}>{client.mobile || "—"}</td>
              <td style={s.tdLabel}>Date</td>
              <td style={s.tdValue}>{invoiceDate || "—"}</td>
            </tr>
            <tr>
              <td style={s.tdLabel}>Email</td>
              <td style={s.tdValue}>{client.email || "—"}</td>
              <td style={s.tdLabel}>Site Address</td>
              <td style={s.tdValue}>{client.siteAddress || "—"}</td>
            </tr>
            {client.siteMapLink && (
              <tr>
                <td style={s.tdLabel}>Location Map</td>
                <td colSpan="3" style={s.tdValue}>
                  <a href={client.siteMapLink} target="_blank" rel="noreferrer" style={{ color: "#374151", textDecoration: "underline" }}>
                    {client.siteMapLink.length > 60 ? client.siteMapLink.substring(0, 60) + "..." : client.siteMapLink}
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pricing Rates */}
        <div style={s.sectionTitle}>PRICING RATES (per sqft)</div>
        <table style={s.table}>
          <thead>
            <tr style={s.theadNavy}>
              <th style={s.thCol}>Frame Rate</th>
              <th style={s.thCol}>Box Rate</th>
              <th style={s.thCol}>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.tdLeft}>{frameworkRate ? formatINR(frameworkRate) : "—"}</td>
              <td style={s.tdLeft}>{boxRate ? formatINR(boxRate) : frameworkRate ? formatINR(frameworkRate * 1.4) : "—"}</td>
              <td style={{ ...s.tdLeft, fontSize: "10px", color: "#64748b" }}>Room-specific prices may vary.</td>
            </tr>
          </tbody>
        </table>

        {/* Rooms */}
        {rooms.length > 0 && (
          <>
            <div style={s.sectionTitle}>ROOMWISE BREAKDOWN</div>
            {rooms.map((room, idx) => {
              const agg = roomsTotals[idx] || {};
              const roomFrameRate = typeof room.frameRate === "number" && !Number.isNaN(room.frameRate) ? room.frameRate : frameworkRate || 0;
              const roomBoxRate = typeof room.boxRate === "number" && !Number.isNaN(room.boxRate) ? room.boxRate : boxRate || roomFrameRate * 1.4;
              return (
                <div key={idx} style={{ marginBottom: "12px" }}>
                  <div style={{ backgroundColor: "#0f172a", padding: "5px 8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "700", fontSize: "11px", color: "#ffffff" }}>{room.name}</span>
                    {room.description && <span style={{ fontSize: "10px", color: "#94a3b8", marginLeft: "8px" }}>— {room.description}</span>}
                  </div>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.theadNavy}>
                        <th style={s.thCol} width="40%">Description</th>
                        <th style={s.thColRight} width="20%">Area (sq.ft)</th>
                        <th style={s.thColRight} width="20%">Rate</th>
                        <th style={s.thColRight} width="20%">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={s.rowEven}>
                        <td style={s.tdLeft}>Frame Work</td>
                        <td style={s.tdRight}>{agg.frameAreaTotal?.toFixed(2) || "0.00"}</td>
                        <td style={s.tdRight}>{formatINR(roomFrameRate)}</td>
                        <td style={s.tdRight}>{formatINR(agg.framePriceTotal || 0)}</td>
                      </tr>
                      <tr style={s.rowOdd}>
                        <td style={s.tdLeft}>Box Work</td>
                        <td style={s.tdRight}>{agg.boxAreaTotal?.toFixed(2) || "0.00"}</td>
                        <td style={s.tdRight}>{formatINR(roomBoxRate)}</td>
                        <td style={s.tdRight}>{formatINR(agg.boxPriceTotal || 0)}</td>
                      </tr>
                      <tr style={s.subtotalRow}>
                        <td style={s.subtotalLabel} colSpan="3">Room Items Subtotal</td>
                        <td style={s.subtotalValue}>{formatINR(agg.itemsTotal || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {agg.accessories?.length > 0 && (
                    <table style={s.table}>
                      <thead>
                        <tr style={s.theadNavy}>
                          <th style={s.thCol} width="40%">Accessory</th>
                          <th style={s.thColRight} width="20%">Qty</th>
                          <th style={s.thColRight} width="20%">Rate</th>
                          <th style={s.thColRight} width="20%">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agg.accessories.map((acc, i) => (
                          <tr key={i} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                            <td style={s.tdLeft}>{acc.name || "Accessory"}</td>
                            <td style={s.tdRight}>{acc.qty || 1}</td>
                            <td style={s.tdRight}>{formatINR(acc.price || 0)}</td>
                            <td style={s.tdRight}>{formatINR((acc.price || 0) * (acc.qty || 1))}</td>
                          </tr>
                        ))}
                        <tr style={s.subtotalRow}>
                          <td style={s.subtotalLabel} colSpan="3">Accessories Total</td>
                          <td style={s.subtotalValue}>{formatINR(agg.accessoriesTotal || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                  <div style={{ textAlign: "right", marginTop: "2px" }}>
                    Room Total:{" "}
                    <span style={{ display: "inline-block", backgroundColor: "#d97706", color: "#ffffff", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                      {formatINR(agg.roomTotal || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Extras */}
        {extras.length > 0 && (
          <>
            <div style={s.sectionTitle}>ADDITIONAL SERVICES</div>
            <table style={s.table}>
              <thead>
                <tr style={s.theadNavy}>
                  <th style={s.thCol} width="40%">Description</th>
                  <th style={s.thColRight} width="20%">Qty / Area</th>
                  <th style={s.thColRight} width="20%">Rate</th>
                  <th style={s.thColRight} width="20%">Amount</th>
                </tr>
              </thead>
              <tbody>
                {extras.map((ex, i) => {
                  const inputs = safeInputs(ex.inputs || {});
                  return (
                    <tr key={ex._id || i} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                      <td style={s.tdLeft}>{ex.label}</td>
                      <td style={s.tdRight}>{ex.type === "ceiling" ? inputs.surfaces?.length || 1 : ex.type === "area_based" ? `${inputs.area} sq.ft` : "Fixed"}</td>
                      <td style={s.tdRight}>{ex.type === "ceiling" ? "As per design" : ex.type === "area_based" ? formatINR(inputs.unitPrice) : formatINR(inputs.price)}</td>
                      <td style={s.tdRight}>{formatINR(ex.total)}</td>
                    </tr>
                  );
                })}
                <tr style={s.subtotalRow}>
                  <td style={s.subtotalLabel} colSpan="3">Extras Total</td>
                  <td style={s.subtotalValue}>{formatINR(extrasTotal)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* Summary */}
        <div style={s.sectionTitle}>SUMMARY</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <table style={{ width: "260px", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr><td style={s.summaryPlain.label}>Total Room Work</td><td style={s.summaryPlain.value}>{formatINR(roomsTotal)}</td></tr>
              {extrasTotal > 0 && <tr><td style={s.summaryPlain.label}>Additional Services</td><td style={s.summaryPlain.value}>{formatINR(extrasTotal)}</td></tr>}
              <tr><td style={s.summaryGray.label}>Sub Total</td><td style={s.summaryGray.value}>{formatINR(grandTotal)}</td></tr>
              {safeDiscount > 0 && <tr><td style={s.summaryDiscount.label}>Discount</td><td style={s.summaryDiscount.value}>- {formatINR(safeDiscount)}</td></tr>}
              <tr><td style={s.summaryFinal.label}>FINAL AMOUNT</td><td style={s.summaryFinal.value}>{formatINR(finalPayable)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <p style={s.footerLabel}>Contact Details:</p>
            <p style={{ margin: 0 }}>{company?.phones?.join(" | ")}</p>
            <p style={{ margin: 0 }}>{company?.email}</p>
          </div>
          <div>
            <p style={s.footerLabel}>Terms:</p>
            {(company?.termsAndConditions ?? []).length > 0 ? (
              <ul style={{ listStyleType: "disc", paddingLeft: "16px", margin: 0 }}>
                {company.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            ) : (
              <ul style={{ listStyleType: "disc", paddingLeft: "16px", margin: 0 }}>
                <li>Quotation valid for 30 days</li>
                <li>Final values based on site measurement</li>
                <li>40% advance, 60% on completion</li>
              </ul>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <p style={{ margin: 0 }}>Thank you for considering {company?.name}. We look forward to serving you.</p>
        </div>
      </div>
    </div>
  );
});

export default ClientInvoiceT2;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ClientInvoiceT2.jsx
git commit -m "feat: add ClientInvoiceT2 Executive Navy template"
```

---

## Task 6: ClientInvoiceT3 — Modern Teal

**Files:**
- Create: `client/src/components/ClientInvoiceT3.jsx`

- [ ] **Step 1: Create ClientInvoiceT3.jsx**

Copy `ClientInvoiceT2.jsx` to `ClientInvoiceT3.jsx`. Change component name to `ClientInvoiceT3`. Replace the inner `s` object with the teal version and update the header JSX to add the accent bar. Apply the same teal chip pattern for room totals.

Replace the `s` object inside the component:

```js
const s = {
  root: { backgroundColor: "#ffffff", padding: "16px", fontSize: "12px", color: "#000000", width: "800px", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" },
  header: { borderBottom: "2px solid #0d9488", paddingBottom: "12px", marginBottom: "4px" },
  accentBar: { width: "4px", backgroundColor: "#0d9488", alignSelf: "stretch", marginRight: "12px", borderRadius: "2px", minHeight: "64px" },
  logoBox: { width: "56px", height: "56px", flexShrink: 0, marginRight: "12px" },
  companyName: { fontSize: "22px", fontWeight: "700", margin: 0, color: "#0d9488" },
  companyInfo: { fontSize: "10px", color: "#4b5563", marginTop: "2px", margin: 0 },
  infoLabel: { fontWeight: "500", color: "#0f766e" },
  body: { paddingTop: "8px" },
  sectionTitle: { fontSize: "13px", fontWeight: "700", marginBottom: "8px", marginTop: "16px", borderBottom: "2px solid #0d9488", paddingBottom: "4px", color: "#0d9488" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "8px" },
  theadTeal: { backgroundColor: "#0d9488" },
  theadLightTeal: { backgroundColor: "#f0fdfa" },
  thSection: { padding: "6px", textAlign: "left", fontWeight: "700", border: "1px solid #0f766e", color: "#ffffff" },
  thCol: { padding: "4px", border: "1px solid #0f766e", textAlign: "left", fontWeight: "500", color: "#ffffff" },
  thColRight: { padding: "4px", border: "1px solid #0f766e", textAlign: "right", fontWeight: "500", color: "#ffffff" },
  tdLabel: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500" },
  tdValue: { padding: "6px", border: "1px solid #ccfbf1" },
  tdLeft: { padding: "4px", border: "1px solid #ccfbf1" },
  tdRight: { padding: "4px", border: "1px solid #ccfbf1", textAlign: "right" },
  rowEven: { backgroundColor: "#ffffff" },
  rowOdd: { backgroundColor: "#f0fdfa" },
  subtotalRow: { backgroundColor: "#0d9488" },
  subtotalLabel: { padding: "4px", border: "1px solid #0f766e", fontWeight: "700", color: "#ffffff" },
  subtotalValue: { padding: "4px", border: "1px solid #0f766e", fontWeight: "700", textAlign: "right", color: "#ffffff" },
  summaryFinal: {
    label: { padding: "6px", border: "1px solid #0d9488", fontWeight: "700", backgroundColor: "#0d9488", color: "#ffffff" },
    value: { padding: "6px", border: "1px solid #0d9488", textAlign: "right", fontWeight: "700", fontSize: "15px", backgroundColor: "#0d9488", color: "#ffffff" },
  },
  summaryGray: {
    label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500", backgroundColor: "#f0fdfa" },
    value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right", backgroundColor: "#f0fdfa" },
  },
  summaryPlain: {
    label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500" },
    value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right" },
  },
  summaryDiscount: {
    label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500", color: "#dc2626" },
    value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right", color: "#dc2626" },
  },
  footer: { borderTop: "2px solid #0d9488", padding: "12px 0 0", fontSize: "10px", color: "#4b5563", marginTop: "8px" },
  footerGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  footerLabel: { fontWeight: "500", color: "#0d9488", marginBottom: "4px" },
  roomTotalChip: { display: "inline-block", backgroundColor: "#0d9488", color: "#ffffff", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },
};
```

Replace the header JSX (inside the `return`):

```jsx
{/* Teal accent header */}
<div style={s.header}>
  <div style={{ display: "flex", alignItems: "flex-start" }}>
    <div style={s.accentBar} />
    {logoURL && (
      <div style={s.logoBox}>
        <img src={logoURL} alt={company?.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    )}
    <div>
      <h1 style={s.companyName}>{company?.name}</h1>
      <p style={s.companyInfo}><span style={s.infoLabel}>Regd Office:</span> {company?.registeredOffice}</p>
      {company?.industryAddress && <p style={s.companyInfo}><span style={s.infoLabel}>Industry:</span> {company.industryAddress}</p>}
      <p style={s.companyInfo}><span style={s.infoLabel}>Contact:</span> {company?.phones?.join(", ")} | <span style={s.infoLabel}>Email:</span> {company?.email}</p>
    </div>
  </div>
</div>
```

Change the room-header background to `#0d9488` and room total text to use the teal chip:
```jsx
<div style={{ backgroundColor: "#0d9488", padding: "5px 8px", marginBottom: "4px" }}>
  <span style={{ fontWeight: "700", fontSize: "11px", color: "#ffffff" }}>{room.name}</span>
  ...
</div>
// ...
<div style={{ textAlign: "right", marginTop: "2px" }}>
  Room Total: <span style={s.roomTotalChip}>{formatINR(agg.roomTotal || 0)}</span>
</div>
```

All `theadNavy` references become `theadTeal`. All `thCol`/`thColRight` border colors and backgrounds are already in the teal `s` object.

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ClientInvoiceT3.jsx
git commit -m "feat: add ClientInvoiceT3 Modern Teal template"
```

---

## Task 7: CompareInvoicesT2 — Executive Navy

**Files:**
- Create: `client/src/components/CompareInvoicesT2.jsx`

`InvoiceComparisonReport` in this file must export the Executive Navy styled version. The data logic is identical to T1. Only the visual styles change.

- [ ] **Step 1: Create CompareInvoicesT2.jsx**

Copy `CompareInvoicesT1.jsx` to `CompareInvoicesT2.jsx`. Change the default export component name to `CompareInvoicesT2`.

- [ ] **Step 2: Apply Executive Navy styles to InvoiceComparisonReport**

In `InvoiceComparisonReport`, the outer wrapper currently has `border: "1px solid #d1d5db"`. Apply the following style overrides throughout (search and replace inline style values):

**Outer wrapper:**
```js
style={{
  backgroundColor: "white",
  color: "#1f2937",
  fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  fontSize: "14px",
  lineHeight: "1.5",
  width: "210mm",
  margin: "0 auto",
  border: "2px solid #0f172a",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
}}
```

**Header section** (`borderBottom` div): change `borderBottom: "2px solid #1f2937"` to a navy band:
```js
style={{ backgroundColor: "#0f172a", padding: "8px 10px" }}
```

**Company name** `<h1>`: add `color: "#ffffff"`

**Company address/info** `<p>` tags: change text color to `#cbd5e1`, label spans to `color: "#fbbf24"`

**Section header bars** (e.g., "INVOICE COMPARISON SUMMARY", "INVOICE A — ...", "INVOICE B — ..."): change `backgroundColor` from `#f3f4f6` / `#e5e7eb` to `#d97706` and text to `color: "#ffffff"`, border to `"1px solid #92400e"`

**Column header rows** (`<tr>` with gray bg): change `backgroundColor` to `#1e293b`, text to `#ffffff`

**Alternating data rows**: keep white/`#f8fafc`

**Final amount rows**: change to `backgroundColor: "#0f172a"`, text `#ffffff`

**Footer border**: change `borderTop` to `"3px solid #0f172a"`

- [ ] **Step 3: Commit**

```bash
git add client/src/components/CompareInvoicesT2.jsx
git commit -m "feat: add CompareInvoicesT2 Executive Navy template"
```

---

## Task 8: CompareInvoicesT3 — Modern Teal

**Files:**
- Create: `client/src/components/CompareInvoicesT3.jsx`

- [ ] **Step 1: Create CompareInvoicesT3.jsx**

Copy `CompareInvoicesT1.jsx` to `CompareInvoicesT3.jsx`. Change the default export component name to `CompareInvoicesT3`.

- [ ] **Step 2: Apply Modern Teal styles to InvoiceComparisonReport**

Apply the following style overrides throughout:

**Outer wrapper border**: `"2px solid #0d9488"`

**Header section**: Replace the navy band with a teal accent layout:
```js
style={{ borderBottom: "2px solid #0d9488", padding: "8px 10px", display: "flex", alignItems: "flex-start", gap: "0" }}
```
Add a `<div style={{ width: "4px", backgroundColor: "#0d9488", alignSelf: "stretch", marginRight: "10px", borderRadius: "2px" }} />` before the logo.

**Company name**: `color: "#0d9488"`

**Section header bars**: `backgroundColor: "#0d9488"`, text `color: "#ffffff"`, border `"1px solid #0f766e"`

**Column header rows**: `backgroundColor: "#0d9488"`, text `#ffffff`

**Alternating rows**: `#ffffff` / `#f0fdfa`

**Final amount rows**: `backgroundColor: "#0d9488"`, text `#ffffff`

**Table borders**: change `#d1d5db` → `#ccfbf1`, `#e5e7eb` → `#ccfbf1`

**Footer border**: `"2px solid #0d9488"`

- [ ] **Step 3: Commit**

```bash
git add client/src/components/CompareInvoicesT3.jsx
git commit -m "feat: add CompareInvoicesT3 Modern Teal template"
```

---

## Task 9: Update History.jsx download handler

**Files:**
- Modify: `client/src/pages/History.jsx`

- [ ] **Step 1: Replace imports at the top of History.jsx**

Remove:
```js
import AdminInvoice from "../components/AdminInvoice";
import ClientInvoice from "../components/ClientInvoice";
```

Add:
```js
import AdminInvoiceT1 from "../components/AdminInvoiceT1";
import AdminInvoiceT2 from "../components/AdminInvoiceT2";
import AdminInvoiceT3 from "../components/AdminInvoiceT3";
import ClientInvoiceT1 from "../components/ClientInvoiceT1";
import ClientInvoiceT2 from "../components/ClientInvoiceT2";
import ClientInvoiceT3 from "../components/ClientInvoiceT3";
```

- [ ] **Step 2: Update handleDownload to use the template map**

Replace line:
```js
const Component = type === "admin" ? AdminInvoice : ClientInvoice;
```

With:
```js
const adminMap = { 1: AdminInvoiceT1, 2: AdminInvoiceT2, 3: AdminInvoiceT3 };
const clientMap = { 1: ClientInvoiceT1, 2: ClientInvoiceT2, 3: ClientInvoiceT3 };
const templateNum = type === "admin"
  ? (company?.adminInvoiceTemplate ?? 1)
  : (company?.clientInvoiceTemplate ?? 1);
const Component = type === "admin"
  ? adminMap[templateNum] ?? AdminInvoiceT1
  : clientMap[templateNum] ?? ClientInvoiceT1;
```

- [ ] **Step 3: Verify download still works**

Start the dev server. Go to History page. Click "Admin" download on any invoice — confirm a PDF downloads. Click "Client" download — confirm a PDF downloads. Both should look like Template 1 (Classic Professional) since no template has been set yet.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/History.jsx
git commit -m "feat: History.jsx download handler resolves template from company preference"
```

---

## Task 10: Update Compare.jsx download handler

**Files:**
- Modify: `client/src/pages/Compare.jsx`

- [ ] **Step 1: Replace imports at the top of Compare.jsx**

Remove:
```js
import CompareInvoices from "../components/CompareInvoices";
import { InvoiceComparisonReport } from "../components/CompareInvoices";
```

Add:
```js
import CompareInvoicesT1, { InvoiceComparisonReport as CompareReportT1 } from "../components/CompareInvoicesT1";
import CompareInvoicesT2, { InvoiceComparisonReport as CompareReportT2 } from "../components/CompareInvoicesT2";
import CompareInvoicesT3, { InvoiceComparisonReport as CompareReportT3 } from "../components/CompareInvoicesT3";
```

- [ ] **Step 2: Derive active template components from company preference**

After the `useState` declarations (around line 28), add:
```js
const compareTemplateNum = company?.compareInvoiceTemplate ?? 1;
const compareDisplayMap = { 1: CompareInvoicesT1, 2: CompareInvoicesT2, 3: CompareInvoicesT3 };
const compareReportMap  = { 1: CompareReportT1,   2: CompareReportT2,   3: CompareReportT3   };
const ActiveCompareDisplay = compareDisplayMap[compareTemplateNum] ?? CompareInvoicesT1;
const ActiveCompareReport  = compareReportMap[compareTemplateNum]  ?? CompareReportT1;
```

- [ ] **Step 3: Update handleDownload to use ActiveCompareReport**

Replace:
```js
const html = renderToStaticMarkup(
  <InvoiceComparisonReport
    invoiceA={invoiceAData}
    invoiceB={invoiceBData}
    company={company}
  />,
);
```

With:
```js
const html = renderToStaticMarkup(
  <ActiveCompareReport
    invoiceA={invoiceAData}
    invoiceB={invoiceBData}
    company={company}
  />,
);
```

- [ ] **Step 4: Update the JSX to use ActiveCompareDisplay**

In the JSX, find `<CompareInvoices` and replace with `<ActiveCompareDisplay` (keep all props identical).

- [ ] **Step 5: Verify compare download still works**

Go to Compare page. Select two invoices. Click Download PDF. Confirm a PDF downloads correctly.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Compare.jsx
git commit -m "feat: Compare.jsx download handler resolves template from company preference"
```

---

## Task 11: Add template picker to CompanyProfileTab

**Files:**
- Modify: `client/src/components/CompanyProfileTab.jsx`

- [ ] **Step 1: Add template fields to form state**

In the `useState` call, add 3 new fields:

```js
const [form, setForm] = useState({
  // ...existing fields...
  adminInvoiceTemplate:   initialCompany?.adminInvoiceTemplate   ?? 1,
  clientInvoiceTemplate:  initialCompany?.clientInvoiceTemplate  ?? 1,
  compareInvoiceTemplate: initialCompany?.compareInvoiceTemplate ?? 1,
});
```

- [ ] **Step 2: Add the template picker section to the JSX**

After the Terms & Conditions card (before the closing `</div>` of the main `<form>`), add:

```jsx
{/* Invoice Templates */}
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
  <div className="p-5 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invoice Templates</h2>
        <p className="text-xs text-gray-600 dark:text-gray-400">Choose the design theme for each invoice type</p>
      </div>
    </div>
  </div>
  <div className="p-5 space-y-6">
    {[
      { key: "adminInvoiceTemplate",   label: "Admin Invoice" },
      { key: "clientInvoiceTemplate",  label: "Client Invoice" },
      { key: "compareInvoiceTemplate", label: "Compare Invoice" },
    ].map(({ key, label }) => (
      <div key={key}>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{label}</p>
        <div className="flex gap-3 flex-wrap">
          {[
            { num: 1, name: "Classic Professional", swatches: ["#f3f4f6", "#d1d5db", "#1f2937"] },
            { num: 2, name: "Executive Navy",        swatches: ["#0f172a", "#d97706", "#ffffff"] },
            { num: 3, name: "Modern Teal",           swatches: ["#0d9488", "#f0fdfa", "#ffffff"] },
          ].map(({ num, name, swatches }) => {
            const selected = form[key] === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setForm((f) => ({ ...f, [key]: num }))}
                className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all w-40 ${
                  selected
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="flex gap-1.5 mb-2">
                  {swatches.map((c, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: c }}
                      className="w-5 h-5 rounded border border-gray-200"
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Template {num}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{name}</span>
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Verify the picker renders and saves**

Open the Company Profile settings. Confirm the "Invoice Templates" card appears with 3 rows, each with 3 clickable template cards. Select "Executive Navy" for Admin Invoice. Click Save. Reload the page. Confirm "Executive Navy" is still selected.

- [ ] **Step 4: Verify the template is applied on download**

With Admin Invoice set to "Executive Navy" (Template 2), go to History and download an admin invoice. Confirm the PDF has the navy header band and amber section headers.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/CompanyProfileTab.jsx
git commit -m "feat: add invoice template picker to CompanyProfileTab"
```

---

## Task 12: Cleanup — remove old component files

**Files:**
- Delete: `client/src/components/AdminInvoice.jsx`
- Delete: `client/src/components/ClientInvoice.jsx`
- Delete: `client/src/components/CompareInvoices.jsx`

- [ ] **Step 1: Confirm no remaining imports**

Run:
```bash
grep -r "from.*AdminInvoice[^T]" client/src/
grep -r "from.*ClientInvoice[^T]" client/src/
grep -r "from.*CompareInvoices[^T]" client/src/
```

Expected: no output. If any imports remain, update them to the T1 versions first.

- [ ] **Step 2: Delete the files**

```bash
rm client/src/components/AdminInvoice.jsx
rm client/src/components/ClientInvoice.jsx
rm client/src/components/CompareInvoices.jsx
```

- [ ] **Step 3: Confirm the app builds without errors**

```bash
cd client && npm run build
```

Expected: build completes with no errors referencing the deleted files.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy AdminInvoice, ClientInvoice, CompareInvoices components"
```

---

## Summary

| Task | Deliverable |
|------|-------------|
| 1 | Company model has 3 template fields (default 1) |
| 2 | T1 files created (copies of current components) |
| 3 | AdminInvoiceT2 — Executive Navy |
| 4 | AdminInvoiceT3 — Modern Teal |
| 5 | ClientInvoiceT2 — Executive Navy (inline styles) |
| 6 | ClientInvoiceT3 — Modern Teal (inline styles) |
| 7 | CompareInvoicesT2 — Executive Navy |
| 8 | CompareInvoicesT3 — Modern Teal |
| 9 | History.jsx download uses template map |
| 10 | Compare.jsx download uses template map |
| 11 | CompanyProfileTab has template picker UI |
| 12 | Legacy files removed, build clean |

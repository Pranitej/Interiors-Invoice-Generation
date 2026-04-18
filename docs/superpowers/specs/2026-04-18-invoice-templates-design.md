# Invoice Template Selection — Design Spec

**Date:** 2026-04-18  
**Status:** Approved

---

## Overview

Allow companies to choose from 3 invoice template themes. The preference is set once by the admin in company settings and applied automatically on every download. Templates are themes — same color palette and layout language across admin, client, and compare invoices. Only the data columns differ per invoice type.

---

## Template Themes

All three invoice types (admin, client, compare) share the same visual theme per template number.

### Template 1 — Classic Professional *(default)*
- White background, gray (`#f3f4f6`) section header bars
- Black/gray borders (`#d1d5db`), dense table layout
- Monochrome, functional, familiar
- **This is the current existing style — no visual changes**

### Template 2 — Executive Navy
- Deep navy (`#0f172a`) full-width header band, company name and logo in white
- Amber/gold (`#d97706`) section header bars with white text
- White body with navy room/section dividers
- Total values styled as amber pill badges
- Authoritative, high-budget project feel

### Template 3 — Modern Teal
- Teal (`#0d9488`) left accent stripe (4px) beside logo in header
- Teal section header bars with white text
- Light teal (`#f0fdfa`) alternating table rows
- Room/section totals in rounded teal chips
- Contemporary, design-forward studio feel

---

## Data Model

### Company schema additions

```js
adminInvoiceTemplate:   { type: Number, enum: [1, 2, 3], default: 1 },
clientInvoiceTemplate:  { type: Number, enum: [1, 2, 3], default: 1 },
compareInvoiceTemplate: { type: Number, enum: [1, 2, 3], default: 1 },
```

- Stored on the Company document
- Returned via the existing company fetch
- Saved via the existing `PUT /company` update route
- No new API endpoints required

---

## New Component Files

Nine new files, one per template per invoice type. Existing components kept untouched until all usages are migrated, then removed.

```
client/src/components/
  AdminInvoiceT1.jsx     ← copy of current AdminInvoice.jsx (no visual change)
  AdminInvoiceT2.jsx     ← Executive Navy, admin data layout
  AdminInvoiceT3.jsx     ← Modern Teal, admin data layout

  ClientInvoiceT1.jsx    ← copy of current ClientInvoice.jsx (no visual change)
  ClientInvoiceT2.jsx    ← Executive Navy, client data layout
  ClientInvoiceT3.jsx    ← Modern Teal, client data layout

  CompareInvoicesT1.jsx  ← copy of current CompareInvoices.jsx (no visual change)
  CompareInvoicesT2.jsx  ← Executive Navy, side-by-side comparison layout
  CompareInvoicesT3.jsx  ← Modern Teal, side-by-side comparison layout

Each CompareInvoicesT*.jsx must export:
  - default export: CompareInvoices (the live page display component)
  - named export: InvoiceComparisonReport (used by Compare.jsx for PDF renderToStaticMarkup)
```

### Data displayed per invoice type (unchanged across templates)

- **Admin** — full detail: per-item frame/box dimensions, areas, prices, accessories, extras breakdown, pricing rates, terms & conditions
- **Client** — aggregated: room-level frame/box totals, accessories, extras summary, final payable
- **Compare** — both invoices side by side using the client-level data aggregation

---

## Settings UI — CompanyProfileTab

Add an **"Invoice Templates"** section to `CompanyProfileTab.jsx`.

- 3 rows: "Admin Invoice", "Client Invoice", "Compare Invoice"
- Each row has 3 clickable cards showing a colour swatch + template name
- Selected card is highlighted with a ring/border
- Saved alongside the rest of the company profile via the existing update flow
- Default selection shown as Template 1 when fields are absent

---

## Download Handler Changes

### History.jsx — `handleDownload(id, type)`

```js
const templateMap = {
  admin:  { 1: AdminInvoiceT1,  2: AdminInvoiceT2,  3: AdminInvoiceT3  },
  client: { 1: ClientInvoiceT1, 2: ClientInvoiceT2, 3: ClientInvoiceT3 },
};
const templateNum = type === "admin"
  ? (company.adminInvoiceTemplate ?? 1)
  : (company.clientInvoiceTemplate ?? 1);
const Component = templateMap[type][templateNum];
```

### Compare.jsx — `handleDownload()`

```js
const compareMap = { 1: CompareInvoicesT1, 2: CompareInvoicesT2, 3: CompareInvoicesT3 };
const Component = compareMap[company.compareInvoiceTemplate ?? 1];
```

No changes to `pdf.service.js` or `pdf.controller.js` — template resolution is purely frontend.

---

## Migration Plan

1. Add 3 fields to Company model (backward-compatible, all default to `1`)
2. Create 9 new template components (T1 copies existing, T2 and T3 are new styled versions)
3. Update `History.jsx` and `Compare.jsx` download handlers to use template map
4. Add template picker UI to `CompanyProfileTab.jsx`
5. Remove old `AdminInvoice.jsx`, `ClientInvoice.jsx`, `CompareInvoices.jsx` after all imports are migrated

---

## Files Touched

| File | Change |
|------|--------|
| `server/models/Company.js` | Add 3 template fields |
| `client/src/components/AdminInvoiceT1-3.jsx` | New (9 files) |
| `client/src/components/ClientInvoiceT1-3.jsx` | New |
| `client/src/components/CompareInvoicesT1-3.jsx` | New |
| `client/src/pages/History.jsx` | Update download handler |
| `client/src/pages/Compare.jsx` | Update download handler |
| `client/src/components/CompanyProfileTab.jsx` | Add template picker section |
| `client/src/components/AdminInvoice.jsx` | Delete after migration |
| `client/src/components/ClientInvoice.jsx` | Delete after migration |
| `client/src/components/CompareInvoices.jsx` | Delete after migration (`InvoiceComparisonReport` only used in `Compare.jsx` — safe to remove) |

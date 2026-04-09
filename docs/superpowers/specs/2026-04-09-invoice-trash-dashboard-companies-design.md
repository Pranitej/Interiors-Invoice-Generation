# Design: Invoice Trash, Dashboard Companies, Company Delete Confirmation

**Date:** 2026-04-09
**Status:** Approved

---

## Overview

Three independent features:

1. **Invoice soft-delete with 30-day grace period** — invoices move to a trash bin on delete; they can be restored within 30 days; permanently purged on trash fetch after expiry.
2. **Companies list on super admin dashboard** — the companies table appears inline on the dashboard below the stat cards.
3. **Confirmation modal for company deletion** — replace the native `confirm()` with a styled React modal.

---

## Feature 1: Invoice Soft-Delete (Trash Bin)

### Schema change

Add one field to `InvoiceSchema` in `server/models/Invoice.js`:

```js
deletedAt: { type: Date, default: null }
```

No other model changes.

### Backend

**All existing queries** in `invoice.service.js` (`listInvoices`, `getInvoiceById`, `updateInvoice`, `deleteInvoice`) gain `deletedAt: null` added to their filter so trashed invoices are invisible in normal operation — including direct GET by ID, preventing access to a trashed invoice via its URL.

**New / changed service functions in `invoice.service.js`:**

| Function | Behaviour |
|---|---|
| `deleteInvoice(id, companyId)` | Sets `deletedAt = new Date()` instead of removing the document |
| `listTrash(companyId)` | Purges invoices where `deletedAt < now - 30 days`, then returns remaining trash for the company |
| `restoreInvoice(id, companyId)` | Sets `deletedAt = null` |
| `permanentDelete(id, companyId)` | Hard-deletes a single trashed invoice (admin only) |

**New routes in `invoice.routes.js`:**

```
GET    /api/invoices/trash          authenticate + scopeToCompany  (all roles)
PATCH  /api/invoices/:id/restore    authenticate + scopeToCompany  (all roles)
DELETE /api/invoices/:id/permanent  authenticate + scopeToCompany  (company_admin + super_admin only)
```

The existing `DELETE /api/invoices/:id` stays on the same route but now soft-deletes.

**Purge logic (inside `listTrash`):**

```js
const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await Invoice.deleteMany({ companyId, deletedAt: { $lt: cutoff } });
```

Run this before the find so the returned list is already clean.

### Frontend — History.jsx

- Add an **Active / Trash** tab toggle below the page title.
- **Active tab:** current behaviour unchanged.
- **Trash tab:**
  - Calls `GET /api/invoices/trash` on mount (and when tab is switched to).
  - Renders the same invoice card layout but replaces Edit/Download action buttons with:
    - **Restore** button (all roles) — calls `PATCH /api/invoices/:id/restore`, removes card from trash list on success.
    - **Delete Forever** button (admin only) — shows an inline confirmation modal, then calls `DELETE /api/invoices/:id/permanent`, removes card on success.
  - Each card shows a **"X days left"** amber badge: `30 - Math.floor((now - deletedAt) / 86400000)` days.
  - Empty state: "Trash is empty" with a bin icon.

---

## Feature 2: Companies List on Super Admin Dashboard

### Backend

No changes. `GET /api/companies` already returns companies with `userCount` and `invoiceCount`.

### Frontend — SuperAdminDashboard.jsx

- Remove the "Manage Companies" button from the page header.
- Below the stat cards, add a **Companies** section with:
  - A heading row: "Companies" on the left, "+ Add Company" link to `/companies` on the right.
  - A table with columns: **Company**, **Status**, **Users**, **Invoices**, **Actions**.
  - Actions per row: **View** (navigates to `/companies/:id`) and **Toggle Active** (calls `PATCH /api/companies/:id/toggle-active`, updates state inline).
  - No Delete action on the dashboard — deletion stays on the dedicated `/companies` page.
- Fetch companies from `GET /api/companies` in the same `useEffect` as stats, using `Promise.all`.
- Loading and error states mirror the existing pattern.

---

## Feature 3: Company Delete Confirmation Modal

### Frontend — Companies.jsx

Replace the `handleDelete` function's `confirm()` call with a React modal.

**State additions:**
```js
const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
```

**Flow:**
1. Clicking Delete sets `deleteTarget = { id, name }` — opens modal.
2. Modal displays: `Delete "[name]"?` with sub-text: `This will permanently delete all users and invoices for this company. This cannot be undone.`
3. **Cancel** clears `deleteTarget`.
4. **Delete** button calls the existing delete API, clears `deleteTarget`, updates state on success.

**Modal style:** matches the existing delete confirmation modal in `History.jsx` (red icon, two-button row, backdrop blur).

---

## What is NOT changing

- No changes to auth routes, company routes, or superAdmin routes.
- No new npm packages.
- No changes to the PDF, upload, or compare flows.
- The `/companies` page retains full CRUD including delete.

# Company User Invoice Permissions — Design Spec

**Date:** 2026-04-09
**Status:** Approved

## Problem

`company_user` can create invoices but currently has no power to edit or delete them (those routes are locked to `COMPANY_ADMIN` / `SUPER_ADMIN`). The requirement is to make these powers configurable in one place (`config.js`) so they can be toggled per deployment without touching route or controller logic each time.

The ownership constraint is always present: when a flag is `true`, `company_user` may only act on invoices **they created** (`createdBy === userId`). Admins remain unrestricted.

## Config Shape

New `permissions` block added to `config.js`:

```js
permissions: {
  companyUser: {
    canEditOwnInvoices: true,            // company_user can PUT their own invoices
    canSoftDeleteOwnInvoices: false,     // company_user can soft-delete (trash) their own invoices
    canPermanentDeleteOwnInvoices: false, // company_user can permanently delete their own invoices
  },
},
```

All three flags default to the current behaviour: edit enabled, both delete forms disabled.

## Approach

**Controller-level check + service ownership filter (Approach A)**

No new middleware, no extra DB round-trips. Each guarded controller handler reads the flag and conditionally passes an `ownerId` down to the service. The service applies `filter.createdBy = ownerId` when `ownerId` is non-null, limiting the DB match to the caller's own invoices.

## Changes by Layer

### `config.js`
- Add `permissions.companyUser` block as above.

### `invoice.routes.js`
- `PUT /:id` — add `COMPANY_USER` to `requireRole` (was `COMPANY_ADMIN, SUPER_ADMIN` only).
- `DELETE /:id` — add `COMPANY_USER` to `requireRole`.
- `DELETE /:id/permanent` — add `COMPANY_USER` to `requireRole`.

`requireRole` still gates unauthenticated users and roles outside the list. The flag check inside the controller provides the second layer of enforcement.

### `invoice.controller.js`

Each of the three handlers (`updateInvoice`, `deleteInvoice`, `permanentDeleteInvoice`) gets this guard block at the top:

```js
const isCompanyUser = req.user.role === config.roles.COMPANY_USER;
if (isCompanyUser && !config.permissions.companyUser.<flag>)
  throw new AppError(403, "Forbidden");
const ownerId = isCompanyUser ? req.user.userId : null;
```

`ownerId` is then passed as an extra argument to the service call.

### `invoice.service.js`

`updateInvoice`, `deleteInvoice`, and `permanentDelete` each gain an optional `ownerId = null` parameter:

```js
if (ownerId) filter.createdBy = ownerId;
```

This narrows the `findOneAndUpdate` / `findOneAndDelete` query so it can only match invoices the caller created. Admins pass `null` — no restriction applied.

## Error Behaviour

| Scenario | Response |
|---|---|
| `company_user` hits edit, flag is `false` | `403 Forbidden` |
| `company_user` hits edit, flag is `true`, invoice belongs to them | `200` with updated invoice |
| `company_user` hits edit, flag is `true`, invoice belongs to another user | `404 Invoice not found` (ownership filter eliminates the document; no 403 leakage of existence) |
| `company_user` hits delete, flag is `false` | `403 Forbidden` |
| Admin hits any route | Unchanged — `ownerId` is `null`, no ownership filter applied |

## Out of Scope

- No changes to `listInvoices` — `company_user` can already list all company invoices.
- No changes to `getInvoice` — read access remains unrestricted within the company.
- No changes to `restoreInvoice` — remains unrestricted within the company.
- No frontend changes in this spec.

# Company Details Edit — Design Spec
**Date:** 2026-04-13  
**Author:** Vangala Pranitej  
**Status:** Approved

---

## Overview

Allow `company_admin` users to view and edit their own company details — including name, addresses, contact info, and a custom terms & conditions list — from a new "Company" tab in the Profile page. The terms & conditions replace all hardcoded footer terms in both invoice types.

---

## Backend

### 1. Company Model (`server/models/Company.js`)
Add field:
```js
termsAndConditions: { type: [String], default: [] }
```
`industryAddress` remains `{ type: String, default: "" }` (no `required: true`) — explicitly optional.

### 2. Config (`server/config.js`)
Add new key:
```js
company: {
  maxTerms: 5,  // maximum number of terms & conditions entries
}
```

### 3. New Routes (`server/routes/company.routes.js`)
Two new endpoints, authenticated + `company_admin` role only, scoped to `req.user.companyId`:

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/companies/my` | Fetch own company details |
| `PUT`  | `/companies/my` | Update own company details |

Both are placed **before** the existing `router.use(authenticate, requireRole(SUPER_ADMIN))` guard.

### 4. Controller (`server/controllers/company.controller.js`)
Two new exported functions:
- `getMyCompany(req, res, next)` — calls `CompanyService.getCompanyById(req.user.companyId)`
- `updateMyCompany(req, res, next)` — calls `CompanyService.updateMyCompany(req.user.companyId, req.body)`

### 5. Service (`server/services/company.service.js`)
New function:
```js
export async function updateMyCompany(companyId, data)
```
- Strips protected fields: `isActive`, `_id`, `__v`, `logoFile`
- Validates `termsAndConditions` is an array with length ≤ `config.company.maxTerms`; throws `AppError(400, ...)` if exceeded
- Calls `Company.findByIdAndUpdate(companyId, safeData, { new: true, runValidators: true })`

---

## Frontend

### 1. Client Config (`client/src/config.js`)
Add:
```js
company: {
  maxTerms: 5,
}
```
Keep in sync with server config.

### 2. Profile Page (`client/src/pages/Profile.jsx`)
- Add "Company" tab, visible only when `currentUser.role === config.roles.COMPANY_ADMIN`
- Tab order: **My Profile | Company | Manage Users | Create User**
- Move `CompanyLogoChanger` into the Company tab (currently rendered unconditionally; scope it to this tab)

**Company tab state:**
```js
const [companyForm, setCompanyForm] = useState({
  name: "",
  tagline: "",
  registeredOffice: "",
  industryAddress: "",   // optional
  phones: [],
  email: "",
  website: "",
  termsAndConditions: [],
});
```

**On tab mount:** `GET /companies/my` → populate `companyForm`.

**Form fields:**
| Field | Type | Required |
|-------|------|----------|
| Company Name | text input | Yes |
| Tagline | text input | No |
| Registered Office | text input | No |
| Industry Address | text input | No (optional) |
| Phones | dynamic list (add/remove) | No |
| Email | text input | No |
| Website | text input | No |
| Terms & Conditions | dynamic list (add/remove), max 5 | No |
| Logo | `CompanyLogoChanger` component | N/A |

**Terms & Conditions UX:**
- Each entry is a text input with a remove (×) button
- "Add Term" button disabled when `termsAndConditions.length >= config.company.maxTerms`
- Counter shown: e.g. "3 / 5"

**On save:** `PUT /companies/my` with the full `companyForm`. Show success/error message using the existing `message` state pattern.

### 3. API (`client/src/api/api.js`)
No changes needed — uses the existing `api` axios instance.

---

## Invoice Footer Changes

### `AdminInvoice.jsx`
Replace hardcoded `<li>` items under "Terms & Conditions:" with:
```jsx
{(company?.termsAndConditions ?? []).map((term, i) => (
  <li key={i} style={s.footerListItem}>{term}</li>
))}
```
If the array is empty, the `<ul>` renders with no items (no fallback).

### `ClientInvoice.jsx`
Replace hardcoded `<li>` items under "Terms:" with the same pattern.

---

## Data Flow Summary

```
company_admin
  → Profile page "Company" tab
  → GET /companies/my        → CompanyController.getMyCompany
                             → CompanyService.getCompanyById(companyId)
  → Edit fields + Save
  → PUT /companies/my        → CompanyController.updateMyCompany
                             → CompanyService.updateMyCompany(companyId, data)
                             → validates termsAndConditions.length ≤ 5
                             → Company.findByIdAndUpdate(...)

Invoice render (AdminInvoice / ClientInvoice)
  → receives company prop (already passed today)
  → company.termsAndConditions.map(...) in footer
```

---

## Constraints & Notes

- `logoFile` is **never** updated via `PUT /companies/my` — logo has its own `POST /my/logo` endpoint.
- `isActive` and `_id` are always stripped server-side — company admin cannot deactivate their own company.
- `industryAddress` is optional at both schema and UI level.
- `maxTerms: 5` lives in both `server/config.js` and `client/src/config.js` — keep in sync manually.
- No fallback hardcoded terms in invoices — if `termsAndConditions` is empty, the footer terms section is empty.

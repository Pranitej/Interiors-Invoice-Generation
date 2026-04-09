# Frontend Role Config & isAdmin Migration — Design Spec

**Date:** 2026-04-09
**Status:** Approved

## Problem

The frontend has two parallel systems for role checking:
- The **correct** system: `user.role` string comparisons (`"company_admin"`, `"company_user"`) — already used in `Header.jsx`, `App.jsx`, `Login.jsx`, `ProtectedRoute.jsx`
- The **legacy** system: `user?.isAdmin` boolean — used in `History.jsx`, `NewQuote.jsx`, `Profile.jsx`

Additionally, `Profile.jsx` sends `isAdmin: true/false` in its API payloads for user creation and update, but the backend `createUser` controller already expects `role: "company_admin" | "company_user"`. This is a live bug.

`client/src/config.js` currently only holds platform branding — it has no role constants or permissions, forcing role strings to be hardcoded as literals wherever they appear.

## Goals

1. Expand `client/src/config.js` to be the single source of truth for roles and company-user permissions, mirroring `server/config.js`
2. Replace every `isAdmin` usage with `user.role === config.roles.COMPANY_ADMIN`
3. Fix the `Profile.jsx` API payload bug (`isAdmin` → `role`)
4. Wire edit/delete button visibility in `History.jsx` to the permission flags from config
5. Fix the edit guard in `NewQuote.jsx` to allow `company_user` through when `canEditOwnInvoices` is true

## Approach

Direct config consumption everywhere (no helper utilities). Replace `isAdmin` inline with `user.role === config.roles.COMPANY_ADMIN`. Permission-aware checks (`canEditOwnInvoices` etc.) are read directly from `config.permissions.companyUser`. This is already the pattern used correctly in the files that were written later.

---

## Changes by File

### `client/src/config.js`

Expand the existing file. Replace the bare `platformConfig` object with a structured `config` object:

```js
// client/src/config.js
// Single source of truth for platform constants and permission flags.
// Keep permission flags in sync with server/config.js.

const config = {
  platform: {
    name: "Interiors SaaS",
    tagline: "Powering Interior Design Businesses",
  },

  roles: {
    SUPER_ADMIN: "super_admin",
    COMPANY_ADMIN: "company_admin",
    COMPANY_USER: "company_user",
  },

  permissions: {
    companyUser: {
      canEditOwnInvoices: true,             // company_user can edit invoices they created
      canSoftDeleteOwnInvoices: false,      // company_user can soft-delete their own invoices
      canPermanentDeleteOwnInvoices: false, // requires canSoftDeleteOwnInvoices: true to be reachable
    },
  },
};

export default config;
```

The existing consumer (`Login.jsx`) imports `platformConfig` as the default — this must be updated to `config` and access `config.platform.name` / `config.platform.tagline`.

---

### `History.jsx`

**Import change:** `import config from "../config.js"` (already imported via platformConfig, just update reference).

Eight `isAdmin` replacements:

| Location | Current | Replacement |
|---|---|---|
| Line 130 (filter) | `user?.isAdmin` | `user?.role === config.roles.COMPANY_ADMIN` |
| Line 217 (handleDelete guard) | `!user?.isAdmin` | see below |
| Line 241 (handleEdit) | `user?.isAdmin && navigate(...)` | see below |
| Line 359 (desktop edit/delete buttons) | `user?.isAdmin` | see below |
| Line 514 (card edit/delete buttons) | `user?.isAdmin` | see below |
| Line 621 (mobile edit button) | `user?.isAdmin` | see below |
| Line 704 (mobile delete button) | `user?.isAdmin` | see below |

**Permission-aware replacements:**

`handleDelete` guard (line 217):
```js
const isAdmin = user?.role === config.roles.COMPANY_ADMIN;
const canDelete = isAdmin ||
  (user?.role === config.roles.COMPANY_USER &&
   config.permissions.companyUser.canSoftDeleteOwnInvoices &&
   invoice.createdBy === user?._id);
if (!canDelete) { alert("Access denied"); return; }
```

Edit button visibility (lines 359, 514, 621):
```js
const canEditInvoice = (inv) =>
  user?.role === config.roles.COMPANY_ADMIN ||
  (user?.role === config.roles.COMPANY_USER &&
   config.permissions.companyUser.canEditOwnInvoices &&
   inv.createdBy === user?._id);
```

Delete button visibility (lines 359, 514, 704):
```js
const canDeleteInvoice = (inv) =>
  user?.role === config.roles.COMPANY_ADMIN ||
  (user?.role === config.roles.COMPANY_USER &&
   config.permissions.companyUser.canSoftDeleteOwnInvoices &&
   inv.createdBy === user?._id);
```

`handleEdit` (line 241):
```js
const handleEdit = (id) =>
  (user?.role === config.roles.COMPANY_ADMIN ||
   config.permissions.companyUser.canEditOwnInvoices) &&
  navigate(`/new-quote/${id}`);
```

These two helpers (`canEditInvoice`, `canDeleteInvoice`) are defined once inside the component, above the JSX, and used at all four render locations.

---

### `NewQuote.jsx`

**Two replacements:**

1. Edit-existing guard (line 150):
```js
// Before
if (!user.isAdmin) { alert("Only admin can edit invoices."); navigate("/history"); return; }

// After
const canEdit =
  user.role === config.roles.COMPANY_ADMIN ||
  (user.role === config.roles.COMPANY_USER &&
   config.permissions.companyUser.canEditOwnInvoices);
if (!canEdit) { alert("You do not have permission to edit invoices."); navigate("/history"); return; }
```

2. Invoice `role` field (line 380) — this is a display field on the invoice document, not the user's system role:
```js
// Before
role: user.isAdmin ? "admin" : "Engineer",

// After
role: user.role === config.roles.COMPANY_ADMIN ? "admin" : "Engineer",
```

---

### `Profile.jsx`

**Import change:** add `import config from "../config.js"`.

**Auth checks** — replace `currentUser?.isAdmin` / `currentUser.isAdmin`:

| Location | Replacement |
|---|---|
| Line 73 (`if (currentUser.isAdmin)`) | `if (currentUser.role === config.roles.COMPANY_ADMIN)` |
| Line 276 (spread condition) | `currentUser?.role === config.roles.COMPANY_ADMIN` |
| Line 355 (JSX conditional) | `currentUser?.role === config.roles.COMPANY_ADMIN` |
| Line 552 (tab visibility) | `currentUser?.role === config.roles.COMPANY_ADMIN` |
| Line 689 (tab visibility) | `currentUser?.role === config.roles.COMPANY_ADMIN` |

**Form state** — `newUserForm`:
```js
// Before
const [newUserForm, setNewUserForm] = useState({ username: "", password: "", isAdmin: false });

// After
const [newUserForm, setNewUserForm] = useState({ username: "", password: "", role: config.roles.COMPANY_USER });
```

All `newUserForm.isAdmin` references:
- `!newUserForm.isAdmin` → `newUserForm.role === config.roles.COMPANY_USER`
- `newUserForm.isAdmin` → `newUserForm.role === config.roles.COMPANY_ADMIN`
- `setNewUserForm({ ...newUserForm, isAdmin: false })` → `setNewUserForm({ ...newUserForm, role: config.roles.COMPANY_USER })`
- `setNewUserForm({ ...newUserForm, isAdmin: true })` → `setNewUserForm({ ...newUserForm, role: config.roles.COMPANY_ADMIN })`
- Reset after create: `{ username: "", password: "", isAdmin: false }` → `{ username: "", password: "", role: config.roles.COMPANY_USER }`

**Form state** — `editingUser` (set from API response, which returns `role` string):
- `editingUser.isAdmin` → `editingUser.role === config.roles.COMPANY_ADMIN`
- `!editingUser.isAdmin` → `editingUser.role === config.roles.COMPANY_USER`
- `editingUser.isAdmin: e.target.checked` → `editingUser.role: e.target.checked ? config.roles.COMPANY_ADMIN : config.roles.COMPANY_USER`

**API payloads** — fix the live bug:

`handleCreateUser` (line 157): `api.post("/auth/users", newUserForm)` — once `newUserForm` uses `role` instead of `isAdmin`, this is automatically correct.

`handleUpdateUser` payload (line 201–205):
```js
// Before
const payload = { username: editingUser.username, isAdmin: editingUser.isAdmin, ...password };

// After
const payload = { username: editingUser.username, role: editingUser.role, ...password };
```

**Self-revoke guard** (line 192):
```js
// Before
if (editingUser._id === currentUser._id && !editingUser.isAdmin)

// After
if (editingUser._id === currentUser._id && editingUser.role !== config.roles.COMPANY_ADMIN)
```

**User list display** (lines 604, 629, 634, 635):
- `user.isAdmin` (badge colour condition) → `user.role === config.roles.COMPANY_ADMIN`
- `user.isAdmin ? "Admin" : "User"` → `user.role === config.roles.COMPANY_ADMIN ? "Admin" : "User"`

---

### `Login.jsx`

Currently imports `platformConfig` (default export). Update to:
```js
import config from "../config.js";
// replace: platformConfig.name → config.platform.name
// replace: platformConfig.tagline → config.platform.tagline
```

---

## Out of Scope

- No changes to `ProtectedRoute.jsx`, `Header.jsx`, `App.jsx` — already correct
- No backend changes
- No visual/UX changes — only logic and labels
- No changes to `CompanyDetail.jsx` — already uses `u.role` string directly

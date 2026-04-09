# Frontend Role Config & isAdmin Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every `isAdmin` boolean check in the frontend with role-based checks driven by a single `client/src/config.js`, and fix the live bug where `Profile.jsx` sends `isAdmin` to an API that expects `role`.

**Architecture:** `config.js` is expanded to mirror `server/config.js` — roles as string constants, permissions as toggleable flags. All `isAdmin` references are replaced inline with `user.role === config.roles.COMPANY_ADMIN` (or permission-flag checks for edit/delete buttons). No helper utilities are introduced — this is the pattern already used correctly in `Header.jsx`, `App.jsx`, and `Login.jsx`.

**Tech Stack:** React 18, Vite, Tailwind CSS, React Router v6

---

> **Note:** No test framework is configured (`npm test` exits with error). Each task includes a browser smoke-test step instead.

---

## File Map

| File | Change type |
|---|---|
| `client/src/config.js` | Expand — add `roles`, `permissions`, nest `platform` |
| `client/src/main.jsx` | Update — `platformConfig.name` → `config.platform.name` |
| `client/src/components/Header.jsx` | Update — `platformConfig` → `config.platform` |
| `client/src/components/CompareInvoices.jsx` | Update — `platformConfig` → `config.platform` |
| `client/src/pages/Login.jsx` | Update — `platformConfig` → `config.platform` |
| `client/src/pages/NewQuote.jsx` | Update — add import, fix 2 `isAdmin` usages |
| `client/src/pages/History.jsx` | Update — fix import alias, add 2 helpers, fix 8 `isAdmin` usages |
| `client/src/pages/Profile.jsx` | Update — add import, fix all `isAdmin` in logic + JSX |

---

### Task 1: Expand `client/src/config.js`

**Files:**
- Modify: `client/src/config.js`

- [ ] **Step 1: Replace the entire file**

```js
// client/src/config.js
// Single source of truth for platform constants and permission flags.
// Keep permissions in sync with server/config.js.

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

- [ ] **Step 2: Verify file is valid JS**

```bash
cd client && node -e "import('./src/config.js').then(m => console.log(JSON.stringify(m.default, null, 2)))"
```

Expected: prints the full config object with `platform`, `roles`, and `permissions`.

- [ ] **Step 3: Commit**

```bash
git add client/src/config.js
git commit -m "feat: expand frontend config with roles and permissions"
```

---

### Task 2: Update `platformConfig` consumers — `main.jsx`, `Header.jsx`, `CompareInvoices.jsx`

**Files:**
- Modify: `client/src/main.jsx`
- Modify: `client/src/components/Header.jsx`
- Modify: `client/src/components/CompareInvoices.jsx`

These three files import `platformConfig` and use it purely as a branding/company fallback. Since we renamed the export from `platformConfig` to `config` and nested `name`/`tagline` under `platform:`, each consumer needs updating.

- [ ] **Step 1: Update `main.jsx`**

Current (line 5–7):
```js
import platformConfig from "./config.js";

document.title = platformConfig.name;
```

Replace with:
```js
import config from "./config.js";

document.title = config.platform.name;
```

- [ ] **Step 2: Update `Header.jsx`**

Current (line 5, 9):
```js
import platformConfig from "../config.js";
// ...
const brandConfig = company ?? platformConfig;
```

Replace with:
```js
import config from "../config.js";
// ...
const brandConfig = company ?? config.platform;
```

- [ ] **Step 3: Update `CompareInvoices.jsx`**

Current (line 4):
```js
import platformConfig from "../config.js";
```

Replace with:
```js
import config from "../config.js";
```

Then replace all `platformConfig` occurrences with `config.platform` — there are ~10, all following the same `company ?? platformConfig` pattern:

```bash
# Verify occurrences before editing
grep -n "platformConfig" client/src/components/CompareInvoices.jsx
```

Use the Edit tool (or editor find-and-replace with `replace_all: true`) to change every `platformConfig` → `config.platform` in this file. The result: `company ?? platformConfig` becomes `company ?? config.platform`, and `(company ?? platformConfig).name` becomes `(company ?? config.platform).name`, etc.

- [ ] **Step 4: Verify the app starts**

```bash
cd client && npm run dev
```

Open the browser. The page title should still say "Interiors SaaS". No console errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/main.jsx client/src/components/Header.jsx client/src/components/CompareInvoices.jsx
git commit -m "chore: update platformConfig consumers to use config.platform"
```

---

### Task 3: Update `Login.jsx`

**Files:**
- Modify: `client/src/pages/Login.jsx`

- [ ] **Step 1: Update import and usages**

Current (line 5):
```js
import platformConfig from "../config.js";
```

Replace with:
```js
import config from "../config.js";
```

Current (line 88, 91, 94):
```jsx
<span className="text-3xl font-bold text-white">{platformConfig.name[0]}</span>
// ...
{platformConfig.name}
// ...
{platformConfig.tagline}
```

Replace with:
```jsx
<span className="text-3xl font-bold text-white">{config.platform.name[0]}</span>
// ...
{config.platform.name}
// ...
{config.platform.tagline}
```

- [ ] **Step 2: Verify**

Open the login page in the browser. The platform name and tagline should still render correctly.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Login.jsx
git commit -m "chore: update Login.jsx to use config.platform"
```

---

### Task 4: Fix `NewQuote.jsx`

**Files:**
- Modify: `client/src/pages/NewQuote.jsx`

Two `isAdmin` usages: an edit guard (line ~150) and an invoice `role` field (line ~380).

- [ ] **Step 1: Add config import**

After line 1 (`import { useEffect, useState, useContext, useRef } from "react";`), add:

```js
import config from "../config.js";
```

- [ ] **Step 2: Fix the edit guard (around line 150)**

Current:
```js
if (!user.isAdmin) {
  alert("Only admin can edit invoices.");
  navigate("/history");
  return;
}
```

Replace with:
```js
const canEdit =
  user.role === config.roles.COMPANY_ADMIN ||
  (user.role === config.roles.COMPANY_USER &&
    config.permissions.companyUser.canEditOwnInvoices);
if (!canEdit) {
  alert("You do not have permission to edit invoices.");
  navigate("/history");
  return;
}
```

- [ ] **Step 3: Fix the invoice `role` field (around line 380)**

Current:
```js
role: user.isAdmin ? "admin" : "Engineer",
```

Replace with:
```js
role: user.role === config.roles.COMPANY_ADMIN ? "admin" : "Engineer",
```

- [ ] **Step 4: Verify**

Log in as a `company_user`. Navigate to `/new-quote`. The page should load normally. Attempt to navigate to `/new-quote/:id` (edit an existing invoice) — it should redirect to `/history` with the updated alert message.

Log in as a `company_admin`. Navigate to `/new-quote/:id` — it should load the invoice for editing.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/NewQuote.jsx
git commit -m "fix: replace isAdmin with role-based check in NewQuote"
```

---

### Task 5: Fix `History.jsx`

**Files:**
- Modify: `client/src/pages/History.jsx`

Eight `isAdmin` usages. We also need to update the `platformConfig` import alias and the `.name` access at line 202.

- [ ] **Step 1: Fix import alias (line 6)**

Current:
```js
import platformConfig from "../config.js";
```

Replace with:
```js
import config from "../config.js";
```

- [ ] **Step 2: Fix the platformConfig.name reference (line 202)**

Current:
```js
a.download = `${(company?.name ?? platformConfig.name).replace(/\s+/g, "-")}-${type}-Invoice-${id.slice(-6)}.pdf`;
```

Replace with:
```js
a.download = `${(company?.name ?? config.platform.name).replace(/\s+/g, "-")}-${type}-Invoice-${id.slice(-6)}.pdf`;
```

- [ ] **Step 3: Add two permission helpers**

Find where the handler functions are defined (around line 200, after the `handleDownload` function). Add these two helpers before `handleDelete`:

```js
const canEditInvoice = (inv) =>
  user?.role === config.roles.COMPANY_ADMIN ||
  (user?.role === config.roles.COMPANY_USER &&
    config.permissions.companyUser.canEditOwnInvoices &&
    inv?.createdBy === user?._id);

const canDeleteInvoice = (inv) =>
  user?.role === config.roles.COMPANY_ADMIN ||
  (user?.role === config.roles.COMPANY_USER &&
    config.permissions.companyUser.canSoftDeleteOwnInvoices &&
    inv?.createdBy === user?._id);
```

- [ ] **Step 4: Fix `handleDelete` (line 217)**

Current:
```js
const handleDelete = async (id) => {
  if (!user?.isAdmin) {
    alert("Access denied");
    return;
  }
  setActiveInvoice(id);
  setShowDeleteConfirm(true);
};
```

Replace with:
```js
const handleDelete = (id) => {
  const invoice = invoices.find((i) => i._id === id);
  if (!canDeleteInvoice(invoice)) {
    alert("Access denied");
    return;
  }
  setActiveInvoice(id);
  setShowDeleteConfirm(true);
};
```

- [ ] **Step 5: Fix `handleEdit` (line 241)**

Current:
```js
const handleEdit = (id) => user?.isAdmin && navigate(`/new-quote/${id}`);
```

Replace with:
```js
const handleEdit = (id) => {
  const invoice = invoices.find((i) => i._id === id);
  if (canEditInvoice(invoice)) navigate(`/new-quote/${id}`);
};
```

- [ ] **Step 6: Fix "admin-only" filter option (line 130)**

Current:
```js
if (selectedFilter === "admin-only") {
  return matchesSearch && user?.isAdmin;
}
```

Replace with:
```js
if (selectedFilter === "admin-only") {
  return matchesSearch && user?.role === config.roles.COMPANY_ADMIN;
}
```

- [ ] **Step 7: Fix "Admin only" filter dropdown option (line 359)**

Current:
```jsx
{user?.isAdmin && (
  <option value="admin-only">Admin only</option>
)}
```

Replace with:
```jsx
{user?.role === config.roles.COMPANY_ADMIN && (
  <option value="admin-only">Admin only</option>
)}
```

- [ ] **Step 8: Fix desktop invoice card edit/delete buttons (line ~514)**

There are two occurrences of the pattern `{user?.isAdmin && (<><button edit /><button delete /></>)}` in the desktop invoice cards (around lines 514 and 621 — one in the expanded card view, one in the compact list view). Replace **each** with individual permission-checked buttons:

```jsx
{/* Replace: {user?.isAdmin && (<><button edit /><button delete /></>)} */}
{canEditInvoice(invoice) && (
  <button
    onClick={() => handleEdit(invoice._id)}
    className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors flex-shrink-0"
    title="Edit"
  >
    <Edit size={16} />
  </button>
)}
{canDeleteInvoice(invoice) && (
  <button
    onClick={() => handleDelete(invoice._id)}
    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
    title="Delete"
  >
    <Trash size={16} />
  </button>
)}
```

Apply this pattern at both desktop card locations (around lines 514 and 621). The wrapper `<>...</>` fragment is no longer needed since each button is independently conditional.

- [ ] **Step 9: Fix permanent-delete button in trash tab (line 704)**

Current:
```jsx
{user?.isAdmin && (
  <button
    onClick={() => handlePermDelete(invoice._id)}
    className="..."
  >
    Delete Forever
  </button>
)}
```

Replace with:
```jsx
{user?.role === config.roles.COMPANY_ADMIN && (
  <button
    onClick={() => handlePermDelete(invoice._id)}
    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 text-sm font-medium rounded transition-colors"
  >
    Delete Forever
  </button>
)}
```

- [ ] **Step 10: Verify**

Log in as `company_admin`. Open History. Edit and Delete buttons should be visible on all invoices. The "Admin only" filter option should appear.

Log in as `company_user`. Edit and Delete buttons should only appear on invoices where `invoice.createdBy === user._id` (and `canEditOwnInvoices` is true in config). The "Admin only" filter option should not appear. The permanent Delete Forever button in the trash should not appear.

- [ ] **Step 11: Commit**

```bash
git add client/src/pages/History.jsx
git commit -m "fix: replace isAdmin with role-based permission checks in History"
```

---

### Task 6: Fix `Profile.jsx` — logic (state, auth checks, API payloads)

**Files:**
- Modify: `client/src/pages/Profile.jsx`

This task handles the non-JSX changes: adding the config import, fixing state initialization, auth checks, and API payloads. The JSX (user list, role selector, edit modal) is handled in Task 7.

- [ ] **Step 1: Add config import**

After line 25 (`import { formatISTDateTime } from "../utils/dateTime";`), add:

```js
import config from "../config.js";
```

- [ ] **Step 2: Fix `newUserForm` initial state (line 48)**

Current:
```js
const [newUserForm, setNewUserForm] = useState({
  username: "",
  password: "",
  isAdmin: false,
});
```

Replace with:
```js
const [newUserForm, setNewUserForm] = useState({
  username: "",
  password: "",
  role: config.roles.COMPANY_USER,
});
```

- [ ] **Step 3: Fix the `useEffect` auth check (line 73)**

Current:
```js
if (currentUser.isAdmin) {
  fetchUsers();
} else {
  setLoading(false);
}
```

Replace with:
```js
if (currentUser.role === config.roles.COMPANY_ADMIN) {
  fetchUsers();
} else {
  setLoading(false);
}
```

- [ ] **Step 4: Fix `newUserForm` reset after successful creation (line 175)**

Current:
```js
setNewUserForm({
  username: "",
  password: "",
  isAdmin: false,
});
```

Replace with:
```js
setNewUserForm({
  username: "",
  password: "",
  role: config.roles.COMPANY_USER,
});
```

- [ ] **Step 5: Fix self-revoke guard in `handleUpdateUser` (line 192)**

Current:
```js
if (editingUser._id === currentUser._id && !editingUser.isAdmin) {
  setMessage({
    type: "error",
    text: "You cannot revoke your own admin rights",
  });
  return;
}
```

Replace with:
```js
if (editingUser._id === currentUser._id && editingUser.role !== config.roles.COMPANY_ADMIN) {
  setMessage({
    type: "error",
    text: "You cannot revoke your own admin rights",
  });
  return;
}
```

- [ ] **Step 6: Fix `handleUpdateUser` API payload (lines 201–205)**

Current:
```js
const payload = {
  username: editingUser.username,
  isAdmin: editingUser.isAdmin,
  ...(editingUser.password && { password: editingUser.password }),
};
```

Replace with:
```js
const payload = {
  username: editingUser.username,
  role: editingUser.role,
  ...(editingUser.password && { password: editingUser.password }),
};
```

- [ ] **Step 7: Fix tabs array (line 276)**

Current:
```js
...(currentUser?.isAdmin
  ? [
      { id: "users", label: "Manage Users", icon: Users, color: "purple" },
      { id: "create-user", label: "Create User", icon: UserPlus, color: "green" },
    ]
  : []),
```

Replace with:
```js
...(currentUser?.role === config.roles.COMPANY_ADMIN
  ? [
      { id: "users", label: "Manage Users", icon: Users, color: "purple" },
      { id: "create-user", label: "Create User", icon: UserPlus, color: "green" },
    ]
  : []),
```

- [ ] **Step 8: Commit logic changes**

```bash
git add client/src/pages/Profile.jsx
git commit -m "fix: migrate Profile.jsx isAdmin logic to role-based checks"
```

---

### Task 7: Fix `Profile.jsx` — JSX display

**Files:**
- Modify: `client/src/pages/Profile.jsx`

This task handles JSX-only changes: the sidebar user info card, the users table, the create-user role selector, and the edit-user modal.

- [ ] **Step 1: Fix user info card in sidebar (line 355)**

Current:
```jsx
{currentUser?.isAdmin ? (
  <>
    <Shield className="w-3 h-3 text-purple-500" />
    <span className="text-xs text-purple-600 dark:text-purple-400">
      Administrator
    </span>
  </>
) : (
  <span className="text-xs text-gray-600 dark:text-gray-400">
    Standard User
  </span>
)}
```

Replace with:
```jsx
{currentUser?.role === config.roles.COMPANY_ADMIN ? (
  <>
    <Shield className="w-3 h-3 text-purple-500" />
    <span className="text-xs text-purple-600 dark:text-purple-400">
      Administrator
    </span>
  </>
) : (
  <span className="text-xs text-gray-600 dark:text-gray-400">
    Standard User
  </span>
)}
```

- [ ] **Step 2: Fix "Manage Users" tab condition (line 552)**

Current:
```jsx
{activeTab === "users" && currentUser?.isAdmin && (
```

Replace with:
```jsx
{activeTab === "users" && currentUser?.role === config.roles.COMPANY_ADMIN && (
```

- [ ] **Step 3: Fix user list avatar colour (line 604)**

Current:
```jsx
className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
  user.isAdmin
    ? "bg-gradient-to-br from-purple-500 to-purple-600"
    : "bg-gradient-to-br from-blue-500 to-blue-600"
}`}
```

Replace with:
```jsx
className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
  user.role === config.roles.COMPANY_ADMIN
    ? "bg-gradient-to-br from-purple-500 to-purple-600"
    : "bg-gradient-to-br from-blue-500 to-blue-600"
}`}
```

- [ ] **Step 4: Fix role badge in user list (lines 629–635)**

Current:
```jsx
className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
  user.isAdmin
    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
    : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
}`}
>
  {user.isAdmin && <Shield className="w-3 h-3" />}
  {user.isAdmin ? "Admin" : "User"}
```

Replace with:
```jsx
className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
  user.role === config.roles.COMPANY_ADMIN
    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
    : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
}`}
>
  {user.role === config.roles.COMPANY_ADMIN && <Shield className="w-3 h-3" />}
  {user.role === config.roles.COMPANY_ADMIN ? "Admin" : "User"}
```

- [ ] **Step 5: Fix "Create User" tab condition (line 689)**

Current:
```jsx
{activeTab === "create-user" && currentUser?.isAdmin && (
```

Replace with:
```jsx
{activeTab === "create-user" && currentUser?.role === config.roles.COMPANY_ADMIN && (
```

- [ ] **Step 6: Fix create-user role selector buttons (lines 782–848)**

The "Standard User" button click handler (line 782):
```jsx
// Current
onClick={() => setNewUserForm({ ...newUserForm, isAdmin: false })}

// Replace with
onClick={() => setNewUserForm({ ...newUserForm, role: config.roles.COMPANY_USER })}
```

The "Standard User" button active state (line 785):
```jsx
// Current: !newUserForm.isAdmin
// Replace with:
newUserForm.role === config.roles.COMPANY_USER
```

The radio dot inside "Standard User" button (line 793 and 798):
```jsx
// Current (border class):
!newUserForm.isAdmin ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
// Replace:
newUserForm.role === config.roles.COMPANY_USER ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"

// Current (dot visibility):
{!newUserForm.isAdmin && (<div className="w-1.5 h-1.5 rounded-full bg-white"></div>)}
// Replace:
{newUserForm.role === config.roles.COMPANY_USER && (<div className="w-1.5 h-1.5 rounded-full bg-white"></div>)}
```

The "Administrator" button click handler (line 817):
```jsx
// Current
onClick={() => setNewUserForm({ ...newUserForm, isAdmin: true })}

// Replace with
onClick={() => setNewUserForm({ ...newUserForm, role: config.roles.COMPANY_ADMIN })}
```

The "Administrator" button active state and radio dot (lines 820, 828, 833):
```jsx
// Current active class: newUserForm.isAdmin
// Replace: newUserForm.role === config.roles.COMPANY_ADMIN

// Current border class:
newUserForm.isAdmin ? "border-purple-500 bg-purple-500" : "border-gray-300 dark:border-gray-600"
// Replace:
newUserForm.role === config.roles.COMPANY_ADMIN ? "border-purple-500 bg-purple-500" : "border-gray-300 dark:border-gray-600"

// Current dot visibility:
{newUserForm.isAdmin && (<div className="w-1.5 h-1.5 rounded-full bg-white"></div>)}
// Replace:
{newUserForm.role === config.roles.COMPANY_ADMIN && (<div className="w-1.5 h-1.5 rounded-full bg-white"></div>)}
```

- [ ] **Step 7: Fix edit-user modal role toggle (lines 941–957)**

Current:
```jsx
<input
  type="checkbox"
  checked={editingUser.isAdmin}
  onChange={(e) =>
    setEditingUser({
      ...editingUser,
      isAdmin: e.target.checked,
    })
  }
  className="sr-only"
/>
<div
  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
    editingUser.isAdmin
      ? "border-purple-500 bg-purple-500"
      : "border-gray-300 dark:border-gray-600"
  }`}
>
  {editingUser.isAdmin && (
    <CheckCircle className="w-3.5 h-3.5 text-white" />
  )}
```

Replace with:
```jsx
<input
  type="checkbox"
  checked={editingUser.role === config.roles.COMPANY_ADMIN}
  onChange={(e) =>
    setEditingUser({
      ...editingUser,
      role: e.target.checked ? config.roles.COMPANY_ADMIN : config.roles.COMPANY_USER,
    })
  }
  className="sr-only"
/>
<div
  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
    editingUser.role === config.roles.COMPANY_ADMIN
      ? "border-purple-500 bg-purple-500"
      : "border-gray-300 dark:border-gray-600"
  }`}
>
  {editingUser.role === config.roles.COMPANY_ADMIN && (
    <CheckCircle className="w-3.5 h-3.5 text-white" />
  )}
```

- [ ] **Step 8: Verify**

Log in as `company_admin`:
- Profile page loads; sidebar shows "Administrator" badge
- "Manage Users" and "Create User" tabs are visible
- User list shows correct purple/blue avatar and role badge per role string
- Create user form: "Standard User" button defaults to selected; clicking "Administrator" selects it
- Edit user modal: checkbox reflects `user.role === "company_admin"` correctly
- Creating a user sends `role: "company_user"` or `role: "company_admin"` to the API (check Network tab) — not `isAdmin`

Log in as `company_user`:
- Profile page loads; sidebar shows "Standard User" badge
- Only "My Profile" tab is visible

- [ ] **Step 9: Commit**

```bash
git add client/src/pages/Profile.jsx
git commit -m "fix: migrate Profile.jsx isAdmin JSX to role-based checks, fix API payload"
```

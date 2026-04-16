# Super Admin Add User Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Add User" button to the Users tab of CompanyDetail that opens a modal allowing super admins to create company users with a role selector (styled radio cards with icons).

**Architecture:** New `CreateUserModal` component (modelled on `EditUserModal`) with username/password fields and two radio-card role options. `CompanyDetail` gets an "Add User" button in the Users tab header and mounts the modal. Backend already supports super admin user creation via `POST /auth/users` with `companyId` in the body — no backend changes needed.

**Tech Stack:** React 18, Tailwind CSS, `lucide-react` (Shield, User, UserPlus, X icons), Axios via `client/src/api/api.js`, `client/src/config.js` for role constants.

**Note on testing:** No Jest/Vitest in this project. Verification is `npm run lint`, `npm run build`, and manual browser checks.

---

## File Structure

**Create:**
- `client/src/components/CreateUserModal.jsx` — ~130 lines. Owns form state (`username`, `password`, `role`), submitting flag, inline error. Calls `POST /auth/users` with `companyId` in body. Calls `onSave(newUser)` on success.

**Modify:**
- `client/src/pages/CompanyDetail.jsx` — add `CreateUserModal` import + `UserPlus` lucide import, `showCreateUser` state, "Add User" button header above the users table, `setShowCreateUser(false)` on tab switch, modal mount at bottom.

---

## Task 1: Create CreateUserModal component

**Files:**
- Create: `client/src/components/CreateUserModal.jsx`

- [ ] **Step 1: Create the component file**

Write exactly this to `client/src/components/CreateUserModal.jsx`:

```jsx
import { useEffect, useState } from "react";
import { Shield, User, X } from "lucide-react";
import api from "../api/api";
import config from "../config";

const ROLES = [
  {
    value: config.roles.COMPANY_ADMIN,
    label: "Company Admin",
    description: "Can manage users and company settings",
    Icon: Shield,
    color: "purple",
  },
  {
    value: config.roles.COMPANY_USER,
    label: "Standard User",
    description: "Can create and view invoices",
    Icon: User,
    color: "blue",
  },
];

export default function CreateUserModal({ companyId, onSave, onClose }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: config.roles.COMPANY_USER,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/users", {
        username: form.username,
        password: form.password,
        role: form.role,
        companyId,
      });
      onSave(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3
            id="create-user-title"
            className="text-lg font-bold text-gray-900 dark:text-white"
          >
            Add User
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Error */}
        <div aria-live="polite">
          {error && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="create-user-username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Username
              </label>
              <input
                id="create-user-username"
                type="text"
                autoFocus
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="create-user-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="create-user-password"
                type="password"
                autoComplete="new-password"
                minLength={4}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Role */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </p>
              <div className="space-y-2">
                {ROLES.map(({ value, label, description, Icon, color }) => {
                  const selected = form.role === value;
                  return (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selected
                          ? color === "purple"
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={selected}
                        onChange={() => setForm((f) => ({ ...f, role: value }))}
                        className="sr-only"
                      />
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          color === "purple"
                            ? "bg-purple-100 dark:bg-purple-900/40"
                            : "bg-blue-100 dark:bg-blue-900/40"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            color === "purple"
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            color === "purple"
                              ? "text-purple-700 dark:text-purple-300"
                              : "text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {description}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selected
                            ? color === "purple"
                              ? "border-purple-500"
                              : "border-blue-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {selected && (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              color === "purple" ? "bg-purple-500" : "bg-blue-500"
                            }`}
                          />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 mt-6">
            <button
              type="submit"
              disabled={submitting}
              aria-disabled={submitting}
              className="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                "Create User"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run lint`

Expected: no errors in the new file. Pre-existing warnings in other files are fine.

- [ ] **Step 3: Commit**

```bash
cd d:/Study/MERN/Interiors-Invoice-Generation
git add client/src/components/CreateUserModal.jsx
git commit -m "feat: add CreateUserModal component for super admin"
```

---

## Task 2: Wire CreateUserModal into CompanyDetail

**Files:**
- Modify: `client/src/pages/CompanyDetail.jsx`

Read the file before editing. Key facts about the current file:
- Imports are at lines 1–7
- `lucide-react` is not currently imported (no icons used yet in this file — icons come from child components)
- State declarations are around lines 13–17
- Tab bar maps over a structured TABS array at lines 78–93
- Users tab body starts at `{tab === "users" && (` around line 93
- Modal mounts are near the bottom, around lines 205–231
- The file already has `editSuccess` toast state and its `useEffect` cleanup

- [ ] **Step 1: Add imports**

Find the existing import block at the top:
```jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import EditUserModal from "../components/EditUserModal";
import CompanyProfileTab from "../components/CompanyProfileTab";
```

Replace with:
```jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import API from "../api/api";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import EditUserModal from "../components/EditUserModal";
import CompanyProfileTab from "../components/CompanyProfileTab";
import CreateUserModal from "../components/CreateUserModal";
```

- [ ] **Step 2: Add showCreateUser state**

Find the state declarations block:
```jsx
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editSuccess, setEditSuccess] = useState("");
```

Replace with:
```jsx
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editSuccess, setEditSuccess] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
```

- [ ] **Step 3: Clear showCreateUser on tab switch**

Find the tab onClick handler:
```jsx
            onClick={() => { setTab(key); setPreviewInvoice(null); setEditingUser(null); }}
```

Replace with:
```jsx
            onClick={() => { setTab(key); setPreviewInvoice(null); setEditingUser(null); setShowCreateUser(false); }}
```

- [ ] **Step 4: Add "Add User" header and button above the users table**

Find the opening of the Users tab body:
```jsx
      {tab === "users" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
```

Replace with:
```jsx
      {tab === "users" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Users ({users.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
```

Then find the closing of the users table div (the `)}` that closes the `{tab === "users" && (` block):
```jsx
        </div>
      )}

      {/* Company Profile Tab */}
```

Replace with:
```jsx
          </div>
        </div>
      )}

      {/* Company Profile Tab */}
```

- [ ] **Step 5: Mount CreateUserModal**

Find the existing modal mount block near the bottom:
```jsx
      {editingUser && (
        <EditUserModal
```

Insert the `CreateUserModal` mount just before it:
```jsx
      {showCreateUser && (
        <CreateUserModal
          companyId={id}
          onSave={(newUser) => {
            setUsers((prev) => [...prev, newUser]);
            setShowCreateUser(false);
            setEditSuccess("User created successfully!");
          }}
          onClose={() => setShowCreateUser(false)}
        />
      )}

      {editingUser && (
        <EditUserModal
```

- [ ] **Step 6: Lint**

Run: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run lint`

Expected: no new errors from CompanyDetail.jsx.

- [ ] **Step 7: Build**

Run: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run build`

Expected: build completes with no errors.

- [ ] **Step 8: Commit**

```bash
cd d:/Study/MERN/Interiors-Invoice-Generation
git add client/src/pages/CompanyDetail.jsx
git commit -m "feat: wire Add User button and CreateUserModal into CompanyDetail"
```

---

## Task 3: Manual browser verification

- [ ] **Step 1: Start dev servers**

Terminal 1: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run dev`
Terminal 2: `cd d:/Study/MERN/Interiors-Invoice-Generation/server && node server.js`

- [ ] **Step 2: Verify Add User button appears**

Log in as super admin. Navigate to a company. Open the Users tab.

Expected: "Users (N)" label on the left and a purple "Add User" button (with person-plus icon) on the right, above the table.

- [ ] **Step 3: Modal opens with correct defaults**

Click "Add User".

Expected: modal opens with username field focused, password blank, "Standard User" radio card pre-selected (blue border).

- [ ] **Step 4: Create a standard user**

Fill in a new username and a password of at least 4 characters. Keep role as Standard User. Click Create User.

Expected: modal closes, new user appears at the bottom of the users table with the `company_user` role badge, green success toast "User created successfully!" shows briefly.

- [ ] **Step 5: Create a company admin**

Click "Add User" again. Fill in a new username and password. Click the "Company Admin" radio card — it should switch to a purple border. Click Create User.

Expected: new user appears in the table with the `company_admin` role badge.

- [ ] **Step 6: Role card visual feedback**

Click between the two radio cards without submitting.

Expected: the selected card shows a coloured border and tinted background; the other card returns to its default grey border. The filled dot indicator appears on the selected card.

- [ ] **Step 7: Duplicate username error**

Try creating a user with a username that already exists.

Expected: inline red error message appears inside the modal ("Username already taken" or similar from the server). Modal stays open.

- [ ] **Step 8: Short password**

Try submitting with a 3-character password.

Expected: browser-native validation prevents submission (the input has `minLength={4}`).

- [ ] **Step 9: Cancel / close methods**

Verify all close paths: Cancel button, X button, backdrop click, ESC key — all close the modal without creating a user.

- [ ] **Step 10: Tab switch clears modal**

Open the Add User modal, then click the Invoices tab.

Expected: modal closes immediately.

- [ ] **Step 11: Dark mode**

Toggle dark mode. Open the Add User modal.

Expected: role cards, inputs, and buttons all render correctly with dark palette — no white flashes or unreadable text.

---

## Self-Review

**Spec coverage:**

- **New `CreateUserModal` component** → Task 1 ✓
- **Props: `companyId`, `onSave`, `onClose`** → Task 1 component signature ✓
- **form state: `{ username, password, role }`, role defaults to `company_user`** → Task 1 `useState` ✓
- **submitting + error state** → Task 1 ✓
- **Same modal shell as EditUserModal (backdrop, stopPropagation, ESC, ARIA)** → Task 1 ✓
- **`role="dialog"`, `aria-modal`, `aria-labelledby="create-user-title"`** → Task 1 ✓
- **Username required, autofocus, htmlFor/id pair** → Task 1 ✓
- **Password required, minLength=4, htmlFor/id pair** → Task 1 ✓
- **Two radio cards: Company Admin (Shield, purple) + Standard User (User, blue)** → Task 1 ROLES array + JSX ✓
- **Selected card: coloured border + tint; unselected: gray border** → Task 1 conditional classes ✓
- **Filled dot indicator showing selection** → Task 1 inner div inside the circle ✓
- **`POST /auth/users` with `{ username, password, role, companyId }`** → Task 1 `handleSubmit` ✓
- **`onSave(res.data.data)` on success** → Task 1 ✓
- **Inline error on failure** → Task 1 + `aria-live="polite"` wrapper ✓
- **Create button disabled + aria-disabled while submitting; shows spinner + "Creating…"** → Task 1 ✓
- **"Add User" button (UserPlus icon, purple) in Users tab header** → Task 2 Step 4 ✓
- **`showCreateUser` state** → Task 2 Step 2 ✓
- **`setShowCreateUser(false)` on tab switch** → Task 2 Step 3 ✓
- **Modal mount with `onSave` appending to users list + closing + showing editSuccess toast** → Task 2 Step 5 ✓
- **Reuses existing `editSuccess` toast (already auto-clears after 3 s)** → Task 2 Step 5 ✓

**Placeholder scan:** None found. All steps contain complete code.

**Type consistency:**
- `onSave(res.data.data)` in Task 1 → wired as `onSave={(newUser) => { setUsers((prev) => [...prev, newUser]); ... }}` in Task 2 ✓
- `companyId` prop in Task 1 used in POST body → supplied as `companyId={id}` from `useParams` in Task 2 ✓
- `showCreateUser` / `setShowCreateUser` consistent across Steps 2, 3, 4, 5 of Task 2 ✓
- `config.roles.COMPANY_ADMIN` / `config.roles.COMPANY_USER` used consistently — matches `client/src/config.js` ✓

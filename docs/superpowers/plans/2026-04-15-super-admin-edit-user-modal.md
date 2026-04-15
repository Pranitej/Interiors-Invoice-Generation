# Super Admin Edit User Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the username/password edit modal from Profile.jsx into a shared `EditUserModal` component, use it in Profile.jsx (removing dead role-toggle code), and wire it into CompanyDetail so super admins can edit any company's users.

**Architecture:** New `EditUserModal` component owns form state and API call (`PUT /auth/users/:id`); callers supply the user object and an `onSave(updatedUser)` callback to patch their local list. No backend changes needed — the existing endpoint already permits SUPER_ADMIN and uses `companyId = null` to update any user by ID.

**Tech Stack:** React 18, Tailwind CSS, `lucide-react`, Axios (via `client/src/api/api.js`).

**Note on testing:** No Jest/Vitest in this project. Verification is `npm run lint`, `npm run build`, and manual browser checks.

---

## File Structure

**Create:**
- `client/src/components/EditUserModal.jsx` — ~90 lines. Owns form state (`username`, `password`), submitting flag, inline error, ESC handler, API call. Calls `onSave(user)` on success.

**Modify:**
- `client/src/pages/Profile.jsx` — remove `handleUpdateUser`, remove inline edit modal block (lines 1138–1252), add `EditUserModal` import, replace with `<EditUserModal>` mount.
- `client/src/pages/CompanyDetail.jsx` — add `editingUser` + `editSuccess` state, "Actions" column to users table, Edit button per row, `EditUserModal` mount, success banner, clear state on tab switch.

---

## Task 1: Create EditUserModal component

**Files:**
- Create: `client/src/components/EditUserModal.jsx`

- [ ] **Step 1: Create the component file**

Write exactly this to `client/src/components/EditUserModal.jsx`:

```jsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../api/api";

export default function EditUserModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({ username: user.username, password: "" });
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
      const payload = { username: form.username };
      if (form.password) payload.password = form.password;
      const res = await api.put(`/auth/users/${user._id}`, payload);
      onSave(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
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
        aria-labelledby="edit-user-title"
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            id="edit-user-title"
            className="text-lg font-bold text-gray-900 dark:text-white"
          >
            Edit User
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

        {error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                New Password
                <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-1">
                  (Optional)
                </span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          <div className="flex gap-2.5 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
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

Expected: no new errors introduced by this file. Pre-existing errors in other files are fine.

- [ ] **Step 3: Commit**

```bash
cd d:/Study/MERN/Interiors-Invoice-Generation
git add client/src/components/EditUserModal.jsx
git commit -m "feat: add shared EditUserModal component"
```

---

## Task 2: Update Profile.jsx to use EditUserModal

**Files:**
- Modify: `client/src/pages/Profile.jsx`

Read the file before editing. The inline edit modal starts at the comment `{/* Edit User Modal */}` and ends at `</div>` just before the final `</div>` that closes the root return. `handleUpdateUser` is defined around line 228.

- [ ] **Step 1: Add the EditUserModal import**

Find the existing import block at the top of `Profile.jsx`. After the line:
```jsx
import CompanyLogoChanger from "../components/CompanyLogoChanger";
```

Add:
```jsx
import EditUserModal from "../components/EditUserModal";
```

- [ ] **Step 2: Remove handleUpdateUser**

Find and delete the entire `handleUpdateUser` function:

```jsx
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (editingUser._id === currentUser._id && editingUser.role !== config.roles.COMPANY_ADMIN) {
      setMessage({
        type: "error",
        text: "You cannot revoke your own admin rights",
      });
      return;
    }

    try {
      const payload = {
        username: editingUser.username,
        role: editingUser.role,
        ...(editingUser.password && { password: editingUser.password }),
      };

      await api.put(`/auth/users/${editingUser._id}`, payload);

      setMessage({
        type: "success",
        text: "User updated successfully!",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Update user failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update user",
      });
    }
  };
```

- [ ] **Step 3: Replace the inline edit modal with EditUserModal**

Find the entire inline edit modal block:

```jsx
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit User
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    New Password
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-1">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={editingUser.password || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave blank to keep current"
                  />
                </div>

                {/* Role */}
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className="relative">
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
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Administrator
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
```

Replace the entire block with:

```jsx
      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={(updated) => {
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
            setEditingUser(null);
            setMessage({ type: "success", text: "User updated successfully!" });
          }}
          onClose={() => setEditingUser(null)}
        />
      )}
```

- [ ] **Step 4: Lint**

Run: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run lint`

Expected: no new errors. If `CheckCircle` or `Shield` now show as unused imports in Profile.jsx, remove them from the import line at the top of the file — but only if they are not used anywhere else in the file. Check by searching for `CheckCircle` and `Shield` in the remaining file content before removing.

- [ ] **Step 5: Build**

Run: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run build`

Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
cd d:/Study/MERN/Interiors-Invoice-Generation
git add client/src/pages/Profile.jsx
git commit -m "refactor: replace inline edit user modal in Profile with EditUserModal component"
```

---

## Task 3: Wire EditUserModal into CompanyDetail

**Files:**
- Modify: `client/src/pages/CompanyDetail.jsx`

Read the file before editing.

- [ ] **Step 1: Add imports and new state**

Find the existing imports at the top:
```jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
```

Replace with:
```jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import EditUserModal from "../components/EditUserModal";
```

Then find the existing state block:
```jsx
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState(null);
```

Replace with:
```jsx
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editSuccess, setEditSuccess] = useState("");
```

- [ ] **Step 2: Clear editingUser on tab switch**

Find the tab `onClick` handler (already clears `previewInvoice`):
```jsx
        onClick={() => { setTab(t); setPreviewInvoice(null); }}
```

Replace with:
```jsx
        onClick={() => { setTab(t); setPreviewInvoice(null); setEditingUser(null); }}
```

- [ ] **Step 3: Add "Actions" column header and fix colSpan in the users table**

Find the users table header:
```jsx
                {["Username", "Role", "Created"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
```

Replace with:
```jsx
                {["Username", "Role", "Created", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
```

Then find the users empty-state:
```jsx
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    No users yet.
                  </td>
                </tr>
              )}
```

Replace with:
```jsx
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No users yet.
                  </td>
                </tr>
              )}
```

- [ ] **Step 4: Add Edit button to each user row**

Find the user row (the last `<td>` in each row is the Created date cell):
```jsx
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
```

Replace with:
```jsx
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditingUser(u)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
```

- [ ] **Step 5: Mount EditUserModal and success banner**

Find the existing modal mounting at the bottom of the component (before the final closing `</div>`):
```jsx
      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          company={company}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
```

Replace with:
```jsx
      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          company={company}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={(updated) => {
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
            setEditingUser(null);
            setEditSuccess("User updated successfully!");
            setTimeout(() => setEditSuccess(""), 3000);
          }}
          onClose={() => setEditingUser(null)}
        />
      )}

      {editSuccess && (
        <div className="fixed bottom-4 right-4 z-40 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {editSuccess}
        </div>
      )}
    </div>
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
git commit -m "feat: add user edit capability to super admin company detail"
```

---

## Task 4: Manual browser verification

- [ ] **Step 1: Start the dev servers**

Terminal 1: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run dev`
Terminal 2: `cd d:/Study/MERN/Interiors-Invoice-Generation/server && node server.js` (or however the server is normally started)

- [ ] **Step 2: Verify super admin can edit a user**

Log in as super admin. Navigate to a company that has users. Open the Users tab.

Expected: "Actions" column with an "Edit" button appears on every user row.

- [ ] **Step 3: Edit username**

Click Edit on a user. Change the username. Click Save Changes.

Expected: modal closes, the row in the table shows the new username, green success toast appears bottom-right for ~3 seconds.

- [ ] **Step 4: Edit password**

Click Edit on a user. Enter a new password. Click Save Changes.

Expected: no error. Log in as that user with the new password to confirm it worked.

- [ ] **Step 5: Leave password blank**

Click Edit, change only the username, leave password blank. Save.

Expected: saves successfully. Existing password is unchanged (user can still log in with old password).

- [ ] **Step 6: Inline error**

Click Edit, clear the username field entirely, attempt to save.

Expected: browser native `required` validation prevents submission (the input is `required`).

Try submitting a username that is already taken by another user (if applicable).

Expected: inline red error message appears inside the modal. Modal stays open.

- [ ] **Step 7: Close methods**

Verify all three close methods: X button, backdrop click, ESC key — all close without saving.

- [ ] **Step 8: Tab switch clears modal**

Open the Edit modal, then click the "Invoices" tab.

Expected: modal closes immediately.

- [ ] **Step 9: Regression — Profile.jsx still works**

Log in as a company admin. Go to Profile → Users tab. Click the edit (pencil) icon on a user.

Expected: the same Edit User modal opens, pre-fills username, password optional — identical behaviour to before. Username update saves correctly.

- [ ] **Step 10: Dark mode**

Toggle dark mode. Open the Edit modal.

Expected: modal uses dark palette throughout — no white flashes or unreadable text.

---

## Self-Review

Spec coverage check:

- **New `EditUserModal` component with username + password fields** → Task 1 ✓
- **No role toggle** → Task 1 code contains no role field ✓
- **ESC + backdrop close** → Task 1 `useEffect` + `onClick={onClose}` ✓
- **Inline error (no alert)** → Task 1 `error` state rendered in red banner ✓
- **`onSave(updatedUser)` callback** → Task 1 `onSave(res.data.data)` ✓
- **Profile.jsx uses EditUserModal** → Task 2 ✓
- **handleUpdateUser removed** → Task 2 Step 2 ✓
- **Dead role-toggle removed** → Task 2 Step 3 (the replacement block has no role toggle) ✓
- **CompanyDetail Actions column + Edit button** → Task 3 Steps 3–4 ✓
- **Clear editingUser on tab switch** → Task 3 Step 2 ✓
- **Success toast in CompanyDetail** → Task 3 Step 5 ✓
- **`aria-modal`, `role="dialog"`, `aria-labelledby`** → Task 1 code ✓

Placeholder scan: none found. All steps contain concrete code.

Type consistency: `onSave(updated)` used consistently in Tasks 2 and 3. `editingUser` / `setEditingUser` consistent across Task 3 steps.

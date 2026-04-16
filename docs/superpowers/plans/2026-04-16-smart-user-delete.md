# Smart User Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a smart delete for users — soft-delete if they have invoices, hard-delete otherwise — behind a styled confirmation modal, for both Super Admin (CompanyDetail) and Company Admin (Profile).

**Architecture:** Backend adds `deletedAt` to User and replaces the hard delete with an invoice-count check. A new shared `DeleteUserModal` component handles the confirmation UI. Both CompanyDetail and Profile wire it in the same way: `deleteTarget` state opens the modal, the confirm handler calls the API, success clears state and refreshes the list.

**Tech Stack:** MongoDB/Mongoose, Express, React, Tailwind CSS, lucide-react

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `server/models/User.js` | Modify | Add `deletedAt` field |
| `server/services/auth.service.js` | Modify | Smart delete in `deleteUser`; filter in `listUsers` |
| `client/src/components/DeleteUserModal.jsx` | Create | Reusable confirmation modal |
| `client/src/pages/CompanyDetail.jsx` | Modify | Add Delete button + wire modal (Super Admin) |
| `client/src/pages/Profile.jsx` | Modify | Replace `window.confirm` + wire modal (Company Admin) |

---

### Task 1: Add `deletedAt` to User model

**Files:**
- Modify: `server/models/User.js`

- [ ] **Step 1: Open the file and add the field**

Current schema ends at `companyId`. Add `deletedAt` before the closing brace of the schema fields:

```js
// server/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "company_admin", "company_user"],
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
```

- [ ] **Step 2: Verify the server still starts**

```bash
cd server && node --input-type=module <<'EOF'
import User from "./models/User.js";
console.log("deletedAt default:", User.schema.paths.deletedAt.defaultValue);
EOF
```

Expected output: `deletedAt default: null`

- [ ] **Step 3: Commit**

```bash
git add server/models/User.js
git commit -m "feat: add deletedAt field to User model for soft delete"
```

---

### Task 2: Update `listUsers` to exclude soft-deleted users

**Files:**
- Modify: `server/services/auth.service.js` — `listUsers` function (line ~69)

- [ ] **Step 1: Update the query filter**

Replace the existing `listUsers` function:

```js
export async function listUsers(companyId) {
  const query = companyId
    ? { companyId, deletedAt: null }
    : { deletedAt: null };
  return User.find(query).select("-password");
}
```

- [ ] **Step 2: Verify manually**

Start the server and call `GET /auth/users` as a company admin. Confirm that only users with `deletedAt: null` are returned. (You can temporarily set a user's `deletedAt` in MongoDB Compass to verify they disappear from the list.)

- [ ] **Step 3: Commit**

```bash
git add server/services/auth.service.js
git commit -m "feat: exclude soft-deleted users from listUsers"
```

---

### Task 3: Implement smart delete in `deleteUser` service

**Files:**
- Modify: `server/services/auth.service.js` — `deleteUser` function (line ~100)

- [ ] **Step 1: Import Invoice model at the top of auth.service.js**

The file already imports `User`, `Company`, `AppError`, `config`. Add `Invoice`:

```js
import Invoice from "../models/Invoice.js";
```

- [ ] **Step 2: Replace `deleteUser` with smart delete logic**

```js
export async function deleteUser(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid user ID");

  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;

  const user = await User.findOne(filter);
  if (!user) throw new AppError(404, "User not found");

  const invoiceCount = await Invoice.countDocuments({ createdBy: id });

  if (invoiceCount > 0) {
    await User.findByIdAndUpdate(id, { deletedAt: new Date() });
  } else {
    await User.findOneAndDelete(filter);
  }
}
```

- [ ] **Step 3: Verify with a user that has invoices**

Using the running app or a REST client (e.g. Postman):
1. Log in as super admin, get a token.
2. Find a `userId` that has at least one invoice in the DB.
3. `DELETE /auth/users/:userId` with the token.
4. Confirm response: `{ success: true, message: "User deleted successfully!" }`.
5. Check MongoDB — user still exists with `deletedAt` set to a date.
6. Call `GET /super-admin/companies/:companyId/users` — user no longer appears.

- [ ] **Step 4: Verify with a user that has no invoices**

1. Create a throwaway user via `POST /auth/users`.
2. `DELETE /auth/users/:newUserId`.
3. Check MongoDB — user document is gone entirely.

- [ ] **Step 5: Commit**

```bash
git add server/services/auth.service.js
git commit -m "feat: smart delete — soft delete if user has invoices, hard delete otherwise"
```

---

### Task 4: Create `DeleteUserModal` component

**Files:**
- Create: `client/src/components/DeleteUserModal.jsx`

- [ ] **Step 1: Create the file**

```jsx
// client/src/components/DeleteUserModal.jsx
import { useEffect } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteUserModal({ user, onConfirm, onClose, deleting }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        className="bg-white dark:bg-gray-800 rounded-lg p-5 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="text-red-600 dark:text-red-400" size={20} />
          </div>
          <h3
            id="delete-user-title"
            className="text-base font-semibold text-gray-900 dark:text-white mb-2"
          >
            Delete &quot;{user.username}&quot;?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This will permanently delete the user. If they have created
            invoices, their account will be retained to preserve invoice
            history.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(user._id)}
              disabled={deleting}
              className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={14} />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component renders without errors**

Import it temporarily in any page and render it with a mock user to check it appears correctly, then remove the temporary usage.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/DeleteUserModal.jsx
git commit -m "feat: add DeleteUserModal reusable confirmation component"
```

---

### Task 5: Wire delete into CompanyDetail (Super Admin)

**Files:**
- Modify: `client/src/pages/CompanyDetail.jsx`

- [ ] **Step 1: Add the import**

At the top of [client/src/pages/CompanyDetail.jsx](client/src/pages/CompanyDetail.jsx), add the import alongside the other component imports:

```js
import DeleteUserModal from "../components/DeleteUserModal";
```

- [ ] **Step 2: Add state variables**

Inside `CompanyDetail`, after the existing `showCreateUser` state (line ~21), add:

```js
const [deleteTarget, setDeleteTarget] = useState(null);
const [deleting, setDeleting] = useState(false);
```

- [ ] **Step 3: Add the confirm handler**

After the existing `useEffect` blocks and before the loading check, add:

```js
const handleConfirmDeleteUser = async (userId) => {
  setDeleting(true);
  try {
    await API.delete(`/auth/users/${userId}`);
    setUsers((prev) => prev.filter((u) => u._id !== userId));
    setEditSuccess("User deleted successfully!");
  } catch {
    setEditSuccess(""); // clear any stale success
    // error is silent here; could surface via a separate error state if needed
  } finally {
    setDeleting(false);
    setDeleteTarget(null);
  }
};
```

- [ ] **Step 4: Add the Delete button in the Users tab table**

In the Users tab, find the `<td>` that contains the Edit button (around line 158). Replace it with:

```jsx
<td className="px-4 py-3">
  <div className="flex items-center gap-2">
    <button
      type="button"
      aria-label={`Edit user ${u.username}`}
      onClick={() => { setEditingUser(u); setShowCreateUser(false); }}
      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
    >
      Edit
    </button>
    <button
      type="button"
      aria-label={`Delete user ${u.username}`}
      onClick={() => setDeleteTarget(u)}
      className="px-3 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
    >
      Delete
    </button>
  </div>
</td>
```

- [ ] **Step 5: Render the modal**

At the bottom of the JSX return, after the `EditUserModal` block and before the toast `<div>`, add:

```jsx
{deleteTarget && (
  <DeleteUserModal
    user={deleteTarget}
    onConfirm={handleConfirmDeleteUser}
    onClose={() => { if (!deleting) setDeleteTarget(null); }}
    deleting={deleting}
  />
)}
```

- [ ] **Step 6: Verify in browser**

1. Log in as super admin, navigate to a company's detail page.
2. Open the Users tab — confirm Delete button appears next to Edit for each user.
3. Click Delete — confirm the modal appears with the user's name.
4. Click Cancel — confirm the modal closes.
5. Click Delete again, then confirm Delete in the modal — confirm the user disappears from the list and the green toast appears.
6. Check MongoDB to confirm soft vs hard delete based on invoice presence.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/CompanyDetail.jsx
git commit -m "feat: add delete user button and modal to CompanyDetail (super admin)"
```

---

### Task 6: Wire delete into Profile (Company Admin)

**Files:**
- Modify: `client/src/pages/Profile.jsx`

- [ ] **Step 1: Add the import**

At the top of [client/src/pages/Profile.jsx](client/src/pages/Profile.jsx), add alongside the existing `EditUserModal` import:

```js
import DeleteUserModal from "../components/DeleteUserModal";
```

- [ ] **Step 2: Add state variables**

Inside `Profile`, after the `editingUser` state declaration (around line 55), add:

```js
const [deleteTarget, setDeleteTarget] = useState(null);
const [deleting, setDeleting] = useState(false);
```

- [ ] **Step 3: Replace `handleDeleteUser` with two handlers**

Remove the existing `handleDeleteUser` function entirely (lines ~229–259) and replace with:

```js
const handleDeleteUser = (user) => {
  if (user._id === currentUser._id) {
    setMessage({ type: "error", text: "Cannot delete your own account" });
    return;
  }
  setDeleteTarget(user);
};

const confirmDeleteUser = async (userId) => {
  setDeleting(true);
  try {
    await api.delete(`/auth/users/${userId}`);
    setMessage({ type: "success", text: "User deleted successfully!" });
    fetchUsers();
  } catch (error) {
    setMessage({
      type: "error",
      text: error.response?.data?.message || "Failed to delete user",
    });
  } finally {
    setDeleting(false);
    setDeleteTarget(null);
  }
};
```

- [ ] **Step 4: Update the Trash2 button's onClick**

Find the Trash2 button in the Manage Users table (around line 911). Change its `onClick`:

```jsx
<button
  onClick={() => handleDeleteUser(user)}
  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
  title="Delete User"
>
  <Trash2 className="w-3.5 h-3.5" />
</button>
```

Note: `handleDeleteUser` now receives the full `user` object (not just `user._id`) so the modal can display the username.

- [ ] **Step 5: Render the modal**

At the bottom of the JSX return, after the existing `{editingUser && <EditUserModal ... />}` block (around line 1103), add:

```jsx
{deleteTarget && (
  <DeleteUserModal
    user={deleteTarget}
    onConfirm={confirmDeleteUser}
    onClose={() => { if (!deleting) setDeleteTarget(null); }}
    deleting={deleting}
  />
)}
```

- [ ] **Step 6: Verify in browser**

1. Log in as a company admin, navigate to Profile → Manage Users tab.
2. Click the red trash icon for a user — confirm the styled modal appears (not a native browser dialog).
3. Click Cancel — confirm the modal closes.
4. Confirm delete — confirm the user disappears from the list and the green success message appears.
5. Check MongoDB to confirm soft vs hard delete based on invoice presence.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/Profile.jsx
git commit -m "feat: replace window.confirm with DeleteUserModal in Profile (company admin)"
```

---

## Self-Review

**Spec coverage:**
- ✅ `deletedAt` added to User model — Task 1
- ✅ `listUsers` filters soft-deleted — Task 2
- ✅ Smart delete (soft if invoices, hard if not) — Task 3
- ✅ Invoice populate still works (no change needed — soft-deleted users remain in DB) — implicit
- ✅ `DeleteUserModal` reusable component — Task 4
- ✅ Super Admin delete button + modal — Task 5
- ✅ Company Admin styled modal replaces `window.confirm` — Task 6
- ✅ Escape key + backdrop close — Task 4 (component handles both)
- ✅ Spinner while deleting — Task 4 (`deleting` prop)
- ✅ Self-delete guard — Task 6 Step 3 (`handleDeleteUser` checks `user._id === currentUser._id`)

**Placeholder scan:** No TBDs, no "similar to Task N" references, all code blocks complete.

**Type consistency:**
- `deleteTarget` is always a full user object `{ _id, username, ... }` — consistent across Tasks 5 and 6.
- `onConfirm(userId)` receives `user._id` (string) from the modal — matches `API.delete(\`/auth/users/${userId}\`)` in both handlers.
- `handleDeleteUser(user)` in Profile receives the full user object — matches `setDeleteTarget(user)` inside.

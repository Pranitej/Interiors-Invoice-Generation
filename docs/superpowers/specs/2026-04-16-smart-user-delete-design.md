# Smart User Delete — Design Spec

**Date:** 2026-04-16  
**Status:** Approved

## Summary

Add a delete feature for users in both the Super Admin (CompanyDetail page) and Company Admin (Profile page). Before deleting, show a styled confirmation modal. The delete logic is smart: if the user has created any invoices, soft-delete them (set `deletedAt`) so invoice history remains intact; if they have no invoices, permanently delete them from the database.

---

## Backend

### 1. User Model (`server/models/User.js`)

Add a `deletedAt` field:

```js
deletedAt: { type: Date, default: null }
```

### 2. `deleteUser` service (`server/services/auth.service.js`)

Replace the current `findOneAndDelete` with smart delete logic:

1. Validate the user ID (existing check).
2. Find the user matching `{ _id: id, ...(companyId && { companyId }) }` — throw 404 if not found.
3. Count invoices where `createdBy = userId` (all invoices, regardless of their own `deletedAt`).
4. If count > 0 → soft delete: `User.findByIdAndUpdate(id, { deletedAt: new Date() })`.
5. If count = 0 → hard delete: `User.findOneAndDelete(filter)`.

Return value: an object `{ deleted: 'soft' | 'hard' }` so callers can distinguish (controller ignores it; kept for future use).

### 3. `listUsers` service (`server/services/auth.service.js`)

Add `deletedAt: null` to the query filter so soft-deleted users never appear in the management UI.

```js
const query = companyId ? { companyId, deletedAt: null } : { deletedAt: null };
```

### 4. Invoice population

No changes needed. `populate('createdBy', 'username')` already works on soft-deleted users because they remain in the database with their `_id` intact.

---

## Frontend

### 5. New component: `DeleteUserModal` (`client/src/components/DeleteUserModal.jsx`)

Props:
- `user` — the user object `{ _id, username }`
- `onConfirm(userId)` — async handler called on confirm click
- `onClose` — called on Cancel or backdrop click
- `deleting` — boolean; disables the confirm button while the API call is in flight

UI:
- Backdrop + centered card (matches existing modal style in `SuperAdminDashboard`)
- Red warning icon (Trash from lucide-react)
- Title: `Delete "{username}"?`
- Body: "This will permanently delete the user. If they have created invoices, their account will be retained to preserve invoice history."
- Two buttons: **Cancel** (neutral) and **Delete** (red, shows spinner when `deleting=true`)
- Escape key and backdrop click both call `onClose`

### 6. Super Admin — CompanyDetail (`client/src/pages/CompanyDetail.jsx`)

Changes:
- Add `deleteTarget` state (user object or null) and `deleting` boolean state.
- Add a Delete button next to the Edit button in each row of the Users tab table.
- On Delete button click → `setDeleteTarget(user)`.
- Render `<DeleteUserModal>` when `deleteTarget !== null`.
- `onConfirm`: call `DELETE /auth/users/:id`, remove user from `users` state, set `editSuccess` toast ("User deleted successfully!"), clear `deleteTarget`.
- `onClose`: clear `deleteTarget`.
- Guard: do not render Delete button for the currently logged-in user (not applicable here since super admin is viewing a company's users — super admin is not in that list — but include the guard for safety).

### 7. Company Admin — Profile (`client/src/pages/Profile.jsx`)

Changes:
- Add `deleteTarget` state (user object or null) and `deleting` boolean state.
- Remove the `window.confirm()` call from `handleDeleteUser`.
- Change the Trash2 button's `onClick` from `() => handleDeleteUser(user._id)` to `() => setDeleteTarget(user)`.
- The actual delete call moves into a new `confirmDeleteUser` handler:
  - Sets `deleting = true`
  - Calls `DELETE /auth/users/:id`
  - On success: `fetchUsers()`, show success message, clear `deleteTarget`
  - On error: show error message, clear `deleteTarget`
  - Finally: `deleting = false`
- Render `<DeleteUserModal>` at bottom of JSX alongside the existing Edit User Modal.
- Self-delete guard already exists (the Delete button is hidden for `user._id === currentUser._id`) — keep as-is.

---

## Constraints & Edge Cases

- **Self-delete**: Blocked on the frontend (button hidden). Backend `scopeToCompany` middleware prevents a user from deleting themselves via a different client too (their own userId won't be in a different company's scope). No additional backend guard needed beyond what exists.
- **Super admin users**: Super admin has no `companyId`. The `deleteUser` service passes `companyId = undefined` for super-admin calls (via `scopeToCompany`), so the filter is just `{ _id: id }` — correct.
- **Already soft-deleted**: `listUsers` filters by `deletedAt: null` so soft-deleted users are invisible. A double-delete attempt is not possible through the UI.
- **Invoice count**: Counts all invoices (`createdBy = userId`), including soft-deleted invoices, to avoid orphaning invoice history.

---

## Files Changed

| File | Change |
|------|--------|
| `server/models/User.js` | Add `deletedAt` field |
| `server/services/auth.service.js` | Smart delete logic in `deleteUser`; `deletedAt: null` filter in `listUsers` |
| `client/src/components/DeleteUserModal.jsx` | New reusable confirmation modal |
| `client/src/pages/CompanyDetail.jsx` | Add Delete button + wire `DeleteUserModal` |
| `client/src/pages/Profile.jsx` | Replace `window.confirm` + wire `DeleteUserModal` |

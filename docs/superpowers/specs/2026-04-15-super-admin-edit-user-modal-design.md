# Super Admin Edit User Modal Design

## Problem

The Super Admin portal's Company Detail page lists users for each company but provides no way to edit them. Company admins can edit their users from the Profile page, but super admins have no equivalent. The backend already supports super admin user updates (`PUT /auth/users/:id` with `SUPER_ADMIN` role allowed and `scopeToCompany` setting `companyId = null` so any user can be updated by ID), so only the frontend is missing.

Additionally, Profile.jsx contains an inline edit modal with a role-toggle that is dead code — the service layer only ever persists `username` and `password`, not `role`. This will be cleaned up as part of this work.

## Goal

Extract the username/password edit modal from Profile.jsx into a reusable `EditUserModal` component, wire it into CompanyDetail so super admins can edit any company's users, and remove the dead role-toggle from the extracted component.

## Non-Goals

- No role toggle (super admin should not reassign internal company roles; the field was already ignored by the backend)
- No user creation or deletion from CompanyDetail (out of scope)
- No new backend endpoints (existing `PUT /auth/users/:id` already handles super admin)

## Approach

Extract the edit modal from Profile.jsx into `client/src/components/EditUserModal.jsx`. Update Profile.jsx to use the new component. Add an Edit button per user row in CompanyDetail and mount `EditUserModal` from there.

This approach was chosen over inlining a copy in CompanyDetail because the user explicitly asked to "use the same components from the company admin." Extraction gives true reuse, removes dead code from Profile.jsx, and keeps both consumers in sync if the modal ever changes.

## Component: `EditUserModal`

**File:** `client/src/components/EditUserModal.jsx`

**Props:**
- `user` — the user object being edited: `{ _id, username, role }`
- `onSave(updatedUser)` — called after a successful PUT with the returned user object from the API
- `onClose` — called to dismiss without saving

**Internal state:**
- `form` — `{ username: user.username, password: "" }`, initialized from `user` prop
- `submitting` — boolean, true while the API call is in flight
- `error` — string, inline error message (empty when no error)

**Behaviour:**
- Fixed-position backdrop with `onClick={onClose}` and `stopPropagation` on the inner card (same pattern as InvoicePreviewModal)
- ESC key closes via `useEffect` keydown listener with cleanup
- Submits `PUT /auth/users/:id` with `{ username, password? }` (password omitted if blank)
- On success: calls `onSave(updatedUser)` — caller is responsible for updating local state
- On error: sets `error` string, does not call `onClose`
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wired to the "Edit User" heading

**Fields:**
- Username — required text input, pre-filled from `user.username`
- New Password — optional password input, placeholder "Leave blank to keep current", blank by default
- Save Changes button (disabled while submitting)
- Cancel button

No role toggle — removed from the extracted component as it was never persisted by the backend.

## Changes to `Profile.jsx`

Replace the inline edit modal block (the `{editingUser && (...)}` block containing the fixed backdrop, form, username/password fields, role toggle, and Save/Cancel buttons) with:

```jsx
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

The `handleUpdateUser` function in Profile.jsx is removed — its logic moves inside the component.

The role field from the inline payload (`role: editingUser.role`) is also removed since the service never persisted it.

## Changes to `CompanyDetail.jsx`

- Add import: `import EditUserModal from "../components/EditUserModal"`
- Add state: `const [editingUser, setEditingUser] = useState(null)`
- Update users table header: `["Username", "Role", "Created"]` → `["Username", "Role", "Created", "Actions"]`
- Update users table empty-state `colSpan` from `3` to `4`
- Add an Actions `<td>` to each user row with an "Edit" button that calls `setEditingUser(u)`
- Clear on tab switch: add `setEditingUser(null)` to the tab `onClick` handler alongside the existing `setPreviewInvoice(null)` call
- Mount modal and success banner at the bottom of the root div:

```jsx
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
```

- Add state: `const [editSuccess, setEditSuccess] = useState("")`
- Render a small success toast/banner when `editSuccess` is set (dismisses automatically after 3 s)

## API

No backend changes. The existing route is:

```
PUT /auth/users/:id
Authorization: Bearer <super_admin_token>
Body: { username, password? }
```

`scopeToCompany` sets `companyId = null` for super admin → service skips company filter → any user can be updated by ID.

## Error Handling

- Inline error text inside the modal (no `alert()`)
- Network/validation errors from the API are surfaced via `error.response?.data?.message || "Failed to update user"`
- Username already taken → server returns 409/400 with a message, displayed inline

## Testing

Manual verification:

1. Log in as super admin, navigate to a company, open the Users tab
2. Confirm "Actions" column with "Edit" button appears on every user row
3. Click Edit — modal opens pre-filled with the user's username, password blank
4. Change username, save — row updates in place, success banner shows briefly
5. Open Edit again, enter a new password, save — no error (password updated server-side)
6. Leave password blank, save — existing password unchanged
7. Cancel / ESC / backdrop click — modal closes with no changes
8. Switch to the Invoices tab while the edit modal is open — modal closes
9. Open Profile as company admin — Edit User modal still works identically (regression check)
10. Dark mode — modal uses dark palette

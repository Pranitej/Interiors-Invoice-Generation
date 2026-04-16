# Super Admin Add User Modal Design

## Problem

The Super Admin portal's Company Detail page lists users for each company but provides no way to create new ones. Company admins can create users from the Profile page (standard users only), but super admins have no equivalent and need the ability to create users of either role — `company_admin` or `company_user` — for any company.

The backend already supports this: `POST /auth/users` with `{ username, password, role, companyId }` in the body. When the caller is a super admin, the controller reads `companyId` from `req.body` rather than the session, allowing cross-company user creation. No backend changes are needed.

## Goal

Add an "Add User" button to the Users tab of CompanyDetail. Clicking it opens a modal with username, password, and a beautifully designed role selector (two radio cards with icons). On success the new user appears in the table immediately.

## Non-Goals

- No changes to Profile.jsx or its create-user flow (company admins are unaffected)
- No bulk user creation
- No new backend endpoints

## Approach

New `CreateUserModal` component modelled on the existing `EditUserModal`. Same modal shell (backdrop, ESC, stopPropagation, ARIA), but purpose-built for creation: password is required, and the role section uses two styled radio cards. `EditUserModal` is untouched — no risk to existing edit flows.

## Component: `CreateUserModal`

**File:** `client/src/components/CreateUserModal.jsx`

**Props:**
- `companyId` — string, included in the request body so the backend associates the new user with the correct company
- `onSave(newUser)` — called with `res.data.data` after successful creation; caller appends the user to its list
- `onClose` — called on cancel, backdrop click, or ESC key

**Internal state:**
- `form` — `{ username: "", password: "", role: "company_user" }` — role defaults to `company_user`
- `submitting` — boolean, true while the API call is in flight
- `error` — string, inline error message (empty when no error)

**Modal shell** (same pattern as `EditUserModal`):
- Fixed-position backdrop with `onClick={onClose}` and `stopPropagation` on the inner card
- ESC key closes via `useEffect` keydown listener with cleanup
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wired to the "Add User" heading

**Fields:**

1. **Username** — required text input, `autoFocus`, `autoComplete="username"`, `htmlFor`/`id` pair (`create-user-username`)

2. **Password** — required password input, `minLength={4}`, `autoComplete="new-password"`, `htmlFor`/`id` pair (`create-user-password`). Password is required (not optional) since this is user creation.

3. **Role** — two radio cards stacked vertically. Each card is a `<label>` wrapping a visually-hidden `<input type="radio">` so clicking anywhere on the card selects the role:

   - **Company Admin card** — `Shield` icon (purple), title "Company Admin", subtitle "Can manage users and company settings". Selected state: purple border (`border-purple-500`) + purple background tint (`bg-purple-50 dark:bg-purple-900/20`).
   - **Standard User card** — `User` icon (blue), title "Standard User", subtitle "Can create and view invoices". Selected state: blue border (`border-blue-500`) + blue background tint (`bg-blue-50 dark:bg-blue-900/20`).
   - Unselected card: `border-gray-200 dark:border-gray-600` background.
   - A filled circle indicator (◉ / ○) on the right edge of each card shows selection state.

4. **Create User** button — disabled while `submitting`; shows spinner + "Creating…" during submission.

5. **Cancel** button.

**API call:** `POST /auth/users` with `{ username, password, role, companyId }`.

**On success:** calls `onSave(res.data.data)`. The modal does not close itself — `onSave` is responsible for closing (caller sets `showCreateUser(false)`).

**On error:** sets `error` string, displays it inline above the form in an always-present `aria-live="polite"` container, modal stays open.

**Accessibility:**
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="create-user-title"`
- All inputs have `htmlFor`/`id` pairs
- Error message in an `aria-live="polite"` region
- Create button `disabled` + `aria-disabled` while submitting

## Changes to `CompanyDetail.jsx`

### Import

```js
import CreateUserModal from "../components/CreateUserModal";
```

### New state

```js
const [showCreateUser, setShowCreateUser] = useState(false);
```

### Users tab header

Replace the bare table card with a two-part layout: a header row above the table containing a "Users" label on the left and an "Add User" button (with `UserPlus` icon from lucide-react) on the right. Both the label and the button sit inside a `flex items-center justify-between` div at the top of the Users tab section, outside the table's `<div>` wrapper.

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
    {/* existing table card */}
    ...
  </div>
)}
```

### Tab switch cleanup

Add `setShowCreateUser(false)` to the tab `onClick` handler alongside the existing `setPreviewInvoice(null)` and `setEditingUser(null)` calls.

### Modal mount

At the bottom of the root div (alongside existing modals):

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
```

Reuses the existing `editSuccess` toast state which already auto-clears after 3 s.

## API

No backend changes. Existing route:

```
POST /auth/users
Authorization: Bearer <super_admin_token>
Body: { username, password, role, companyId }
```

Controller logic (already in place):
```js
const companyId =
  req.user.role === SUPER_ADMIN ? req.body.companyId : req.companyId;
```

Super admin can set any role — the company admin restriction (`role !== COMPANY_USER` → 403) only applies when `req.user.role === COMPANY_ADMIN`.

## Error Handling

- Inline error text inside the modal (no `alert()`)
- Username already taken → server returns 409/400 with message, displayed inline
- Short password → `minLength={4}` browser-native validation prevents submission
- Network/server errors → `err.response?.data?.message || "Failed to create user"`

## Testing

Manual verification:

1. Log in as super admin, navigate to a company, open the Users tab
2. Confirm "Add User" button appears in the top-right of the Users section
3. Click "Add User" — modal opens, username focused, password blank, "Standard User" radio pre-selected
4. Fill in username + password, keep role as Standard User, click Create User — user appears in table, success toast shows
5. Repeat with Company Admin role selected — new user has company_admin role badge in the table
6. Try creating with a username already taken — inline error appears, modal stays open
7. Try creating with a 3-character password — browser prevents submission (minLength=4)
8. Cancel / ESC / backdrop click — modal closes with no user created
9. Switch to Invoices tab while modal is open — modal closes
10. Dark mode — role cards, inputs, and buttons render correctly in dark palette

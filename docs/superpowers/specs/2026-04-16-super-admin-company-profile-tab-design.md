# Super Admin Company Profile Tab Design

## Problem

The Super Admin portal's Company Detail page has two tabs — Users and Invoices — but no way to edit a company's profile data (name, tagline, addresses, email, website, phones, logo, terms). Company admins can do all of this from their Profile page Company tab, but super admins have no equivalent. The backend already supports super admin company updates (`PUT /companies/:id`, requiring `SUPER_ADMIN` role), so only the frontend is missing.

## Goal

Add a "Company Profile" tab to `CompanyDetail` where a super admin can view and edit all company metadata: logo, name, tagline, addresses, contact info, and terms — the same fields available in the company admin's Profile → Company tab.

## Non-Goals

- No changes to `Profile.jsx` or `CompanyLogoChanger`
- No new backend endpoints (existing `PUT /companies/:id` and `POST /upload/logo` cover everything)
- No company activation/deactivation from this tab (already handled by the dashboard toggle)
- No user management or invoice management from this tab

## Approach

Create a new `CompanyProfileTab` component that is self-contained: it receives the already-loaded company object as `initialCompany`, manages its own form state and API calls, and notifies its parent via `onUpdate` when a save succeeds. CompanyDetail mounts it as a third tab. `Profile.jsx` and `CompanyLogoChanger` are untouched.

This approach was chosen over extracting a shared form from Profile.jsx because the two consumers have different API endpoints, different auth contexts (company admin reads from `AuthContext.company`; super admin passes a prop), and different logo upload paths. A shared form would need enough props to cover both cases — more complexity than simply writing a focused component for the super admin case.

## Component: `CompanyProfileTab`

**File:** `client/src/components/CompanyProfileTab.jsx`

**Props:**
- `companyId` — string, MongoDB `_id` used as the URL param for the PUT call
- `initialCompany` — company object already loaded by CompanyDetail: `{ name, tagline, registeredOffice, industryAddress, phones, email, website, termsAndConditions, logoFile }`
- `onUpdate(updatedCompany)` — called with the API response after a successful save; CompanyDetail uses this to keep its `company` state (and the header name) current

**Internal state:**
- `form` — `{ name, tagline, registeredOffice, industryAddress, phones[], email, website, termsAndConditions[], logoFile }` — initialized from `initialCompany`
- `saving` — boolean, true while the company PUT is in flight
- `logoUploading` — boolean, true while the logo POST is in flight
- `message` — `{ type: "success"|"error", text: "" }` — auto-clears after 5 s via `useEffect` (same pattern as `Profile.jsx`)

**Logo section:**
- 80px circular preview (same visual as `CompanyLogoChanger`)
- Hidden file input triggered by "Change Logo" button
- Client-side validation before upload: max 2 MB, JPEG/PNG/GIF/WEBP only
- On file select: `POST /upload/logo` (multipart) → `res.data.data.filename` → sets `form.logoFile`; shows spinner during upload
- Logo URL for display: `` `${import.meta.env.VITE_API_BASE}/public/${form.logoFile}` `` when `form.logoFile` is set, else placeholder icon
- Upload errors shown in `message` immediately (auto-clear)
- If the user uploads a logo then cancels without saving, the uploaded file is orphaned on the server — this is acceptable (same behavior as the create-company flow in `SuperAdminDashboard`)

**Fields** (identical to Profile.jsx company tab):
- Company Name — required text input
- Tagline — optional text input
- Registered Office — optional text input
- Industry Address — optional text input, label suffix "(optional)"
- Email + Website — 2-column grid on medium+ screens, single column on mobile
- Phone Numbers — dynamic list, add/remove with `+` / `×` buttons
- Terms & Conditions — dynamic list, add/remove; "Add Term" button disabled when `termsAndConditions.length >= config.company.maxTerms`; counter `N / maxTerms` shown in label

**Save behaviour:**
- Client-side guard: if `form.name.trim()` is empty → set `message.type = "error"`, abort
- Client-side guard: if `termsAndConditions.length > config.company.maxTerms` → set `message.type = "error"`, abort
- `PUT /companies/:id` with full form body
- On success: `setMessage({ type: "success", text: "Company updated successfully!" })` and call `onUpdate(res.data.data)`
- On error: `setMessage({ type: "error", text: err.response?.data?.message || "Failed to update company" })`
- Save button disabled while `saving` or `logoUploading`; shows spinner + "Saving…" text while `saving`

**Accessibility:**
- All inputs have `<label>` with matching `htmlFor`/`id` pairs
- `message` rendered in an always-present `role="status" aria-live="polite"` container (so it announces when set)
- Save button `disabled` when in flight; `aria-disabled` mirrors the disabled state

**Styling:**
- Indigo accent colour (same as Profile.jsx company tab — `focus:ring-indigo-500`, gradient `from-indigo-500 to-indigo-600`)
- Dark mode: all inputs `dark:bg-gray-700 dark:text-white`, card `dark:bg-gray-800 dark:border-gray-700`
- Structure: logo card on top, details form card below, matching the layout in Profile.jsx

## Changes to `CompanyDetail.jsx`

### Tab data structure

Replace the current inline `["users", "invoices"]` array with a structured constant so the third tab can carry its own label and suppress the count badge:

```js
const TABS = [
  { key: "users",           label: "Users",           count: users.length },
  { key: "invoices",        label: "Invoices",         count: invoices.length },
  { key: "company-profile", label: "Company Profile",  count: null },
];
```

### Tab bar render

```jsx
{TABS.map(({ key, label, count }) => (
  <button
    key={key}
    onClick={() => { setTab(key); setPreviewInvoice(null); setEditingUser(null); }}
    className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
      tab === key
        ? "border-blue-600 text-blue-600 dark:text-blue-400"
        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    }`}
  >
    {label}{count !== null ? ` (${count})` : ""}
  </button>
))}
```

### New tab body

```jsx
{tab === "company-profile" && (
  <CompanyProfileTab
    companyId={id}
    initialCompany={company}
    onUpdate={(updated) => setCompany(updated)}
  />
)}
```

### `company` state setter

`company` is already a `useState` variable (`const [company, setCompany] = useState(null)`). The `onUpdate` callback passes `setCompany` directly — no other changes needed.

### Import

```js
import CompanyProfileTab from "../components/CompanyProfileTab";
```

## API

No backend changes. Routes used:

```
POST /upload/logo
Authorization: Bearer <super_admin_token>
Body: multipart/form-data { logo: <file> }
Response: { data: { filename: "logo-<timestamp>.png" } }

PUT /companies/:id
Authorization: Bearer <super_admin_token>
Body: { name, tagline, registeredOffice, industryAddress, phones, email, website, termsAndConditions, logoFile }
Response: { data: <updatedCompany> }
```

`PUT /companies/:id` requires `SUPER_ADMIN` role (enforced by `router.use(authenticate, requireRole(SUPER_ADMIN))` in `company.routes.js`).

## Error Handling

- Name blank → client-side, inline error, no API call
- Terms over limit → client-side, inline error, no API call
- Logo file too large (>2 MB) or wrong type → client-side, inline error, no upload
- Logo upload API failure → `message.type = "error"`, no change to `form.logoFile`
- Company save API failure → `message.type = "error"`, form stays editable
- All errors use `err.response?.data?.message` with a fallback string

## Testing

Manual verification:

1. Log in as super admin, navigate to any company, confirm three tabs: Users, Invoices, Company Profile
2. Click "Company Profile" — form pre-fills with the company's current data
3. Edit company name, click Save — CompanyDetail header updates to new name, success message appears
4. Upload a logo — preview updates immediately; save — logo persists on reload
5. Clear the name field, click Save — inline error "Company name is required", no API call
6. Add terms up to `maxTerms` limit — "Add Term" button disables; counter shows `5 / 5`
7. Add a phone number, remove it, save — change persists
8. Navigate to Users tab then back to Company Profile — form resets to the last saved state (component unmounts on tab switch; this is acceptable — avoids stale unsaved edits)
9. Dark mode — all cards, inputs, and buttons render correctly in dark palette
10. Company admin Profile → Company tab — unchanged; no regression

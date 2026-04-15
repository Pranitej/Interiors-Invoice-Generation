# Super Admin Invoice Preview Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Preview" action on every invoice row in the Super Admin → Company Detail → Invoices tab that opens a responsive modal showing the full invoice with an Admin/Client view toggle.

**Architecture:** New lightweight `InvoicePreviewModal` component renders the existing `AdminInvoice` / `ClientInvoice` components inside a modal dialog with a view-mode toggle. `CompanyDetail.jsx` holds the selected-invoice state and mounts the modal when an invoice is chosen. No backend changes — the existing `/super-admin/companies/:id/invoices` response already includes full invoice documents.

**Tech Stack:** React 18, Tailwind CSS, Vite, `lucide-react` icons.

**Note on testing:** This client has no Jest/Vitest setup (`client/package.json` scripts = `dev`, `build`, `lint`). Verification uses `npm run lint`, `npm run build`, and manual browser checks against the running dev server.

---

## File Structure

**Create:**
- `client/src/components/InvoicePreviewModal.jsx` — new, ~130 lines. Responsibility: render a responsive modal containing `AdminInvoice` or `ClientInvoice`, with view toggle, backdrop click, ESC key, and close button.

**Modify:**
- `client/src/pages/CompanyDetail.jsx` — add preview-invoice state, an "Actions" column to the invoices table with a Preview button per row, and render the modal.

---

## Task 1: Create InvoicePreviewModal component

**Files:**
- Create: `client/src/components/InvoicePreviewModal.jsx`

- [ ] **Step 1: Create the component file**

Create `client/src/components/InvoicePreviewModal.jsx` with the following content:

```jsx
import { useEffect, useState } from "react";
import { X, Shield, UserCheck } from "lucide-react";
import AdminInvoice from "./AdminInvoice";
import ClientInvoice from "./ClientInvoice";

export default function InvoicePreviewModal({ invoice, company, onClose }) {
  const [viewMode, setViewMode] = useState("admin");

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!invoice) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700 flex-wrap sm:flex-nowrap">
          <h3 className="text-base font-bold text-gray-900 dark:text-white shrink-0">
            Invoice Preview
          </h3>

          {/* Admin / Client toggle */}
          <div className="relative bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm order-3 sm:order-2 w-full sm:w-auto">
            <div className="flex items-center">
              <button
                onClick={() => setViewMode("admin")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "admin"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4" strokeWidth={viewMode === "admin" ? 2.5 : 2} />
                Admin
              </button>
              <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />
              <button
                onClick={() => setViewMode("client")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "client"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <UserCheck className="w-4 h-4" strokeWidth={viewMode === "client" ? 2.5 : 2} />
                Client
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors order-2 sm:order-3 shrink-0"
            aria-label="Close preview"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          <div className="min-w-[210mm]">
            {viewMode === "admin" ? (
              <AdminInvoice invoice={invoice} company={company} />
            ) : (
              <ClientInvoice invoice={invoice} company={company} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint the new file**

Run: `cd client && npm run lint`
Expected: no new lint errors referencing `InvoicePreviewModal.jsx`. Warnings already present in other files may still appear — that's fine, just make sure nothing new is added by this file.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/InvoicePreviewModal.jsx
git commit -m "feat: add InvoicePreviewModal component for super admin invoice preview"
```

---

## Task 2: Wire preview button into CompanyDetail invoices table

**Files:**
- Modify: `client/src/pages/CompanyDetail.jsx`

- [ ] **Step 1: Add the import and state**

Open `client/src/pages/CompanyDetail.jsx`.

At the top of the file, find the existing imports:

```jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";
```

Replace with:

```jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
```

Then, inside the component, find the existing state block:

```jsx
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
```

Replace with:

```jsx
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState(null);
```

- [ ] **Step 2: Add an "Actions" column header to the invoices table**

In the invoices tab (`{tab === "invoices" && ...}`), find the header row:

```jsx
              <tr>
                {["Client", "Amount", "Type", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
```

Replace with:

```jsx
              <tr>
                {["Client", "Amount", "Type", "Date", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
```

- [ ] **Step 3: Update the empty-state colSpan**

In the same table, find:

```jsx
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
```

Replace with:

```jsx
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
```

- [ ] **Step 4: Add the Preview button cell to each invoice row**

Find the invoice row rendering:

```jsx
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                    {inv.client?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
                    ₹{(inv.finalPayableAfterDiscount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {inv.invoiceType}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
```

Replace with:

```jsx
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                    {inv.client?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
                    ₹{(inv.finalPayableAfterDiscount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {inv.invoiceType}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
```

- [ ] **Step 5: Mount the modal at the bottom of the component**

Find the closing `</div>` of the root return (the last `</div>` just before `);` at the end of the component).

Currently the tail looks like:

```jsx
      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          ...
        </div>
      )}
    </div>
  );
}
```

Replace that tail with:

```jsx
      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          ...
        </div>
      )}

      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          company={company}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  );
}
```

(Leave the `...` contents of the invoices tab unchanged — the replacement is only about inserting the `{previewInvoice && ...}` block between the closing `)}` of the invoices tab and the root `</div>`.)

- [ ] **Step 6: Lint**

Run: `cd client && npm run lint`
Expected: no new lint errors for `CompanyDetail.jsx`.

- [ ] **Step 7: Build**

Run: `cd client && npm run build`
Expected: build completes successfully with no errors.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/CompanyDetail.jsx
git commit -m "feat: add invoice preview button to super admin company detail"
```

---

## Task 3: Manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run in one terminal: `cd client && npm run dev`
Run in another terminal: `cd server && npm run dev` (or however the server is normally started)

- [ ] **Step 2: Log in as super admin and open a company that has invoices**

Navigate to the Super Admin Dashboard, click "View" on a company that has at least one invoice, then click the "Invoices" tab.

Expected: every invoice row shows a "Preview" button in the Actions column.

- [ ] **Step 3: Verify Preview opens the modal in Admin mode**

Click "Preview" on any invoice.

Expected:
- Modal opens centered over a dark blurred backdrop
- Header shows "Invoice Preview", an Admin/Client toggle (Admin highlighted), and an X button
- Body shows the `AdminInvoice` rendering with company logo, client details, rooms, totals

- [ ] **Step 4: Toggle to Client view**

Click "Client" in the header toggle.

Expected: body swaps to the `ClientInvoice` rendering (simpler, client-facing layout). Toggle highlight moves to Client.

- [ ] **Step 5: Verify all three close methods work**

In separate attempts:
- Click the X button → modal closes
- Click the dark backdrop area outside the modal → modal closes
- Press ESC → modal closes

Expected: each closes the modal; clicking inside the modal body does NOT close it.

- [ ] **Step 6: Verify a second invoice opens with a fresh state**

Click Preview on a different invoice.

Expected: modal opens with the new invoice's data, view mode is back to "Admin" (fresh state per open, not sticky).

- [ ] **Step 7: Verify responsiveness**

Open the browser devtools, enable device toolbar, set width to 375px (mobile).

Expected:
- Modal fills the viewport with small padding
- Header wraps if needed — the Admin/Client toggle can sit on its own row below the title
- Body horizontally scrolls to show the A4-width invoice content
- All close methods still work

Set width to 768px (tablet).

Expected: modal is centered, toggle fits inline with title and close button, body scrolls as needed.

- [ ] **Step 8: Verify dark mode**

Toggle dark mode via the app's theme switcher.

Expected: modal backdrop, container, header, toggle, and body all use the dark palette correctly — no white flashes or unreadable text.

- [ ] **Step 9: Final commit marker (if any fix-ups were needed)**

If any of the above revealed bugs, make the fix, re-run lint + build, and commit. If everything passed on the first try, skip this step — no empty commits.

---

## Self-Review Notes

Checked against spec:

- **Preview action on every invoice row** → Task 2 Step 4 ✓
- **Modal uses AdminInvoice / ClientInvoice** → Task 1 Step 1 ✓
- **Admin / Client toggle** → Task 1 Step 1 (header toggle) ✓
- **Responsive (mobile + desktop)** → Task 1 layout classes + Task 3 Step 7 verification ✓
- **Backdrop click, X button, ESC key close** → Task 1 `onClick`, `X` button, `useEffect` keydown; verified in Task 3 Step 5 ✓
- **Fresh state per open** → modal unmounts when `previewInvoice` is null (Task 2 Step 5); verified in Task 3 Step 6 ✓
- **No new API endpoints** → confirmed: the existing invoices response carries full invoice documents ✓
- **Non-goal: no edit/delete/download from modal** → plan does not introduce those actions ✓

Placeholder scan: none found.

Type consistency: component prop names (`invoice`, `company`, `onClose`) match between Task 1 definition and Task 2 usage.

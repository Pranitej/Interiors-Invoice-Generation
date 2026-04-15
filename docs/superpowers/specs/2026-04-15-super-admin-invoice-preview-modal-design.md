# Super Admin Invoice Preview Modal

## Problem

In the Super Admin portal, the Company Detail page lists a company's invoices in a table but offers no way to open or inspect them. Super admins need to audit invoice content (line items, pricing, totals) for support and verification, but currently can only see the client name, total, type, and date in the row.

## Goal

Add a "Preview" action to each invoice row on the Company Detail page. Clicking it opens a responsive modal that renders the full invoice using the same `AdminInvoice` / `ClientInvoice` components used elsewhere in the app, with a toggle between the two views.

## Non-Goals

- No edit, delete, or PDF-download actions from this modal — the super admin's role here is read-only auditing.
- No changes to the existing `InvoicePreview` component used in the NewQuote editor; that component stays coupled to editor state.
- No new API endpoints. The existing `/super-admin/companies/:id/invoices` response already contains full invoice documents.

## Approach

Create a new lightweight component `InvoicePreviewModal` that renders `AdminInvoice` or `ClientInvoice` inside a responsive modal with an Admin/Client view toggle. Wire it up from `CompanyDetail.jsx` via a new "Preview" button on each invoice row.

This approach was chosen over reusing `InvoicePreview.jsx` directly because that component is tightly coupled to NewQuote editor state (individual props like `rooms`, `extrasState`, `globalFrameRate`, plus a collapsible header and scroll-hint chrome). Reusing it would require destructuring the saved invoice back into those props and stubbing the collapse behavior, and the editor chrome would look out of place inside a modal. The modal path and the editor path both render the same underlying `AdminInvoice` / `ClientInvoice` components, so visual parity is preserved.

## Components

### `client/src/components/InvoicePreviewModal.jsx` (new)

**Props:**

- `invoice` — the saved invoice object as returned by the API (full shape, including `rooms`, `extras`, `pricing`, `client`, `grandTotal`, `discount`, `finalPayableAfterDiscount`, `invoiceType`, etc.)
- `company` — the company object for header/branding
- `onClose` — callback invoked when the modal should close

**State:**

- `viewMode` — `'admin' | 'client'`, defaults to `'admin'`

**Behavior:**

- Fixed-position backdrop overlay (`fixed inset-0 bg-black/60 backdrop-blur-sm z-50`)
- Clicking the backdrop calls `onClose`; clicking inside the modal does not
- ESC key closes the modal (via a `useEffect` keydown listener that cleans up on unmount)
- Renders `<AdminInvoice invoice={invoice} company={company} />` when `viewMode === 'admin'`, else `<ClientInvoice .../>`

**Layout:**

- Outer wrapper: flex-centered, padding for mobile gutter
- Modal container: `w-full max-w-5xl max-h-[90vh]` on tablet/desktop; full-width with 16px padding on mobile; rounded, bordered, shadowed
- Header: sticky `top-0`, contains title "Invoice Preview", Admin/Client toggle (matching the `Shield`/`UserCheck` style from the existing `InvoicePreview`), and an `X` close button
- Body: scrollable (`overflow-auto`), contains the invoice component inside a `min-w-[210mm]` inner wrapper so the A4 layout does not squish on narrow screens; body handles horizontal scroll when the viewport is narrower than A4

### `client/src/pages/CompanyDetail.jsx` (modified)

- Add state: `const [previewInvoice, setPreviewInvoice] = useState(null)`
- Add an "Actions" column to the invoices table header
- Add a "Preview" button to each invoice row that calls `setPreviewInvoice(inv)`
- Render `<InvoicePreviewModal invoice={previewInvoice} company={company} onClose={() => setPreviewInvoice(null)} />` when `previewInvoice` is truthy

## Responsiveness

- **Mobile (<640px):** modal fills the viewport with 16px padding; header toggle may wrap; body horizontally scrolls to accommodate the A4-width invoice content
- **Tablet/desktop:** modal is centered, capped at `max-w-5xl` and `max-h-[90vh]`; body still horizontally scrollable if the invoice layout exceeds available width

## Error Handling

- If the invoice object is missing expected fields (e.g., `rooms` is empty), the existing rendering rules in `AdminInvoice` / `ClientInvoice` already guard against that per the project's invoice-rendering conventions. No new guards needed here.
- If `company` is `null` (still loading), the preview button is disabled until loaded — but `CompanyDetail` already blocks rendering until `company` is loaded, so this is a non-issue in practice.

## Testing

Manual verification on a running client:

1. Navigate to `/companies/:id` as super admin for a company that has invoices
2. Open the Invoices tab — confirm a "Preview" button appears in every row
3. Click Preview — modal opens with the admin view by default, invoice content is visible
4. Toggle to Client view — the body swaps to `ClientInvoice` rendering
5. Click the backdrop, the X button, and press ESC — each closes the modal
6. Resize to mobile width — modal fills viewport; header toggle remains usable; body scrolls horizontally for the A4 content
7. Open the modal for a second invoice in the same session — the toggle resets to admin view (fresh state per open)

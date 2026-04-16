# Super Admin Company Profile Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Company Profile" tab to the super admin CompanyDetail page where super admins can edit all company metadata (logo, name, tagline, addresses, contact info, phones, T&C).

**Architecture:** New self-contained `CompanyProfileTab` component receives the already-loaded company as `initialCompany`, manages its own form/logo state, saves via `PUT /companies/:id` (super-admin route), and notifies the parent via `onUpdate`. CompanyDetail gains a third tab entry and mounts the component. No backend changes.

**Tech Stack:** React 18, Tailwind CSS, `lucide-react`, Axios (via `client/src/api/api.js`), `client/src/config.js` for `maxTerms`.

**Note on testing:** No Jest/Vitest in this project. Verification is `npm run lint`, `npm run build`, and manual browser checks.

---

## File Structure

**Create:**
- `client/src/components/CompanyProfileTab.jsx` — ~200 lines. Owns form state (`name`, `tagline`, `registeredOffice`, `industryAddress`, `phones[]`, `email`, `website`, `termsAndConditions[]`, `logoFile`), logo upload state, saving flag, inline message. Calls `PUT /companies/:id` on save.

**Modify:**
- `client/src/pages/CompanyDetail.jsx` — add `CompanyProfileTab` import, restructure tab array to `TABS` constant, update tab bar render to support a no-count tab, add `{tab === "company-profile" && ...}` body.

---

## Task 1: Create CompanyProfileTab component

**Files:**
- Create: `client/src/components/CompanyProfileTab.jsx`

- [ ] **Step 1: Create the component file**

Write exactly this to `client/src/components/CompanyProfileTab.jsx`:

```jsx
import { useEffect, useRef, useState } from "react";
import { ImageIcon, Plus, Save, Upload, X } from "lucide-react";
import api from "../api/api";
import config from "../config";

const MAX_LOGO_MB = 2;
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function CompanyProfileTab({ companyId, initialCompany, onUpdate }) {
  const [form, setForm] = useState({
    name: initialCompany?.name ?? "",
    tagline: initialCompany?.tagline ?? "",
    registeredOffice: initialCompany?.registeredOffice ?? "",
    industryAddress: initialCompany?.industryAddress ?? "",
    phones: Array.isArray(initialCompany?.phones) ? initialCompany.phones : [],
    email: initialCompany?.email ?? "",
    website: initialCompany?.website ?? "",
    termsAndConditions: Array.isArray(initialCompany?.termsAndConditions)
      ? initialCompany.termsAndConditions
      : [],
    logoFile: initialCompany?.logoFile ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const logoUrl = form.logoFile
    ? `${import.meta.env.VITE_API_BASE}/public/${form.logoFile}`
    : null;

  const handleLogoSelect = async (file) => {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setMessage({ type: "error", text: "Only JPEG, PNG, GIF, and WEBP images are allowed" });
      return;
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      setMessage({ type: "error", text: `Logo must be under ${MAX_LOGO_MB} MB` });
      return;
    }
    setLogoUploading(true);
    setMessage({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.post("/upload/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, logoFile: res.data.data.filename }));
      setMessage({ type: "success", text: "Logo uploaded — click Save Changes to apply." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to upload logo" });
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Company name is required" });
      return;
    }
    if (form.termsAndConditions.length > config.company.maxTerms) {
      setMessage({ type: "error", text: `Maximum ${config.company.maxTerms} terms allowed` });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/companies/${companyId}`, form);
      onUpdate(res.data.data);
      setMessage({ type: "success", text: "Company updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update company" });
    } finally {
      setSaving(false);
    }
  };

  const setPhone = (idx, val) => {
    const updated = [...form.phones];
    updated[idx] = val;
    setForm((f) => ({ ...f, phones: updated }));
  };
  const removePhone = (idx) =>
    setForm((f) => ({ ...f, phones: f.phones.filter((_, i) => i !== idx) }));
  const addPhone = () => setForm((f) => ({ ...f, phones: [...f.phones, ""] }));

  const setTerm = (idx, val) => {
    const updated = [...form.termsAndConditions];
    updated[idx] = val;
    setForm((f) => ({ ...f, termsAndConditions: updated }));
  };
  const removeTerm = (idx) =>
    setForm((f) => ({ ...f, termsAndConditions: f.termsAndConditions.filter((_, i) => i !== idx) }));
  const addTerm = () =>
    setForm((f) => ({ ...f, termsAndConditions: [...f.termsAndConditions, ""] }));

  return (
    <div className="space-y-5">
      {/* Inline message */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {message.text && (
          <div
            className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            <span className="font-medium">{message.text}</span>
          </div>
        )}
      </div>

      {/* Logo card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Company Logo</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Upload a new logo (max {MAX_LOGO_MB} MB) — then click Save Changes below
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              id="company-logo-input"
              onChange={(e) => handleLogoSelect(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoUploading}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logoUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Change Logo
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, GIF, or WEBP</p>
          </div>
        </div>
      </div>

      {/* Details form card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Company Details</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Update company information and terms
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-5">
            {/* Company Name */}
            <div>
              <label
                htmlFor="cp-name"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
              >
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cp-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                required
              />
            </div>

            {/* Tagline */}
            <div>
              <label
                htmlFor="cp-tagline"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
              >
                Tagline
              </label>
              <input
                id="cp-tagline"
                type="text"
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Registered Office */}
            <div>
              <label
                htmlFor="cp-reg-office"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
              >
                Registered Office
              </label>
              <input
                id="cp-reg-office"
                type="text"
                value={form.registeredOffice}
                onChange={(e) => setForm((f) => ({ ...f, registeredOffice: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Industry Address */}
            <div>
              <label
                htmlFor="cp-ind-address"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
              >
                Industry Address{" "}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(optional)</span>
              </label>
              <input
                id="cp-ind-address"
                type="text"
                value={form.industryAddress}
                onChange={(e) => setForm((f) => ({ ...f, industryAddress: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Email & Website */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cp-email"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
                >
                  Email
                </label>
                <input
                  id="cp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="cp-website"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
                >
                  Website
                </label>
                <input
                  id="cp-website"
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
            </div>

            {/* Phones */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                Phone Numbers
              </label>
              <div className="space-y-2">
                {form.phones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(idx, e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Phone number"
                    />
                    <button
                      type="button"
                      onClick={() => removePhone(idx)}
                      className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label="Remove phone"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhone}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Phone
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Terms &amp; Conditions
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {form.termsAndConditions.length} / {config.company.maxTerms}
                </span>
              </div>
              <div className="space-y-2">
                {form.termsAndConditions.map((term, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => setTerm(idx, e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder={`Term ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeTerm(idx)}
                      className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label="Remove term"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={form.termsAndConditions.length >= config.company.maxTerms}
                  onClick={addTerm}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Term
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || logoUploading}
                aria-disabled={saving || logoUploading}
                className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run lint`

Expected: no errors in the new file.

- [ ] **Step 3: Commit**

```bash
cd d:/Study/MERN/Interiors-Invoice-Generation
git add client/src/components/CompanyProfileTab.jsx
git commit -m "feat: add CompanyProfileTab component for super admin"
```

---

## Task 2: Wire CompanyProfileTab into CompanyDetail

**Files:**
- Modify: `client/src/pages/CompanyDetail.jsx`

Read the file before editing. The current file has:
- `const [tab, setTab] = useState("users")` at the top
- A tab bar that maps over `["users", "invoices"]`
- Tab body blocks for `tab === "users"` and `tab === "invoices"`

- [ ] **Step 1: Add the CompanyProfileTab import**

Find the existing imports at the top:
```jsx
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import EditUserModal from "../components/EditUserModal";
```

Replace with:
```jsx
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import EditUserModal from "../components/EditUserModal";
import CompanyProfileTab from "../components/CompanyProfileTab";
```

- [ ] **Step 2: Replace the tab array with a TABS constant**

Find the tab bar render (the `{["users", "invoices"].map(...)` block):
```jsx
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {["users", "invoices"].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPreviewInvoice(null); setEditingUser(null); }}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t} ({t === "users" ? users.length : invoices.length})
          </button>
        ))}
      </div>
```

Replace with:
```jsx
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: "users", label: "Users", count: users.length },
          { key: "invoices", label: "Invoices", count: invoices.length },
          { key: "company-profile", label: "Company Profile", count: null },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPreviewInvoice(null); setEditingUser(null); }}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {label}{count !== null ? ` (${count})` : ""}
          </button>
        ))}
      </div>
```

- [ ] **Step 3: Add the Company Profile tab body**

Find the end of the Invoices tab body (the closing `)}` of the `{tab === "invoices" && (...)}` block), which ends just before the `{previewInvoice && ...}` modal mount:

```jsx
      )}
      {previewInvoice && (
```

Insert the Company Profile tab body between them:

```jsx
      )}

      {/* Company Profile Tab */}
      {tab === "company-profile" && (
        <CompanyProfileTab
          companyId={id}
          initialCompany={company}
          onUpdate={(updated) => setCompany(updated)}
        />
      )}

      {previewInvoice && (
```

- [ ] **Step 4: Lint**

Run: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run lint`

Expected: no new errors from CompanyDetail.jsx.

- [ ] **Step 5: Build**

Run: `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run build`

Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
cd d:/Study/MERN/Interiors-Invoice-Generation
git add client/src/pages/CompanyDetail.jsx
git commit -m "feat: wire Company Profile tab into super admin company detail"
```

---

## Task 3: Manual browser verification

- [ ] **Step 1: Start the dev servers**

Terminal 1 (client): `cd d:/Study/MERN/Interiors-Invoice-Generation/client && npm run dev`

Terminal 2 (server): `cd d:/Study/MERN/Interiors-Invoice-Generation/server && node server.js`

- [ ] **Step 2: Verify three tabs exist**

Log in as super admin. Navigate to any company. Confirm the tab bar shows: **Users (N) | Invoices (N) | Company Profile**.

- [ ] **Step 3: Form pre-fills**

Click "Company Profile". The form fields should pre-fill with the company's current data (name, tagline, addresses, contact info, existing phones and T&C).

- [ ] **Step 4: Edit name and save**

Change the company name. Click "Save Changes".

Expected: success message "Company updated successfully!" appears. The CompanyDetail header (top of the page) updates to the new name.

- [ ] **Step 5: Upload a logo**

Click "Change Logo", select a JPEG/PNG. A spinner appears briefly.

Expected: the 80px preview circle updates to the new logo image. A message "Logo uploaded — click Save Changes to apply." appears.

Click "Save Changes".

Expected: success message. Reload the page, navigate back to the company — logo persists.

- [ ] **Step 6: Name validation**

Clear the Company Name field. Click Save Changes.

Expected: inline error "Company name is required", no API call.

- [ ] **Step 7: T&C counter and limit**

Add terms one by one until the counter shows `5 / 5`.

Expected: "Add Term" button becomes disabled (greyed out, not clickable).

- [ ] **Step 8: Add and remove phones**

Click "Add Phone", enter a number. Click the × button to remove it. Add two numbers and save.

Expected: both numbers persist after saving and reloading.

- [ ] **Step 9: Tab switch resets form**

Edit some fields in Company Profile without saving. Switch to Users tab, then back to Company Profile.

Expected: form resets to the last saved state (component unmounts on tab switch — stale unsaved edits are discarded).

- [ ] **Step 10: Logo file-type validation**

Try uploading a non-image file (e.g. a `.txt` or `.pdf`).

Expected: error message "Only JPEG, PNG, GIF, and WEBP images are allowed" — no upload occurs.

- [ ] **Step 11: Dark mode**

Toggle dark mode. Open the Company Profile tab.

Expected: all cards, inputs, and buttons render correctly in dark palette — no white flashes or unreadable text.

- [ ] **Step 12: Regression — company admin Profile tab unchanged**

Log in as a company admin. Go to Profile → Company tab.

Expected: the existing company form still works identically — logo changer, fields, save. No regression.

---

## Self-Review

**Spec coverage:**

- **New `CompanyProfileTab` component** → Task 1 ✓
- **Props: `companyId`, `initialCompany`, `onUpdate`** → Task 1 component signature ✓
- **Form state initialized from `initialCompany`** → Task 1 `useState` initializer ✓
- **Logo upload via `POST /upload/logo`** → Task 1 `handleLogoSelect` ✓
- **Logo 2 MB / type validation** → Task 1 client-side guards ✓
- **All fields: name, tagline, registeredOffice, industryAddress, email, website, phones, T&C** → Task 1 form ✓
- **`PUT /companies/:id` on save** → Task 1 `handleSubmit` ✓
- **Name required guard** → Task 1 `handleSubmit` ✓
- **maxTerms guard + "Add Term" disabled** → Task 1 ✓
- **`onUpdate(res.data.data)` on success** → Task 1 ✓
- **Inline message auto-clears after 5 s** → Task 1 `useEffect` ✓
- **`role="status" aria-live="polite"` message container** → Task 1 ✓
- **Save button disabled while saving or logoUploading** → Task 1 `disabled={saving || logoUploading}` ✓
- **`aria-disabled` on save button** → Task 1 ✓
- **Indigo accent colour** → Task 1 throughout ✓
- **Dark mode classes** → Task 1 throughout ✓
- **Third "Company Profile" tab with no count badge** → Task 2 TABS array with `count: null` ✓
- **Tab renders `{label}{count !== null ? (count) : ""}** → Task 2 ✓
- **`{tab === "company-profile" && <CompanyProfileTab ...>}`** → Task 2 Step 3 ✓
- **`onUpdate={(updated) => setCompany(updated)}`** → Task 2 Step 3; `company` is already `useState` in CompanyDetail ✓
- **Tab switch clears editingUser / previewInvoice (no new state needed for this tab)** → Task 2 tab onClick unchanged ✓

**Placeholder scan:** None found. All steps contain complete code.

**Type consistency:**
- `form.logoFile` set by `handleLogoSelect` → used in `logoUrl` and sent in `handleSubmit` body ✓
- `setForm((f) => ...)` functional updater used consistently throughout ✓
- `onUpdate` called as `onUpdate(res.data.data)` in Task 1; wired as `onUpdate={(updated) => setCompany(updated)}` in Task 2 ✓
- `companyId` used as `` `/companies/${companyId}` `` in Task 1; supplied as `companyId={id}` from CompanyDetail's `useParams` in Task 2 ✓

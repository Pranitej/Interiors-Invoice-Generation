# Company Details Edit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow company admins to edit all company details (including a custom terms & conditions list) from a new "Company" tab in the Profile page, and display those terms in both invoice footers.

**Architecture:** New `PUT /companies/my` and `GET /companies/my` endpoints scoped to the authenticated company admin's own company. Profile page gains a "Company" tab with an inline edit form. Both invoice components replace hardcoded footer terms with `company.termsAndConditions`.

**Tech Stack:** Express, Mongoose, React, Tailwind CSS, Lucide React, Axios

---

## File Map

| File | Change |
|------|--------|
| `server/config.js` | Add `company.maxTerms: 5` |
| `server/models/Company.js` | Add `termsAndConditions: [String]` field |
| `server/services/company.service.js` | Add `updateMyCompany(companyId, data)` |
| `server/controllers/company.controller.js` | Add `getMyCompany`, `updateMyCompany` |
| `server/routes/company.routes.js` | Add `GET /my` and `PUT /my` before super-admin guard |
| `client/src/config.js` | Add `company.maxTerms: 5` |
| `client/src/pages/Profile.jsx` | Add "Company" tab; move `CompanyLogoChanger` into it |
| `client/src/components/AdminInvoice.jsx` | Replace hardcoded terms with `company.termsAndConditions` |
| `client/src/components/ClientInvoice.jsx` | Replace hardcoded terms with `company.termsAndConditions` |

---

## Task 1: Add `maxTerms` to server config and `termsAndConditions` to Company model

**Files:**
- Modify: `server/config.js`
- Modify: `server/models/Company.js`

- [ ] **Step 1: Add `company` key to server/config.js**

In `server/config.js`, add after the `invoice` block (before `permissions`):

```js
  company: {
    maxTerms: 5,   // maximum number of terms & conditions entries per company
  },
```

Full updated `config` object structure (only showing the new block in context):
```js
  invoice: {
    defaultPage: 1,
    defaultLimit: 50,
    maxLimit: 100,
    trashRetentionDays: 30,
  },

  company: {
    maxTerms: 5,
  },

  permissions: {
```

- [ ] **Step 2: Add `termsAndConditions` field to Company model**

In `server/models/Company.js`, add after `website`:

```js
    termsAndConditions: { type: [String], default: [] },
```

Full updated schema:
```js
const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    logoFile: { type: String, default: "" },
    tagline: { type: String, default: "" },
    registeredOffice: { type: String, default: "" },
    industryAddress: { type: String, default: "" },
    phones: [String],
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    termsAndConditions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
```

- [ ] **Step 3: Verify server still starts**

```bash
cd server && node server.js
```
Expected: Server starts without errors. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add server/config.js server/models/Company.js
git commit -m "feat: add termsAndConditions to Company model and maxTerms to config"
```

---

## Task 2: Add `updateMyCompany` service function

**Files:**
- Modify: `server/services/company.service.js`

- [ ] **Step 1: Add import for config.company at top of service**

The service already imports `config`. Add destructuring of `company` config at the top where roles are destructured:

After line:
```js
const { COMPANY_ADMIN } = config.roles;
```
Add:
```js
const { maxTerms } = config.company;
```

- [ ] **Step 2: Add `updateMyCompany` function**

Add at the end of `server/services/company.service.js`, before the final empty line:

```js
export async function updateMyCompany(companyId, data) {
  // Strip fields the company admin must not change
  const { isActive, _id, __v, logoFile, ...safeData } = data;

  // Validate termsAndConditions length
  if (safeData.termsAndConditions !== undefined) {
    if (!Array.isArray(safeData.termsAndConditions))
      throw new AppError(400, "termsAndConditions must be an array");
    if (safeData.termsAndConditions.length > maxTerms)
      throw new AppError(400, `Maximum ${maxTerms} terms and conditions allowed`);
  }

  const company = await Company.findByIdAndUpdate(companyId, safeData, {
    new: true,
    runValidators: true,
  });
  if (!company) throw new AppError(404, "Company not found");
  return company;
}
```

- [ ] **Step 3: Verify server still starts**

```bash
cd server && node server.js
```
Expected: Server starts without errors. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add server/services/company.service.js
git commit -m "feat: add updateMyCompany service with maxTerms validation"
```

---

## Task 3: Add `getMyCompany` and `updateMyCompany` controller functions

**Files:**
- Modify: `server/controllers/company.controller.js`

- [ ] **Step 1: Add the two new controller functions**

Add at the end of `server/controllers/company.controller.js`, before the final empty line:

```js
export async function getMyCompany(req, res, next) {
  try {
    const company = await CompanyService.getCompanyById(req.user.companyId);
    sendSuccess(res, company);
  } catch (err) {
    next(err);
  }
}

export async function updateMyCompany(req, res, next) {
  try {
    const company = await CompanyService.updateMyCompany(req.user.companyId, req.body);
    sendSuccess(res, company);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Verify server still starts**

```bash
cd server && node server.js
```
Expected: No errors. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add server/controllers/company.controller.js
git commit -m "feat: add getMyCompany and updateMyCompany controllers"
```

---

## Task 4: Add `GET /companies/my` and `PUT /companies/my` routes

**Files:**
- Modify: `server/routes/company.routes.js`

- [ ] **Step 1: Import the two new controller functions**

The file already has:
```js
import * as CompanyController from "../controllers/company.controller.js";
```
No change needed — the new exports are auto-included via `* as`.

- [ ] **Step 2: Add the two new routes before the super-admin guard**

In `server/routes/company.routes.js`, the existing company-admin route is `POST /my/logo`. Add the two new routes directly after that route block (after the multer error handler, before `router.use(authenticate, requireRole(SUPER_ADMIN))`):

```js
// --- Company-admin: read and update own company details ---
router.get(
  "/my",
  authenticate,
  requireRole(COMPANY_ADMIN),
  CompanyController.getMyCompany,
);

router.put(
  "/my",
  authenticate,
  requireRole(COMPANY_ADMIN),
  CompanyController.updateMyCompany,
);
```

Final route order in the file:
1. `POST /my/logo` + multer error handler (already there)
2. `GET /my` (new)
3. `PUT /my` (new)
4. `router.use(authenticate, requireRole(SUPER_ADMIN))` guard (already there)
5. Super-admin CRUD routes (already there)

- [ ] **Step 3: Manual smoke test — GET /companies/my**

Start the server. Use curl (replace `<token>` with a valid company_admin JWT):

```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/companies/my
```
Expected: `{ success: true, data: { name: "...", termsAndConditions: [], ... } }`

- [ ] **Step 4: Manual smoke test — PUT /companies/my**

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"termsAndConditions":["Payment: 50% advance","1 year warranty"]}' \
  http://localhost:5000/api/companies/my
```
Expected: `{ success: true, data: { ..., termsAndConditions: ["Payment: 50% advance","1 year warranty"] } }`

- [ ] **Step 5: Verify maxTerms enforcement**

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"termsAndConditions":["1","2","3","4","5","6"]}' \
  http://localhost:5000/api/companies/my
```
Expected: `400` with message `"Maximum 5 terms and conditions allowed"`

- [ ] **Step 6: Commit**

```bash
git add server/routes/company.routes.js
git commit -m "feat: add GET /companies/my and PUT /companies/my routes for company admin"
```

---

## Task 5: Add `company.maxTerms` to client config

**Files:**
- Modify: `client/src/config.js`

- [ ] **Step 1: Add `company` key**

In `client/src/config.js`, add after the `permissions` block:

```js
  company: {
    maxTerms: 5,  // keep in sync with server/config.js company.maxTerms
  },
```

Full updated file:
```js
// client/src/config.js
// Single source of truth for platform constants and permission flags.
// Keep permissions in sync with server/config.js.

const config = {
  platform: {
    name: "Interiors SaaS",
    tagline: "Powering Interior Design Businesses",
  },

  roles: {
    SUPER_ADMIN: "super_admin",
    COMPANY_ADMIN: "company_admin",
    COMPANY_USER: "company_user",
  },

  permissions: {
    companyUser: {
      canEditOwnInvoices: true,
      canSoftDeleteOwnInvoices: false,
      canPermanentDeleteOwnInvoices: false,
    },
  },

  company: {
    maxTerms: 5,  // keep in sync with server/config.js company.maxTerms
  },
};

export default config;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/config.js
git commit -m "feat: add company.maxTerms to client config"
```

---

## Task 6: Add Company tab to Profile page

**Files:**
- Modify: `client/src/pages/Profile.jsx`

- [ ] **Step 1: Add `Building2` to lucide-react imports**

At the top of `client/src/pages/Profile.jsx`, add `Building2` to the lucide-react import:

```js
import {
  User,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Users,
  Settings,
  Key,
  UserPlus,
  Calendar,
  IdCard,
  Building2,
  Plus,
} from "lucide-react";
```

- [ ] **Step 2: Add company form state**

After the existing `editingUser` state (around line 52), add:

```js
  const [companyForm, setCompanyForm] = useState({
    name: "",
    tagline: "",
    registeredOffice: "",
    industryAddress: "",
    phones: [],
    email: "",
    website: "",
    termsAndConditions: [],
  });
  const [companyLoading, setCompanyLoading] = useState(false);
```

- [ ] **Step 3: Add `fetchCompany` function and call it when Company tab is opened**

Add after `fetchUsers` function (around line 93):

```js
  const fetchCompany = async () => {
    try {
      const response = await api.get("/companies/my");
      const c = response.data.data;
      setCompanyForm({
        name: c.name || "",
        tagline: c.tagline || "",
        registeredOffice: c.registeredOffice || "",
        industryAddress: c.industryAddress || "",
        phones: Array.isArray(c.phones) ? c.phones : [],
        email: c.email || "",
        website: c.website || "",
        termsAndConditions: Array.isArray(c.termsAndConditions) ? c.termsAndConditions : [],
      });
    } catch (error) {
      console.error("Failed to fetch company:", error);
      setMessage({ type: "error", text: "Failed to load company details" });
    }
  };
```

Update the tab click handler. Find the existing tab `onClick`:
```js
    onClick={() => {
      setActiveTab(tab.id);
    }}
```
Replace with:
```js
    onClick={() => {
      setActiveTab(tab.id);
      if (tab.id === "company") fetchCompany();
    }}
```

- [ ] **Step 4: Add `handleCompanyUpdate` handler**

Add after `handleDeleteUser` function:

```js
  const handleCompanyUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!companyForm.name.trim()) {
      setMessage({ type: "error", text: "Company name is required" });
      return;
    }

    if (companyForm.termsAndConditions.length > config.company.maxTerms) {
      setMessage({ type: "error", text: `Maximum ${config.company.maxTerms} terms allowed` });
      return;
    }

    try {
      setCompanyLoading(true);
      const response = await api.put("/companies/my", companyForm);
      const updatedCompany = response.data.data;
      setCompany(updatedCompany);
      localStorage.setItem("company", JSON.stringify(updatedCompany));
      setMessage({ type: "success", text: "Company details updated successfully!" });
    } catch (error) {
      console.error("Company update failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update company details",
      });
    } finally {
      setCompanyLoading(false);
    }
  };
```

- [ ] **Step 5: Add "Company" tab to the tabs array**

Find the `tabs` array (around line 276):
```js
  const tabs = [
    { id: "profile", label: "My Profile", icon: User, color: "blue" },
    ...(currentUser?.role === config.roles.COMPANY_ADMIN
      ? [
          { id: "users", label: "Manage Users", icon: Users, color: "purple" },
          {
            id: "create-user",
            label: "Create User",
            icon: UserPlus,
            color: "green",
          },
        ]
      : []),
  ];
```

Replace with:
```js
  const tabs = [
    { id: "profile", label: "My Profile", icon: User, color: "blue" },
    ...(currentUser?.role === config.roles.COMPANY_ADMIN
      ? [
          { id: "company", label: "Company", icon: Building2, color: "indigo" },
          { id: "users", label: "Manage Users", icon: Users, color: "purple" },
          { id: "create-user", label: "Create User", icon: UserPlus, color: "green" },
        ]
      : []),
  ];
```

- [ ] **Step 6: Move `CompanyLogoChanger` out of the profile tab**

In the JSX, find:
```jsx
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
              {currentUser?.role === config.roles.COMPANY_ADMIN && (
                <CompanyLogoChanger />
              )}
```

Remove the `CompanyLogoChanger` from here:
```jsx
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
```

- [ ] **Step 7: Add the Company tab JSX**

After the closing `</>` of the Profile tab block (after `)}` that closes `{activeTab === "profile" && ...}`), add the Company tab JSX:

```jsx
            {/* Company Tab */}
            {activeTab === "company" && currentUser?.role === config.roles.COMPANY_ADMIN && (
              <div className="space-y-5">
                <CompanyLogoChanger />

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          Company Details
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Update your company information and terms
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleCompanyUpdate} className="p-5">
                    <div className="space-y-5">
                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={companyForm.name}
                          onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          required
                        />
                      </div>

                      {/* Tagline */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                          Tagline
                        </label>
                        <input
                          type="text"
                          value={companyForm.tagline}
                          onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>

                      {/* Registered Office */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                          Registered Office
                        </label>
                        <input
                          type="text"
                          value={companyForm.registeredOffice}
                          onChange={(e) => setCompanyForm({ ...companyForm, registeredOffice: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>

                      {/* Industry Address (optional) */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                          Industry Address
                          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={companyForm.industryAddress}
                          onChange={(e) => setCompanyForm({ ...companyForm, industryAddress: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>

                      {/* Email & Website */}
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                            Email
                          </label>
                          <input
                            type="email"
                            value={companyForm.email}
                            onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                            Website
                          </label>
                          <input
                            type="text"
                            value={companyForm.website}
                            onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
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
                          {companyForm.phones.map((phone, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                value={phone}
                                onChange={(e) => {
                                  const updated = [...companyForm.phones];
                                  updated[idx] = e.target.value;
                                  setCompanyForm({ ...companyForm, phones: updated });
                                }}
                                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                placeholder="Phone number"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = companyForm.phones.filter((_, i) => i !== idx);
                                  setCompanyForm({ ...companyForm, phones: updated });
                                }}
                                className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setCompanyForm({ ...companyForm, phones: [...companyForm.phones, ""] })}
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
                            {companyForm.termsAndConditions.length} / {config.company.maxTerms}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {companyForm.termsAndConditions.map((term, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                value={term}
                                onChange={(e) => {
                                  const updated = [...companyForm.termsAndConditions];
                                  updated[idx] = e.target.value;
                                  setCompanyForm({ ...companyForm, termsAndConditions: updated });
                                }}
                                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                placeholder={`Term ${idx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = companyForm.termsAndConditions.filter((_, i) => i !== idx);
                                  setCompanyForm({ ...companyForm, termsAndConditions: updated });
                                }}
                                className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            disabled={companyForm.termsAndConditions.length >= config.company.maxTerms}
                            onClick={() => setCompanyForm({
                              ...companyForm,
                              termsAndConditions: [...companyForm.termsAndConditions, ""],
                            })}
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
                          disabled={companyLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {companyLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Update Company
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
```

- [ ] **Step 8: Verify the Company tab renders and saves**

Start both server and client dev server. Log in as a company admin. Navigate to Profile → Company tab. Verify:
- All fields populate from the existing company
- Logo changer is visible
- Add a term and click "Update Company" — success message shown
- Refresh the page, open Company tab again — the new term persists

- [ ] **Step 9: Commit**

```bash
git add client/src/pages/Profile.jsx
git commit -m "feat: add Company tab to Profile page with editable company details and T&C"
```

---

## Task 7: Replace hardcoded invoice footer terms with `company.termsAndConditions`

**Files:**
- Modify: `client/src/components/AdminInvoice.jsx`
- Modify: `client/src/components/ClientInvoice.jsx`

- [ ] **Step 1: Update AdminInvoice footer**

In `client/src/components/AdminInvoice.jsx`, find the footer terms block (around line 1099–1109):

```jsx
            <p style={s.footerLabel}>Terms &amp; Conditions:</p>
            <ul style={s.footerList}>
              <li style={s.footerListItem}>
                Payment: 50% advance, balance before delivery
              </li>
              <li style={s.footerListItem}>GST included in all prices</li>
              <li style={s.footerListItem}>1 year warranty on workmanship</li>
              <li style={s.footerListItem}>
                Delivery: 30-45 days from advance
              </li>
            </ul>
```

Replace with:

```jsx
            <p style={s.footerLabel}>Terms &amp; Conditions:</p>
            <ul style={s.footerList}>
              {(company?.termsAndConditions ?? []).map((term, i) => (
                <li key={i} style={s.footerListItem}>{term}</li>
              ))}
            </ul>
```

- [ ] **Step 2: Update ClientInvoice footer**

In `client/src/components/ClientInvoice.jsx`, find the footer terms block (around line 965–970):

```jsx
            <p style={s.footerLabel}>Terms:</p>
            <ul style={s.footerList}>
              <li>Quotation valid for 30 days</li>
              <li>Final values based on site measurement</li>
              <li>40% advance, 60% on completion</li>
            </ul>
```

Replace with:

```jsx
            <p style={s.footerLabel}>Terms:</p>
            <ul style={s.footerList}>
              {(company?.termsAndConditions ?? []).map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
```

- [ ] **Step 3: Verify invoice footer**

Start both dev servers. Log in as company admin. Set at least 2 terms in the Company tab. Open or generate an invoice. Verify:
- AdminInvoice footer shows the custom terms
- ClientInvoice footer shows the custom terms
- No hardcoded terms remain

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AdminInvoice.jsx client/src/components/ClientInvoice.jsx
git commit -m "feat: replace hardcoded invoice footer terms with company.termsAndConditions"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - `termsAndConditions` field on Company model ✓ (Task 1)
  - `maxTerms: 5` in server config ✓ (Task 1)
  - `maxTerms: 5` in client config ✓ (Task 5)
  - `GET /companies/my` ✓ (Task 4)
  - `PUT /companies/my` ✓ (Task 4)
  - `industryAddress` shown as optional in UI ✓ (Task 6)
  - Company tab in Profile page ✓ (Task 6)
  - Tab order: My Profile | Company | Manage Users | Create User ✓ (Task 6)
  - `CompanyLogoChanger` moved into Company tab ✓ (Task 6)
  - Both AdminInvoice and ClientInvoice use `company.termsAndConditions` ✓ (Task 7)
  - `logoFile` not updatable via `PUT /companies/my` ✓ (Task 2)
  - `isActive` not updatable by company admin ✓ (Task 2)
- [x] **No placeholders:** All code is complete and explicit
- [x] **Type consistency:** `companyForm.termsAndConditions` is always an array; `company.termsAndConditions` guarded with `?? []` in invoices

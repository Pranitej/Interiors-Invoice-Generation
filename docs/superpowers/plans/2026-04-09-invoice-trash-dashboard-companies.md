# Invoice Trash, Dashboard Companies, Delete Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add soft-delete with 30-day trash bin for invoices, embed a companies table on the super-admin dashboard, and replace the native `confirm()` company-delete dialog with a styled React modal.

**Architecture:** Three independent features sharing no new dependencies. Soft-delete adds `deletedAt` to the Invoice model and three new API endpoints; the dashboard companies section reuses the existing `/api/companies` endpoint; the delete modal is pure frontend state.

**Tech Stack:** Express, Mongoose, React, Tailwind CSS, lucide-react

---

## File Map

| File | Change |
|---|---|
| `server/models/Invoice.js` | Add `deletedAt` field |
| `server/services/invoice.service.js` | Update existing filters + add `listTrash`, `restoreInvoice`, `permanentDelete` |
| `server/controllers/invoice.controller.js` | Add `listTrash`, `restoreInvoice`, `permanentDeleteInvoice` |
| `server/routes/invoice.routes.js` | Add GET `/trash`, PATCH `/:id/restore`, DELETE `/:id/permanent` |
| `client/src/pages/History.jsx` | Add Active/Trash tab toggle + full trash view |
| `client/src/pages/SuperAdminDashboard.jsx` | Add companies table below stat cards |
| `client/src/pages/Companies.jsx` | Replace `confirm()` with React modal |

---

### Task 1: Add `deletedAt` to Invoice model and harden existing query filters

**Files:**
- Modify: `server/models/Invoice.js`
- Modify: `server/services/invoice.service.js`

- [ ] **Step 1: Add `deletedAt` field to InvoiceSchema**

In `server/models/Invoice.js`, add the following field inside `InvoiceSchema` directly after the `createdBy` field and before `{ timestamps: true }`:

```js
    deletedAt: { type: Date, default: null },
```

The bottom of the schema should look like:

```js
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
```

- [ ] **Step 2: Add `deletedAt: null` filter to `listInvoices`**

In `server/services/invoice.service.js`, update `listInvoices` so `baseFilter` always excludes trashed invoices:

```js
export async function listInvoices({
  companyId,
  q,
  sortBy = "createdAt",
  order = "desc",
  page = 1,
  limit = 50,
}) {
  const ALLOWED_SORT_FIELDS = new Set(["createdAt", "updatedAt", "client.name", "grandTotalBeforeDiscount"]);
  const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
  const baseFilter = companyId
    ? { companyId, deletedAt: null }
    : { deletedAt: null };
  const searchFilter = q
    ? {
        $or: [
          { "client.name": { $regex: q, $options: "i" } },
          { "client.mobile": { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const query = { ...baseFilter, ...searchFilter };

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .sort({ [safeSortBy]: order === "asc" ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Invoice.countDocuments(query),
  ]);

  return { invoices, total };
}
```

- [ ] **Step 3: Add `deletedAt: null` filter to `getInvoiceById`**

```js
export async function getInvoiceById(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOne(filter);
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}
```

- [ ] **Step 4: Add `deletedAt: null` filter to `updateInvoice`**

```js
export async function updateInvoice(id, companyId, data) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const { companyId: _c, createdBy: _u, _id: _i, ...safeData } = data;
  const filter = { _id: id, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndUpdate(filter, safeData, {
    new: true,
    runValidators: true,
  });
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}
```

- [ ] **Step 5: Convert `deleteInvoice` from hard-delete to soft-delete**

```js
export async function deleteInvoice(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndUpdate(
    filter,
    { deletedAt: new Date() },
    { new: true }
  );
  if (!invoice) throw new AppError(404, "Invoice not found");
}
```

- [ ] **Step 6: Verify server still boots**

```bash
cd server && npm run dev
```

Expected: `Server running on port 5000` with no errors.

- [ ] **Step 7: Commit**

```bash
git add server/models/Invoice.js server/services/invoice.service.js
git commit -m "feat: add deletedAt to Invoice and soft-delete existing operations"
```

---

### Task 2: Add trash service functions

**Files:**
- Modify: `server/services/invoice.service.js`

- [ ] **Step 1: Add `listTrash` service function**

Append to `server/services/invoice.service.js`:

```js
export async function listTrash(companyId) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const filter = companyId ? { companyId } : {};
  await Invoice.deleteMany({ ...filter, deletedAt: { $lt: cutoff } });
  return Invoice.find({ ...filter, deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
}
```

- [ ] **Step 2: Add `restoreInvoice` service function**

```js
export async function restoreInvoice(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: { $ne: null } };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndUpdate(
    filter,
    { deletedAt: null },
    { new: true }
  );
  if (!invoice) throw new AppError(404, "Invoice not found in trash");
  return invoice;
}
```

- [ ] **Step 3: Add `permanentDelete` service function**

```js
export async function permanentDelete(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: { $ne: null } };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndDelete(filter);
  if (!invoice) throw new AppError(404, "Invoice not found in trash");
}
```

- [ ] **Step 4: Commit**

```bash
git add server/services/invoice.service.js
git commit -m "feat: add listTrash, restoreInvoice, permanentDelete service functions"
```

---

### Task 3: Add trash controller functions and routes

**Files:**
- Modify: `server/controllers/invoice.controller.js`
- Modify: `server/routes/invoice.routes.js`

- [ ] **Step 1: Add three controller functions to `invoice.controller.js`**

Append to `server/controllers/invoice.controller.js`:

```js
export async function listTrash(req, res, next) {
  try {
    const invoices = await InvoiceService.listTrash(req.companyId);
    sendSuccess(res, invoices);
  } catch (err) {
    next(err);
  }
}

export async function restoreInvoice(req, res, next) {
  try {
    const invoice = await InvoiceService.restoreInvoice(req.params.id, req.companyId);
    sendSuccess(res, invoice, 200, "Invoice restored");
  } catch (err) {
    next(err);
  }
}

export async function permanentDeleteInvoice(req, res, next) {
  try {
    await InvoiceService.permanentDelete(req.params.id, req.companyId);
    sendSuccess(res, null, 200, "Invoice permanently deleted");
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Add three new routes to `invoice.routes.js`**

The `GET /trash` route **must** be registered before `GET /:id` or Express will treat the string `"trash"` as an `:id` parameter. Replace the full contents of `server/routes/invoice.routes.js` with:

```js
// server/routes/invoice.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import * as InvoiceController from "../controllers/invoice.controller.js";
import config from "../config.js";

const { COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, scopeToCompany);

router.post("/", requireRole(COMPANY_USER, COMPANY_ADMIN), InvoiceController.createInvoice);
router.get("/trash", InvoiceController.listTrash);
router.get("/", InvoiceController.listInvoices);
router.get("/:id", InvoiceController.getInvoice);
router.put("/:id", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.updateInvoice);
router.delete("/:id", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.deleteInvoice);
router.patch("/:id/restore", InvoiceController.restoreInvoice);
router.delete("/:id/permanent", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.permanentDeleteInvoice);

export default router;
```

- [ ] **Step 3: Verify server boots and endpoints respond**

```bash
cd server && npm run dev
```

Expected: `Server running on port 5000` with no errors.

- [ ] **Step 4: Commit**

```bash
git add server/controllers/invoice.controller.js server/routes/invoice.routes.js
git commit -m "feat: add trash, restore, permanent-delete invoice endpoints"
```

---

### Task 4: Update History.jsx with Active/Trash tab toggle

**Files:**
- Modify: `client/src/pages/History.jsx`

- [ ] **Step 1: Add trash state variables and fetch function**

Add the following state declarations immediately after the existing `const [copiedId, setCopiedId] = useState(null);` line:

```js
const [activeTab, setActiveTab] = useState("active"); // "active" | "trash"
const [trashedInvoices, setTrashedInvoices] = useState([]);
const [loadingTrash, setLoadingTrash] = useState(false);
const [showPermDeleteConfirm, setShowPermDeleteConfirm] = useState(false);
const [permDeleteTarget, setPermDeleteTarget] = useState(null);
```

- [ ] **Step 2: Add `fetchTrash` function and wire tab switching**

Add the following function directly after the existing `useEffect` block that fetches invoices:

```js
const fetchTrash = async () => {
  setLoadingTrash(true);
  try {
    const res = await api.get("/invoices/trash");
    setTrashedInvoices(res.data?.data || []);
  } catch (err) {
    console.error("Failed to fetch trash:", err);
  } finally {
    setLoadingTrash(false);
  }
};

useEffect(() => {
  if (activeTab === "trash") fetchTrash();
}, [activeTab]);
```

- [ ] **Step 3: Add trash action handlers**

Add the following after the existing `handleEdit` function:

```js
const handleRestore = async (id) => {
  try {
    await api.patch(`/invoices/${id}/restore`);
    setTrashedInvoices((p) => p.filter((i) => i._id !== id));
  } catch (err) {
    console.error("Restore failed:", err);
    alert("Failed to restore invoice");
  }
};

const handlePermDelete = (id) => {
  setPermDeleteTarget(id);
  setShowPermDeleteConfirm(true);
};

const confirmPermDelete = async () => {
  if (!permDeleteTarget) return;
  try {
    await api.delete(`/invoices/${permDeleteTarget}/permanent`);
    setTrashedInvoices((p) => p.filter((i) => i._id !== permDeleteTarget));
  } catch (err) {
    console.error("Permanent delete failed:", err);
    alert("Failed to permanently delete invoice");
  } finally {
    setShowPermDeleteConfirm(false);
    setPermDeleteTarget(null);
  }
};

const daysLeft = (deletedAt) =>
  30 - Math.floor((Date.now() - new Date(deletedAt)) / 86400000);
```

- [ ] **Step 4: Add the tab toggle UI**

Replace the existing header block (the `<div className="mb-2">` opening and its inner `<div className="flex flex-col sm:flex-row...">` title row) with this version that adds the tab toggle below the title:

```jsx
<div className="mb-2">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        Invoice History
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {activeTab === "active"
          ? `${sortedInvoices.length} invoices • Total: ${formatINR(sortedInvoices.reduce((sum, inv) => sum + (inv.finalPayableAfterDiscount || 0), 0))}`
          : `${trashedInvoices.length} invoices in trash`}
      </p>
    </div>

    {activeTab === "active" && (
      <button
        onClick={() => navigate("/new-quote")}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus size={18} />
        New Invoice
      </button>
    )}
  </div>

  {/* Tab Toggle */}
  <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
    <button
      onClick={() => setActiveTab("active")}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
        activeTab === "active"
          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      Active
    </button>
    <button
      onClick={() => setActiveTab("trash")}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
        activeTab === "trash"
          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      Trash
    </button>
  </div>
```

- [ ] **Step 5: Add the trash tab content**

The existing JSX renders the active invoice list. Wrap it with a conditional on `activeTab`, and add the trash view. Replace the section starting from `{/* Search and Filters */}` all the way to the end of the invoice list (just before the `{/* Downloading Overlay */}` comment) with:

```jsx
      {activeTab === "active" && (
        <>
          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">All Invoices</option>
                  <option value="recent">Last 30 days</option>
                  <option value="high-value">High value (&gt; ₹50k)</option>
                  {user?.isAdmin && <option value="admin-only">Admin only</option>}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="new-old">Newest first</option>
                  <option value="old-new">Oldest first</option>
                  <option value="a-z">Client A → Z</option>
                  <option value="z-a">Client Z → A</option>
                  <option value="amount-high-low">Amount High → Low</option>
                  <option value="amount-low-high">Amount Low → High</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
              <div className="flex items-center justify-center sm:justify-end">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{sortedInvoices.length}</span> results
                </div>
              </div>
            </div>
          </div>

          {/* Active Invoice List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading invoices...</span>
            </div>
          ) : sortedInvoices.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invoices found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {search ? "Try a different search term" : "Create your first invoice to get started"}
              </p>
              {!search && (
                <button
                  onClick={() => navigate("/new-quote")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Create New Invoice
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                >
                  {/* Desktop View */}
                  <div className="hidden lg:flex items-center p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white truncate">{invoice.client?.name || "Unnamed Client"}</span>
                      </div>
                      <div className="flex gap-2 items-center text-md">
                        <button
                          onClick={() => copyToClipboard(invoice._id)}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          {copiedId === invoice._id ? <><Check size={12} />Copied!</> : <><Copy size={12} />#{invoice._id.slice(-8)}</>}
                        </button>
                        <small className="text-gray-600">({invoice.invoiceType})</small>
                      </div>
                    </div>
                    <div className="flex-shrink-0 px-4 min-w-[160px] max-w-[200px]">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin size={12} className="flex-shrink-0" />
                        <span className="truncate">{invoice.client.siteAddress || "—"}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 px-4 min-w-[120px] text-center">
                      <div className="text-xs text-gray-900 dark:text-white">{formatISTDate(invoice.createdAt)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatISTTime(invoice.createdAt)}</div>
                    </div>
                    <div className="flex-shrink-0 px-4 min-w-[100px] text-right">
                      <div className="font-semibold text-green-600 dark:text-green-400 truncate">{formatINR(invoice.finalPayableAfterDiscount)}</div>
                    </div>
                    <div className="flex-shrink-0 px-4 min-w-[180px]">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDownload(invoice._id, "client")} disabled={isDownloading && activeInvoice === invoice._id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap">
                          {isDownloading && activeInvoice === invoice._id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          Client
                        </button>
                        <button onClick={() => handleDownload(invoice._id, "admin")} disabled={isDownloading && activeInvoice === invoice._id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-sm font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap">
                          <Download size={14} />Admin
                        </button>
                        {user?.isAdmin && (
                          <>
                            <button onClick={() => handleEdit(invoice._id)} className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors flex-shrink-0" title="Edit"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(invoice._id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0" title="Delete"><Trash size={16} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="lg:hidden p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">{invoice.client?.name || "Unnamed Client"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300 truncate">{invoice.client.siteAddress || "—"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600 dark:text-green-400 mb-1">{formatINR(invoice.finalPayableAfterDiscount)}</div>
                        <button onClick={() => copyToClipboard(invoice._id)} className="cursor-pointer inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {copiedId === invoice._id ? <><Check size={12} />Copied!</> : <><Copy size={12} />#{invoice._id.slice(-8)}</>}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3 flex justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{formatISTDateTime(invoice.createdAt)}</span>
                      </div>
                      <div className="items-center gap-2 text-sm text-gray-600"><p>({invoice.invoiceType})</p></div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDownload(invoice._id, "client")} disabled={isDownloading && activeInvoice === invoice._id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-medium rounded transition-colors disabled:opacity-50">
                          {isDownloading && activeInvoice === invoice._id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}Client
                        </button>
                        <button onClick={() => handleDownload(invoice._id, "admin")} disabled={isDownloading && activeInvoice === invoice._id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-sm font-medium rounded transition-colors disabled:opacity-50">
                          <Download size={14} />Admin
                        </button>
                      </div>
                      {user?.isAdmin && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(invoice._id)} className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors" title="Edit"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(invoice._id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Delete"><Trash size={16} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "trash" && (
        <>
          {loadingTrash ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading trash...</span>
            </div>
          ) : trashedInvoices.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Trash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Trash is empty</h3>
              <p className="text-gray-500 dark:text-gray-400">Deleted invoices will appear here for 30 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trashedInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900/30 transition-colors"
                >
                  <div className="flex items-center p-4 gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white truncate">{invoice.client?.name || "Unnamed Client"}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">
                          {daysLeft(invoice.deletedAt)}d left
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar size={11} />
                        <span>Deleted {formatISTDate(invoice.deletedAt)}</span>
                        <span className="mx-1">•</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{formatINR(invoice.finalPayableAfterDiscount)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRestore(invoice._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 text-sm font-medium rounded transition-colors"
                      >
                        Restore
                      </button>
                      {user?.isAdmin && (
                        <button
                          onClick={() => handlePermDelete(invoice._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 text-sm font-medium rounded transition-colors"
                        >
                          Delete Forever
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
```

- [ ] **Step 6: Add the permanent-delete confirmation modal**

Inside the return block, directly after the existing `{/* Delete Confirmation Modal */}` block (which handles the active-invoice soft-delete), add:

```jsx
      {/* Permanent Delete Confirmation Modal */}
      {showPermDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 max-w-xs w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Delete Forever?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                This invoice cannot be recovered.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPermDeleteConfirm(false); setPermDeleteTarget(null); }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPermDelete}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Trash size={14} />
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 7: Verify the History page renders without errors**

Start the dev server and navigate to `/history`. Confirm the Active/Trash tab toggle appears, the active tab shows invoices as before, and switching to Trash calls the API and shows the empty state or trashed invoices.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/History.jsx
git commit -m "feat: add Active/Trash tab toggle with restore and permanent-delete to History"
```

---

### Task 5: Add companies table to SuperAdminDashboard

**Files:**
- Modify: `client/src/pages/SuperAdminDashboard.jsx`

- [ ] **Step 1: Replace SuperAdminDashboard.jsx with the updated version**

```jsx
// client/src/pages/SuperAdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get("/super-admin/stats"),
      API.get("/companies"),
    ])
      .then(([statsRes, companiesRes]) => {
        setStats(statsRes.data.data);
        setCompanies(companiesRes.data.data);
      })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await API.patch(`/companies/${id}/toggle-active`);
      setCompanies((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: res.data.data.isActive } : c))
      );
    } catch {
      alert("Failed to toggle company status");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return <p className="text-center text-red-500 mt-8">{error}</p>;

  const cards = [
    { label: "Total Companies", value: stats.totalCompanies, color: "blue" },
    { label: "Active Companies", value: stats.activeCompanies, color: "green" },
    { label: "Total Users", value: stats.totalUsers, color: "purple" },
    { label: "Total Invoices", value: stats.totalInvoices, color: "amber" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Super Admin Dashboard
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Companies Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Companies</h2>
          <Link
            to="/companies"
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Company
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {["Company", "Status", "Users", "Invoices", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {companies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No companies yet.
                  </td>
                </tr>
              )}
              {companies.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-white">{company.name}</div>
                    <div className="text-xs text-gray-400">{company.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {company.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{company.userCount}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{company.invoiceCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/companies/${company._id}`)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleToggle(company._id)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          company.isActive
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                        }`}
                      >
                        {company.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the dashboard renders**

Navigate to the super-admin dashboard. Confirm stat cards appear, and below them the companies table shows all companies with View and Toggle Active actions.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/SuperAdminDashboard.jsx
git commit -m "feat: embed companies table on super admin dashboard"
```

---

### Task 6: Replace confirm() with styled modal in Companies.jsx

**Files:**
- Modify: `client/src/pages/Companies.jsx`

- [ ] **Step 1: Add `deleteTarget` state and update `handleDelete`**

Add `Trash` to the existing lucide-react import (if not already present — it currently is not imported). Add this import at the top of `Companies.jsx`:

```js
import { Trash } from "lucide-react";
```

Add state declaration after the existing `const [error, setError] = useState("");` line:

```js
const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
```

Replace the existing `handleDelete` function:

```js
const handleDelete = (id, name) => {
  setDeleteTarget({ id, name });
};

const confirmDelete = async () => {
  if (!deleteTarget) return;
  try {
    await API.delete(`/companies/${deleteTarget.id}`);
    setCompanies((prev) => prev.filter((c) => c._id !== deleteTarget.id));
  } catch {
    alert("Failed to delete company");
  } finally {
    setDeleteTarget(null);
  }
};
```

- [ ] **Step 2: Update the Delete button call signature in the table**

Find the existing Delete button in the companies table row:

```jsx
onClick={() => handleDelete(company._id, company.name)}
```

This already matches the new `handleDelete(id, name)` signature — no change needed.

- [ ] **Step 3: Add the confirmation modal**

Add the following JSX at the very end of the return block, just before the final closing `</div>`:

```jsx
      {/* Delete Company Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Delete &quot;{deleteTarget.name}&quot;?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                This will permanently delete all users and invoices for this company. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Trash size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 4: Verify the modal appears and works**

Navigate to `/companies`. Click Delete on a company — confirm the styled modal appears with the company name. Verify Cancel closes it without deleting. Verify Delete proceeds with the deletion.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Companies.jsx
git commit -m "feat: replace confirm() with styled modal for company deletion"
```

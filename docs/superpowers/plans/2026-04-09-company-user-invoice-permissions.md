# Company User Invoice Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `company_user` invoice permissions (edit-own, soft-delete-own, permanent-delete-own) configurable from a single `config.js` block, with ownership enforced at the service layer.

**Architecture:** Config flags live in `config.permissions.companyUser`. Routes admit `COMPANY_USER` for the guarded actions. Each controller handler reads the relevant flag — throws 403 if false, or passes `ownerId` (the caller's userId) to the service if true. The service adds `filter.createdBy = ownerId` when `ownerId` is non-null, limiting the DB match to the caller's own invoices. Admins pass `null` — no restriction.

**Tech Stack:** Node.js, Express 5, Mongoose, ES modules

---

> **Note:** No test framework is configured in this project (`npm test` exits with error). Each task includes a manual verification step instead of automated tests.

---

### Task 1: Add `permissions` block to config.js

**Files:**
- Modify: `server/config.js`

- [ ] **Step 1: Add the permissions block**

Open `server/config.js`. After the `invoice` block (line 62), add:

```js
  permissions: {
    companyUser: {
      canEditOwnInvoices: true,            // company_user can PUT their own invoices
      canSoftDeleteOwnInvoices: false,     // company_user can soft-delete (trash) their own invoices
      canPermanentDeleteOwnInvoices: false, // company_user can permanently delete their own invoices
    },
  },
```

Full updated `config.js` after the edit — the `invoice` and `permissions` blocks should look like:

```js
  invoice: {
    defaultPage: 1,
    defaultLimit: 50,
    maxLimit: 100,
    trashRetentionDays: 30,       // * 24 * 60 * 60 * 1000 in invoice.service.js
  },

  permissions: {
    companyUser: {
      canEditOwnInvoices: true,            // company_user can PUT their own invoices
      canSoftDeleteOwnInvoices: false,     // company_user can soft-delete (trash) their own invoices
      canPermanentDeleteOwnInvoices: false, // company_user can permanently delete their own invoices
    },
  },

  security: {
```

- [ ] **Step 2: Verify server still starts**

```bash
cd server && node --input-type=module <<'EOF'
import config from './config.js';
console.log(config.permissions.companyUser);
EOF
```

Expected output:
```
{ canEditOwnInvoices: true, canSoftDeleteOwnInvoices: false, canPermanentDeleteOwnInvoices: false }
```

- [ ] **Step 3: Commit**

```bash
git add server/config.js
git commit -m "feat: add permissions.companyUser config block"
```

---

### Task 2: Add ownership filter to invoice service

**Files:**
- Modify: `server/services/invoice.service.js`

The three functions `updateInvoice`, `deleteInvoice`, and `permanentDelete` each gain an optional `ownerId = null` parameter. When non-null, `filter.createdBy = ownerId` is added before the DB call.

- [ ] **Step 1: Update `updateInvoice`**

Current signature (line 58):
```js
export async function updateInvoice(id, companyId, data) {
```

Replace the full function with:
```js
export async function updateInvoice(id, companyId, data, ownerId = null) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const { companyId: _c, createdBy: _u, _id: _i, ...safeData } = data;
  const filter = { _id: id, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  if (ownerId) filter.createdBy = ownerId;
  const invoice = await Invoice.findOneAndUpdate(filter, safeData, {
    new: true,
    runValidators: true,
  });
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}
```

- [ ] **Step 2: Update `deleteInvoice`**

Current signature (line 72):
```js
export async function deleteInvoice(id, companyId) {
```

Replace the full function with:
```js
export async function deleteInvoice(id, companyId, ownerId = null) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  if (ownerId) filter.createdBy = ownerId;
  const invoice = await Invoice.findOneAndUpdate(
    filter,
    { deletedAt: new Date() },
    { new: true }
  );
  if (!invoice) throw new AppError(404, "Invoice not found");
}
```

- [ ] **Step 3: Update `permanentDelete`**

Current signature (line 106):
```js
export async function permanentDelete(id, companyId) {
```

Replace the full function with:
```js
export async function permanentDelete(id, companyId, ownerId = null) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid invoice ID");
  const filter = { _id: id, deletedAt: { $ne: null } };
  if (companyId) filter.companyId = companyId;
  if (ownerId) filter.createdBy = ownerId;
  const invoice = await Invoice.findOneAndDelete(filter);
  if (!invoice) throw new AppError(404, "Invoice not found in trash");
}
```

- [ ] **Step 4: Verify the file parses cleanly**

```bash
cd server && node --input-type=module <<'EOF'
import * as svc from './services/invoice.service.js';
console.log(typeof svc.updateInvoice, typeof svc.deleteInvoice, typeof svc.permanentDelete);
EOF
```

Expected output:
```
function function function
```

- [ ] **Step 5: Commit**

```bash
git add server/services/invoice.service.js
git commit -m "feat: add ownerId ownership filter to invoice service"
```

---

### Task 3: Add controller guards and open routes to COMPANY_USER

**Files:**
- Modify: `server/controllers/invoice.controller.js`
- Modify: `server/routes/invoice.routes.js`

- [ ] **Step 1: Update `updateInvoice` controller**

Current function (lines 66–77):
```js
export async function updateInvoice(req, res, next) {
  try {
    const invoice = await InvoiceService.updateInvoice(
      req.params.id,
      req.companyId,
      req.body,
    );
    sendSuccess(res, invoice);
  } catch (err) {
    next(err);
  }
}
```

Replace with:
```js
export async function updateInvoice(req, res, next) {
  try {
    const isCompanyUser = req.user.role === config.roles.COMPANY_USER;
    if (isCompanyUser && !config.permissions.companyUser.canEditOwnInvoices)
      throw new AppError(403, "Forbidden");
    const ownerId = isCompanyUser ? req.user.userId : null;
    const invoice = await InvoiceService.updateInvoice(
      req.params.id,
      req.companyId,
      req.body,
      ownerId,
    );
    sendSuccess(res, invoice);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Update `deleteInvoice` controller**

Current function (lines 79–86):
```js
export async function deleteInvoice(req, res, next) {
  try {
    await InvoiceService.deleteInvoice(req.params.id, req.companyId);
    sendSuccess(res, null, 200, "Invoice deleted successfully");
  } catch (err) {
    next(err);
  }
}
```

Replace with:
```js
export async function deleteInvoice(req, res, next) {
  try {
    const isCompanyUser = req.user.role === config.roles.COMPANY_USER;
    if (isCompanyUser && !config.permissions.companyUser.canSoftDeleteOwnInvoices)
      throw new AppError(403, "Forbidden");
    const ownerId = isCompanyUser ? req.user.userId : null;
    await InvoiceService.deleteInvoice(req.params.id, req.companyId, ownerId);
    sendSuccess(res, null, 200, "Invoice deleted successfully");
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Update `permanentDeleteInvoice` controller**

Current function (lines 109–116):
```js
export async function permanentDeleteInvoice(req, res, next) {
  try {
    await InvoiceService.permanentDelete(req.params.id, req.companyId);
    sendSuccess(res, null, 200, "Invoice permanently deleted");
  } catch (err) {
    next(err);
  }
}
```

Replace with:
```js
export async function permanentDeleteInvoice(req, res, next) {
  try {
    const isCompanyUser = req.user.role === config.roles.COMPANY_USER;
    if (isCompanyUser && !config.permissions.companyUser.canPermanentDeleteOwnInvoices)
      throw new AppError(403, "Forbidden");
    const ownerId = isCompanyUser ? req.user.userId : null;
    await InvoiceService.permanentDelete(req.params.id, req.companyId, ownerId);
    sendSuccess(res, null, 200, "Invoice permanently deleted");
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Update routes to admit COMPANY_USER**

Current lines 18–21 in `server/routes/invoice.routes.js`:
```js
router.put("/:id", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.updateInvoice);
router.delete("/:id", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.deleteInvoice);
router.patch("/:id/restore", InvoiceController.restoreInvoice);
router.delete("/:id/permanent", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.permanentDeleteInvoice);
```

Replace with:
```js
router.put("/:id", requireRole(COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN), InvoiceController.updateInvoice);
router.delete("/:id", requireRole(COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN), InvoiceController.deleteInvoice);
router.patch("/:id/restore", InvoiceController.restoreInvoice);
router.delete("/:id/permanent", requireRole(COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN), InvoiceController.permanentDeleteInvoice);
```

- [ ] **Step 5: Verify the file parses cleanly**

```bash
cd server && node --input-type=module <<'EOF'
import './controllers/invoice.controller.js';
console.log('controller ok');
EOF
```

Expected output:
```
controller ok
```

- [ ] **Step 6: Commit**

```bash
git add server/controllers/invoice.controller.js server/routes/invoice.routes.js
git commit -m "feat: enforce company_user invoice permissions via config flags"
```

---

### Task 4: End-to-end smoke test

Start the server and run these manual checks with a `company_user` JWT to confirm behaviour matches the spec.

- [ ] **Step 1: Start the server**

```bash
cd server && npm run dev
```

Expected: server starts on configured port with no errors.

- [ ] **Step 2: Test edit blocked when flag is false**

Temporarily set `canEditOwnInvoices: false` in `config.js`. Send:

```bash
curl -X PUT http://localhost:5000/api/invoices/<any-invoice-id> \
  -H "Authorization: Bearer <company_user_token>" \
  -H "Content-Type: application/json" \
  -d '{"client":{"name":"Test"}}'
```

Expected response: `403 Forbidden`.

Restore `canEditOwnInvoices: true` before the next step.

- [ ] **Step 3: Test edit allowed on own invoice**

```bash
curl -X PUT http://localhost:5000/api/invoices/<invoice-created-by-this-user> \
  -H "Authorization: Bearer <company_user_token>" \
  -H "Content-Type: application/json" \
  -d '{"client":{"name":"Updated Name"}}'
```

Expected response: `200` with updated invoice.

- [ ] **Step 4: Test edit blocked on another user's invoice**

```bash
curl -X PUT http://localhost:5000/api/invoices/<invoice-created-by-different-user> \
  -H "Authorization: Bearer <company_user_token>" \
  -H "Content-Type: application/json" \
  -d '{"client":{"name":"Should Fail"}}'
```

Expected response: `404 Invoice not found` (not 403 — ownership filter eliminates the document silently).

- [ ] **Step 5: Test soft delete blocked (flag is false)**

```bash
curl -X DELETE http://localhost:5000/api/invoices/<invoice-created-by-this-user> \
  -H "Authorization: Bearer <company_user_token>"
```

Expected response: `403 Forbidden`.

- [ ] **Step 6: Test permanent delete blocked (flag is false)**

```bash
curl -X DELETE http://localhost:5000/api/invoices/<trashed-invoice-id>/permanent \
  -H "Authorization: Bearer <company_user_token>"
```

Expected response: `403 Forbidden`.

- [ ] **Step 7: Test admin is unaffected**

```bash
curl -X PUT http://localhost:5000/api/invoices/<any-invoice-id> \
  -H "Authorization: Bearer <company_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"client":{"name":"Admin Edit"}}'
```

Expected response: `200` — admins pass `ownerId = null`, no ownership filter applied.

- [ ] **Step 8: Remove debug log**

In `server/controllers/invoice.controller.js`, the `listInvoices` handler still has `console.log("Hello")` on line 31. Remove it:

```js
export async function listInvoices(req, res, next) {
  try {
    const { q, sortBy, order } = req.query;
```

- [ ] **Step 9: Final commit**

```bash
git add server/controllers/invoice.controller.js
git commit -m "chore: remove debug log from listInvoices"
```

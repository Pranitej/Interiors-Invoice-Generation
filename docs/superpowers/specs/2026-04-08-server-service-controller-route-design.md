# Server Refactor: Service-Controller-Route Architecture

**Date:** 2026-04-08  
**Scope:** Server-side only (`server/`)  
**Goal:** Separate HTTP handling, business logic, and routing into distinct layers. Add a global error handler, custom AppError class, consistent response format, and manual input validations.

---

## 1. Folder Structure

```
server/
  routes/
    auth.routes.js
    invoice.routes.js
    company.routes.js
    superAdmin.routes.js
    upload.routes.js
    pdf.routes.js
  controllers/
    auth.controller.js
    invoice.controller.js
    company.controller.js
    superAdmin.controller.js
    upload.controller.js
    pdf.controller.js
  services/
    auth.service.js
    invoice.service.js
    company.service.js
    superAdmin.service.js
    pdf.service.js
  middleware/
    authenticate.js       (unchanged)
    requireRole.js        (unchanged)
    scopeToCompany.js     (unchanged)
    errorHandler.js       (NEW)
  utils/
    AppError.js           (NEW)
  models/                 (unchanged)
  database/               (unchanged)
  config.js               (unchanged)
  server.js               (updated — mounts errorHandler last)
```

No `upload.service.js` — multer config stays in `upload.routes.js`, the controller only reads `req.file`.

---

## 2. New Utilities

### `utils/AppError.js`

```js
export default class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

Used by services to throw operational errors with a status code. Unknown errors (DB failures, etc.) are plain `Error` instances and surface as 500.

### `middleware/errorHandler.js`

```js
export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal Server Error";
  if (!err.statusCode) console.error(err);
  res.status(statusCode).json({ success: false, message });
}
```

Mounted last in `server.js` after all routes. All controllers pass errors via `next(err)`.

---

## 3. Layer Responsibilities

### Routes
- Declare path + middleware chain only.
- No logic, no imports from models or services.

```js
// invoice.routes.js
router.get("/:id", authenticate, scopeToCompany, InvoiceController.getInvoice);
```

### Controllers
- Validate required fields (manual checks, throw `AppError(400, ...)` on failure).
- Call the service.
- Send the response on success.
- Catch all errors and pass to `next(err)`.

```js
export async function getInvoice(req, res, next) {
  try {
    const invoice = await InvoiceService.getInvoiceById(req.params.id, req.companyId);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}
```

### Services
- Pure business logic — no `req`, no `res`.
- Throw `new AppError(statusCode, message)` for expected failures (not found, conflict, etc.).
- Let unexpected errors propagate naturally (caught by controller → errorHandler).

```js
export async function getInvoiceById(id, companyId) {
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOne(filter);
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}
```

---

## 4. Consistent Response Format

| Case | Shape |
|------|-------|
| Success with data | `{ success: true, data: { ... } }` |
| Success with message | `{ success: true, message: "..." }` |
| Success with list | `{ success: true, data: [...], total: N }` |
| Any error | `{ success: false, message: "..." }` |

All error responses flow through `errorHandler` — no scattered `res.status().json()` in catch blocks.

---

## 5. Domain Breakdown

### Auth (`auth.routes.js / controller / service`)
| Endpoint | Method | Validation |
|----------|--------|------------|
| `POST /login` | login | username, password required |
| `GET /me` | getMe | — |
| `POST /users` | createUser | username, password, role required; username unique check |
| `GET /users` | listUsers | — |
| `GET /users/:id` | getUserById | — |
| `PUT /users/:id` | updateUser | — |
| `DELETE /users/:id` | deleteUser | — |

### Invoices (`invoice.routes.js / controller / service`)
| Endpoint | Method | Validation |
|----------|--------|------------|
| `POST /` | createInvoice | body must be present |
| `GET /` | listInvoices | — (query params optional) |
| `GET /:id` | getInvoice | — |
| `PUT /:id` | updateInvoice | — |
| `DELETE /:id` | deleteInvoice | — |

### Companies (`company.routes.js / controller / service`)
| Endpoint | Method | Validation |
|----------|--------|------------|
| `POST /` | createCompany | name, adminUsername, adminPassword required |
| `GET /` | listCompanies | — |
| `GET /:id` | getCompany | — |
| `PUT /:id` | updateCompany | — |
| `DELETE /:id` | deleteCompany | cascades users + invoices |
| `PATCH /:id/toggle-active` | toggleActive | — |

### Super Admin (`superAdmin.routes.js / controller / service`)
| Endpoint | Method |
|----------|--------|
| `GET /stats` | getPlatformStats |
| `GET /companies/:id/invoices` | getCompanyInvoices |
| `GET /companies/:id/users` | getCompanyUsers |

### Upload (`upload.routes.js / controller`)
| Endpoint | Method | Notes |
|----------|--------|-------|
| `POST /logo` | uploadLogo | multer config stays in route; controller reads `req.file` |

### PDF (`pdf.routes.js / controller / service`)
| Endpoint | Method | Notes |
|----------|--------|-------|
| `GET /status` | getStatus | reads renderState from service |
| `POST /render` | renderPdf | concurrency guard + generatePDF in service |

The `renderState` concurrency tracker and `generatePDF`/timeout logic move to `pdf.service.js`. The `validatePayload` and `concurrencyGuard` middleware stay in `pdf.routes.js`.

---

## 6. server.js Changes

```js
// Mount errorHandler LAST, after all routes
import errorHandler from "./middleware/errorHandler.js";
app.use(errorHandler);
```

Route imports updated to point at `routes/*.routes.js`.

---

## 7. What Does NOT Change

- All `middleware/` files (authenticate, requireRole, scopeToCompany) — untouched.
- All `models/` files — untouched.
- `database/`, `config.js`, `server.js` structure — only route import paths and errorHandler mount change.
- No new npm packages added.

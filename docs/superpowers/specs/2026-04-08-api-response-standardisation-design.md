# API Response Standardisation — Design Spec
_Date: 2026-04-08_

## Goals

1. Standardise all API response shapes through two utility functions (`sendSuccess` / `sendError`).
2. Centralise all `process.env` reads and magic constants in `config.js`.
3. Fix the frontend login handler to match the updated response shape.

---

## 1. Response Utility — `server/utils/response.js`

Two exported functions define the entire response contract.

```js
sendSuccess(res, data = null, statusCode = 200, message = null)
// → { success: true, data, message }   (null fields omitted)

sendError(res, statusCode, message)
// → { success: false, message }
```

- `data` is omitted from the JSON when `null` (e.g. delete endpoints).
- `message` is omitted from the JSON when `null` (e.g. fetch endpoints).
- `sendError` is never called from controller catch blocks — those call `next(err)`.

### Error flow (unchanged)

```
Service         → throw new AppError(statusCode, message)
Controller      → catch (err) { next(err) }
Express         → routes to errorHandler
errorHandler    → AppError: sendError(res, err.statusCode, err.message)
                  Unknown:  console.error(err); sendError(res, 500, "Internal Server Error")
```

`sendError` is called **directly** (not via errorHandler) only where the caller already knows the exact status and message:
- `authenticate.js` — 401 token errors
- `upload.routes.js` — multer file-size / type errors
- `pdf.controller.js` — PDF generation failure after headers not sent

---

## 2. Config — `server/config.js`

Single source of truth for all environment variables and constants. Every other file imports from config; no file reads `process.env` directly except `config.js`.

**Principle:** config stores human-readable values; code performs unit derivations.

```js
const config = {
  platform: { name: "Interiors SaaS" },

  roles: {
    SUPER_ADMIN: "super_admin",
    COMPANY_ADMIN: "company_admin",
    COMPANY_USER: "company_user",
  },

  server: {
    port: process.env.PORT || 5000,
    bodyLimitMb: 5,               // used as `${bodyLimitMb}mb` in server.js
  },

  db: {
    uri: process.env.MONGO_URI,
    maxPoolSize: 5,
    serverSelectionTimeoutSec: 5, // * 1000 in db.js
    socketTimeoutSec: 45,         // * 1000 in db.js
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresInDays: 7,          // appended as `${n}d` in auth.service.js
    bcryptRounds: 10,
  },

  superAdmin: {
    username: process.env.SUPER_ADMIN_USERNAME,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },

  pdf: {
    maxConcurrent: 2,
    pdfTimeoutSec: 45,            // * 1000 in pdf.service.js
    browserTimeoutSec: 60,        // * 1000 in pdf.service.js
    retryCount: 2,
    retryDelayBaseMs: 600,        // used as attempt * retryDelayBaseMs
    maxHtmlBytes: 512_000,
  },

  upload: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxFileSizeMb: 2,             // * 1024 * 1024 in upload.routes.js
    destination: "public/",
  },

  invoice: {
    defaultPage: 1,
    defaultLimit: 50,
    maxLimit: 100,
  },
};
```

---

## 3. Files Changed

### New
| File | Purpose |
|------|---------|
| `server/utils/response.js` | `sendSuccess` and `sendError` utilities |

### Backend — Modified
| File | Change |
|------|--------|
| `server/config.js` | Expand with all env vars and constants |
| `server/middleware/errorHandler.js` | Replace inline `res.json` with `sendError` |
| `server/middleware/authenticate.js` | Replace inline `res.json` with `sendError` directly |
| `server/routes/upload.routes.js` | Replace inline `res.json` errors with `sendError`; read limits/types from config |
| `server/controllers/auth.controller.js` | `sendSuccess`; login wraps `{ token, user, company }` under `data` |
| `server/controllers/invoice.controller.js` | `sendSuccess`; read pagination defaults from config |
| `server/controllers/company.controller.js` | `sendSuccess` |
| `server/controllers/upload.controller.js` | `sendSuccess`; wrap `filename` under `data` |
| `server/controllers/pdf.controller.js` | `sendSuccess` for `getStatus`; `sendError` for error case |
| `server/controllers/superAdmin.controller.js` | `sendSuccess` |
| `server/services/pdf.service.js` | Read all constants from config; derive ms values in code |
| `server/services/auth.service.js` | Read `jwtSecret`, `jwtExpiresInDays`, `bcryptRounds` from config |
| `server/database/db.js` | Read `uri` and timeout values from config; derive ms in code |
| `server/database/seeding.js` | Read superAdmin credentials from config |
| `server/server.js` | Read `port`, `bodyLimitMb` from config; derive string in code |

### Frontend — Modified
| File | Change |
|------|--------|
| Login handler | Update destructure: `res.data` → `res.data.data` for `token`, `user`, `company` |

---

## 4. Response Shape Reference

### Success — with data
```json
{ "success": true, "data": { ... } }
```

### Success — with message only (delete / action endpoints)
```json
{ "success": true, "message": "User deleted successfully" }
```

### Success — with both (create endpoints)
```json
{ "success": true, "data": { ... }, "message": "User created successfully" }
```

### Error
```json
{ "success": false, "message": "User not found" }
```

### PDF endpoint
Binary `application/pdf` response — no JSON envelope. Error case uses the error JSON shape above.

---

## 5. Out of Scope

- No changes to service layer logic.
- No changes to route definitions, middleware order, or auth guards.
- No changes to models.

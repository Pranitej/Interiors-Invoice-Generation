# API Response Standardisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardise all API responses through `sendSuccess`/`sendError` utilities, centralise all `process.env` reads and magic constants in `config.js`, and fix the frontend login to match the updated response envelope.

**Architecture:** A new `server/utils/response.js` defines the two response helpers. `server/config.js` is expanded to be the single source of truth for all env vars and constants — all other files import from it. Controllers use `sendSuccess`; the global `errorHandler` and direct-send locations use `sendError`. The frontend login destructures from `res.data.data` instead of `res.data`.

**Tech Stack:** Node.js, Express, Mongoose, Puppeteer, React (Vite), Axios

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `server/utils/response.js` | `sendSuccess` and `sendError` helpers |
| Modify | `server/config.js` | All env vars + all constants |
| Modify | `server/database/db.js` | Read DB config from config.js |
| Modify | `server/database/seeding.js` | Read superAdmin credentials from config.js |
| Modify | `server/server.js` | Read port + body limit from config.js |
| Modify | `server/services/auth.service.js` | Read JWT config + bcrypt rounds from config.js |
| Modify | `server/services/pdf.service.js` | Read all PDF constants from config.js |
| Modify | `server/middleware/errorHandler.js` | Use `sendError` |
| Modify | `server/middleware/authenticate.js` | Use `sendError` directly |
| Modify | `server/routes/upload.routes.js` | Use `sendError`; read limits from config.js |
| Modify | `server/controllers/auth.controller.js` | `sendSuccess`; login wraps under `data` |
| Modify | `server/controllers/invoice.controller.js` | `sendSuccess`; pagination from config.js |
| Modify | `server/controllers/company.controller.js` | `sendSuccess` |
| Modify | `server/controllers/upload.controller.js` | `sendSuccess`; wrap filename under `data` |
| Modify | `server/controllers/pdf.controller.js` | `sendSuccess` for status; `sendError` for failure |
| Modify | `server/controllers/superAdmin.controller.js` | `sendSuccess` |
| Modify | `client/src/pages/Login.jsx` | Destructure from `res.data.data` |

---

## Task 1: Create `server/utils/response.js`

**Files:**
- Create: `server/utils/response.js`

- [ ] **Step 1: Create the file**

```js
// server/utils/response.js

export function sendSuccess(res, data = null, statusCode = 200, message = null) {
  const body = { success: true };
  if (data !== null) body.data = data;
  if (message !== null) body.message = message;
  res.status(statusCode).json(body);
}

export function sendError(res, statusCode, message) {
  res.status(statusCode).json({ success: false, message });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/utils/response.js
git commit -m "feat: add sendSuccess and sendError response utilities"
```

---

## Task 2: Expand `server/config.js`

**Files:**
- Modify: `server/config.js`

- [ ] **Step 1: Replace the file contents**

```js
// server/config.js
// Single source of truth for all environment variables and constants.
// All process.env reads happen here. All magic numbers live here.
// Rule: store human-readable values; code performs unit derivations (e.g. * 1000, * 1024 * 1024).

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

export default config;
```

- [ ] **Step 2: Commit**

```bash
git add server/config.js
git commit -m "feat: expand config.js as single source of truth for env vars and constants"
```

---

## Task 3: Update database files

**Files:**
- Modify: `server/database/db.js`
- Modify: `server/database/seeding.js`

- [ ] **Step 1: Update `server/database/db.js`**

Remove the `dotenv.config()` call and the direct `process.env.MONGO_URI` read. Import from config and derive ms values in code.

```js
// server/database/db.js
import mongoose from "mongoose";
import config from "../config.js";

const { uri, maxPoolSize, serverSelectionTimeoutSec, socketTimeoutSec } = config.db;

if (!uri) {
  throw new Error("MONGO_URI is not defined");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      maxPoolSize,
      serverSelectionTimeoutMS: serverSelectionTimeoutSec * 1000,
      socketTimeoutMS: socketTimeoutSec * 1000,
      family: 4,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected (edge safe)");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB edge connection failed:", error);
    throw error;
  }
}
```

- [ ] **Step 2: Update `server/database/seeding.js`**

Replace `process.env` reads with config imports.

```js
// server/database/seeding.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import config from "../config.js";

const { username, password } = config.superAdmin;
const { bcryptRounds } = config.auth;
const { SUPER_ADMIN } = config.roles;

export default async function seedDatabase() {
  try {
    const superAdminExists = await User.findOne({ role: SUPER_ADMIN });
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash(password, bcryptRounds);
      await User.create({
        username,
        password: hashedPassword,
        role: SUPER_ADMIN,
        companyId: null,
      });
      console.log("Super admin seeded...");
    }
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/database/db.js server/database/seeding.js
git commit -m "refactor: read DB config and superAdmin credentials from config.js"
```

---

## Task 4: Update `server/server.js`

**Files:**
- Modify: `server/server.js`

- [ ] **Step 1: Replace PORT and body limit with config values**

```js
// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import seeding from "./database/seeding.js";
import invoiceRouter from "./routes/invoice.routes.js";
import authRouter from "./routes/auth.routes.js";
import pdfRouter from "./routes/pdf.routes.js";
import companyRouter from "./routes/company.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import config from "./config.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: `${config.server.bodyLimitMb}mb` }));
app.use("/public", express.static("public"));

await connectDB();
await seeding();

app.use("/api/invoices", invoiceRouter);
app.use("/api/auth", authRouter);
app.use("/api/pdf", pdfRouter);
app.use("/api/companies", companyRouter);
app.use("/api/super-admin", superAdminRouter);
app.use("/api/upload", uploadRouter);

app.get("/", (_, res) =>
  res.send({ ok: true, message: `${config.platform.name} API` })
);

app.use(errorHandler);

app.listen(config.server.port, () =>
  console.log(`Server running on port ${config.server.port}`)
);
```

- [ ] **Step 2: Commit**

```bash
git add server/server.js
git commit -m "refactor: read port and body limit from config.js in server.js"
```

---

## Task 5: Update `server/services/auth.service.js`

**Files:**
- Modify: `server/services/auth.service.js`

- [ ] **Step 1: Replace all `process.env` reads with config**

```js
// server/services/auth.service.js
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Company from "../models/Company.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";

const { jwtSecret, jwtExpiresInDays, bcryptRounds } = config.auth;

export async function login(username, password) {
  const user = await User.findOne({ username });
  if (!user) throw new AppError(401, "Invalid username or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError(401, "Invalid username or password");

  const token = jwt.sign(
    { userId: user._id, role: user.role, companyId: user.companyId ?? null },
    jwtSecret,
    { expiresIn: `${jwtExpiresInDays}d` }
  );

  let company = null;
  if (user.companyId) {
    company = await Company.findById(user.companyId);
  }

  return {
    token,
    user: {
      _id: user._id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    company,
  };
}

export async function getMe(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function createUser({ username, password, role, companyId }) {
  const existing = await User.findOne({ username });
  if (existing) throw new AppError(400, "Username already exists");

  const hashedPassword = await bcrypt.hash(password, bcryptRounds);
  const newUser = await User.create({
    username,
    password: hashedPassword,
    role,
    companyId: companyId ?? null,
  });

  return {
    _id: newUser._id,
    username: newUser.username,
    role: newUser.role,
    companyId: newUser.companyId,
    createdAt: newUser.createdAt,
  };
}

export async function listUsers(companyId) {
  const query = companyId ? { companyId } : {};
  return User.find(query).select("-password");
}

export async function getUserById(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid user ID");
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const user = await User.findOne(filter).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function updateUser(id, companyId, body) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid user ID");
  const { username, password } = body;
  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (password) updateData.password = await bcrypt.hash(password, bcryptRounds);

  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;

  const user = await User.findOneAndUpdate(filter, updateData, { new: true }).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function deleteUser(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid user ID");
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const user = await User.findOneAndDelete(filter);
  if (!user) throw new AppError(404, "User not found");
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/auth.service.js
git commit -m "refactor: read JWT config and bcrypt rounds from config.js"
```

---

## Task 6: Update `server/services/pdf.service.js`

**Files:**
- Modify: `server/services/pdf.service.js`

- [ ] **Step 1: Replace all hardcoded constants with config values**

```js
// server/services/pdf.service.js
import puppeteer from "puppeteer";
import config from "../config.js";

const {
  maxConcurrent,
  pdfTimeoutSec,
  browserTimeoutSec,
  retryCount,
  retryDelayBaseMs,
  maxHtmlBytes,
} = config.pdf;

const PDF_TIMEOUT_MS = pdfTimeoutSec * 1000;
const BROWSER_TIMEOUT_MS = browserTimeoutSec * 1000;

export { maxHtmlBytes as MAX_HTML_BYTES };
export const SLOT_LEASE_MS = PDF_TIMEOUT_MS + 10_000;

export const renderState = {
  active: 0,
  increment() {
    this.active = Math.min(this.active + 1, maxConcurrent + 10);
  },
  decrement() {
    this.active = Math.max(this.active - 1, 0);
  },
  isBusy() {
    return this.active >= maxConcurrent;
  },
  get maxConcurrent() {
    return maxConcurrent;
  },
};

async function generatePDF(html, retries = retryCount) {
  let browser = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        timeout: BROWSER_TIMEOUT_MS,
      });

      const page = await browser.newPage();
      page.setDefaultTimeout(PDF_TIMEOUT_MS);
      page.setDefaultNavigationTimeout(PDF_TIMEOUT_MS);

      await page.setContent(
        `<!DOCTYPE html>
         <html>
           <head>
             <meta charset="utf-8"/>
             <style>
               * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
               @page { margin: 0; }
               html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
               tr { page-break-inside: avoid; }
               img { max-width: 100%; }
             </style>
           </head>
           <body>${html}</body>
         </html>`,
        { waitUntil: "networkidle0", timeout: PDF_TIMEOUT_MS }
      );

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();
      browser = null;
      return pdfBuffer;
    } catch (err) {
      console.error(`[PDF] Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (browser) {
        try { await browser.close(); } catch (_) {}
        browser = null;
      }
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, attempt * retryDelayBaseMs));
    }
  }
}

export function generatePDFWithTimeout(html) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`PDF generation timed out after ${PDF_TIMEOUT_MS}ms`)),
      PDF_TIMEOUT_MS
    );
    generatePDF(html)
      .then((buf) => { clearTimeout(timer); resolve(buf); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/pdf.service.js
git commit -m "refactor: read all PDF constants from config.js"
```

---

## Task 7: Update middleware

**Files:**
- Modify: `server/middleware/errorHandler.js`
- Modify: `server/middleware/authenticate.js`

- [ ] **Step 1: Update `server/middleware/errorHandler.js`**

```js
// server/middleware/errorHandler.js
import { sendError } from "../utils/response.js";

export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal Server Error";
  if (!err.statusCode) console.error(err);
  sendError(res, statusCode, message);
}
```

- [ ] **Step 2: Update `server/middleware/authenticate.js`**

```js
// server/middleware/authenticate.js
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";
import config from "../config.js";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId,
    };
    next();
  } catch {
    return sendError(res, 401, "Invalid or expired token");
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/middleware/errorHandler.js server/middleware/authenticate.js
git commit -m "refactor: use sendError in errorHandler and authenticate middleware"
```

---

## Task 8: Update `server/routes/upload.routes.js`

**Files:**
- Modify: `server/routes/upload.routes.js`

- [ ] **Step 1: Replace hardcoded limits with config and inline errors with sendError**

```js
// server/routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as UploadController from "../controllers/upload.controller.js";
import { sendError } from "../utils/response.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const { allowedMimeTypes, maxFileSizeMb, destination } = config.upload;
const router = express.Router();

const storage = multer.diskStorage({
  destination,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const allowedMimeSet = new Set(allowedMimeTypes);

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeSet.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
  },
});

router.post(
  "/logo",
  authenticate,
  requireRole(SUPER_ADMIN),
  upload.single("logo"),
  UploadController.uploadLogo
);

router.use((err, _req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return sendError(res, 400, `File exceeds ${maxFileSizeMb} MB limit`);
  if (err.message)
    return sendError(res, 400, err.message);
  next(err);
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/upload.routes.js
git commit -m "refactor: read upload limits from config.js and use sendError"
```

---

## Task 9: Update all controllers

**Files:**
- Modify: `server/controllers/auth.controller.js`
- Modify: `server/controllers/invoice.controller.js`
- Modify: `server/controllers/company.controller.js`
- Modify: `server/controllers/upload.controller.js`
- Modify: `server/controllers/pdf.controller.js`
- Modify: `server/controllers/superAdmin.controller.js`

- [ ] **Step 1: Update `server/controllers/auth.controller.js`**

Login result now wraps under `data`. All responses use `sendSuccess`.

```js
// server/controllers/auth.controller.js
import * as AuthService from "../services/auth.service.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      throw new AppError(400, "username and password are required");

    const result = await AuthService.login(username, password);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await AuthService.getMe(req.user.userId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role)
      throw new AppError(400, "username, password, and role are required");

    const companyId =
      req.user.role === SUPER_ADMIN ? req.body.companyId : req.companyId;

    const user = await AuthService.createUser({ username, password, role, companyId });
    sendSuccess(res, user, 201, "User created successfully");
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await AuthService.listUsers(req.companyId);
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await AuthService.getUserById(req.params.id, req.companyId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await AuthService.updateUser(req.params.id, req.companyId, req.body);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await AuthService.deleteUser(req.params.id, req.companyId);
    sendSuccess(res, null, 200, "User deleted successfully");
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 2: Update `server/controllers/invoice.controller.js`**

```js
// server/controllers/invoice.controller.js
import * as InvoiceService from "../services/invoice.service.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import config from "../config.js";

const { defaultPage, defaultLimit, maxLimit } = config.invoice;

export async function createInvoice(req, res, next) {
  try {
    if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length === 0)
      throw new AppError(400, "Request body is required");

    const invoice = await InvoiceService.createInvoice({
      body: req.body,
      companyId: req.companyId,
      userId: req.user.userId,
    });
    sendSuccess(res, invoice, 201);
  } catch (err) {
    next(err);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const { q, sortBy, order } = req.query;
    const page  = Math.max(1, parseInt(req.query.page, 10)  || defaultPage);
    const limit = Math.min(maxLimit, parseInt(req.query.limit, 10) || defaultLimit);
    const { invoices, total } = await InvoiceService.listInvoices({
      companyId: req.companyId,
      q,
      sortBy,
      order,
      page,
      limit,
    });
    sendSuccess(res, { invoices, total });
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const invoice = await InvoiceService.getInvoiceById(
      req.params.id,
      req.companyId
    );
    sendSuccess(res, invoice);
  } catch (err) {
    next(err);
  }
}

export async function updateInvoice(req, res, next) {
  try {
    const invoice = await InvoiceService.updateInvoice(
      req.params.id,
      req.companyId,
      req.body
    );
    sendSuccess(res, invoice);
  } catch (err) {
    next(err);
  }
}

export async function deleteInvoice(req, res, next) {
  try {
    await InvoiceService.deleteInvoice(req.params.id, req.companyId);
    sendSuccess(res, null, 200, "Invoice deleted successfully");
  } catch (err) {
    next(err);
  }
}
```

> **Note on `listInvoices`:** The previous response shape was `{ success, data: invoices, total }` — `total` was at the root. It is now `{ success, data: { invoices, total } }`. If the frontend reads `res.data.total` anywhere, update it to `res.data.data.total` and `res.data.data.invoices`.

- [ ] **Step 3: Update `server/controllers/company.controller.js`**

```js
// server/controllers/company.controller.js
import * as CompanyService from "../services/company.service.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";

export async function createCompany(req, res, next) {
  try {
    const { name, adminUsername, adminPassword } = req.body;
    if (!name || !adminUsername || !adminPassword)
      throw new AppError(400, "name, adminUsername, and adminPassword are required");

    const result = await CompanyService.createCompany(req.body);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function listCompanies(req, res, next) {
  try {
    const companies = await CompanyService.listCompanies();
    sendSuccess(res, companies);
  } catch (err) {
    next(err);
  }
}

export async function getCompany(req, res, next) {
  try {
    const company = await CompanyService.getCompanyById(req.params.id);
    sendSuccess(res, company);
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req, res, next) {
  try {
    const company = await CompanyService.updateCompany(req.params.id, req.body);
    sendSuccess(res, company);
  } catch (err) {
    next(err);
  }
}

export async function deleteCompany(req, res, next) {
  try {
    await CompanyService.deleteCompany(req.params.id);
    sendSuccess(res, null, 200, "Company deleted successfully");
  } catch (err) {
    next(err);
  }
}

export async function toggleActive(req, res, next) {
  try {
    const company = await CompanyService.toggleCompanyActive(req.params.id);
    sendSuccess(res, company);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Update `server/controllers/upload.controller.js`**

```js
// server/controllers/upload.controller.js
import { sendSuccess, sendError } from "../utils/response.js";

export function uploadLogo(req, res) {
  if (!req.file)
    return sendError(res, 400, "No file uploaded");
  return sendSuccess(res, { filename: req.file.filename });
}
```

- [ ] **Step 5: Update `server/controllers/pdf.controller.js`**

```js
// server/controllers/pdf.controller.js
import crypto from "crypto";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  renderState,
  generatePDFWithTimeout,
  SLOT_LEASE_MS,
} from "../services/pdf.service.js";

export function getStatus(req, res) {
  sendSuccess(res, {
    activeRenders: renderState.active,
    maxConcurrent: renderState.maxConcurrent,
    available: renderState.maxConcurrent - renderState.active,
  });
}

export async function renderPdf(req, res) {
  const requestId = crypto.randomUUID();
  renderState.increment();

  const leaseTimer = setTimeout(() => {
    console.error(`[PDF] SAFETY RESET — slot leaked for ${requestId}`);
    renderState.decrement();
  }, SLOT_LEASE_MS);

  console.log(
    `[PDF] Start ${requestId} | active: ${renderState.active}/${renderState.maxConcurrent}`
  );

  try {
    const pdfBuffer = await generatePDFWithTimeout(req.body.html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("X-Request-Id", requestId);
    res.end(pdfBuffer);

    console.log(`[PDF] Done ${requestId} | ${pdfBuffer.length} bytes`);
  } catch (err) {
    console.error(`[PDF] Failed ${requestId}: ${err.message}`);
    if (!res.headersSent) {
      sendError(res, 500, "PDF generation failed");
    }
  } finally {
    clearTimeout(leaseTimer);
    renderState.decrement();
    console.log(
      `[PDF] Released ${requestId} | active: ${renderState.active}/${renderState.maxConcurrent}`
    );
  }
}
```

- [ ] **Step 6: Update `server/controllers/superAdmin.controller.js`**

```js
// server/controllers/superAdmin.controller.js
import * as SuperAdminService from "../services/superAdmin.service.js";
import { sendSuccess } from "../utils/response.js";

export async function getPlatformStats(req, res, next) {
  try {
    const stats = await SuperAdminService.getPlatformStats();
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyInvoices(req, res, next) {
  try {
    const invoices = await SuperAdminService.getCompanyInvoices(req.params.id);
    sendSuccess(res, invoices);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyUsers(req, res, next) {
  try {
    const users = await SuperAdminService.getCompanyUsers(req.params.id);
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 7: Commit all controllers**

```bash
git add server/controllers/auth.controller.js \
        server/controllers/invoice.controller.js \
        server/controllers/company.controller.js \
        server/controllers/upload.controller.js \
        server/controllers/pdf.controller.js \
        server/controllers/superAdmin.controller.js
git commit -m "refactor: use sendSuccess/sendError across all controllers"
```

---

## Task 10: Fix frontend login

**Files:**
- Modify: `client/src/pages/Login.jsx`

The login response shape changes from:
```js
// before
res.data.token
res.data.user
res.data.company
```
to:
```js
// after — login result is now under data envelope
res.data.data.token
res.data.data.user
res.data.data.company
```

- [ ] **Step 1: Update the `handleLogin` function in `client/src/pages/Login.jsx`**

Replace only the `handleLogin` function body (lines 26–79):

```js
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });

      if (res.data.success) {
        const { token, user, company } = res.data.data;

        const userData = {
          _id: user._id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        if (company) {
          localStorage.setItem("company", JSON.stringify(company));
        }

        setUser(userData);
        setToken(token);
        setCompany(company ?? null);

        setTimeout(() => {
          if (userData.role === "super_admin") {
            navigate("/dashboard");
          } else {
            navigate("/new-quote");
          }
        }, 300);
      } else {
        setError(
          res.data.message || "Login failed. Please check your credentials.",
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Unable to connect to the server. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Login.jsx
git commit -m "fix: update login to destructure token/user/company from res.data.data"
```

---

## Self-Review

**Spec coverage:**
- `sendSuccess` / `sendError` utility — Task 1 ✓
- `config.js` expansion — Task 2 ✓
- `process.env` removed from `db.js`, `seeding.js` — Task 3 ✓
- `process.env` removed from `server.js` — Task 4 ✓
- `process.env` removed from `auth.service.js` — Task 5 ✓
- Hardcoded PDF constants removed from `pdf.service.js` — Task 6 ✓
- `errorHandler` uses `sendError` — Task 7 ✓
- `authenticate.js` uses `sendError` directly — Task 7 ✓
- `upload.routes.js` uses `sendError` + config limits — Task 8 ✓
- All 6 controllers updated — Task 9 ✓
- Frontend login fixed — Task 10 ✓

**Placeholder scan:** No TBDs, no "similar to Task N", all code blocks complete.

**Type consistency:**
- `sendSuccess(res, data, statusCode, message)` — signature used consistently across Tasks 1, 7, 8, 9.
- `sendError(res, statusCode, message)` — signature used consistently across Tasks 1, 7, 8, 9.
- `MAX_HTML_BYTES` export from `pdf.service.js` preserved as a named re-export — any consumer of this export is unaffected.
- `listInvoices` shape change (`data: { invoices, total }`) is called out explicitly in Task 9 Step 2 note.

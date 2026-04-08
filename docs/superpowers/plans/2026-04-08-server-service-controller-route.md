# Server Service-Controller-Route Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Express server from fat-route files into a clean service → controller → route architecture with a global error handler, AppError utility, consistent response shape, and manual input validation.

**Architecture:** Each domain (auth, invoice, company, superAdmin, pdf, upload) gets a `*.service.js` (pure business logic, throws AppError), a `*.controller.js` (validates input, calls service, sends response, passes errors via `next(err)`), and a `*.routes.js` (path + middleware chain only). A single `errorHandler` middleware in `server.js` handles all error formatting.

**Tech Stack:** Node.js, Express, Mongoose, bcryptjs, jsonwebtoken, multer, puppeteer — no new packages added.

> **Note on tests:** This project has no test framework configured. Each task includes a manual server-start verification step instead of unit tests. Adding a test framework is out of scope for this refactor.

> **Note on response shape changes:** This refactor standardises all success responses to `{ success: true, data: ... }`. The frontend currently reads fields directly (e.g. `res.data.invoices`, `res.data.user`). After completing this plan, frontend pages that call changed endpoints will need updating. The login response shape is intentionally preserved to minimise immediate breakage.

---

## File Map

**Create (new):**
- `server/utils/AppError.js`
- `server/middleware/errorHandler.js`
- `server/services/invoice.service.js`
- `server/controllers/invoice.controller.js`
- `server/routes/invoice.routes.js`
- `server/services/auth.service.js`
- `server/controllers/auth.controller.js`
- `server/routes/auth.routes.js`
- `server/services/company.service.js`
- `server/controllers/company.controller.js`
- `server/routes/company.routes.js`
- `server/services/superAdmin.service.js`
- `server/controllers/superAdmin.controller.js`
- `server/routes/superAdmin.routes.js`
- `server/services/pdf.service.js`
- `server/controllers/pdf.controller.js`
- `server/routes/pdf.routes.js`
- `server/controllers/upload.controller.js`
- `server/routes/upload.routes.js`

**Modify:**
- `server/server.js` — update route imports, mount errorHandler last

**Delete (old fat-route files, after replacements are in place):**
- `server/routes/invoices.js`
- `server/routes/auth.js`
- `server/routes/companies.js`
- `server/routes/superAdmin.js`
- `server/routes/upload.js`
- `server/routes/pdf.js`

---

## Task 1: AppError utility + errorHandler middleware

**Files:**
- Create: `server/utils/AppError.js`
- Create: `server/middleware/errorHandler.js`

- [ ] **Step 1: Create `server/utils/AppError.js`**

```js
// server/utils/AppError.js
export default class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

- [ ] **Step 2: Create `server/middleware/errorHandler.js`**

```js
// server/middleware/errorHandler.js

// Operational errors (AppError instances) have a statusCode — expose their message.
// Unknown errors (DB failures, bugs) do not — hide internals, log server-side.
export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal Server Error";
  if (!err.statusCode) console.error(err);
  res.status(statusCode).json({ success: false, message });
}
```

- [ ] **Step 3: Commit**

```bash
git add server/utils/AppError.js server/middleware/errorHandler.js
git commit -m "feat: add AppError utility and global errorHandler middleware"
```

---

## Task 2: Invoice domain

**Files:**
- Create: `server/services/invoice.service.js`
- Create: `server/controllers/invoice.controller.js`
- Create: `server/routes/invoice.routes.js`
- Delete: `server/routes/invoices.js`

- [ ] **Step 1: Create `server/services/invoice.service.js`**

```js
// server/services/invoice.service.js
import Invoice from "../models/Invoice.js";
import AppError from "../utils/AppError.js";

export async function createInvoice({ body, companyId, userId }) {
  const invoice = new Invoice({ ...body, companyId, createdBy: userId });
  await invoice.save();
  return invoice;
}

export async function listInvoices({
  companyId,
  q,
  sortBy = "createdAt",
  order = "desc",
  page = 1,
  limit = 50,
}) {
  const baseFilter = companyId ? { companyId } : {};
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
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit)),
    Invoice.countDocuments(query),
  ]);

  return { invoices, total };
}

export async function getInvoiceById(id, companyId) {
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOne(filter);
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}

export async function updateInvoice(id, companyId, data) {
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndUpdate(filter, data, {
    new: true,
    runValidators: true,
  });
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice;
}

export async function deleteInvoice(id, companyId) {
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const invoice = await Invoice.findOneAndDelete(filter);
  if (!invoice) throw new AppError(404, "Invoice not found");
}
```

- [ ] **Step 2: Create `server/controllers/invoice.controller.js`**

```js
// server/controllers/invoice.controller.js
import * as InvoiceService from "../services/invoice.service.js";
import AppError from "../utils/AppError.js";

export async function createInvoice(req, res, next) {
  try {
    if (!req.body || Object.keys(req.body).length === 0)
      throw new AppError(400, "Request body is required");

    const invoice = await InvoiceService.createInvoice({
      body: req.body,
      companyId: req.companyId,
      userId: req.user.userId,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const { q, sortBy, order, page, limit } = req.query;
    const { invoices, total } = await InvoiceService.listInvoices({
      companyId: req.companyId,
      q,
      sortBy,
      order,
      page,
      limit,
    });
    res.json({ success: true, data: invoices, total });
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
    res.json({ success: true, data: invoice });
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
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function deleteInvoice(req, res, next) {
  try {
    await InvoiceService.deleteInvoice(req.params.id, req.companyId);
    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Create `server/routes/invoice.routes.js`**

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
router.get("/", InvoiceController.listInvoices);
router.get("/:id", InvoiceController.getInvoice);
router.put("/:id", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.updateInvoice);
router.delete("/:id", requireRole(COMPANY_ADMIN, SUPER_ADMIN), InvoiceController.deleteInvoice);

export default router;
```

- [ ] **Step 4: Update `server/server.js` — swap invoice route import**

Change:
```js
import invoicesRouter from "./routes/invoices.js";
```
To:
```js
import invoiceRouter from "./routes/invoice.routes.js";
```

And change the mount line:
```js
app.use("/api/invoices", invoicesRouter);
```
To:
```js
app.use("/api/invoices", invoiceRouter);
```

- [ ] **Step 5: Delete old file**

```bash
rm server/routes/invoices.js
```

- [ ] **Step 6: Verify server starts**

```bash
cd server && node server.js
```
Expected: `Server running on port 5000` with no import errors.

- [ ] **Step 7: Commit**

```bash
git add server/services/invoice.service.js server/controllers/invoice.controller.js server/routes/invoice.routes.js server/server.js
git rm server/routes/invoices.js
git commit -m "feat: extract invoice service, controller, and routes"
```

---

## Task 3: Auth domain

**Files:**
- Create: `server/services/auth.service.js`
- Create: `server/controllers/auth.controller.js`
- Create: `server/routes/auth.routes.js`
- Delete: `server/routes/auth.js`

- [ ] **Step 1: Create `server/services/auth.service.js`**

```js
// server/services/auth.service.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Company from "../models/Company.js";
import AppError from "../utils/AppError.js";

export async function login(username, password) {
  const user = await User.findOne({ username });
  if (!user) throw new AppError(401, "Invalid username or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError(401, "Invalid username or password");

  const token = jwt.sign(
    { userId: user._id, role: user.role, companyId: user.companyId ?? null },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
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

  const hashedPassword = await bcrypt.hash(password, 10);
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

export async function getUserById(id) {
  const user = await User.findById(id).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function updateUser(id, { password, ...rest }) {
  const updateData = { ...rest };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function deleteUser(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError(404, "User not found");
}
```

- [ ] **Step 2: Create `server/controllers/auth.controller.js`**

```js
// server/controllers/auth.controller.js
import * as AuthService from "../services/auth.service.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      throw new AppError(400, "username and password are required");

    const result = await AuthService.login(username, password);
    // Spread intentionally preserves { token, user, company } shape for frontend compatibility
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await AuthService.getMe(req.user.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role)
      throw new AppError(400, "username, password, and role are required");

    // super_admin provides companyId in body; company_admin uses their own company
    const companyId =
      req.user.role === SUPER_ADMIN ? req.body.companyId : req.companyId;

    const user = await AuthService.createUser({ username, password, role, companyId });
    res.status(201).json({ success: true, message: "User created successfully", data: user });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await AuthService.listUsers(req.companyId);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await AuthService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await AuthService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await AuthService.deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Create `server/routes/auth.routes.js`**

```js
// server/routes/auth.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import * as AuthController from "../controllers/auth.controller.js";
import config from "../config.js";

const { COMPANY_ADMIN, SUPER_ADMIN } = config.roles;
const router = express.Router();

router.post("/login", AuthController.login);
router.get("/me", authenticate, AuthController.getMe);

router.post(
  "/users",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  scopeToCompany,
  AuthController.createUser
);
router.get(
  "/users",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  scopeToCompany,
  AuthController.listUsers
);
router.get(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  AuthController.getUserById
);
router.put(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  AuthController.updateUser
);
router.delete(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  AuthController.deleteUser
);

export default router;
```

- [ ] **Step 4: Update `server/server.js` — swap auth route import**

Change:
```js
import authRouter from "./routes/auth.js";
```
To:
```js
import authRouter from "./routes/auth.routes.js";
```

- [ ] **Step 5: Delete old file**

```bash
rm server/routes/auth.js
```

- [ ] **Step 6: Verify server starts**

```bash
cd server && node server.js
```
Expected: `Server running on port 5000` with no errors.

- [ ] **Step 7: Commit**

```bash
git add server/services/auth.service.js server/controllers/auth.controller.js server/routes/auth.routes.js server/server.js
git rm server/routes/auth.js
git commit -m "feat: extract auth service, controller, and routes"
```

---

## Task 4: Company domain

**Files:**
- Create: `server/services/company.service.js`
- Create: `server/controllers/company.controller.js`
- Create: `server/routes/company.routes.js`
- Delete: `server/routes/companies.js`

- [ ] **Step 1: Create `server/services/company.service.js`**

```js
// server/services/company.service.js
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";

const { COMPANY_ADMIN } = config.roles;

export async function createCompany({
  name,
  logoFile,
  tagline,
  registeredOffice,
  industryAddress,
  phones,
  email,
  website,
  adminUsername,
  adminPassword,
}) {
  const company = await Company.create({
    name,
    logoFile: logoFile ?? "",
    tagline: tagline ?? "",
    registeredOffice: registeredOffice ?? "",
    industryAddress: industryAddress ?? "",
    phones: phones ?? [],
    email: email ?? "",
    website: website ?? "",
  });

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminUser = await User.create({
    username: adminUsername,
    password: hashedPassword,
    role: COMPANY_ADMIN,
    companyId: company._id,
  });

  return {
    company,
    adminUser: {
      _id: adminUser._id,
      username: adminUser.username,
      role: adminUser.role,
    },
  };
}

export async function listCompanies() {
  const companies = await Company.find().sort({ createdAt: -1 });
  return Promise.all(
    companies.map(async (company) => {
      const [userCount, invoiceCount] = await Promise.all([
        User.countDocuments({ companyId: company._id }),
        Invoice.countDocuments({ companyId: company._id }),
      ]);
      return { ...company.toObject(), userCount, invoiceCount };
    })
  );
}

export async function getCompanyById(id) {
  const company = await Company.findById(id);
  if (!company) throw new AppError(404, "Company not found");
  return company;
}

export async function updateCompany(id, data) {
  const company = await Company.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!company) throw new AppError(404, "Company not found");
  return company;
}

export async function deleteCompany(id) {
  const company = await Company.findByIdAndDelete(id);
  if (!company) throw new AppError(404, "Company not found");
  await Promise.all([
    User.deleteMany({ companyId: id }),
    Invoice.deleteMany({ companyId: id }),
  ]);
}

export async function toggleCompanyActive(id) {
  const company = await Company.findById(id);
  if (!company) throw new AppError(404, "Company not found");
  company.isActive = !company.isActive;
  await company.save();
  return company;
}
```

- [ ] **Step 2: Create `server/controllers/company.controller.js`**

```js
// server/controllers/company.controller.js
import * as CompanyService from "../services/company.service.js";
import AppError from "../utils/AppError.js";

export async function createCompany(req, res, next) {
  try {
    const { name, adminUsername, adminPassword } = req.body;
    if (!name || !adminUsername || !adminPassword)
      throw new AppError(400, "name, adminUsername, and adminPassword are required");

    const result = await CompanyService.createCompany(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listCompanies(req, res, next) {
  try {
    const companies = await CompanyService.listCompanies();
    res.json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
}

export async function getCompany(req, res, next) {
  try {
    const company = await CompanyService.getCompanyById(req.params.id);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req, res, next) {
  try {
    const company = await CompanyService.updateCompany(req.params.id, req.body);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
}

export async function deleteCompany(req, res, next) {
  try {
    await CompanyService.deleteCompany(req.params.id);
    res.json({ success: true, message: "Company deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function toggleActive(req, res, next) {
  try {
    const company = await CompanyService.toggleCompanyActive(req.params.id);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Create `server/routes/company.routes.js`**

```js
// server/routes/company.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as CompanyController from "../controllers/company.controller.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, requireRole(SUPER_ADMIN));

router.post("/", CompanyController.createCompany);
router.get("/", CompanyController.listCompanies);
router.get("/:id", CompanyController.getCompany);
router.put("/:id", CompanyController.updateCompany);
router.delete("/:id", CompanyController.deleteCompany);
router.patch("/:id/toggle-active", CompanyController.toggleActive);

export default router;
```

- [ ] **Step 4: Update `server/server.js` — swap company route import**

Change:
```js
import companiesRouter from "./routes/companies.js";
```
To:
```js
import companyRouter from "./routes/company.routes.js";
```

Change mount line:
```js
app.use("/api/companies", companiesRouter);
```
To:
```js
app.use("/api/companies", companyRouter);
```

- [ ] **Step 5: Delete old file**

```bash
rm server/routes/companies.js
```

- [ ] **Step 6: Verify server starts**

```bash
cd server && node server.js
```
Expected: `Server running on port 5000` with no errors.

- [ ] **Step 7: Commit**

```bash
git add server/services/company.service.js server/controllers/company.controller.js server/routes/company.routes.js server/server.js
git rm server/routes/companies.js
git commit -m "feat: extract company service, controller, and routes"
```

---

## Task 5: SuperAdmin domain

**Files:**
- Create: `server/services/superAdmin.service.js`
- Create: `server/controllers/superAdmin.controller.js`
- Create: `server/routes/superAdmin.routes.js`
- Delete: `server/routes/superAdmin.js`

- [ ] **Step 1: Create `server/services/superAdmin.service.js`**

```js
// server/services/superAdmin.service.js
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import config from "../config.js";

export async function getPlatformStats() {
  const [totalCompanies, activeCompanies, totalUsers, totalInvoices] =
    await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $ne: config.roles.SUPER_ADMIN } }),
      Invoice.countDocuments(),
    ]);
  return { totalCompanies, activeCompanies, totalUsers, totalInvoices };
}

export async function getCompanyInvoices(companyId) {
  return Invoice.find({ companyId }).sort({ createdAt: -1 });
}

export async function getCompanyUsers(companyId) {
  return User.find({ companyId }).select("-password");
}
```

- [ ] **Step 2: Create `server/controllers/superAdmin.controller.js`**

```js
// server/controllers/superAdmin.controller.js
import * as SuperAdminService from "../services/superAdmin.service.js";

export async function getPlatformStats(req, res, next) {
  try {
    const stats = await SuperAdminService.getPlatformStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getCompanyInvoices(req, res, next) {
  try {
    const invoices = await SuperAdminService.getCompanyInvoices(req.params.id);
    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
}

export async function getCompanyUsers(req, res, next) {
  try {
    const users = await SuperAdminService.getCompanyUsers(req.params.id);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Create `server/routes/superAdmin.routes.js`**

```js
// server/routes/superAdmin.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as SuperAdminController from "../controllers/superAdmin.controller.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, requireRole(SUPER_ADMIN));

router.get("/stats", SuperAdminController.getPlatformStats);
router.get("/companies/:id/invoices", SuperAdminController.getCompanyInvoices);
router.get("/companies/:id/users", SuperAdminController.getCompanyUsers);

export default router;
```

- [ ] **Step 4: Update `server/server.js` — swap superAdmin route import**

Change:
```js
import superAdminRouter from "./routes/superAdmin.js";
```
To:
```js
import superAdminRouter from "./routes/superAdmin.routes.js";
```

- [ ] **Step 5: Delete old file**

```bash
rm server/routes/superAdmin.js
```

- [ ] **Step 6: Verify server starts**

```bash
cd server && node server.js
```
Expected: `Server running on port 5000` with no errors.

- [ ] **Step 7: Commit**

```bash
git add server/services/superAdmin.service.js server/controllers/superAdmin.controller.js server/routes/superAdmin.routes.js server/server.js
git rm server/routes/superAdmin.js
git commit -m "feat: extract superAdmin service, controller, and routes"
```

---

## Task 6: PDF domain

**Files:**
- Create: `server/services/pdf.service.js`
- Create: `server/controllers/pdf.controller.js`
- Create: `server/routes/pdf.routes.js`
- Delete: `server/routes/pdf.js`

- [ ] **Step 1: Create `server/services/pdf.service.js`**

```js
// server/services/pdf.service.js
import puppeteer from "puppeteer";

const MAX_CONCURRENT = 2;
const PDF_TIMEOUT_MS = 45_000;
const BROWSER_TIMEOUT_MS = 60_000;
const RETRY_COUNT = 2;

export const MAX_HTML_BYTES = 512_000;
export const SLOT_LEASE_MS = PDF_TIMEOUT_MS + 10_000; // 55s safety reset

export const renderState = {
  active: 0,
  increment() {
    this.active = Math.min(this.active + 1, MAX_CONCURRENT + 10);
  },
  decrement() {
    this.active = Math.max(this.active - 1, 0);
  },
  isBusy() {
    return this.active >= MAX_CONCURRENT;
  },
  get maxConcurrent() {
    return MAX_CONCURRENT;
  },
};

async function generatePDF(html, retries = RETRY_COUNT) {
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
      await new Promise((r) => setTimeout(r, attempt * 600));
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

- [ ] **Step 2: Create `server/controllers/pdf.controller.js`**

```js
// server/controllers/pdf.controller.js
import crypto from "crypto";
import {
  renderState,
  generatePDFWithTimeout,
  SLOT_LEASE_MS,
} from "../services/pdf.service.js";

export function getStatus(req, res) {
  res.json({
    activeRenders: renderState.active,
    maxConcurrent: renderState.maxConcurrent,
    available: renderState.maxConcurrent - renderState.active,
  });
}

export async function renderPdf(req, res) {
  const requestId = crypto.randomUUID();
  renderState.increment();

  // Safety lease — force-releases slot if finally block never runs (OOM, SIGTERM, etc.)
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
      res.status(500).json({ error: "PDF generation failed", requestId });
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

- [ ] **Step 3: Create `server/routes/pdf.routes.js`**

```js
// server/routes/pdf.routes.js
import express from "express";
import { renderState, MAX_HTML_BYTES } from "../services/pdf.service.js";
import * as PdfController from "../controllers/pdf.controller.js";

const router = express.Router();

const validatePayload = (req, res, next) => {
  const bytes = parseInt(req.headers["content-length"] || "0", 10);
  if (bytes > MAX_HTML_BYTES)
    return res.status(413).json({ error: "Payload too large" });

  const { html } = req.body;
  if (!html || typeof html !== "string" || html.trim().length === 0)
    return res.status(400).json({ error: "html is required" });

  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES)
    return res.status(413).json({ error: "HTML content too large" });

  next();
};

const concurrencyGuard = (req, res, next) => {
  if (renderState.isBusy()) {
    console.warn(`[PDF] Rejected — active: ${renderState.active}/${renderState.maxConcurrent}`);
    return res.status(429).json({
      error: "PDF generation in progress, please try again in a moment",
      activeRenders: renderState.active,
      maxConcurrent: renderState.maxConcurrent,
    });
  }
  next();
};

router.get("/status", PdfController.getStatus);
router.post("/render", validatePayload, concurrencyGuard, PdfController.renderPdf);

export default router;
```

- [ ] **Step 4: Update `server/server.js` — swap pdf route import**

Change:
```js
import pdfRoutes from "./routes/pdf.js";
```
To:
```js
import pdfRouter from "./routes/pdf.routes.js";
```

Change mount line:
```js
app.use("/api/pdf", pdfRoutes);
```
To:
```js
app.use("/api/pdf", pdfRouter);
```

- [ ] **Step 5: Delete old file**

```bash
rm server/routes/pdf.js
```

- [ ] **Step 6: Verify server starts**

```bash
cd server && node server.js
```
Expected: `Server running on port 5000` with no errors.

- [ ] **Step 7: Commit**

```bash
git add server/services/pdf.service.js server/controllers/pdf.controller.js server/routes/pdf.routes.js server/server.js
git rm server/routes/pdf.js
git commit -m "feat: extract pdf service, controller, and routes"
```

---

## Task 7: Upload domain

**Files:**
- Create: `server/controllers/upload.controller.js`
- Create: `server/routes/upload.routes.js`
- Delete: `server/routes/upload.js`

- [ ] **Step 1: Create `server/controllers/upload.controller.js`**

```js
// server/controllers/upload.controller.js
export function uploadLogo(req, res) {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });
  return res.json({ success: true, filename: req.file.filename });
}
```

- [ ] **Step 2: Create `server/routes/upload.routes.js`**

```js
// server/routes/upload.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as UploadController from "../controllers/upload.controller.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const router = express.Router();

const storage = multer.diskStorage({
  destination: "public/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.post(
  "/logo",
  authenticate,
  requireRole(SUPER_ADMIN),
  upload.single("logo"),
  UploadController.uploadLogo
);

export default router;
```

- [ ] **Step 3: Update `server/server.js` — swap upload route import**

Change:
```js
import uploadRouter from "./routes/upload.js";
```
To:
```js
import uploadRouter from "./routes/upload.routes.js";
```

- [ ] **Step 4: Delete old file**

```bash
rm server/routes/upload.js
```

- [ ] **Step 5: Verify server starts**

```bash
cd server && node server.js
```
Expected: `Server running on port 5000` with no errors.

- [ ] **Step 6: Commit**

```bash
git add server/controllers/upload.controller.js server/routes/upload.routes.js server/server.js
git rm server/routes/upload.js
git commit -m "feat: extract upload controller and routes"
```

---

## Task 8: Mount errorHandler + final server.js cleanup

**Files:**
- Modify: `server/server.js`

- [ ] **Step 1: Replace full `server/server.js` with final version**

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
app.use(express.json({ limit: "5mb" }));
app.use("/public", express.static("public"));

const PORT = process.env.PORT || 5000;

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

// Global error handler — must be mounted AFTER all routes
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 2: Verify server starts cleanly with no old-file references**

```bash
cd server && node server.js
```
Expected: `Server running on port 5000`.

- [ ] **Step 3: Smoke test — hit the health endpoint**

```bash
curl http://localhost:5000/
```
Expected: `{"ok":true,"message":"Interiors SaaS API"}`

- [ ] **Step 4: Commit**

```bash
git add server/server.js
git commit -m "feat: mount global errorHandler and finalize server.js imports"
```

---

## Final Folder Verification

After Task 8, run this to confirm the new structure:

```bash
ls server/routes/ server/controllers/ server/services/ server/utils/ server/middleware/
```

Expected output:
```
server/routes/:
auth.routes.js  company.routes.js  invoice.routes.js  pdf.routes.js  superAdmin.routes.js  upload.routes.js

server/controllers/:
auth.controller.js  company.controller.js  invoice.controller.js  pdf.controller.js  superAdmin.controller.js  upload.controller.js

server/services/:
auth.service.js  company.service.js  invoice.service.js  pdf.service.js  superAdmin.service.js

server/utils/:
AppError.js

server/middleware/:
authenticate.js  errorHandler.js  requireRole.js  scopeToCompany.js
```

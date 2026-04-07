# Multi-Tenant SaaS Transformation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-company invoice app into a multi-tenant SaaS platform with JWT auth, bcrypt passwords, role-based access control, a Company model, and a super admin dashboard.

**Architecture:** Single MongoDB database with `companyId` on every User and Invoice document. Three roles — `super_admin`, `company_admin`, `company_user` — enforced by Express middleware. Super admin bypasses tenant scoping; company users are scoped to their own company automatically.

**Tech Stack:** Express 5, Mongoose 8, `jsonwebtoken`, `bcryptjs`, React + React Router, Axios, Tailwind CSS.

---

## File Map

### Backend — New Files
- `server/middleware/authenticate.js` — JWT verification, attaches `req.user`
- `server/middleware/requireRole.js` — role-based access factory
- `server/middleware/scopeToCompany.js` — injects `req.companyId` from token
- `server/models/Company.js` — Company mongoose model
- `server/routes/companies.js` — Company CRUD + toggle-active (super admin only)
- `server/routes/superAdmin.js` — stats + per-company users/invoices views

### Backend — Modified Files
- `server/config.js` — add `roles` object and `platform`, remove old company data
- `server/models/User.js` — replace `isAdmin` with `role` enum + add `companyId` ref
- `server/models/Invoice.js` — add `companyId` + `createdBy` as ObjectId refs, remove old string fields
- `server/database/seeding.js` — seed only super admin using `.env` credentials + bcrypt
- `server/routes/auth.js` — login with JWT + bcrypt; protect user CRUD with middleware
- `server/routes/invoices.js` — add middleware stack; auto-stamp `companyId`/`createdBy` on create
- `server/server.js` — register `companies` and `superAdmin` routes

### Frontend — New Files
- `client/src/components/ProtectedRoute.jsx` — role-aware route guard
- `client/src/pages/SuperAdminDashboard.jsx` — stats overview (companies, users, invoices)
- `client/src/pages/Companies.jsx` — company list with create/edit/delete/toggle
- `client/src/pages/CompanyDetail.jsx` — company detail with Users + Invoices tabs

### Frontend — Modified Files
- `client/src/context/AuthContext.jsx` — store `user`, `token`, `company`
- `client/src/api/api.js` — attach Bearer token on every request; handle 401
- `client/src/pages/Login.jsx` — save `token` + `company`; redirect super admin to `/dashboard`
- `client/src/App.jsx` — add new routes; wrap with `ProtectedRoute`
- `client/src/config.js` — platform branding only (name, tagline for super admin dashboard)
- `client/src/components/Header.jsx` — use `company` from context instead of static config; use `role` instead of `isAdmin`
- `client/src/components/AdminInvoice.jsx` — accept `company` prop instead of static import
- `client/src/components/ClientInvoice.jsx` — accept `company` prop instead of static import
- `client/src/components/InvoicePreview.jsx` — pass `company` from context down to invoice components

---

## Phase 1: Backend

---

### Task 1: Install server dependencies

**Files:**
- Modify: `server/package.json` (via npm install)

- [ ] **Step 1: Install runtime packages**

```bash
cd server && npm install jsonwebtoken bcryptjs
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Verify packages appear in package.json**

Open `server/package.json` and confirm `jsonwebtoken` and `bcryptjs` appear under `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: add jsonwebtoken and bcryptjs dependencies"
```

---

### Task 2: Update `server/config.js`

**Files:**
- Modify: `server/config.js`

- [ ] **Step 1: Replace the file contents**

```js
// server/config.js
// Single source of truth for platform identity and role constants.
// Super admin credentials live in .env — not here.

const config = {
  platform: { name: "Interiors SaaS" },
  roles: {
    SUPER_ADMIN: "super_admin",
    COMPANY_ADMIN: "company_admin",
    COMPANY_USER: "company_user",
  },
};

export default config;
```

- [ ] **Step 2: Commit**

```bash
git add server/config.js
git commit -m "refactor: replace company config with platform identity and roles"
```

---

### Task 3: Add super admin credentials to `.env`

**Files:**
- Modify: `server/.env` (create if it doesn't exist)

- [ ] **Step 1: Open `server/.env` and add these three lines**

```
JWT_SECRET=change_this_to_a_long_random_string_in_production
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=Admin@1234
```

Leave `MONGO_URI` and `PORT` unchanged.

- [ ] **Step 2: Verify `.env` is in `.gitignore`**

```bash
cat .gitignore
```

Confirm `.env` is listed. If not, add it:

```bash
echo "server/.env" >> .gitignore
git add .gitignore
git commit -m "chore: ensure .env is gitignored"
```

---

### Task 4: Create `server/models/Company.js`

**Files:**
- Create: `server/models/Company.js`

- [ ] **Step 1: Create the file**

```js
// server/models/Company.js
import mongoose from "mongoose";

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
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Company", CompanySchema);
```

- [ ] **Step 2: Commit**

```bash
git add server/models/Company.js
git commit -m "feat: add Company model"
```

---

### Task 5: Update `server/models/User.js`

**Files:**
- Modify: `server/models/User.js`

- [ ] **Step 1: Replace the file contents**

```js
// server/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "company_admin", "company_user"],
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
```

- [ ] **Step 2: Commit**

```bash
git add server/models/User.js
git commit -m "feat: replace isAdmin with role enum, add companyId to User model"
```

---

### Task 6: Update `server/models/Invoice.js`

**Files:**
- Modify: `server/models/Invoice.js`

- [ ] **Step 1: Remove the old `createdBy` and `role` string fields at the bottom of `InvoiceSchema` and replace with typed refs**

Find this block near the end of `InvoiceSchema` (before `{ timestamps: true }`):

```js
    createdBy: { type: String },
    role: { type: String },
```

Replace it with:

```js
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
```

- [ ] **Step 2: Verify the full bottom of `InvoiceSchema` now looks like this**

```js
    grandTotalBeforeDiscount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    invoiceType: { type: String, default: "Basic" },
    finalPayableAfterDiscount: { type: Number, default: 0 },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
```

- [ ] **Step 3: Commit**

```bash
git add server/models/Invoice.js
git commit -m "feat: add companyId and createdBy ObjectId refs to Invoice model"
```

---

### Task 7: Update `server/database/seeding.js`

**Files:**
- Modify: `server/database/seeding.js`

- [ ] **Step 1: Replace the file contents**

```js
// server/database/seeding.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export default async function seedDatabase() {
  try {
    const superAdminExists = await User.findOne({ role: "super_admin" });
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash(
        process.env.SUPER_ADMIN_PASSWORD,
        10
      );
      await User.create({
        username: process.env.SUPER_ADMIN_USERNAME,
        password: hashedPassword,
        role: "super_admin",
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

- [ ] **Step 2: Start the server and verify seeding runs without errors**

```bash
cd server && npm run dev
```

Expected console output: `Super admin seeded...` on first run, nothing on subsequent runs. No crash.

- [ ] **Step 3: Commit**

```bash
git add server/database/seeding.js
git commit -m "feat: seed only super admin from .env with bcrypt hash"
```

---

### Task 8: Create `server/middleware/authenticate.js`

**Files:**
- Create: `server/middleware/authenticate.js`

- [ ] **Step 1: Create the file**

```js
// server/middleware/authenticate.js
import jwt from "jsonwebtoken";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId,
    };
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/middleware/authenticate.js
git commit -m "feat: add JWT authenticate middleware"
```

---

### Task 9: Create `server/middleware/requireRole.js`

**Files:**
- Create: `server/middleware/requireRole.js`

- [ ] **Step 1: Create the file**

```js
// server/middleware/requireRole.js
export default function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/middleware/requireRole.js
git commit -m "feat: add requireRole middleware factory"
```

---

### Task 10: Create `server/middleware/scopeToCompany.js`

**Files:**
- Create: `server/middleware/scopeToCompany.js`

- [ ] **Step 1: Create the file**

```js
// server/middleware/scopeToCompany.js
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;

export default function scopeToCompany(req, res, next) {
  if (req.user.role === SUPER_ADMIN) {
    req.companyId = null; // super admin sees all data
  } else {
    req.companyId = req.user.companyId;
  }
  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add server/middleware/scopeToCompany.js
git commit -m "feat: add scopeToCompany middleware for tenant data isolation"
```

---

### Task 11: Update `server/routes/auth.js`

**Files:**
- Modify: `server/routes/auth.js`

- [ ] **Step 1: Replace the entire file**

```js
// server/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Company from "../models/Company.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import config from "../config.js";

const { COMPANY_ADMIN, SUPER_ADMIN } = config.roles;
const router = express.Router();

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        companyId: user.companyId ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    let company = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId);
    }

    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      company,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

/* ================= ME ================= */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

/* ================= CREATE USER ================= */
router.post(
  "/users",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  scopeToCompany,
  async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    try {
      const existing = await User.findOne({ username });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // company_admin can only create company_user within their own company
      // super_admin can create company_admin (companyId must be provided in body)
      const companyId =
        req.user.role === SUPER_ADMIN ? req.body.companyId : req.companyId;

      const newUser = new User({
        username,
        password: hashedPassword,
        role,
        companyId: companyId ?? null,
      });
      await newUser.save();

      return res.json({
        success: true,
        message: "User created successfully",
        user: {
          _id: newUser._id,
          username: newUser.username,
          role: newUser.role,
          companyId: newUser.companyId,
          createdAt: newUser.createdAt,
        },
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ================= LIST USERS ================= */
router.get(
  "/users",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  scopeToCompany,
  async (req, res) => {
    try {
      const query = req.companyId ? { companyId: req.companyId } : {};
      const users = await User.find(query).select("-password");
      return res.json({ success: true, users });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ================= GET SINGLE USER ================= */
router.get(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      return res.json({ success: true, user });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ================= UPDATE USER ================= */
router.put(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      const updateData = { ...rest };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select("-password");

      if (!updatedUser)
        return res.status(404).json({ message: "User not found" });

      return res.json({ success: true, user: updatedUser });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error updating user", error: error.message });
    }
  }
);

/* ================= DELETE USER ================= */
router.delete(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser)
        return res.status(404).json({ message: "User not found" });
      return res.json({ message: "User deleted successfully", success: true });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error deleting user", error: error.message });
    }
  }
);

export default router;
```

- [ ] **Step 2: Test login manually**

Start the server (`npm run dev`). Run:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Admin@1234"}'
```

Expected response: `{ "success": true, "token": "eyJ...", "user": { "role": "super_admin" }, "company": null }`

- [ ] **Step 3: Test that a protected route rejects without token**

```bash
curl http://localhost:5000/api/auth/users
```

Expected: `{ "success": false, "message": "No token provided" }`

- [ ] **Step 4: Commit**

```bash
git add server/routes/auth.js
git commit -m "feat: add JWT login, bcrypt password verification, protect user routes"
```

---

### Task 12: Update `server/routes/invoices.js`

**Files:**
- Modify: `server/routes/invoices.js`

- [ ] **Step 1: Replace the entire file**

```js
// server/routes/invoices.js
import express from "express";
import Invoice from "../models/Invoice.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import config from "../config.js";

const { COMPANY_ADMIN, COMPANY_USER, SUPER_ADMIN } = config.roles;
const router = express.Router();

// All invoice routes require authentication + company scoping
router.use(authenticate, scopeToCompany);

/* ================= CREATE ================= */
router.post(
  "/",
  requireRole(COMPANY_USER, COMPANY_ADMIN),
  async (req, res) => {
    try {
      const invoice = new Invoice({
        ...req.body,
        companyId: req.companyId,
        createdBy: req.user.userId,
      });
      await invoice.save();
      res.status(201).json(invoice);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  }
);

/* ================= READ LIST ================= */
router.get("/", async (req, res) => {
  try {
    const {
      q,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    const baseFilter = req.companyId ? { companyId: req.companyId } : {};

    const searchFilter = q
      ? {
          $or: [
            { "client.name": { $regex: q, $options: "i" } },
            { "client.mobile": { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const query = { ...baseFilter, ...searchFilter };

    const invoices = await Invoice.find(query)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Invoice.countDocuments(query);

    res.json({ data: invoices, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

/* ================= READ SINGLE ================= */
router.get("/:id", async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.companyId) filter.companyId = req.companyId;

    const invoice = await Invoice.findOne(filter);
    if (!invoice) return res.status(404).json({ error: "Not found" });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

/* ================= UPDATE ================= */
router.put(
  "/:id",
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const filter = { _id: req.params.id };
      if (req.companyId) filter.companyId = req.companyId;

      const updatedInvoice = await Invoice.findOneAndUpdate(filter, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updatedInvoice)
        return res.status(404).json({ message: "Invoice not found" });
      res.json(updatedInvoice);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  }
);

/* ================= DELETE ================= */
router.delete(
  "/:id",
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const filter = { _id: req.params.id };
      if (req.companyId) filter.companyId = req.companyId;

      const deletedInvoice = await Invoice.findOneAndDelete(filter);
      if (!deletedInvoice)
        return res.status(404).json({ message: "Invoice not found" });
      res.json({ message: "Invoice deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  }
);

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/invoices.js
git commit -m "feat: protect invoice routes with JWT middleware and tenant scoping"
```

---

### Task 13: Create `server/routes/companies.js`

**Files:**
- Create: `server/routes/companies.js`

- [ ] **Step 1: Create the file**

```js
// server/routes/companies.js
import express from "express";
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import config from "../config.js";

const { SUPER_ADMIN, COMPANY_ADMIN } = config.roles;
const router = express.Router();

// All company routes require super admin
router.use(authenticate, requireRole(SUPER_ADMIN));

/* ================= CREATE COMPANY + FIRST ADMIN ================= */
router.post("/", async (req, res) => {
  const {
    // Company fields
    name,
    logoFile,
    tagline,
    registeredOffice,
    industryAddress,
    phones,
    email,
    website,
    // First admin fields
    adminUsername,
    adminPassword,
  } = req.body;

  if (!name || !adminUsername || !adminPassword) {
    return res.status(400).json({
      success: false,
      message: "name, adminUsername, and adminPassword are required",
    });
  }

  try {
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

    return res.status(201).json({
      success: true,
      company,
      adminUser: {
        _id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create company" });
  }
});

/* ================= LIST ALL COMPANIES ================= */
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    // Attach user and invoice counts
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const [userCount, invoiceCount] = await Promise.all([
          User.countDocuments({ companyId: company._id }),
          Invoice.countDocuments({ companyId: company._id }),
        ]);
        return { ...company.toObject(), userCount, invoiceCount };
      })
    );

    return res.json({ success: true, companies: companiesWithCounts });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch companies" });
  }
});

/* ================= GET SINGLE COMPANY ================= */
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    return res.json({ success: true, company });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch company" });
  }
});

/* ================= UPDATE COMPANY ================= */
router.put("/:id", async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    return res.json({ success: true, company });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update company" });
  }
});

/* ================= DELETE COMPANY ================= */
router.delete("/:id", async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    // Cascade delete all users and invoices for this company
    await Promise.all([
      User.deleteMany({ companyId: req.params.id }),
      Invoice.deleteMany({ companyId: req.params.id }),
    ]);

    return res.json({ success: true, message: "Company deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete company" });
  }
});

/* ================= TOGGLE ACTIVE ================= */
router.patch("/:id/toggle-active", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    company.isActive = !company.isActive;
    await company.save();

    return res.json({ success: true, company });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle company status" });
  }
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/companies.js
git commit -m "feat: add company CRUD routes with cascade delete and toggle-active"
```

---

### Task 14: Create `server/routes/superAdmin.js`

**Files:**
- Create: `server/routes/superAdmin.js`

- [ ] **Step 1: Create the file**

```js
// server/routes/superAdmin.js
import express from "express";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, requireRole(SUPER_ADMIN));

/* ================= PLATFORM STATS ================= */
router.get("/stats", async (req, res) => {
  try {
    const [totalCompanies, activeCompanies, totalUsers, totalInvoices] =
      await Promise.all([
        Company.countDocuments(),
        Company.countDocuments({ isActive: true }),
        User.countDocuments({ role: { $ne: "super_admin" } }),
        Invoice.countDocuments(),
      ]);

    return res.json({
      success: true,
      stats: { totalCompanies, activeCompanies, totalUsers, totalInvoices },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch stats" });
  }
});

/* ================= INVOICES FOR A COMPANY ================= */
router.get("/companies/:id/invoices", async (req, res) => {
  try {
    const invoices = await Invoice.find({ companyId: req.params.id }).sort({
      createdAt: -1,
    });
    return res.json({ success: true, invoices });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch invoices" });
  }
});

/* ================= USERS FOR A COMPANY ================= */
router.get("/companies/:id/users", async (req, res) => {
  try {
    const users = await User.find({ companyId: req.params.id }).select(
      "-password"
    );
    return res.json({ success: true, users });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch users" });
  }
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/superAdmin.js
git commit -m "feat: add super admin stats and per-company data routes"
```

---

### Task 15: Update `server/server.js`

**Files:**
- Modify: `server/server.js`

- [ ] **Step 1: Replace the file**

```js
// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import seeding from "./database/seeding.js";
import invoicesRouter from "./routes/invoices.js";
import authRouter from "./routes/auth.js";
import pdfRoutes from "./routes/pdf.js";
import companiesRouter from "./routes/companies.js";
import superAdminRouter from "./routes/superAdmin.js";
import config from "./config.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/public", express.static("public"));

const PORT = process.env.PORT || 5000;

await connectDB();
await seeding();

app.use("/api/invoices", invoicesRouter);
app.use("/api/auth", authRouter);
app.use("/api/pdf", pdfRoutes);
app.use("/api/companies", companiesRouter);
app.use("/api/super-admin", superAdminRouter);

app.get("/", (_, res) =>
  res.send({ ok: true, message: `${config.platform.name} API` })
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 2: Restart the server and verify no errors**

```bash
cd server && npm run dev
```

Expected: `MongoDB connected`, `Super admin seeded...` (first run only), `Server running on port 5000`. No crash.

- [ ] **Step 3: Verify stats endpoint works with a token**

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Admin@1234"}' | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")

curl http://localhost:5000/api/super-admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `{ "success": true, "stats": { "totalCompanies": 0, ... } }`

- [ ] **Step 4: Commit**

```bash
git add server/server.js
git commit -m "feat: register companies and superAdmin routes"
```

---

## Phase 2: Frontend

---

### Task 16: Update `client/src/context/AuthContext.jsx`

**Files:**
- Modify: `client/src/context/AuthContext.jsx`

- [ ] **Step 1: Replace the file**

```jsx
// client/src/context/AuthContext.jsx
import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  token: null,
  company: null,
  setUser: () => {},
  setToken: () => {},
  setCompany: () => {},
  logout: () => {},
});
```

- [ ] **Step 2: Update `client/src/App.jsx` to manage token and company state**

In `App.jsx`, update the state initialization block (replace the existing `user` state and `logout` function):

```jsx
const [user, setUser] = useState(() => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
});

const [token, setToken] = useState(() => {
  return localStorage.getItem("token") || null;
});

const [company, setCompany] = useState(() => {
  const stored = localStorage.getItem("company");
  return stored ? JSON.parse(stored) : null;
});

const logout = () => {
  setUser(null);
  setToken(null);
  setCompany(null);
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("company");
};
```

Update the `AuthContext.Provider` value prop:

```jsx
<AuthContext.Provider value={{ user, setUser, token, setToken, company, setCompany, logout }}>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/context/AuthContext.jsx client/src/App.jsx
git commit -m "feat: add token and company to AuthContext"
```

---

### Task 17: Update `client/src/api/api.js`

**Files:**
- Modify: `client/src/api/api.js`

- [ ] **Step 1: Replace the file**

```js
// client/src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api`,
  timeout: 10000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear storage and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/api/api.js
git commit -m "feat: add JWT request interceptor and 401 auto-logout to Axios"
```

---

### Task 18: Create `client/src/components/ProtectedRoute.jsx`

**Files:**
- Create: `client/src/components/ProtectedRoute.jsx`

- [ ] **Step 1: Create the file**

```jsx
// client/src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Wraps a route so only authenticated users with the right role can access it.
 * roles: array of allowed role strings. If omitted, any authenticated user is allowed.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ProtectedRoute.jsx
git commit -m "feat: add ProtectedRoute component for role-based route guarding"
```

---

### Task 19: Update `client/src/pages/Login.jsx`

**Files:**
- Modify: `client/src/pages/Login.jsx`

- [ ] **Step 1: Update the import to include `setToken` and `setCompany`**

Find:
```jsx
const { user, setUser } = useContext(AuthContext);
```
Replace with:
```jsx
const { user, setUser, setToken, setCompany } = useContext(AuthContext);
```

- [ ] **Step 2: Update the `handleLogin` success block**

Find the `if (res.data.success)` block and replace the entire block:

```jsx
if (res.data.success) {
  const userData = {
    _id: res.data.user._id,
    username: res.data.user.username,
    role: res.data.user.role,
    createdAt: res.data.user.createdAt,
  };

  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("token", res.data.token);
  if (res.data.company) {
    localStorage.setItem("company", JSON.stringify(res.data.company));
  }

  setUser(userData);
  setToken(res.data.token);
  setCompany(res.data.company ?? null);

  setTimeout(() => {
    if (userData.role === "super_admin") {
      navigate("/dashboard");
    } else {
      navigate("/new-quote");
    }
  }, 300);
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Login.jsx
git commit -m "feat: save token and company on login, redirect super_admin to /dashboard"
```

---

### Task 20: Update `client/src/App.jsx` — routes and role guards

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add new page imports at the top of `App.jsx`**

Add after the existing imports:

```jsx
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
```

- [ ] **Step 2: Replace the `<Routes>` block**

```jsx
<Routes>
  <Route path="/" element={<Login />} />

  {/* Super admin routes */}
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute roles={["super_admin"]}>
        <SuperAdminDashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/companies"
    element={
      <ProtectedRoute roles={["super_admin"]}>
        <Companies />
      </ProtectedRoute>
    }
  />
  <Route
    path="/companies/:id"
    element={
      <ProtectedRoute roles={["super_admin"]}>
        <CompanyDetail />
      </ProtectedRoute>
    }
  />

  {/* Company user/admin routes */}
  <Route
    path="/new-quote/:id"
    element={
      <ProtectedRoute roles={["company_user", "company_admin"]}>
        <NewQuote />
      </ProtectedRoute>
    }
  />
  <Route
    path="/new-quote"
    element={
      <ProtectedRoute roles={["company_user", "company_admin"]}>
        <NewQuote />
      </ProtectedRoute>
    }
  />
  <Route
    path="/history"
    element={
      <ProtectedRoute roles={["company_user", "company_admin"]}>
        <History />
      </ProtectedRoute>
    }
  />
  <Route
    path="/compare"
    element={
      <ProtectedRoute roles={["company_user", "company_admin"]}>
        <Compare />
      </ProtectedRoute>
    }
  />
  <Route
    path="/profile"
    element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    }
  />

  <Route path="*" element={<PageNotFound />} />
</Routes>
```

- [ ] **Step 3: Remove the old `{user && ( ... )}` wrapping** from the routes since `ProtectedRoute` now handles that.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: add role-protected routes for super admin and company users"
```

---

### Task 21: Update `client/src/config.js`

**Files:**
- Modify: `client/src/config.js`

- [ ] **Step 1: Replace file to contain only platform branding**

```js
// client/src/config.js
// Platform-level branding for the super admin dashboard.
// Individual company branding is fetched from the API and stored in AuthContext.

const platformConfig = {
  name: "Interiors SaaS",
  tagline: "Powering Interior Design Businesses",
};

export default platformConfig;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/config.js
git commit -m "refactor: client config.js is now platform branding only"
```

---

### Task 22: Update `client/src/components/Header.jsx`

**Files:**
- Modify: `client/src/components/Header.jsx`

- [ ] **Step 1: Replace the `companyConfig` import with context usage**

Find:
```jsx
import companyConfig from "../config.js";
```
Replace with:
```jsx
import platformConfig from "../config.js";
```

- [ ] **Step 2: Read company from context**

Find:
```jsx
const { user, logout } = useContext(AuthContext);
```
Replace with:
```jsx
const { user, logout, company } = useContext(AuthContext);
const brandConfig = company ?? platformConfig;
```

- [ ] **Step 3: Replace all uses of `companyConfig.name` and `companyConfig.tagline`**

Find (2 occurrences):
```jsx
{companyConfig.name[0]}
```
Replace both with:
```jsx
{brandConfig.name[0]}
```

Find:
```jsx
{companyConfig.name}
```
Replace with:
```jsx
{brandConfig.name}
```

Find:
```jsx
{companyConfig.tagline}
```
Replace with:
```jsx
{brandConfig.tagline}
```

- [ ] **Step 4: Replace `user.isAdmin` with role-based checks**

Find (3 occurrences):
```jsx
user.isAdmin ? "Administrator" : "User"
```
Replace with:
```jsx
user.role === "company_admin" ? "Administrator" : user.role === "super_admin" ? "Super Admin" : "User"
```

Find (2 occurrences):
```jsx
user.isAdmin ? link.showForAdmin : link.showForUser
```
Replace with:
```jsx
user.role !== "super_admin" ? (user.role === "company_admin" ? link.showForAdmin : link.showForUser) : false
```

Find (2 occurrences):
```jsx
{user.isAdmin ? <UserStar /> : <User />}
```
Replace with:
```jsx
{user.role !== "company_user" ? <UserStar /> : <User />}
```

Find (2 occurrences):
```jsx
{user.isAdmin && (
```
Replace with:
```jsx
{user.role !== "company_user" && (
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Header.jsx
git commit -m "feat: use dynamic company branding and role-based UI in Header"
```

---

### Task 23: Update `AdminInvoice` and `ClientInvoice` to accept `company` prop

**Files:**
- Modify: `client/src/components/AdminInvoice.jsx`
- Modify: `client/src/components/ClientInvoice.jsx`
- Modify: `client/src/components/InvoicePreview.jsx`

- [ ] **Step 1: Update `AdminInvoice.jsx` — remove static import, use prop**

Find:
```jsx
import companyConfig from "../config.js";
```
Remove this line.

Find:
```jsx
const AdminInvoice = forwardRef(function AdminInvoice({ invoice }, ref) {
```
Replace with:
```jsx
const AdminInvoice = forwardRef(function AdminInvoice({ invoice, company }, ref) {
```

Find:
```jsx
const logoURL = `${import.meta.env.VITE_API_BASE}/public/${companyConfig.logoFile}`;
```
Replace with:
```jsx
const logoURL = company?.logoFile
  ? `${import.meta.env.VITE_API_BASE}/public/${company.logoFile}`
  : null;
```

Then find every occurrence of `companyConfig.` in `AdminInvoice.jsx` and replace it with `company?.` (e.g., `companyConfig.name` → `company?.name`, `companyConfig.phones` → `company?.phones`).

- [ ] **Step 2: Update `ClientInvoice.jsx` — same pattern**

Apply the same changes to `ClientInvoice.jsx`: remove the static import, add `company` prop, replace all `companyConfig.` with `company?.`.

- [ ] **Step 3: Update `InvoicePreview.jsx` — pass company down**

In `InvoicePreview.jsx`, add `company` to the component's props and pass it through to both `AdminInvoice` and `ClientInvoice`:

Find:
```jsx
export default function InvoicePreview({
  id,
  client,
  ...
```
Add `company` to the destructured props list.

Find both `<AdminInvoice` and `<ClientInvoice` JSX blocks and add `company={company}` as a prop.

- [ ] **Step 4: Find where `InvoicePreview` is used and pass `company` from context**

Search for `<InvoicePreview` in `client/src/pages/NewQuote.jsx`. Import `AuthContext` and read `company` from it, then pass it as a prop to `<InvoicePreview company={company} ... />`.

Do the same in `client/src/pages/History.jsx` if `InvoicePreview` is used there.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AdminInvoice.jsx client/src/components/ClientInvoice.jsx client/src/components/InvoicePreview.jsx client/src/pages/NewQuote.jsx
git commit -m "feat: pass company as prop to invoice components instead of static import"
```

---

### Task 24: Create `client/src/pages/SuperAdminDashboard.jsx`

**Files:**
- Create: `client/src/pages/SuperAdminDashboard.jsx`

- [ ] **Step 1: Create the file**

```jsx
// client/src/pages/SuperAdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/super-admin/stats")
      .then((res) => setStats(res.data.stats))
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return (
      <p className="text-center text-red-500 mt-8">{error}</p>
    );

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
        <Link
          to="/companies"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Manage Companies
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className={`text-3xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/SuperAdminDashboard.jsx
git commit -m "feat: add SuperAdminDashboard page with stats cards"
```

---

### Task 25: Create `client/src/pages/Companies.jsx`

**Files:**
- Create: `client/src/pages/Companies.jsx`

- [ ] **Step 1: Create the file**

```jsx
// client/src/pages/Companies.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

const emptyForm = {
  name: "",
  tagline: "",
  email: "",
  phones: "",
  registeredOffice: "",
  industryAddress: "",
  website: "",
  logoFile: "",
  adminUsername: "",
  adminPassword: "",
};

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchCompanies = () => {
    setLoading(true);
    API.get("/companies")
      .then((res) => setCompanies(res.data.companies))
      .catch(() => setError("Failed to load companies"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await API.patch(`/companies/${id}/toggle-active`);
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, isActive: res.data.company.isActive } : c
        )
      );
    } catch {
      alert("Failed to toggle company status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its users/invoices? This cannot be undone.`)) return;
    try {
      await API.delete(`/companies/${id}`);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Failed to delete company");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        phones: form.phones.split(",").map((p) => p.trim()).filter(Boolean),
      };
      await API.post("/companies", payload);
      setForm(emptyForm);
      setShowForm(false);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create company");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Companies</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showForm ? "Cancel" : "+ Add Company"}
        </button>
      </div>

      {/* Create Company Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-800 dark:text-white">New Company</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Company Name *", placeholder: "Nova Interiors" },
              { key: "tagline", label: "Tagline", placeholder: "Crafting Spaces..." },
              { key: "email", label: "Email", placeholder: "contact@company.com" },
              { key: "phones", label: "Phones (comma-separated)", placeholder: "9876543210, 9876543211" },
              { key: "registeredOffice", label: "Registered Office", placeholder: "Plot 42, Jubilee Hills..." },
              { key: "industryAddress", label: "Industry Address", placeholder: "Survey No. 201..." },
              { key: "website", label: "Website", placeholder: "https://..." },
              { key: "logoFile", label: "Logo Filename", placeholder: "logo.png" },
              { key: "adminUsername", label: "Admin Username *", placeholder: "admin" },
              { key: "adminPassword", label: "Admin Password *", placeholder: "••••••••" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {label}
                </label>
                <input
                  type={key === "adminPassword" ? "password" : "text"}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={["name", "adminUsername", "adminPassword"].includes(key)}
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Company"}
          </button>
        </form>
      )}

      {/* Companies Table */}
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
                  No companies yet. Add one above.
                </td>
              </tr>
            )}
            {companies.map((company) => (
              <tr key={company._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800 dark:text-white">
                    {company.name}
                  </div>
                  <div className="text-xs text-gray-400">{company.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {company.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {company.userCount}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {company.invoiceCount}
                </td>
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
                    <button
                      onClick={() => handleDelete(company._id, company.name)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Companies.jsx
git commit -m "feat: add Companies management page for super admin"
```

---

### Task 26: Create `client/src/pages/CompanyDetail.jsx`

**Files:**
- Create: `client/src/pages/CompanyDetail.jsx`

- [ ] **Step 1: Create the file**

```jsx
// client/src/pages/CompanyDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";

export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get(`/companies/${id}`),
      API.get(`/super-admin/companies/${id}/users`),
      API.get(`/super-admin/companies/${id}/invoices`),
    ])
      .then(([companyRes, usersRes, invoicesRes]) => {
        setCompany(companyRes.data.company);
        setUsers(usersRes.data.users);
        setInvoices(invoicesRes.data.invoices);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!company)
    return <p className="text-center text-red-500 mt-8">Company not found.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/companies"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {company.name}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
              company.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {company.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {["users", "invoices"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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

      {/* Users Tab */}
      {tab === "users" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {["Username", "Role", "Created"].map((h) => (
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    No users yet.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                    {u.username}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "company_admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
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
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/CompanyDetail.jsx
git commit -m "feat: add CompanyDetail page with Users and Invoices tabs"
```

---

## Final Verification

- [ ] **Start both server and client**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

- [ ] **Verify super admin login and dashboard**

1. Go to `http://localhost:5173`
2. Login with `superadmin` / `Admin@1234`
3. Should redirect to `/dashboard` with stats cards showing 0 companies/users/invoices

- [ ] **Verify company creation**

1. Navigate to `/companies`
2. Click "Add Company", fill the form, create a company
3. Table should show the new company with Active badge

- [ ] **Verify company user login**

1. Logout
2. Login with the `adminUsername` you created
3. Should redirect to `/new-quote`
4. Header should show the company's name

- [ ] **Verify tenant isolation**

1. Create two companies (CompanyA and CompanyB) with different admins
2. Login as CompanyA admin, create an invoice
3. Login as CompanyB admin — invoice list should be empty (CompanyA invoice not visible)

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete multi-tenant SaaS transformation with JWT auth and super admin dashboard"
```

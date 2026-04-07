# Multi-Tenant SaaS Transformation — Design Spec

**Date:** 2026-04-07  
**Project:** Interiors Invoice Generation  
**Scope:** Transform single-company app into a multi-tenant SaaS platform with subscription model, super admin dashboard, JWT security, and role-based access control.

---

## 1. Overview

The app currently serves one interior design company via config-file branding swap. This spec describes the transformation into a shared SaaS platform where:

- A **super admin** (you) manages all companies from a dedicated dashboard
- Each **company** has its own admin and users, isolated from other companies
- All API routes are secured with **JWT** and **role-based middleware**
- Passwords are hashed with **bcrypt**
- Company activation/deactivation is the subscription control mechanism (Phase 1)

---

## 2. Multi-Tenancy Strategy

**Single DB with `companyId` on every document (Option A).**

All companies share one MongoDB database. Every `User` and `Invoice` document carries a `companyId` reference. A `scopeToCompany` middleware automatically filters all queries to the requesting user's company. Super admin bypasses scoping and can see all data.

---

## 3. Configuration (`server/config.js`)

Single source of truth for platform identity, super admin seed credentials, and role constants.

```js
export default {
  platform: { name: "Interiors SaaS" },
  superAdmin: { username: "superadmin", password: "changeme123" },
  roles: {
    SUPER_ADMIN: "super_admin",
    COMPANY_ADMIN: "company_admin",
    COMPANY_USER: "company_user",
  }
}
```

`client/src/config.js` becomes the super admin dashboard's platform branding (name, logo, etc.). Individual company branding is stored in the Company document in MongoDB and fetched dynamically at login.

---

## 4. Data Models

### 4.1 Company (new model)

```
Company {
  name:               String, required
  logoFile:           String            // filename served from server/public/
  tagline:            String
  registeredOffice:   String
  industryAddress:    String
  phones:             [String]
  email:              String
  website:            String
  isActive:           Boolean, default: true
  createdAt, updatedAt
}
```

### 4.2 User (updated)

```
User {
  username:   String, required, unique
  password:   String, required          // bcrypt hashed
  role:       enum ["super_admin", "company_admin", "company_user"], required
  companyId:  ObjectId → Company        // null for super_admin
  createdAt, updatedAt
}
```

`isAdmin: Boolean` is removed and replaced by `role`.

### 4.3 Invoice (updated)

```
Invoice {
  ...all existing fields unchanged...
  companyId:  ObjectId → Company, required
  createdBy:  ObjectId → User, required
  // removes: createdBy: String, role: String (old plaintext fields)
}
```

### 4.4 Seeding

Only the super admin is seeded at startup. Credentials come from `server/config.js`:

```js
{ username: config.superAdmin.username, password: bcrypt(config.superAdmin.password), role: "super_admin", companyId: null }
```

Super admin creates all companies and their first admin user via the dashboard. No company or regular user seeding.

---

## 5. JWT & Auth Middleware

### 5.1 Login Flow

1. Client POSTs `{ username, password }` to `POST /api/auth/login`
2. Server finds user, verifies password with `bcrypt.compare`
3. Server signs JWT: `{ userId, role, companyId }`, expires in 7 days, signed with `JWT_SECRET` from `.env`
4. Response returns `{ token, user, company }` — `company` is null for super admin
5. Client stores token in `localStorage`, attaches via Axios interceptor on every request

### 5.2 Server Middleware

**`authenticate`** — applied to all protected routes:
- Reads `Authorization: Bearer <token>` header
- Verifies JWT using `JWT_SECRET`
- Attaches `req.user = { userId, role, companyId }` to the request
- Returns `401` if token is missing, expired, or invalid

**`requireRole(...roles)`** — applied per-route:
- Checks `req.user.role` is in the allowed list
- Returns `403` if unauthorized
- Roles imported from `config.js`, no magic strings

**`scopeToCompany`** — applied to all company-data routes:
- If `req.user.role === SUPER_ADMIN`, skip (can access all data)
- Otherwise, sets `req.companyId = req.user.companyId`
- All downstream queries use `req.companyId` to filter documents

### 5.3 Route Protection Matrix

| Route group | Middleware chain |
|---|---|
| `POST /api/auth/login` | none |
| `GET /api/auth/me` | authenticate |
| `* /api/auth/users` | authenticate → requireRole(company_admin, super_admin) |
| `* /api/invoices` | authenticate → scopeToCompany |
| `POST /api/invoices` | authenticate → requireRole(company_user, company_admin) → scopeToCompany |
| `* /api/companies` | authenticate → requireRole(super_admin) |
| `* /api/super-admin` | authenticate → requireRole(super_admin) |

---

## 6. API Routes

### 6.1 Auth (`/api/auth`)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/login` | public | Login, returns JWT + user + company |
| GET | `/me` | any | Get current user profile |
| POST | `/users` | company_admin, super_admin | Create user within own company |
| GET | `/users` | company_admin, super_admin | List users (scoped to company) |
| GET | `/users/:id` | company_admin, super_admin | Get single user |
| PUT | `/users/:id` | company_admin, super_admin | Update user |
| DELETE | `/users/:id` | company_admin, super_admin | Delete user |

### 6.2 Invoices (`/api/invoices`)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/` | company_user, company_admin | Create invoice (auto-stamps companyId + createdBy) |
| GET | `/` | any authenticated | List invoices (scoped to company) |
| GET | `/:id` | any authenticated | Get single invoice (scoped) |
| PUT | `/:id` | company_admin, super_admin | Update invoice |
| DELETE | `/:id` | company_admin, super_admin | Delete invoice |

### 6.3 Companies (`/api/companies`) — super admin only

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create company + first admin user |
| GET | `/` | List all companies |
| GET | `/:id` | Get single company |
| PUT | `/:id` | Update company details |
| DELETE | `/:id` | Delete company + all its users and invoices |
| PATCH | `/:id/toggle-active` | Activate / deactivate company |

### 6.4 Super Admin Stats (`/api/super-admin`)

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | Total companies, users, invoices counts |
| GET | `/companies/:id/invoices` | All invoices for a specific company |
| GET | `/companies/:id/users` | All users for a specific company |

---

## 7. Frontend Changes

### 7.1 AuthContext

Stores `{ user, token, company }`. On login:
- JWT token stored in `localStorage`
- `company` object (branding) stored in context and `localStorage`
- On `401` response from Axios interceptor: clear storage, redirect to `/`

### 7.2 Dynamic Company Branding

`InvoicePreview`, `Header`, and PDF generation consume company branding from `AuthContext` instead of the static `client/src/config.js`. Super admin sees platform branding from `client/src/config.js`.

### 7.3 Routes

| Path | Role | Description |
|---|---|---|
| `/` | public | Login |
| `/dashboard` | super_admin | Stats overview |
| `/companies` | super_admin | Manage all companies |
| `/companies/:id` | super_admin | Company detail (users + invoices tabs) |
| `/new-quote` | company_user, company_admin | Create invoice |
| `/history` | company_user, company_admin | Invoice history |
| `/compare` | company_user, company_admin | Compare invoices |
| `/profile` | any authenticated | Profile |

### 7.4 Super Admin Dashboard Pages

**`/dashboard`** — stat cards: total companies, active companies, total users, total invoices.

**`/companies`** — table with: company name, active/inactive badge, user count, invoice count, toggle-active button, edit button, delete button. "Add Company" opens a form to create company + first admin user in one step.

**`/companies/:id`** — company detail view with two tabs:
- **Users tab**: list of users with role badge, add/edit/delete controls
- **Invoices tab**: read-only list of all company invoices

---

## 8. What Does Not Change

- All existing invoice field structure (rooms, extras, pricing, discount, etc.)
- PDF generation logic
- Compare invoices feature
- Dark/light theme toggle
- The existing admin/user role distinction within a company — `company_admin` maps to the old `isAdmin: true`, `company_user` maps to `isAdmin: false`

---

## 9. Environment Variables Required

```
MONGO_URI=...
JWT_SECRET=...
PORT=5000
```

---

## 10. Out of Scope (Phase 1)

- Payment gateway integration
- Email notifications
- Invoice PDF email delivery
- Company logo upload UI (logo filename is set manually by super admin)

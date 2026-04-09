# Security Middleware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five security middleware packages to harden the Express API against common web attacks.

**Architecture:** All middleware is registered globally in `server.js` before route mounting. Rate-limit config values live in `config.js` per the project convention. XSS sanitization is wrapped in a thin custom middleware so there is no scattered utility call throughout controllers.

**Tech Stack:** express-mongo-sanitize, helmet, express-rate-limit, hpp, xss (all ESM-compatible)

---

## File Map

| File | Change |
|---|---|
| `server/package.json` | Add 5 new dependencies |
| `server/config.js` | Add `security.rateLimit` block |
| `server/server.js` | Import and register all 5 middleware |

---

### Task 1: Install packages

**Files:**
- Modify: `server/package.json` (via npm install)

- [ ] **Step 1: Install all five packages**

```bash
cd server && npm install express-mongo-sanitize helmet express-rate-limit hpp xss
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Verify they appear in package.json dependencies**

```bash
grep -E "mongo-sanitize|helmet|rate-limit|hpp|xss" package.json
```

Expected: 5 lines, one per package.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install security middleware packages"
```

---

### Task 2: Add rate-limit config to config.js

**Files:**
- Modify: `server/config.js`

- [ ] **Step 1: Add `security` block to config**

In `server/config.js`, add the following block after the `invoice` block (before the closing `};`):

```js
  security: {
    rateLimit: {
      windowMinutes: 15,      // * 60 * 1000 in server.js
      maxRequests: 100,       // requests per window per IP
      authMaxRequests: 20,    // stricter limit for /api/auth routes
    },
  },
```

- [ ] **Step 2: Commit**

```bash
git add server/config.js
git commit -m "chore: add security rate-limit config values"
```

---

### Task 3: Wire all middleware into server.js

**Files:**
- Modify: `server/server.js`

- [ ] **Step 1: Add imports at the top of server.js**

After the existing imports (before `const app = express();`), add:

```js
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import xss from "xss";
```

- [ ] **Step 2: Register global security middleware**

Replace the current middleware block:

```js
app.use(cors());
app.use(express.json({ limit: `${config.server.bodyLimitMb}mb` }));
app.use("/public", express.static("public"));
```

With:

```js
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: `${config.server.bodyLimitMb}mb` }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(mongoSanitize());
app.use((req, _res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      if (typeof obj === "string") return xss(obj);
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (obj && typeof obj === "object") {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, sanitize(v)])
        );
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
});
app.use("/public", express.static("public"));
```

- [ ] **Step 3: Add route-level rate limiters before route mounting**

After the middleware block and before the route registrations, add:

```js
const globalLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMinutes * 60 * 1000,
  max: config.security.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMinutes * 60 * 1000,
  max: config.security.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);
```

- [ ] **Step 4: Verify server.js final shape**

The middleware + limiter section of server.js should look exactly like this (between `const app = express();` and `await connectDB();`):

```js
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: `${config.server.bodyLimitMb}mb` }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(mongoSanitize());
app.use((req, _res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      if (typeof obj === "string") return xss(obj);
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (obj && typeof obj === "object") {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, sanitize(v)])
        );
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
});
app.use("/public", express.static("public"));

const globalLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMinutes * 60 * 1000,
  max: config.security.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMinutes * 60 * 1000,
  max: config.security.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);
```

- [ ] **Step 5: Start the server and verify it boots without errors**

```bash
npm run dev
```

Expected: `Server running on port 5000` with no import or middleware errors.

- [ ] **Step 6: Smoke-test the health endpoint**

```bash
curl http://localhost:5000/
```

Expected: `{"success":true,"data":null,"message":"Interiors SaaS API"}`

Also check response headers include `X-Content-Type-Options`, `X-Frame-Options` (added by helmet).

- [ ] **Step 7: Commit**

```bash
git add server/server.js
git commit -m "feat: add helmet, mongo-sanitize, rate-limit, hpp, xss middleware"
```

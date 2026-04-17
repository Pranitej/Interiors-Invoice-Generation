// server/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./database/db.js";
import seeding from "./database/seeding.js";
import invoiceRouter from "./routes/invoice.routes.js";
import authRouter from "./routes/auth.routes.js";
import pdfRouter from "./routes/pdf.routes.js";
import companyRouter from "./routes/company.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { startScheduler } from "./crons/scheduler.js";
import { sendSuccess } from "./utils/response.js";
import config from "./config.js";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import xss from "xss";
import AppError from "./utils/AppError.js";

const app = express();

app.set("trust proxy", config.server.trustProxy);
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
}));
app.use(cookieParser());
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: `${config.server.bodyLimitMb}mb` }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use((req, _res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  // Express 5 defines req.query as a getter-only property, so direct assignment throws.
  // Shadow it with a sanitized value via Object.defineProperty instead.
  const sanitizedQuery = mongoSanitize.sanitize(req.query);
  Object.defineProperty(req, "query", {
    value: sanitizedQuery,
    writable: true,
    configurable: true,
  });
  next();
});
app.use((req, _res, next) => {
  // Skip XSS sanitization for the PDF render endpoint — its body is
  // server-generated HTML that requires inline styles to render correctly.
  if (req.path === "/api/pdf/render" && req.method === "POST") return next();

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

await connectDB();
await seeding();
startScheduler();

app.use("/api/invoices", invoiceRouter);
app.use("/api/auth", authRouter);
app.use("/api/pdf", pdfRouter);
app.use("/api/companies", companyRouter);
app.use("/api/super-admin", superAdminRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/subscription", subscriptionRouter);

app.get("/", (_, res) => sendSuccess(res, null, 200, `${config.platform.name} API`));

app.use((_req, _res, next) => {
  next(new AppError(404, "Route not found"));
});

app.use(errorHandler);

app.listen(config.server.port, () =>
  console.log(`Server running on port ${config.server.port}`)
);

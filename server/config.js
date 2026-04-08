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

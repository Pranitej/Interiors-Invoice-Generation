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

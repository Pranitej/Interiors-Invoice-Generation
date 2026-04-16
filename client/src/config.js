// client/src/config.js
// Single source of truth for platform constants and permission flags.
// Keep permissions in sync with server/config.js.

const config = {
  platform: {
    name: "Interiors SaaS",
    tagline: "Powering Interior Design Businesses",
  },

  roles: {
    SUPER_ADMIN: "super_admin",
    COMPANY_ADMIN: "company_admin",
    COMPANY_USER: "company_user",
  },

  permissions: {
    companyUser: {
      canEditOwnInvoices: true, // company_user can edit invoices they created
    },
  },

  company: {
    maxTerms: 5,  // keep in sync with server/config.js company.maxTerms
  },
};

export default config;

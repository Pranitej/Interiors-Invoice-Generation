// client/src/config.js
// ─────────────────────────────────────────────────────────────────
// Edit this file to rebrand the app for a different company.
// Place the company logo at server/public/<logoFile>.
// ─────────────────────────────────────────────────────────────────

const companyConfig = {
  name: "NOVA INTERIORS",
  tagline: "Crafting Spaces, Creating Memories",
  registeredOffice:
    "Plot No. 42, Jubilee Hills, Road No. 36, Hyderabad - 500033",
  industryAddress:
    "Survey No. 201, Industrial Estate, Balanagar, Hyderabad, Telangana - 500037",
  phones: ["9876543210", "9123456789", "8012345678"],
  email: "hello@novainteriors.in",
  website: "www.novainteriors.in", // leave empty to hide
  logoFile: "logo.png", // filename served from server/public/
};

export default companyConfig;

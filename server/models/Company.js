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
    termsAndConditions: { type: [String], default: [] },
    isActive: { type: Boolean, default: false },
    downloadsBlocked: { type: Boolean, default: false },
    invoicesBlocked: { type: Boolean, default: false },
    loginBlocked: { type: Boolean, default: false },
    // Subscription fields
    subscriptionExpiryDate: { type: Date, default: null },
    subscriptionAmount: { type: Number, default: null },
    inactiveRemarks: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Company", CompanySchema);

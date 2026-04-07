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

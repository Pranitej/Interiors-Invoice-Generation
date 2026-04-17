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
    loginBlocked: { type: Boolean, default: false },
    // Subscription fields
    subscriptionExpiryDate: { type: Date, default: null },
    subscriptionAmount: { type: Number, default: null },
    inactiveRemarks: { type: String, default: "" },
  },
  { timestamps: true }
);

CompanySchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  const companyId = doc._id;
  const [User, Invoice, SubscriptionTransaction] = await Promise.all([
    import("./User.js").then(m => m.default),
    import("./Invoice.js").then(m => m.default),
    import("./SubscriptionTransaction.js").then(m => m.default),
  ]);
  await Promise.all([
    User.deleteMany({ companyId }),
    Invoice.deleteMany({ companyId }),
    SubscriptionTransaction.deleteMany({ companyId }),
  ]);
});

export default mongoose.model("Company", CompanySchema);

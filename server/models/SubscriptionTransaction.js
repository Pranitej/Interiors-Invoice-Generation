// server/models/SubscriptionTransaction.js
import mongoose from "mongoose";

const SubscriptionTransactionSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    type: {
      type: String,
      enum: ["activated", "deactivated", "auto_expired", "amount_changed", "downloads_toggled"],
      required: true,
    },
    amount: { type: Number, default: null },
    expiryDate: { type: Date, default: null },
    modeOfPayment: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Cheque"],
      default: null,
    },
    remarks: { type: String, default: "" },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

SubscriptionTransactionSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model("SubscriptionTransaction", SubscriptionTransactionSchema);

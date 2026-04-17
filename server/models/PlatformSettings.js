// server/models/PlatformSettings.js
// Singleton document — only one record ever exists (key: "global").
import mongoose from "mongoose";

const PlatformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    subscriptionAmount: { type: Number, default: 0 },
    upiQrFile: { type: String, default: "" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("PlatformSettings", PlatformSettingsSchema);

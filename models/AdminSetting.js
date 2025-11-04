import mongoose from "mongoose";

const adminSettingSchema = new mongoose.Schema(
  {
    commissionPercent: { type: Number, default: 10 }, // platform share %
    adRevenueShare: { type: Number, default: 90 }, // creator share %
    minPayoutLimit: { type: Number, default: 100 }, // minimum withdrawal amount
    maxPayoutLimit: { type: Number, default: 10000 }, // optional limit
    bonusPerReferral: { type: Number, default: 50 }, // referral reward
    currency: { type: String, default: "INR" }, // currency type
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who changed it
  },
  { timestamps: true }
);

export default mongoose.model("AdminSetting", adminSettingSchema);

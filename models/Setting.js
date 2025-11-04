import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    commissionRate: { type: Number, default: 10 }, // %
    minPayout: { type: Number, default: 100 }, // ₹
    maxPayout: { type: Number, default: 10000 }, // ₹
    adRevenueShare: { type: Number, default: 60 }, // %
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);

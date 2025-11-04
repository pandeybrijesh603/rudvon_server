import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    // 👤 Creator requesting payout
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 💸 Amount to withdraw
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    // 🗓️ For monthly summary (optional)
    month: {
      type: String,
      default: () => {
        const date = new Date();
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
      },
    },

    // 💳 Payment method
    method: {
      type: String,
      enum: ["upi", "bank", "paypal"],
      required: true,
    },

    // 🧾 Payment details
    accountDetails: {
      upiId: String,
      bankAccount: String,
      ifscCode: String,
      accountHolder: String,
      paypalEmail: String,
    },

    // ⚙️ Status control
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid", "failed"],
      default: "pending",
    },

    // 📅 Timestamps for actions
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: Date,

    // 📝 Admin notes or remarks
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payout", payoutSchema);

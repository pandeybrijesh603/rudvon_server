import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // 🧑‍💻 Linked user (required for all)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 🎬 Optional: if transaction is related to a video
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },

    // 💵 Transaction type
    type: {
      type: String,
      enum: ["credit", "debit"], // credit = earning, debit = deduction
      required: true,
    },

    // 💰 Amount
    amount: { type: Number, required: true },

    // 🏷️ Source: ad revenue, payout, bonus, etc.
    source: {
      type: String,
      enum: ["ad", "payout", "bonus", "creator", "original", "platform"],
      default: "ad",
    },

    // 🧾 Description for clarity
    description: { type: String },

    // 📊 Role in split-revenue model (optional)
    role: {
      type: String,
      enum: ["creator", "original", "platform", "user"],
      default: "user",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);

// middleware/transactionMiddleware.js
import Transaction from "../models/Transaction.js";

/**
 * 🪙 recordTransaction()
 * Create an automatic transaction entry when an event (ad revenue, payout, etc.) happens
 */
export const recordTransaction = async ({
  userId,
  videoId = null,
  amount,
  type = "credit", // "credit" = earning, "debit" = deduction
  source = "ad",
  description = "",
  role = "user",
}) => {
  try {
    const txn = await Transaction.create({
      user: userId,
      video: videoId,
      amount,
      type,
      source,
      description,
      role,
    });

    console.log("✅ Transaction recorded:", txn._id);
    return txn;
  } catch (err) {
    console.error("❌ Transaction creation failed:", err.message);
  }
};

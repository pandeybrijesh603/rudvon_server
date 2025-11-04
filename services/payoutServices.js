import nodeCron from "node-cron";
import Payout from "../models/Payout.js";
import User from "../models/User.js";

export const processMonthlyPayouts = async () => {
  const now = new Date();
  const month = `${now.getFullYear()}-${now.getMonth() + 1}`;

  const verifiedUsers = await User.find({ kycStatus: "verified" });
  for (const user of verifiedUsers) {
    const total = Math.floor(Math.random() * 1000); // mock calculation
    await Payout.create({ user: user._id, amount: total, month });
  }
  console.log(`💸 Payouts processed for ${month}`);
};

// Run daily, but payouts processed 1–15 only
nodeCron.schedule("0 2 * * *", async () => {
  const day = new Date().getDate();
  if (day >= 1 && day <= 15) await processMonthlyPayouts();
});

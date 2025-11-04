// utils/dashboardEnhancer.js
import Transaction from "../models/Transaction.js";
import { getAdminSettings } from "./adminSettingsCache.js";

/**
 * 🧮 Calculate total revenue & payout stats
 * Reads AdminSetting values directly from in-memory cache
 */
export const getRevenueStats = async () => {
  // ⚙️ Load current admin settings from cache (fast, no DB hit)
  const settings = await getAdminSettings();

  // 💰 Fetch credit (income) & debit (payout/expenses) totals
  const [credits, debits] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: "credit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "debit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalCredits = credits[0]?.total || 0;
  const totalDebits = debits[0]?.total || 0;
  const netRevenue = totalCredits - totalDebits;

  // 🧩 Include relevant admin configuration
  return {
    totalCredits,
    totalDebits,
    netRevenue,
    commissionPercent: settings?.commissionPercent ?? 0,
    adRevenueShare: settings?.adRevenueShare ?? 0,
    currency: settings?.currency || "INR",
  };
};

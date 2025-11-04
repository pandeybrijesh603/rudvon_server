// routes/adminDashboardRoutes.js
import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Report from "../models/Report.js";
import Payout from "../models/Payout.js";
import Transaction from "../models/Transaction.js";
import { getRevenueStats } from "../utils/dashboardEnhancer.js";
import { getAdminSettings } from "../utils/adminSettingsCache.js"; // ✅ Added cache-based settings

const router = express.Router();

/**
 * 📊 Helper: Calculate Growth %
 */
const calculateGrowth = (current, previous) => {
  if (previous === 0) return "0.00%";
  const change = ((current - previous) / previous) * 100;
  return `${change.toFixed(2)}%`;
};

/**
 * 🧠 RudVon Admin Dashboard Stats API (Enhanced + Growth + Live Settings)
 * GET /api/admin/dashboard
 * Admin only
 */
router.get("/dashboard", isAdmin, async (req, res) => {
  try {
    // 🗓️ Today’s range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 🧮 Total counts
    const [totalUsers, totalVideos, totalReports, pendingReports, totalPayouts] =
      await Promise.all([
        User.countDocuments(),
        Video.countDocuments({ status: { $ne: "deleted" } }),
        Report.countDocuments(),
        Report.countDocuments({ status: "pending" }),
        Payout.countDocuments(),
      ]);

    // 💸 Total paid & total video revenue
    const [totalPaid, totalVideoRevenue] = await Promise.all([
      Payout.aggregate([
        { $match: { status: { $in: ["paid", "completed"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Video.aggregate([
        { $group: { _id: null, total: { $sum: "$totalRevenue" } } },
      ]),
    ]);

    // 🧾 Include transaction-based revenue stats
    const revenueStats = await getRevenueStats();

    // ⚙️ Get current admin settings from memory cache
    const settings = await getAdminSettings();

    // 📆 Today's stats
    const [newUsersToday, newVideosToday, newReportsToday, newPayoutsToday] =
      await Promise.all([
        User.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
        Video.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
        Report.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
        Payout.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      ]);

    // 📈 Monthly growth comparison
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const prevMonthEnd = new Date(startOfMonth - 1);

    const [
      usersThisMonth,
      usersLastMonth,
      videosThisMonth,
      videosLastMonth,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
      Video.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Video.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
      Transaction.aggregate([
        { $match: { type: "credit", createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            type: "credit",
            createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const growthSummary = {
      userGrowth: calculateGrowth(usersThisMonth, usersLastMonth),
      videoGrowth: calculateGrowth(videosThisMonth, videosLastMonth),
      revenueGrowth: calculateGrowth(
        revenueThisMonth[0]?.total || 0,
        revenueLastMonth[0]?.total || 0
      ),
    };

    // ✅ Final Response (with cached settings)
    res.json({
      success: true,
      message: "✅ RudVon Admin Dashboard stats fetched successfully!",
      summary: {
        totalUsers,
        totalVideos,
        totalReports,
        pendingReports,
        totalPayouts,
        totalPaidAmount: totalPaid[0]?.total || 0,
        totalVideoRevenue: totalVideoRevenue[0]?.total || 0,
        totalTransactionCredits: revenueStats.totalCredits,
        totalTransactionDebits: revenueStats.totalDebits,
        netRevenue: revenueStats.netRevenue,
        commissionPercent: settings?.commissionPercent ?? 0,
        adRevenueShare: settings?.adRevenueShare ?? 0,
        currency: settings?.currency || "INR",
      },
      today: {
        newUsersToday,
        newVideosToday,
        newReportsToday,
        newPayoutsToday,
      },
      growth: growthSummary,
    });
  } catch (error) {
    console.error("❌ Dashboard Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
});

export default router;

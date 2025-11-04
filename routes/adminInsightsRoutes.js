import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Payout from "../models/Payout.js";

const router = express.Router();

/**
 * 📈 RudVon Admin Insights — Monthly Analytics + Growth Comparison + Filters
 * GET /api/admin/insights?month=2025-10&userId=abc123&category=Music&compare=true
 * Admin only
 */
router.get("/insights", isAdmin, async (req, res) => {
  try {
    const { month, userId, category, compare } = req.query;

    // 🗓️ Calculate month range (start → end)
    const selectedMonth = month ? new Date(`${month}-01`) : new Date();
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    // 📆 Last month (for growth comparison)
    const prevMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    const prevMonthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 0);

    // 🧩 Build filters
    const videoFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    if (userId) videoFilter.uploader = userId;
    if (category) videoFilter.category = category;

    const payoutFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    if (userId) payoutFilter.user = userId;

    // 🧮 Current month stats
    const [usersThisMonth, videosThisMonth, payoutsThisMonth, revenueThisMonth] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Video.countDocuments(videoFilter),
      Payout.countDocuments(payoutFilter),
      Video.aggregate([
        { $match: videoFilter },
        { $group: { _id: null, total: { $sum: "$totalRevenue" } } },
      ]),
    ]);

    // 🔁 Previous month (if compare=true)
    let growth = {};
    if (compare === "true") {
      const [prevUsers, prevVideos, prevRevenue] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
        Video.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
        Video.aggregate([
          { $match: { createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
          { $group: { _id: null, total: { $sum: "$totalRevenue" } } },
        ]),
      ]);

      // 📊 Calculate % growth safely
      const calcGrowth = (curr, prev) =>
        prev === 0 ? 100 : (((curr - prev) / prev) * 100).toFixed(2);

      growth = {
        users: calcGrowth(usersThisMonth, prevUsers),
        videos: calcGrowth(videosThisMonth, prevVideos),
        revenue: calcGrowth(revenueThisMonth[0]?.total || 0, prevRevenue[0]?.total || 0),
      };
    }

    // 📤 Response
    res.json({
      success: true,
      filters: { month: month || "current", userId, category, compare },
      summary: {
        usersThisMonth,
        videosThisMonth,
        payoutsThisMonth,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        growth,
      },
      message: "✅ RudVon Admin Insights fetched successfully!",
    });
  } catch (error) {
    console.error("❌ Insights Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load admin insights",
    });
  }
});

export default router;

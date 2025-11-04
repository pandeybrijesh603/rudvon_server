import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Payout from "../models/Payout.js";

const router = express.Router();

/**
 * 📆 RudVon Monthly Analytics + Growth Comparison API
 * GET /api/admin/analytics/monthly
 * Admin only
 */
router.get("/analytics/monthly", isAdmin, async (req, res) => {
  try {
    const currentDate = new Date();

    // 📆 Get start of current & last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const label = date.toLocaleString("default", { month: "short", year: "numeric" });
      months.push({ date, label });
    }

    // Helper: monthly counts for any model
    const getMonthlyCounts = async (Model) => {
      const data = await Model.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().setMonth(currentDate.getMonth() - 5)
              ),
              $lte: currentDate,
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Convert result to map: "month-year" => count
      const map = {};
      data.forEach((d) => (map[`${d._id.month}-${d._id.year}`] = d.count));

      // Align counts to months array
      return months.map((m) => {
        const key = `${m.date.getMonth() + 1}-${m.date.getFullYear()}`;
        return map[key] || 0;
      });
    };

    // 📊 Collect all metrics in parallel
    const [userCounts, videoCounts, payoutCounts] = await Promise.all([
      getMonthlyCounts(User),
      getMonthlyCounts(Video),
      getMonthlyCounts(Payout),
    ]);

    // 📈 Helper: Calculate % change from previous month
    const calcGrowth = (arr) => {
      const current = arr[arr.length - 1];
      const previous = arr[arr.length - 2] || 0;
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(2);
    };

    const userGrowth = calcGrowth(userCounts);
    const videoGrowth = calcGrowth(videoCounts);
    const payoutGrowth = calcGrowth(payoutCounts);

    // 💰 Total payout trend by month
    const revenueData = await Payout.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(currentDate.getMonth() - 5)),
            $lte: currentDate,
          },
          status: { $in: ["completed", "paid"] },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const revenueMap = {};
    revenueData.forEach(
      (r) => (revenueMap[`${r._id.month}-${r._id.year}`] = r.totalAmount)
    );
    const revenueTrend = months.map((m) => {
      const key = `${m.date.getMonth() + 1}-${m.date.getFullYear()}`;
      return revenueMap[key] || 0;
    });

    const revenueGrowth = calcGrowth(revenueTrend);

    // ✅ Final JSON response
    res.json({
      success: true,
      message: "✅ RudVon Monthly Analytics + Growth Comparison fetched successfully!",
      labels: months.map((m) => m.label),
      trends: {
        newUsers: userCounts,
        newVideos: videoCounts,
        newPayouts: payoutCounts,
        totalRevenue: revenueTrend,
      },
      growthComparison: {
        userGrowth: `${userGrowth}%`,
        videoGrowth: `${videoGrowth}%`,
        payoutGrowth: `${payoutGrowth}%`,
        revenueGrowth: `${revenueGrowth}%`,
      },
    });
  } catch (error) {
    console.error("❌ Monthly Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load monthly analytics data",
    });
  }
});

export default router;

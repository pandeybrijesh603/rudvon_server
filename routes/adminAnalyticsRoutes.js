import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Report from "../models/Report.js";
import Payout from "../models/Payout.js";

const router = express.Router();

/**
 * 📊 RudVon Admin Analytics (7-Day Trends)
 * GET /api/admin/analytics
 * Admin only
 */
router.get("/analytics", isAdmin, async (req, res) => {
  try {
    // 📆 Generate last 7 dates (oldest → newest)
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    // Helper: aggregate daily counts for any model
    const getDailyCounts = async (Model) => {
      const raw = await Model.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              $lte: today,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Convert to map for date lookup
      const map = {};
      raw.forEach((r) => (map[r._id] = r.count));

      // Return array aligned with last7Days
      return last7Days.map((d) => map[d] || 0);
    };

    // 🔹 Get all counts in parallel
    const [userCounts, videoCounts, payoutCounts, reportCounts] = await Promise.all([
      getDailyCounts(User),
      getDailyCounts(Video),
      getDailyCounts(Payout),
      getDailyCounts(Report),
    ]);

    // 💰 Revenue per day (optional)
    const revData = await Video.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            $lte: today,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalRevenue" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revMap = {};
    revData.forEach((r) => (revMap[r._id] = r.totalRevenue));
    const totalRevenueTrend = last7Days.map((d) => revMap[d] || 0);

    // 📊 Format for chart & structured table
    const formatForTable = (labelArr, users, videos, payouts, reports) =>
      labelArr.map((d, i) => ({
        date: d,
        newUsers: users[i],
        newVideos: videos[i],
        newPayouts: payouts[i],
        newReports: reports[i],
        revenue: totalRevenueTrend[i],
      }));

    // ✅ Final Response
    res.json({
      success: true,
      message: "✅ RudVon Admin Analytics (7-day trends) fetched successfully!",
      labels: last7Days,
      trends: {
        newUsers: userCounts,
        newVideos: videoCounts,
        newPayouts: payoutCounts,
        newReports: reportCounts,
        totalRevenueTrend,
      },
      tableView: formatForTable(
        last7Days,
        userCounts,
        videoCounts,
        payoutCounts,
        reportCounts
      ),
    });
  } catch (error) {
    console.error("❌ Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load analytics data",
    });
  }
});

export default router;

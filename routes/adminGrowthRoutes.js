import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

/**
 * 📈 Monthly Growth Comparison API
 * GET /api/admin/growth
 * Admin only
 * Returns month-by-month data + % change
 */
router.get("/growth", isAdmin, async (req, res) => {
  try {
    // Helper function for monthly aggregation
    const getMonthlyData = async (Model, extraGroup = null) => {
      const groupStage = {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
      };
      if (extraGroup) Object.assign(groupStage, extraGroup);

      return Model.aggregate([
        { $group: groupStage },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);
    };

    // 1️⃣ Aggregate Users
    const userData = await getMonthlyData(User);

    // 2️⃣ Aggregate Videos
    const videoData = await getMonthlyData(Video);

    // 3️⃣ Aggregate Transactions (Credits Only = Revenue)
    const revenueData = await Transaction.aggregate([
      {
        $match: { type: "credit" },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalRevenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Helper → Calculate percentage change
    const calcGrowth = (data, field = "count") => {
      return data.map((item, index) => {
        const prev = index > 0 ? data[index - 1][field] : 0;
        const curr = item[field];
        const change =
          prev > 0 ? (((curr - prev) / prev) * 100).toFixed(2) : "0.00";
        return {
          month: `${item._id.month}-${item._id.year}`,
          value: curr,
          change: `${change}%`,
        };
      });
    };

    const usersGrowth = calcGrowth(userData);
    const videosGrowth = calcGrowth(videoData);
    const revenueGrowth = calcGrowth(revenueData, "totalRevenue");

    res.json({
      success: true,
      message: "📈 Monthly growth comparison fetched successfully!",
      growth: {
        users: usersGrowth,
        videos: videosGrowth,
        revenue: revenueGrowth,
      },
    });
  } catch (error) {
    console.error("❌ Growth API Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load growth comparison data",
    });
  }
});

export default router;

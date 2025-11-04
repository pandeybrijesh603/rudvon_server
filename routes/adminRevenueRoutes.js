import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import Video from "../models/Video.js";
import Payout from "../models/Payout.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * 💰 Admin Revenue Analytics
 * GET /api/admin/revenue
 * Protected (Admin only)
 */
router.get("/revenue", isAdmin, async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    // 📈 1️⃣ Daily Revenue Trend (last 7 days)
    const dailyRevenue = await Video.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo, $lte: today },
          status: { $in: ["ready", "suppressed", "frozen"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalRevenue" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 📊 2️⃣ Top 5 Creators by totalRevenue
    const topCreators = await Video.aggregate([
      { $group: { _id: "$uploader", totalRevenue: { $sum: "$totalRevenue" } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          mobile: "$user.mobile",
          totalRevenue: 1,
        },
      },
    ]);

    // 🗓️ 3️⃣ Monthly Payout Summary
    const monthlyPayoutSummary = await Payout.aggregate([
      {
        $group: {
          _id: "$month",
          totalPaid: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
          },
          totalRequests: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 6 },
    ]);

    // 💰 4️⃣ Total Revenue (All Time)
    const totalRevenueAllTimeData = await Video.aggregate([
      { $group: { _id: null, total: { $sum: "$totalRevenue" } } },
    ]);
    const totalRevenueAllTime = totalRevenueAllTimeData[0]?.total || 0;

    // 💸 5️⃣ Total Paid Out (Completed payouts)
    const totalPaidOutData = await Payout.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalPaidOut = totalPaidOutData[0]?.total || 0;

    // ✅ Format daily revenue to include missing days
    const formatData = (data) => {
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const found = data.find((d) => d._id === dateStr);
        result.push({ date: dateStr, total: found ? found.total : 0 });
      }
      return result;
    };

    res.json({
      success: true,
      totalRevenueAllTime,
      totalPaidOut,
      dailyRevenue: formatData(dailyRevenue),
      topCreators,
      monthlyPayoutSummary,
    });
  } catch (error) {
    console.error("❌ Revenue Analytics Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load revenue analytics" });
  }
});

export default router;

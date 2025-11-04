import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

/**
 * 💰 Create Transaction (Admin Only)
 * POST /api/transactions/add
 * Used internally when payout or ad revenue occurs
 */
router.post("/add", isAdmin, async (req, res) => {
  try {
    const { userId, type, amount, source, description } = req.body;

    if (!userId || !amount || !type) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const transaction = await Transaction.create({
      user: userId,
      type, // 'credit' | 'debit'
      amount,
      source, // e.g. 'ad', 'payout', 'bonus', etc.
      description,
    });

    res.json({ success: true, message: "Transaction added successfully", transaction });
  } catch (error) {
    console.error("❌ Add Transaction Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to add transaction" });
  }
});

/**
 * 📜 Get My Transactions (User)
 * GET /api/transactions/my
 * Query: ?type=credit|debit&source=ad&payout&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const { type, source, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (source) filter.source = source;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    const totalEarnings = transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      totalEarnings,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("❌ My Transactions Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

/**
 * 🧾 Get All Transactions (Admin)
 * GET /api/transactions/all
 * Optional Filters: type, source, startDate, endDate, page, limit
 */
router.get("/all", isAdmin, async (req, res) => {
  try {
    const { type, source, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (source) filter.source = source;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("user", "name email mobile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      transactions,
    });
  } catch (error) {
    console.error("❌ Admin Transactions Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load transactions" });
  }
});

export default router;

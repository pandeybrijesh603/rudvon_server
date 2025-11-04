import express from "express";
import Payout from "../models/Payout.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";
import sendNotification from "../utils/sendNotification.js"; // ✅ notification utility
import { recordTransaction } from "../middleware/transactionMiddleware.js"; // ✅ transaction logger

const router = express.Router();

/**
 * 💸 Request a payout
 * Protected route
 * POST /api/payout/request
 */
router.post("/request", verifyToken, async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payout amount" });
    }

    if (!method) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    // 🔍 Prevent duplicate pending requests
    const existing = await Payout.findOne({ user: req.user._id, status: "pending" });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending payout request",
      });
    }

    // 📝 Create new payout request
    const payout = await Payout.create({
      user: req.user._id,
      amount,
      method,
      accountDetails,
    });

    res.status(201).json({
      success: true,
      message: "Payout request submitted successfully",
      payout,
    });
  } catch (error) {
    console.error("❌ Payout Request Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * 📋 Get all payout requests (Admin only)
 * GET /api/payout/all
 */
router.get("/all", isAdmin, async (_, res) => {
  try {
    const payouts = await Payout.find()
      .populate("user", "name mobile email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payouts.length,
      payouts,
    });
  } catch (error) {
    console.error("❌ Fetch Payouts Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load payouts" });
  }
});

/**
 * 🧾 Get my payout history (for user)
 * GET /api/payout/my
 */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const myPayouts = await Payout.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: myPayouts.length,
      payouts: myPayouts,
    });
  } catch (error) {
    console.error("❌ My Payouts Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch payout history" });
  }
});

/**
 * ✅ Approve / Reject / Mark Paid
 * Admin-only route
 * PATCH /api/payout/update/:id
 */
router.patch("/update/:id", isAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    payout.status = status || payout.status;
    payout.notes = notes || payout.notes;
    payout.processedAt = new Date();

    await payout.save();

    // ✅ Create transaction entry when payout is completed/approved
    if (status === "approved" || status === "completed") {
      await recordTransaction({
        userId: payout.user,
        amount: payout.amount,
        type: "debit",
        source: "payout",
        description: `Payout of ₹${payout.amount} processed.`,
      });

      // ✅ Send notification
      await sendNotification({
        userId: payout.user,
        title: "Payout Approved",
        message: `Your payout of ₹${payout.amount} has been approved.`,
        type: "payout",
      });
    }

    res.json({
      success: true,
      message: `Payout ${status} successfully`,
      payout,
    });
  } catch (error) {
    console.error("❌ Payout Update Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;

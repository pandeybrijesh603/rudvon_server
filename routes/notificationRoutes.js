import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import Notification from "../models/Notification.js";

const router = express.Router();

/**
 * 🧾 Get all my notifications
 * GET /api/notifications
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    console.error("❌ Fetch Notifications Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
});

/**
 * ✅ Mark as read
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification)
      return res.status(404).json({ success: false, message: "Notification not found" });

    res.json({ success: true, message: "Marked as read", notification });
  } catch (error) {
    console.error("❌ Mark Read Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
});

export default router;

import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import logAdminAction from "../utils/logAdminAction.js";
import AdminLog from "../models/AdminLog.js";
import sendNotification from "../utils/sendNotification.js"; // ✅ added notification utility

const router = express.Router();

/**
 * 👥 Get All Users
 * GET /api/admin/users
 * Admin only
 */
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("name email mobile kycStatus status suspensionEnd createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("❌ Get Users Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load users" });
  }
});

/**
 * ⚙️ Update User Status
 * PATCH /api/admin/user/:id/status
 */
router.patch("/user/:id/status", isAdmin, async (req, res) => {
  try {
    const { status, suspensionDays } = req.body;
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (status === "suspended") {
      const end = new Date();
      end.setDate(end.getDate() + (suspensionDays || 7));
      user.suspensionEnd = end;
    }

    user.status = status || user.status;
    await user.save();

    // ✅ Log the admin action
    await logAdminAction({
      adminId: req.admin._id,
      actionType: "user_update",
      targetType: "User",
      targetId: user._id,
      details: `User ${status} by admin`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `User ${status} successfully`, user });
  } catch (error) {
    console.error("❌ Update User Status Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update user status" });
  }
});

/**
 * 🪪 Update KYC Status
 * PATCH /api/admin/user/:id/kyc
 */
router.patch("/user/:id/kyc", isAdmin, async (req, res) => {
  try {
    const { kycStatus } = req.body;
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.kycStatus = kycStatus;
    await user.save();

    // ✅ Log admin KYC action
    await logAdminAction({
      adminId: req.admin._id,
      actionType: "user_kyc",
      targetType: "User",
      targetId: user._id,
      details: `KYC ${kycStatus} by admin`,
      ipAddress: req.ip,
    });

    // ✅ Send notification to user about KYC update
    await sendNotification({
      userId: user._id,
      title: "KYC Status Updated",
      message: `Your KYC has been ${kycStatus} by admin.`,
      type: "kyc",
    });

    res.json({ success: true, message: `KYC ${kycStatus} successfully`, user });
  } catch (error) {
    console.error("❌ KYC Update Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update KYC" });
  }
});

/**
 * 🎬 Get All Videos (with uploader info)
 * GET /api/admin/videos
 */
router.get("/videos", isAdmin, async (req, res) => {
  try {
    const videos = await Video.find()
      .populate("uploader", "name mobile status")
      .select("title status totalRevenue createdAt");

    res.json({ success: true, count: videos.length, videos });
  } catch (error) {
    console.error("❌ Get Videos Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load videos" });
  }
});

/**
 * ❄️ Update Video Status
 * PATCH /api/admin/video/:id/status
 */
router.patch("/video/:id/status", isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["ready", "suppressed", "frozen", "deleted"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!video)
      return res.status(404).json({ success: false, message: "Video not found" });

    // ✅ Log admin video moderation action
    await logAdminAction({
      adminId: req.admin._id,
      actionType: "video_status",
      targetType: "Video",
      targetId: video._id,
      details: `Video marked as ${status} by admin`,
      ipAddress: req.ip,
    });

    // ✅ Send notification to uploader about video status
    await sendNotification({
      userId: video.uploader,
      title: "Video Status Changed",
      message: `Your video "${video.title}" has been marked as ${status}.`,
      type: "video",
    });

    res.json({ success: true, message: `Video ${status} successfully`, video });
  } catch (error) {
    console.error("❌ Video Status Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update video status" });
  }
});

/**
 * 🧾 View all Admin Logs
 * GET /api/admin/logs
 */
router.get("/logs", isAdmin, async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate("admin", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error("❌ Fetch Logs Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load admin logs" });
  }
});

export default router;

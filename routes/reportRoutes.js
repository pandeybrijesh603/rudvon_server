import express from "express";
import Report from "../models/Report.js";
import Video from "../models/Video.js";
import verifyToken from "../middleware/verifyToken.js"; // ✅ replaced old protect

const router = express.Router();

/**
 * 🧾 Submit a new report
 * Protected route
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { videoId, reportedUserId, reason, type, description } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: "Report type is required" });
    }

    // 🔍 Prevent duplicate reports by same user on same video
    const existing = await Report.findOne({
      reporter: req.user._id,
      video: videoId,
      type,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this video for this issue",
      });
    }

    // 📝 Create new report
    const report = await Report.create({
      reporter: req.user._id,
      video: videoId,
      reportedUser: reportedUserId,
      reason,
      type,
      description,
    });

    // ⚙️ Auto moderation logic
    if (["adult", "illegal"].includes(type)) {
      await Video.findByIdAndUpdate(videoId, { status: "frozen" });
    } else if (type === "duplicate") {
      await Video.findByIdAndUpdate(videoId, { status: "suppressed" });
    }

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report,
    });
  } catch (error) {
    console.error("❌ Report Creation Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * 📋 Get all reports (for admin panel or moderation dashboard)
 */
router.get("/", async (_, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name mobile")
      .populate("video", "title status videoUrl")
      .populate("reportedUser", "name mobile")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("❌ Fetch Reports Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch reports" });
  }
});

export default router;

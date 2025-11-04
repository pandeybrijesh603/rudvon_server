import express from "express";
import Video from "../models/Video.js";
import verifyToken from "../middleware/verifyToken.js"; // ✅ updated name
import Category from "../models/Category.js";

const router = express.Router();

/**
 * ✅ Upload a new video
 * Protected route — user must be logged in (token required)
 */
router.post("/upload", verifyToken, async (req, res) => {
  try {
    const { title, description, tags, categoryIds, isShort, isAI, videoUrl, thumbnailUrl } = req.body;

    // 🔍 Validation
    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, message: "Title and video URL are required" });
    }

    // 🧩 Validate category IDs (optional)
    let validCategories = [];
    if (categoryIds?.length) {
      validCategories = await Category.find({ _id: { $in: categoryIds } });
      if (validCategories.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid category IDs" });
      }
    }

    // 🎥 Create video entry
    const video = await Video.create({
      uploader: req.user._id,
      title,
      description,
      tags,
      categories: validCategories.map(c => c._id),
      isShort: Boolean(isShort),
      isAI: Boolean(isAI),
      videoUrl,
      thumbnailUrl
    });

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video
    });
  } catch (error) {
    console.error("❌ Video Upload Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * ✅ Get video feed (public)
 */
router.get("/feed", async (_, res) => {
  try {
    const videos = await Video.find()
      .populate("uploader", "mobile name")
      .populate("categories", "name slug")
      .sort({ createdAt: -1 }); // latest first

    res.json({
      success: true,
      count: videos.length,
      videos
    });
  } catch (error) {
    console.error("❌ Feed Fetch Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load feed" });
  }
});

export default router;

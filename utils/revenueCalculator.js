// utils/revenueCalculator.js
import Video from "../models/Video.js";
import { recordTransaction } from "../middleware/transactionMiddleware.js";

/**
 * ⚙️ autoCalculateRevenue(videoId, metrics)
 * Automatically calculate ad revenue & create transaction
 */
export const autoCalculateRevenue = async (videoId, metrics) => {
  try {
    const { views = 0, watchTime = 0, adClicks = 0 } = metrics;

    // Simple revenue model (you can tweak this later)
    const revenue =
      views * 0.02 + // ₹0.02 per view
      adClicks * 0.5 + // ₹0.5 per ad click
      watchTime * 0.001; // ₹0.001 per watch minute

    const video = await Video.findById(videoId).populate("uploader");
    if (!video) return console.warn("⚠️ Video not found for revenue calc");

    // 💸 Update total revenue in video model
    video.totalRevenue += revenue;
    await video.save();

    // 🧾 Create transaction entry
    await recordTransaction({
      userId: video.uploader._id,
      videoId: video._id,
      amount: revenue,
      type: "credit",
      source: "ad",
      description: `Ad revenue credited for video: ${video.title}`,
      role: "creator",
    });

    return revenue;
  } catch (err) {
    console.error("❌ Auto revenue calculation failed:", err.message);
  }
};

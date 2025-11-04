import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    // 👤 User who reported
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🎥 Video being reported (optional)
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },

    // 👤 If reporting a specific user (optional)
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🧾 Type of issue (from your version)
    type: {
      type: String,
      enum: ["adult", "illegal", "duplicate", "other"],
      required: true,
    },

    // 🧠 Additional reason details (optional)
    reason: {
      type: String,
      enum: [
        "spam",
        "copyright",
        "misleading",
        "nudity",
        "violence",
        "hate",
        "harassment",
        "child_safety",
        "other",
      ],
      default: "other",
    },

    // 📝 Extra description (optional, for user explanation)
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // ⚙️ Review process info (admin actions)
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin user
    },

    actionTaken: {
      type: String,
      enum: ["none", "video_removed", "user_suspended", "warning_issued"],
      default: "none",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);

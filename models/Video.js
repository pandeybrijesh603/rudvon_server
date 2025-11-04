import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    thumbnailUrl: {
      type: String,
      default:
        "https://res.cloudinary.com/demo/image/upload/v1690000000/default-thumb.jpg",
    },

    videoUrl: {
      type: String,
      required: true,
    },

    // 🎬 Content type flags
    isShort: { type: Boolean, default: false },
    isAI: { type: Boolean, default: false },
    isCopied: { type: Boolean, default: false },

    // 🔗 Reference to original video if copied
    originalVideoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },

    // 📊 Analytics
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },

    // 💰 Monetization
    totalRevenue: { type: Number, default: 0 },

    // 👁️ Visibility & Moderation
    isPublic: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["processing", "ready", "suppressed", "frozen", "deleted"],
      default: "ready",
    },
  },
  { timestamps: true }
);

// ✅ Index for faster text search
videoSchema.index({ title: "text", description: "text", tags: 1 });

// 🧹 Optional hook: log when video deleted
videoSchema.pre("remove", async function (next) {
  console.log(`🧹 Video deleted: ${this._id}`);
  next();
});

export default mongoose.model("Video", videoSchema);

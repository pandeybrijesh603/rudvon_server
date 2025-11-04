import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        "user_update",
        "user_kyc",
        "video_status",
        "payout_update",
        "report_review",
        "system_action",
      ],
    },
    targetType: {
      type: String,
      enum: ["User", "Video", "Payout", "Report", "System"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: String,
      trim: true,
    },
    ipAddress: String,
  },
  { timestamps: true }
);

export default mongoose.model("AdminLog", adminLogSchema);

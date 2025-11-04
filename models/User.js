import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // 🧍‍♂️ Basic user info
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: false, // optional, because OTP login is via mobile
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
    },

    // ✅ OTP system
    mobileVerified: {
      type: Boolean,
      default: false,
    },

    // 🪪 KYC system
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    // ⚙️ Account status (moderation control)
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    // 🕐 Optional: temporary suspension expiry time
    suspensionEnd: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Helper: auto-check if suspension expired
userSchema.methods.isAccountActive = function () {
  if (this.status === "suspended" && this.suspensionEnd) {
    if (new Date() > this.suspensionEnd) {
      this.status = "active";
      this.suspensionEnd = null;
    }
  }
  return this.status === "active";
};

export default mongoose.model("User", userSchema);

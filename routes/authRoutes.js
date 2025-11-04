import express from "express";
import User from "../models/User.js";
import { sendOtp, verifyOtp } from "../services/otpService.js";
import generateToken from "../utils/generateToken.js";

const router = express.Router();

/* =========================================
   ✅ Request OTP (Step 1)
   ========================================= */
router.post("/request-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required" });
    }

    // Send OTP using service
    await sendOtp(mobile);

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${mobile}`,
    });
  } catch (error) {
    console.error("❌ OTP Request Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Try again later.",
    });
  }
});

/* =========================================
   ✅ Verify OTP (Step 2)
   ========================================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP both are required",
      });
    }

    // Check OTP validity
    const isValid = verifyOtp(mobile, otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Find or create user
    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({
        mobile,
        mobileVerified: true,
      });
    } else {
      user.mobileVerified = true;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("❌ OTP Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;

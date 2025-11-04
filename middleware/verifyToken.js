import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * ✅ Middleware: Verify JWT Token
 * - Checks if Authorization header exists
 * - Verifies JWT signature
 * - Attaches user info to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    // ✅ Check header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // ✅ Extract token from header
    const token = authHeader.split(" ")[1];

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Find user from DB
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Optional: check account status (suspended/banned)
    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Your account is banned. Contact support.",
      });
    }

    if (user.status === "suspended" && user.suspensionEnd > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Your account is suspended until ${user.suspensionEnd}`,
      });
    }

    // ✅ Attach user info to request
    req.user = user;
    next(); // go to next middleware/route
  } catch (error) {
    console.error("❌ Token Verification Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }

    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default verifyToken;

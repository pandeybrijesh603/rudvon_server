import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/**
 * 🔐 Verify admin access using token
 */
const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No admin token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.userId);
    if (!admin) {
      return res.status(403).json({ success: false, message: "Access denied: not an admin" });
    }

    if (admin.status !== "active") {
      return res.status(403).json({ success: false, message: "Admin account suspended" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("❌ Admin Auth Error:", error.message);
    res.status(401).json({ success: false, message: "Invalid or expired admin token" });
  }
};

export default isAdmin;

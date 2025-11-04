import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const router = express.Router();

// 🧾 Login Admin
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  res.json({ success: true, token, admin });
});

export default router;

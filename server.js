import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import initAdminSettings from "./utils/initAdminSettings.js"; // ✅ Auto AdminSetting setup
import AdminSetting from "./models/AdminSetting.js"; // ✅ For startup summary

// ✅ Import all routes
import authRoutes from "./routes/authRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import payoutRoutes from "./routes/payoutRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import adminRevenueRoutes from "./routes/adminRevenueRoutes.js";
import adminControlRoutes from "./routes/adminControlRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminMonthlyAnalyticsRoutes from "./routes/adminMonthlyAnalyticsRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";

// ✅ Initialize
dotenv.config();
const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ✅ Connect MongoDB + Auto Init Settings + Show Summary
connectDB().then(async () => {
  console.log("✅ MongoDB connected successfully!");
  await initAdminSettings(); // 🧠 Auto-create default AdminSetting if missing

  // 🧩 Fetch current settings for startup summary
  const settings = await AdminSetting.findOne().lean();
  console.log("\n⚙️  RUDVON ADMIN SETTINGS SUMMARY");
  console.log("──────────────────────────────────");
  console.table({
    "Commission %": settings?.commissionPercent ?? "N/A",
    "Min Payout Limit": `₹${settings?.minPayoutLimit ?? "N/A"}`,
    "Max Payout Limit": settings?.maxPayoutLimit
      ? `₹${settings.maxPayoutLimit}`
      : "No Limit",
    "Bonus Per Referral": `₹${settings?.bonusPerReferral ?? 0}`,
    "Ad Revenue Share": `${settings?.adRevenueShare ?? 0}%`,
  });
  console.log("──────────────────────────────────\n");
});

// ✅ Root Test Route
app.get("/", (req, res) => {
  res.status(200).send("✅ RudVon Backend Running Successfully!");
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payout", payoutRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin", adminAnalyticsRoutes);
app.use("/api/admin", adminRevenueRoutes);
app.use("/api/admin", adminControlRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminMonthlyAnalyticsRoutes);
app.use("/api/admin", adminSettingsRoutes);

// ✅ 404 Fallback Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "❌ Route not found",
    path: req.originalUrl,
  });
});

// ✅ Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 RudVon Server running at: http://localhost:${PORT}`);
});

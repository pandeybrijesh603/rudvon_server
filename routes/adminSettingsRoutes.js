import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import AdminSetting from "../models/AdminSetting.js";
import { refreshAdminSettingsCache } from "../utils/adminSettingsCache.js";

const router = express.Router();

/**
 * ⚙️ GET /api/admin/settings
 * Fetch current or default settings (Admin only)
 */
router.get("/settings", isAdmin, async (req, res) => {
  try {
    // Try to find settings; create default if none exist
    let settings = await AdminSetting.findOne();
    if (!settings) {
      settings = await AdminSetting.create({
        commissionPercent: 10,
        adRevenueShare: 90,
        minPayoutLimit: 100,
        maxPayoutLimit: 10000,
        bonusPerReferral: 50,
        currency: "INR",
      });
    }

    res.json({
      success: true,
      message: "✅ Admin settings fetched successfully!",
      data: settings,
    });
  } catch (error) {
    console.error("❌ Fetch Settings Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin settings",
    });
  }
});

/**
 * ✏️ PATCH /api/admin/settings/update
 * Update one or more global settings (Admin only)
 */
router.patch("/settings/update", isAdmin, async (req, res) => {
  try {
    const updates = req.body;
    let settings = await AdminSetting.findOne();

    // If not found, create new
    if (!settings) {
      settings = new AdminSetting(updates);
    } else {
      Object.assign(settings, updates);
      settings.updatedBy = req.user?.id;
    }

    await settings.save();

    // 🔄 Refresh memory cache instantly
    await refreshAdminSettingsCache();

    res.json({
      success: true,
      message: "⚙️ Admin settings updated & cache reloaded successfully!",
      data: settings,
    });
  } catch (error) {
    console.error("❌ Update Settings Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update admin settings",
    });
  }
});

/**
 * 🧹 POST /api/admin/settings/reset
 * Reset settings to default values (Admin only)
 */
router.post("/settings/reset", isAdmin, async (req, res) => {
  try {
    await AdminSetting.deleteMany({});
    const defaults = await AdminSetting.create({
      commissionPercent: 10,
      adRevenueShare: 90,
      minPayoutLimit: 100,
      maxPayoutLimit: 10000,
      bonusPerReferral: 50,
      currency: "INR",
    });

    // 🔄 Refresh cache after reset
    await refreshAdminSettingsCache();

    res.json({
      success: true,
      message: "🧹 Admin settings reset to defaults & cache updated!",
      data: defaults,
    });
  } catch (error) {
    console.error("❌ Reset Settings Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to reset settings",
    });
  }
});

export default router;

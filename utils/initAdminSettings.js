// utils/initAdminSettings.js
import AdminSetting from "../models/AdminSetting.js";
import { loadAdminSettingsToCache } from "./adminSettingsCache.js";

/**
 * 🧠 Ensure at least one AdminSetting document exists
 * Auto-runs at server startup + loads into memory cache
 */
const initAdminSettings = async () => {
  try {
    let settings = await AdminSetting.findOne();

    if (!settings) {
      console.log("🧠 No AdminSetting found — creating default one...");
      settings = new AdminSetting({
        commissionPercent: 10,  // Platform commission (10%)
        minPayoutLimit: 500,    // ₹500 minimum withdrawal
        maxPayoutLimit: 10000,  // Optional upper cap
        bonusPerReferral: 50,   // ₹50 referral bonus
        adRevenueShare: 70,     // 70% creator share
        currency: "INR",
      });
      await settings.save();
      console.log("✅ Default AdminSetting created successfully!");
    } else {
      console.log("⚙️ AdminSetting already exists — skipping creation.");
    }

    // ✅ Load into memory cache
    await loadAdminSettingsToCache();
    console.log("🧩 Admin settings successfully loaded into memory cache!");
  } catch (error) {
    console.error("❌ Failed to initialize AdminSetting:", error.message);
  }
};

export default initAdminSettings;

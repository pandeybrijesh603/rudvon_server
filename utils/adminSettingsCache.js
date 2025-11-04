// utils/adminSettingsCache.js
import AdminSetting from "../models/AdminSetting.js";
import { startAdminSettingsWatcher } from "./adminSettingsWatcher.js";

let adminSettingsCache = null;

/**
 * 🧠 Load settings from DB into memory cache
 */
export const loadAdminSettingsToCache = async () => {
  const settings = await AdminSetting.findOne().lean();
  if (settings) {
    adminSettingsCache = settings;
    console.log("⚙️ Admin settings loaded into memory cache.");
  } else {
    console.warn("⚠️ No AdminSetting found to cache!");
  }

  // 👁️ Start watching DB for real-time updates
  startAdminSettingsWatcher();
  return adminSettingsCache;
};

/**
 * ♻️ Refresh cache (after update/reset)
 */
export const refreshAdminSettingsCache = async () => {
  adminSettingsCache = null;
  console.log("♻️ Clearing AdminSetting cache...");
  return await loadAdminSettingsToCache();
};

/**
 * 🚀 Get cached settings (fallback to DB if not loaded)
 */
export const getAdminSettings = async () => {
  if (!adminSettingsCache) {
    console.log("🧩 Cache empty, loading settings from DB...");
    await loadAdminSettingsToCache();
  }
  return adminSettingsCache;
};

/**
 * ⚡ Get settings instantly (no async)
 * — use only when you’re sure cache is already loaded
 */
export const getCachedSettings = () => adminSettingsCache;

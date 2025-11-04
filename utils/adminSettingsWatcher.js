// utils/adminSettingsWatcher.js
import mongoose from "mongoose";
import AdminSetting from "../models/AdminSetting.js";
import { refreshAdminSettingsCache } from "./adminSettingsCache.js";

/**
 * 👁️ Live MongoDB watcher for AdminSetting collection
 * ✅ Auto-refresh cache when any change occurs (insert, update, delete)
 * ✅ Works even if update happens on another server instance
 */
export const startAdminSettingsWatcher = async () => {
  try {
    // 🧠 Use mongoose connection for reliability
    const db = mongoose.connection;
    const collection = db.collection("adminsettings");

    // 👁️ Start watching for any operation
    const changeStream = collection.watch([], { fullDocument: "updateLookup" });

    changeStream.on("change", async (change) => {
      const { operationType } = change;
      if (["insert", "update", "replace", "delete"].includes(operationType)) {
        console.log(`🔔 AdminSetting ${operationType} detected — refreshing cache...`);
        await refreshAdminSettingsCache();
        console.log("✅ AdminSetting cache auto-updated in real-time!");
      }
    });

    changeStream.on("error", (err) => {
      console.error("❌ AdminSetting watcher error:", err.message);
    });

    console.log("🔍 AdminSetting change-stream watcher started successfully!");
  } catch (error) {
    console.error("⚠️ Failed to start AdminSetting watcher:", error.message);

    // 🔁 Fallback to model-based watcher (if MongoDB native watcher fails)
    try {
      const fallbackStream = AdminSetting.watch([], { fullDocument: "updateLookup" });
      fallbackStream.on("change", async (change) => {
        console.log("🔔 [Fallback] AdminSetting changed:", change.operationType);
        await refreshAdminSettingsCache();
      });
      console.log("🟡 Fallback AdminSetting watcher started successfully!");
    } catch (fallbackErr) {
      console.error("❌ Fallback watcher also failed:", fallbackErr.message);
    }
  }
};

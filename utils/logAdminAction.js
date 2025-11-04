import AdminLog from "../models/AdminLog.js";

/**
 * Record an admin action
 * @param {Object} params - action details
 * @param {string} params.adminId - Admin user ID
 * @param {string} params.actionType - Type of action performed
 * @param {string} params.targetType - Entity type (User, Video, etc.)
 * @param {string} params.targetId - Entity ID
 * @param {string} params.details - Optional notes
 * @param {string} params.ipAddress - Optional IP info
 */
const logAdminAction = async ({
  adminId,
  actionType,
  targetType,
  targetId,
  details,
  ipAddress,
}) => {
  try {
    await AdminLog.create({
      admin: adminId,
      actionType,
      targetType,
      targetId,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error("⚠️ Failed to log admin action:", error.message);
  }
};

export default logAdminAction;

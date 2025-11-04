import Notification from "../models/Notification.js";

/**
 * ✅ Create and save a notification for a user
 */
const sendNotification = async ({ userId, title, message, type = "system" }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
    });

    console.log(`📩 Notification sent to user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error("❌ Notification Error:", error.message);
  }
};

export default sendNotification;

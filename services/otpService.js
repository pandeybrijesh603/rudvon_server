// ✅ Temporary in-memory OTP store (for testing / dev)
// In production: Replace with Redis, MongoDB, or external SMS service like Twilio
const otpStore = new Map();

/**
 * ✅ Send OTP
 * @param {string} mobile - user's mobile number
 * @returns {string} generated OTP (for testing)
 */
export const sendOtp = (mobile) => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP with timestamp (5-minute validity)
  otpStore.set(mobile, { otp, createdAt: Date.now() });

  console.log(`📲 OTP for ${mobile}: ${otp}`); // mock log for Postman/local testing

  return otp;
};

/**
 * ✅ Verify OTP
 * @param {string} mobile - user's mobile number
 * @param {string} otp - OTP entered by user
 * @returns {boolean} whether OTP is valid or not
 */
export const verifyOtp = (mobile, otp) => {
  const record = otpStore.get(mobile);

  // ❌ No OTP found
  if (!record) return false;

  // 🕒 Expiry check (5 minutes)
  const isExpired = Date.now() - record.createdAt > 5 * 60 * 1000;
  if (isExpired) {
    otpStore.delete(mobile);
    console.log(`⌛ OTP for ${mobile} expired`);
    return false;
  }

  // ✅ Match check
  const isValid = record.otp === otp;
  if (isValid) {
    otpStore.delete(mobile); // remove after successful verification
    console.log(`✅ OTP verified for ${mobile}`);
    return true;
  }

  console.log(`❌ Invalid OTP for ${mobile}`);
  return false;
};

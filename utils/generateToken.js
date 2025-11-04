import jwt from "jsonwebtoken";

/**
 * ✅ Generates a signed JWT token for a user.
 * @param {Object} payload - Data to include in the token (e.g., userId, role)
 * @param {String} expiresIn - Token validity duration (default: 30d)
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = "30d") => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in .env file");
    }

    // Generate token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    return token;
  } catch (error) {
    console.error("❌ JWT Generation Error:", error.message);
    return null; // fail-safe return
  }
};

export default generateToken;

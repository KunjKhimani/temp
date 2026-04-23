const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  if (!id) {
    throw new Error("User ID is required to generate a token");
  }

  if (!process.env.JWT_TOKEN_KEY) {
    throw new Error("JWT secret key is missing in environment variables");
  }

  try {
    return jwt.sign({ user_id: id }, process.env.JWT_TOKEN_KEY, {
      expiresIn: process.env.JWT_EXPIRATION || "30d", // Configurable expiration
    });
  } catch (error) {
    console.error("Error generating JWT:", error.message);
    throw new Error("Failed to generate token");
  }
};

module.exports = generateToken;

// utils/userUtils.js

const bcrypt = require("bcrypt");
const crypto = require("crypto");

/**
 * Compares an entered password with a stored hashed password.
 * @param {string} enteredPassword - The password attempt from the user.
 * @param {string} hashedPassword - The stored hashed password from the database.
 * @returns {Promise<boolean>} - True if passwords match, false otherwise.
 */
const comparePassword = async (enteredPassword, hashedPassword) => {
  if (!enteredPassword || !hashedPassword) {
    return false; // Or throw an error, depending on desired handling
  }
  return await bcrypt.compare(enteredPassword, hashedPassword);
};

/**
 * Generates email verification credentials (token and code),
 * sets them on the provided user object, and returns the
 * values needed for the email (unhashed token, plain code).
 * IMPORTANT: This function modifies the user object directly.
 *
 * @param {object} user - The Mongoose user document instance.
 * @returns {{token: string, code: string}} - The unhashed token and plain code.
 */
const setAndGenerateVerificationCredentials = (user) => {
  if (!user) {
    throw new Error("User object is required to generate credentials.");
  }

  // 1. Generate random token for the link
  const verificationToken = crypto.randomBytes(20).toString("hex");

  // 2. Hash the token for database storage
  user.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // 3. Generate a user-friendly code (e.g., 6 digits)
  let verificationCode;
  if (crypto.randomInt) {
    verificationCode = crypto.randomInt(100000, 1000000).toString();
  } else {
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  }
  user.emailVerificationCode = verificationCode; // Store the plain code

  // 4. Set an expiry time
  user.emailVerificationExpires = Date.now() + 3600000; // 1 hour

  // 5. Return the *unhashed* token and *plain* code for the email
  return { token: verificationToken, code: verificationCode };
};

/**
 * Hashes a plain text password.
 * @param {string} plainPassword - The password to hash.
 * @returns {Promise<string>} - The hashed password.
 */
const hashPassword = async (plainPassword) => {
  if (!plainPassword) {
    throw new Error("Password cannot be empty.");
  }
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

module.exports = {
  comparePassword,
  setAndGenerateVerificationCredentials,
  hashPassword, // Export the hashing function for the pre-save hook
};

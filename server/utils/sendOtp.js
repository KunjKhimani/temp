// utils/sendOtp.js

const nodemailer = require("nodemailer");
const crypto = require("crypto"); // Import crypto for token generation
const OTP = require("../model/otp.model.js"); // Ensure path is correct
require("dotenv").config();

// Generate a random 6-digit number (remains the same)
const generateResetCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Ensure necessary environment variables are available
if (
  !process.env.EMAIL_USERNAME ||
  !process.env.EMAIL_PASSWORD ||
  !process.env.FRONTEND_BASE_URL ||
  !process.env.EMAIL_FROM_ADDRESS
) {
  console.error(
    "SMTP configuration or FRONTEND_BASE_URL is missing. Check environment variables (EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_FROM_ADDRESS, FRONTEND_BASE_URL)."
  );
  // Throwing an error might stop the server, consider logging and returning failure instead depending on context.
  throw new Error(
    "Required environment variables for sending OTP are missing."
  );
}

// Create nodemailer transporter (remains the same)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com", // Use EMAIL_HOST or default
  port: parseInt(process.env.EMAIL_PORT || "465", 10), // Use EMAIL_PORT or default
  secure: (process.env.EMAIL_PORT || "465") === "465", // Secure if port is 465
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Sends a password reset email containing both a code and a reset link.
 * @param {string} email - The recipient's email address.
 * @returns {Promise<{success: boolean, message: string}>} - Operation result.
 */
const sendOtp = async (email) => {
  try {
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return { success: false, message: "A valid email address is required." };
    }

    // Check if a valid OTP/token already exists for this email to prevent spamming
    // Check based on email and expiry only.
    const recentEntry = await OTP.findOne({
      email,
      expiresAt: { $gt: Date.now() }, // Entry is still valid
    });

    // Implement rate limiting logic here if desired (e.g., check createdAt time)
    if (recentEntry) {
      // Optional: Check how recent it was before blocking
      // const timeDiff = Date.now() - recentEntry.createdAt.getTime();
      // if (timeDiff < 60000) { // e.g., less than 1 minute ago
      return {
        success: false,
        message:
          "Password reset already requested recently. Please check your email or wait a moment before trying again.",
      };
      // }
    }

    // --- Generate Credentials ---
    const resetCode = generateResetCode();
    const rawResetToken = crypto.randomBytes(32).toString("hex"); // Generate a secure token
    const hashedResetToken = crypto // Hash the token for storage
      .createHash("sha256")
      .update(rawResetToken)
      .digest("hex");

    const expirationTime = new Date(Date.now() + 10 * 60000); // 10 minutes expiration

    // --- Database Operations ---
    // Remove any previous/expired entries for this email to ensure only one valid reset is active
    await OTP.deleteMany({ email });

    // Store the new entry with code and hashed token
    await OTP.create({
      email,
      code: resetCode,
      resetToken: hashedResetToken, // Store the hashed token
      expiresAt: expirationTime,
    });

    // --- Email Content ---
    // Construct the reset link using the UNHASHED token
    const resetUrl = `${process.env.FRONTEND_BASE_URL}/reset-password/${rawResetToken}`; // Point to your frontend reset page

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Your App Name"}" <${
        process.env.EMAIL_FROM_ADDRESS
      }>`,
      to: email,
      subject: "Reset Your Password",
      text: `
Hello,

You requested to reset your password for Your App Name. Please use one of the methods below. This request expires in 10 minutes.

Method 1: Enter the following code in the app:
${resetCode}

Method 2: Click the link below to reset your password:
${resetUrl}

If you did not request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
Your App Team
      `,
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password for <strong>Your App Name</strong>. Please use one of the methods below. This request expires in <strong>10 minutes</strong>.</p>
        <hr>
        <p><strong>Method 1: Enter this code in the app:</strong></p>
        <p style="font-size: 1.8em; font-weight: bold; letter-spacing: 3px; color: #333;">${resetCode}</p>
        <hr>
        <p><strong>Method 2: Click the link below:</strong></p>
        <p><a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 10px 15px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Reset Password via Link</a></p>
        <p><small>If the button doesn't work, copy and paste this URL into your browser: ${resetUrl}</small></p>
        <hr>
        <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>Your App Team</p>
      `,
    };

    // --- Send Email ---
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Password reset email sent successfully to ${email}: ${info.messageId}`
    );
    return {
      success: true,
      message:
        "Password reset email sent successfully. Please check your inbox.",
    };
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error);
    // Avoid exposing specific internal errors to the client
    // Check for specific error types if needed (e.g., DB connection issues vs SMTP issues)
    return {
      success: false,
      message:
        "Failed to send password reset email. Please try again later or contact support.",
    };
  }
};

module.exports = sendOtp; // Keep the name sendOtp or rename to sendPasswordResetEmail if clearer

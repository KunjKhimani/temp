// controllers/auth.controller.js

const crypto = require("crypto");
const User = require("../model/user.model.js");
const generateToken = require("../utils/generateToken.js");
const OTP = require("../model/otp.model.js"); // Used for password reset only
const sendOtp = require("../utils/sendOtp.js"); // Specific for password reset // Generic email sender
const {
  setAndGenerateVerificationCredentials,
  comparePassword,
} = require("../utils/userUtils.js");
const { sendVerificationEmail } = require("../utils/sendEmail.js");
require("dotenv").config();

// --- Login Controller (No changes needed here, verification check commented out earlier) ---
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find the user by email and explicitly select the password field
    // because it likely has `select: false` in the schema
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists first
    if (!user) {
      console.log(`Login attempt failed: User not found for email ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Now compare the password
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      console.log(`Login attempt failed: Invalid password for email ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if account is suspended
    if (user.status === "suspended") {
      console.log(`Login attempt failed: Account suspended for email ${email}`);
      return res.status(403).json({
        message:
          "Your account has been suspended. Please contact support for assistance.",
      });
    }

    // Optional: Email verification check

    console.log(!user.isAdmin);

    if (!user.isAdmin && !user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in.",
        emailNotVerified: true, // Flag for frontend handling
      });
    }

    // Prepare the user object to send back
    // Convert the Mongoose document to a plain JavaScript object
    const userToSend = user.toObject();

    // Explicitly remove sensitive fields before sending
    delete userToSend.password;
    delete userToSend.emailVerificationToken;
    delete userToSend.emailVerificationCode;
    delete userToSend.emailVerificationExpires;
    // Optionally remove mongoose version key if you don't need it on client
    // delete userToSend.__v;

    // Send the full user object (minus sensitive fields) and the token
    res.status(200).json({
      user: userToSend, // Send the prepared full user object
      token: generateToken(user._id), // Generate JWT token
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
};

// --- Register User Controller (UPDATED to call new sendVerificationEmail signature) ---
const registerUser = async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      companyName,
      representativeName,
      accountType,
    } = req.body;

    // Basic validation (remains the same)
    if (!email || !password || !accountType) {
      return res
        .status(400)
        .json({ message: "Email, password, and account type are required" });
    }
    // ... other validations ...

    const userExist = await User.findOne({ email });
    if (userExist) {
      // Check if the existing user is unverified
      if (!userExist.isEmailVerified) {
        try {
          // Generate new credentials (still includes token internally, but we only use code)
          const { code: newCode } =
            setAndGenerateVerificationCredentials(userExist);
          await userExist.save(); // Save new credentials
          // *** Call updated email helper with CODE ONLY ***
          await sendVerificationEmail(userExist, newCode);
          return res.status(200).json({
            message:
              "Account exists but is not verified. A new verification code has been sent to your email.",
            emailVerificationPending: true,
          });
        } catch (resendError) {
          console.error(
            "Error resending verification during registration check:",
            resendError
          );
          return res.status(500).json({
            message: "User exists, but failed to resend verification email.",
          });
        }
      } else {
        return res
          .status(400)
          .json({ message: "User already exists and is verified." });
      }
    }

    // Create new user instance
    const user = new User({
      email,
      password,
      name: accountType === "individual" ? username : undefined,
      companyName: accountType === "agency" ? companyName : undefined,
      representativeName:
        accountType === "agency" ? representativeName : undefined,
      accountType,
      isEmailVerified: false,
      // Subscription details will be handled after email verification and plan selection
      // Initial state for subscription will be default values from schema (isActive: false, paymentStatus: 'pending')
    });

    // Generate verification credentials (still includes token internally)
    const { code: verificationCode } =
      setAndGenerateVerificationCredentials(user);

    const savedUser = await user.save();

    // *** Call updated email helper with CODE ONLY ***
    await sendVerificationEmail(savedUser, verificationCode);

    res.status(201).json({
      message:
        "Registration successful! Please check your email for a verification code.",
      userId: savedUser._id,
      email: savedUser.email,
      accountType: savedUser.accountType, // Include accountType in response
      emailVerificationPending: true,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Email address is already registered." });
    }
    res
      .status(500)
      .json({ message: "Internal server error during registration" });
  }
};

// --- Verify Email Controller (UPDATED for CODE ONLY) ---
const verifyEmail = async (req, res) => {
  try {
    // *** Only expect email and code in the request body ***
    const { email, code } = req.body;

    // *** Updated validation: require email and code ***
    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Check if verification details exist and are not expired
    // Note: Expiry applies to the code now
    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < Date.now()
    ) {
      // Clear potentially expired code details
      user.emailVerificationCode = undefined;
      user.emailVerificationExpires = undefined;
      user.emailVerificationToken = undefined; // Also clear token field
      await user.save();
      return res.status(400).json({
        message: "Verification code has expired. Please request a new one.",
      });
    }

    let isValid = false;

    // *** REMOVED token validation block ***

    // *** Validate the code ONLY ***
    if (code && user.emailVerificationCode) {
      // Compare the plain code directly
      if (code === user.emailVerificationCode) {
        isValid = true;
      }
    }

    if (!isValid) {
      // *** Updated error message for invalid code ***
      return res.status(400).json({ message: "Invalid verification code." });
    }

    // --- Verification Successful ---
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined; // Clear the (unused) token field
    user.emailVerificationCode = undefined; // Clear the code
    user.emailVerificationExpires = undefined; // Clear the expiry
    await user.save();

    // Prepare the user object to send back
    const userToSend = user.toObject();
    delete userToSend.password;
    delete userToSend.emailVerificationToken;
    delete userToSend.emailVerificationCode;
    delete userToSend.emailVerificationExpires;

    res.status(200).json({
      message: "Email verified successfully! You are now logged in.",
      user: userToSend,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Email Verification Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during email verification." });
  }
};

// --- Resend Verification Email Controller (UPDATED to call new sendVerificationEmail signature) ---
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message:
          "If an account with that email exists, a new verification code has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res
        .status(400)
        .json({ message: "This email address is already verified." });
    }

    // Optional: Rate limiting check (remains the same logic)

    // Generate new credentials (still includes token internally)
    const { code: newVerificationCode } =
      setAndGenerateVerificationCredentials(user);

    // console.log(code);
    console.log(newVerificationCode);

    await user.save(); // Save the user with the new code/expiry

    // *** Call updated email helper with CODE ONLY ***
    await sendVerificationEmail(user, newVerificationCode);

    res.status(200).json({
      message:
        "A new verification code has been sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend Verification Email Error:", error);
    res.status(500).json({
      message: "Internal server error while resending verification email.",
    });
  }
};

// --- Password Reset Functions (No changes needed here) ---
const forgotPassword = async (req, res) => {
  // ... (code remains the same)
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res
        .status(400)
        .json({ success: false, message: "Valid email is required" });
    }

    const user = await User.findOne({ email });

    // It's generally better practice *not* to reveal if an email exists or not
    // for password reset. Send a generic success message regardless.
    // if (!user) {
    //   // return res.status(404).json({ success: false, message: "User not found." });
    // }

    // Send OTP regardless of whether user exists to prevent email enumeration
    const otpResponse = await sendOtp(email); // sendOtp handles DB storage & email sending

    // Log the internal status but send a generic message to the client
    if (otpResponse.success === false) {
      console.error(
        "Failed to process forgot password request for:",
        email,
        "Reason:",
        otpResponse.message
      );
      // Don't reveal the failure reason to the client if it's internal
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred, please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  // ... (code remains the same)
  try {
    // Note: This implementation relies on the OTP model and 'code'.
    // If using the token link from sendOtp, the logic here needs adjustment
    // to verify the token instead of the code.
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP code, and new password are required" });
    }

    // Find the OTP entry using email and code
    const otpEntry = await OTP.findOne({ email, code });

    if (!otpEntry) {
      return res.status(400).json({ message: "Invalid or expired OTP code" }); // Combine checks
    }

    // Check expiry explicitly (though the findOne could include $gt: Date.now())
    if (otpEntry.expiresAt < Date.now()) {
      await OTP.deleteOne({ _id: otpEntry._id }); // Clean up expired entry
      return res.status(400).json({ message: "OTP code has expired" });
    }

    // If using token: Verify token against otpEntry.resetToken (hashed)
    // const { token } = req.body; // Assuming token comes instead of code
    // const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    // const otpEntry = await OTP.findOne({ email, resetToken: hashedToken, expiresAt: { $gt: Date.now() } });
    // if (!otpEntry) return res.status(400).json({ message: "Invalid or expired reset token." });

    const user = await User.findOne({ email });
    if (!user) {
      // Should generally not happen if OTP was valid, but check anyway
      return res
        .status(404)
        .json({ message: "User associated with this request not found." });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Clean up OTP entries for this email after successful reset
    await OTP.deleteMany({ email });

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during password reset" });
  }
};

module.exports = {
  registerUser,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
};

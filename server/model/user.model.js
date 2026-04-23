// models/user.model.js

const mongoose = require("mongoose");
const { hashPassword } = require("../utils/userUtils"); // Import the hash utility

const UserSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      required: true,
      enum: ["individual", "agency"],
      default: "individual",
    },
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    bio: { type: String },
    password: { type: String, required: true },
    companyName: { type: String, trim: true },
    representativeName: { type: String, trim: true },
    website: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    isSeller: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    stripeAccountId: { type: String, sparse: true }, // Stripe Connect Account ID for sellers
    hasSetIntent: { type: Boolean, default: false }, // New field
    userIntent: {
      type: String,
      enum: ["provide", "buy", null], // Allow null initially
      default: null,
    },
    userCategories: [
      {
        type: String,
        enum: ["services", "products", "talent"],
      },
    ],
    location: { type: String },
    profilePicture: { type: String },
    experience: { type: String },
    skills: [{ type: String }],
    generalAreaOfService: { type: String },
    telephone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },
    documents: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    reviews: [],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      // For link verification
      type: String,
    },
    emailVerificationCode: {
      // For manual code entry
      type: String,
    },
    emailVerificationExpires: {
      // Single expiry for both token and code
      type: Date,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["basic_account", "growth_account", "business_account"],
        default: "basic_account",
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: false, // Default to false, set to true upon successful subscription
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "cancelled"],
        default: "pending",
      },
      stripeCustomerId: {
        type: String,
      },
      squareCustomerId: {
        type: String,
      },
      lastPaymentDate: {
        type: Date,
      },
      nextBillingDate: {
        type: Date,
      },
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// --- Pre-Save Hook (Updated to use utility) ---
UserSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Use the utility function to hash the password
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error); // Pass error to Mongoose error handling
  }
});

//Add indexes for commonly queried/sorted fields

// UserSchema.index({ email: 1 });
UserSchema.index({ accountType: 1 });
UserSchema.index({ isSeller: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ isAdmin: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ name: "text", email: "text" });

const User = mongoose.model("User", UserSchema);

module.exports = User;

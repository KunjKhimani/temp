// server/scripts/userStatusMigration.js

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const User = require("../model/user.model");

const migrateUserStatus = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/sparework";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for migration...");

    // Update all users who don't have a status to 'active'
    // Users with isVerified: true should definitely be 'active'
    // For others, we'll set them to 'active' as well to avoid breaking current access, 
    // unless they are unverified sellers who might need to be 'pending'.
    // But to be safe and backward compatible, let's set everyone to 'active' or 'pending' based on verification.
    
    const result = await User.updateMany(
      { status: { $exists: false } },
      [
        {
          $set: {
            status: {
              $cond: {
                if: { $eq: ["$isVerified", true] },
                then: "active",
                else: "pending"
              }
            }
          }
        }
      ]
    );

    console.log(`Migration completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    
    // Also ensure admins are active
    const adminResult = await User.updateMany(
      { isAdmin: true },
      { $set: { status: "active" } }
    );
    console.log(`Ensured ${adminResult.modifiedCount} admins are active.`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateUserStatus();

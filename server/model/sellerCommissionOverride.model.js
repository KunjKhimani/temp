const mongoose = require("mongoose");

const SellerCommissionOverrideSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    percentage: { type: Number, required: true }, // Commission rate (e.g., 1 for 1%)
    
    durationDays: { type: Number, default: null }, // Number of days
    untilDate: { type: Date, default: null },      // Calculated expiration date

    appliedPromoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommissionPromoCode",
      default: null,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Helper method to check if override is active
SellerCommissionOverrideSchema.methods.isActive = function() {
  if (this.untilDate === null || this.untilDate === undefined) {
    if (this.durationDays === null || this.durationDays === undefined || this.durationDays <= 0) {
      return true;
    }
    const expiresAt = new Date(this.updatedAt.getTime() + (this.durationDays * 24 * 60 * 60 * 1000));
    return new Date() < expiresAt;
  }
  
  return new Date() < new Date(this.untilDate);
};

module.exports = mongoose.models.SellerCommissionOverride || mongoose.model("SellerCommissionOverride", SellerCommissionOverrideSchema);

const mongoose = require("mongoose");

const CommissionPromoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Helper to check if a code is currently valid
CommissionPromoCodeSchema.methods.isValid = function () {
  const now = new Date();
  const isWithinDates = now >= this.startDate && now <= this.endDate;
  const isBelowLimit = this.usageLimit === null || this.usedCount < this.usageLimit;
  return this.isActive && isWithinDates && isBelowLimit;
};

module.exports = mongoose.model("CommissionPromoCode", CommissionPromoCodeSchema);

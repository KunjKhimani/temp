const mongoose = require("mongoose");

const PricingHistorySchema = new mongoose.Schema(
  {
    promotionType: String,
    changes: mongoose.Schema.Types.Mixed,
    changedBy: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PricingHistory || mongoose.model("PricingHistory", PricingHistorySchema);
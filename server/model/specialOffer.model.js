const mongoose = require("mongoose");

const SpecialOfferSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "itemType",
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ["Product", "Service", "RequestedProduct", "ServiceRequest"],
    },
    description: {
      type: String,
      maxlength: [1000, "Special description cannot exceed 1000 characters."],
    },
    actualPrice: {
      type: Number,
      required: [true, "Actual price is required for special offers."],
      min: [0, "Actual price cannot be negative."],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required for special offers."],
      min: [0, "Selling price cannot be negative."],
      validate: {
        validator: function (v) {
          if (!this.itemType) return true; // Fallback
          if (this.itemType === "Product" || this.itemType === "Service") {
            return v < this.actualPrice;
          } else if (this.itemType === "RequestedProduct" || this.itemType === "ServiceRequest") {
            return v > this.actualPrice;
          }
          return true;
        },
        message: function() {
          return "Selling price validation failed based on item type.";
        },
      },
    },
    discountPercentage: {
      type: Number,
      min: [0, "Discount percentage cannot be negative."],
      max: [100, "Discount percentage cannot exceed 100%."],
    },
    priceDifference: {
      type: Number,
      min: [0, "Price difference cannot be negative."],
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    durationDays: {
      type: Number,
      min: [0, "Duration days cannot be negative."],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

SpecialOfferSchema.index({ status: 1, expiresAt: 1 });

const SpecialOffer = mongoose.model("SpecialOffer", SpecialOfferSchema);
module.exports = SpecialOffer;

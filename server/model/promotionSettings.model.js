const mongoose = require("mongoose");

const PromotionSettingsSchema = new mongoose.Schema(
  {
    featured: {
      enabled: { type: Boolean, default: true },
      plans: {
        type: [
          {
            durationMonths: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 },
            description: { type: [String], default: [] },
          },
        ],
        default: [
          { durationMonths: 1, price: 4.99 },
          { durationMonths: 3, price: 9.90 },
          { durationMonths: 6, price: 15.99 },
        ],
      },
      allowStacking: { type: Boolean, default: true },
      badgeLabel: { type: String, default: "Featured" },
    },

    specialDeal: {
      enabled: { type: Boolean, default: true },
      activationFee: { type: Number, default: 7.99 },
      requireOriginalPrice: { type: Boolean, default: true },
      requireDiscountedPrice: { type: Boolean, default: true },
      allowForRequests: { type: Boolean, default: true },
      badgeLabel: { type: String, default: "Special Deal" },
      expirationDays: { type: Number, default: null },
    },

    communityOffer: {
      enabled: { type: Boolean, default: true },
      plans: {
        type: [
          {
            durationMonths: { type: Number, required: true },
            price: { type: Number, required: true },
            description: { type: [String], default: [] },
          },
        ],
        default: [
          { durationMonths: 1, price: 0 },
          { durationMonths: 2, price: 7.99 },
          { durationMonths: 3, price: 15.99 },
        ],
      },
      allowFreeTier: { type: Boolean, default: true },
      requireAdminReviewForFree: { type: Boolean, default: false },
      allowPaidTiersBelowMinimum: { type: Boolean, default: false },
      badgeLabel: { type: String, default: "Community Offer" },
    },

    commission: {
      type: {
        type: String,
        enum: ["percentage", "flat"],
        default: "percentage"
      },

      flatAmount: { type: Number, default: 0 },

      minimumAmount: { type: Number, default: 0 },
      maximumCap: { type: Number, default: 0 },

      standard: {
        offerPercent: { type: Number, default: 0 },
        requestPercent: { type: Number, default: 0 }
      },

      featured: {
        offerPercent: { type: Number, default: 0 },
        requestPercent: { type: Number, default: 0 }
      },

      specialDeal: {
        offerPercent: { type: Number, default: 0 },
        requestPercent: { type: Number, default: 0 }
      },

      community: {
        free: { type: Number, default: 0 },
        donation: { type: Number, default: 0 },
        lowCostPercent: { type: Number, default: 0 },
        subcategoryCommissions: {
          type: [
            {
              subcategory: { type: String, required: true },
              lowCostPercent: { type: Number, default: 0 },
            },
          ],
          default: [],
        },
      }
    },

    rules: {
      minimumPaidPromotionFee: { type: Number, default: 7.99 },

      allowMultiplePromotions: { type: Boolean, default: false },

      autoExpireFeatured: { type: Boolean, default: true },
      autoExpireCommunity: { type: Boolean, default: true },
      autoExpireSpecialDeal: { type: Boolean, default: false },

      sortPriority: {
        type: [String],
        default: ["special_deal", "featured", "community_offer", "normal"],
      },

      eligibility: {
        allowOffersPromotion: { type: Boolean, default: true },
        allowRequestsPromotion: { type: Boolean, default: true },

        allowCommunityForRequests: { type: Boolean, default: true },
        allowSpecialDealForRequests: { type: Boolean, default: true }
      }
    },

    homepage: {
      showFeatured: { type: Boolean, default: true },
      showSpecialDeals: { type: Boolean, default: true },
      showCommunityOffers: { type: Boolean, default: true },
      featuredLimit: { type: Number, default: 12 },
      specialDealsLimit: { type: Number, default: 12 },
      communityOffersLimit: { type: Number, default: 12 },
      featuredSectionTitle: { type: String, default: "Featured Listings" },
      specialDealsSectionTitle: { type: String, default: "Special Deals" },
      communityOffersSectionTitle: { type: String, default: "Community Offers" },
      specialDealsDescription: {
        type: String,
        default:
          "Discover discounted offers and high-priority requests. Special Deals highlight listings with the best value and fastest response opportunities.",
      },
      communityOffersDescription: {
        type: String,
        default:
          "Explore free, donation-based, and low-cost services. Community Offers are designed to support local engagement and accessible opportunities for everyone.",
      },
    },

    updatedBy: String,
  },
  { timestamps: true }
);

PromotionSettingsSchema.index({ updatedAt: -1 });

module.exports =
  mongoose.models.PromotionSettings ||
  mongoose.model("PromotionSettings", PromotionSettingsSchema);
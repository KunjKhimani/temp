const SpecialOffer = require('../model/specialOffer.model');
const Product = require('../model/product.model');
const Service = require('../model/service.model');
const RequestedProduct = require('../model/requestedProduct.model');
const ServiceRequest = require('../model/serviceRequest.model');

const processExpiredSpecialDeals = async () => {
  try {
    const now = new Date();

    // Find active deals that have an expiration date set and have passed it
    const expiredDeals = await SpecialOffer.find({
      status: 'active',
      expiresAt: { $lt: now, $ne: null }
    });

    if (expiredDeals.length > 0) {
      console.log(`[SpecialDealCron] Found ${expiredDeals.length} expired special deals.`);

      for (const deal of expiredDeals) {
        // 1. Deactivate the SpecialOffer
        deal.status = 'inactive';
        await deal.save();

        // 2. Update the corresponding listing
        const ItemModel = mongoose.model(deal.itemType);
        if (ItemModel) {
          await ItemModel.findByIdAndUpdate(deal.item, {
            isSpecial: false,
            // specialOffer: null // Optional: keep for history but hide from storefront logic
          });
          console.log(`[SpecialDealCron] Deactivated deal ${deal._id} for ${deal.itemType} ${deal.item}`);
        }
      }
      console.log(`[SpecialDealCron] Successfully processed ${expiredDeals.length} expired deals.`);
    } else {
      console.log(`[SpecialDealCron] No expired special deals found.`);
    }
  } catch (error) {
    console.error(`[SpecialDealCron] Error processing expired special deals:`, error);
  }
};

const mongoose = require('mongoose');

const startSpecialDealCron = () => {
  console.log('[SpecialDealCron] Starting special deal expiration job...');

  // Run once immediately on startup
  processExpiredSpecialDeals();

  // Run every 6 Hour = 6 * 60 * 60 * 1000 ms
  const ONE_HOUR = 6 * 60 * 60 * 1000;
  setInterval(processExpiredSpecialDeals, ONE_HOUR);
};

module.exports = {
  startSpecialDealCron,
  processExpiredSpecialDeals
};
const Product = require("../model/product.model");
const Service = require("../model/service.model");
const ServiceRequest = require("../model/serviceRequest.model");
const RequestedProduct = require("../model/requestedProduct.model");
const CommunityPayment = require("../model/communityPayment.model");

/**
 * Processes all listing types to set isCommunity to false if their
 * linked community plan has expired.
 */
const processExpiredCommunityOffers = async () => {
  try {
    const now = new Date();
    console.log(`[CommunityCron] Checking for expired community offers at ${now.toISOString()}...`);

    // 1. Find all successful community payments that have expired
    const expiredPayments = await CommunityPayment.find({
      communityOfferUntill: { $lt: now },
      status: "succeeded"
    }).select("_id");

    if (expiredPayments.length === 0) {
      console.log("[CommunityCron] No expired community payments found.");
      return;
    }

    const expiredPaymentIds = expiredPayments.map(cp => cp._id);
    const models = [
      { name: "Product", model: Product },
      { name: "Service", model: Service },
      { name: "ServiceRequest", model: ServiceRequest },
      { name: "RequestedProduct", model: RequestedProduct }
    ];

    let totalUpdated = 0;

    // 2. For each model, update items that are linked to an expired payment
    for (const { name, model } of models) {
      const result = await model.updateMany(
        { 
          communityPayment: { $in: expiredPaymentIds },
          isCommunity: true 
        },
        { 
          $set: { isCommunity: false } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`[CommunityCron] Updated ${result.modifiedCount} ${name}s to non-community status.`);
        totalUpdated += result.modifiedCount;
      }
    }

    if (totalUpdated > 0) {
      console.log(`[CommunityCron] Successfully processed ${totalUpdated} total expirations.`);
    } else {
      console.log("[CommunityCron] Expired payments found, but no active community listings needed updating.");
    }
  } catch (error) {
    console.error("[CommunityCron] Error processing expired community offers:", error.message, error.stack);
  }
};

/**
 * Starts the community offer expiration cron job.
 * Runs every 6 hours by default.
 */
const startCommunityExpiryCron = () => {
  console.log("[CommunityCron] Starting community offer expiration job...");

  // Run once immediately on startup to catch anything that expired while the server was down
  processExpiredCommunityOffers();

  // Run every 6 Hours = 6 * 60 * 60 * 1000 ms
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setInterval(processExpiredCommunityOffers, SIX_HOURS);
};

module.exports = {
  processExpiredCommunityOffers,
  startCommunityExpiryCron
};

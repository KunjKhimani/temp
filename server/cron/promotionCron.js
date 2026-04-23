const ServiceRequest = require('../model/serviceRequest.model');
const PROMOTION_TYPES = require('../utils/promotionTypes');

const processExpiredPromotions = async () => {
  try {
    const now = new Date();
    
    // Fetch all currently promoted requests
    const promotedRequests = await ServiceRequest.find({
      'promotionDetails.isPromoted': true
    });

    // Filter natively in Javascript to avoid BSON type casting issues
    const expiredRequests = promotedRequests.filter(request => {
      if (!request.promotionDetails || !request.promotionDetails.promotedUntil) return false;
      
      const promotedUntilTime = new Date(request.promotionDetails.promotedUntil).getTime();
      return promotedUntilTime < now.getTime();
    });

    if (expiredRequests.length > 0) {
      console.log(`[Cron] Found ${expiredRequests.length} expired promoted service requests.`);
      
      const updatePromises = expiredRequests.map(request => {
        request.promotionDetails.isPromoted = false;
        // Optionally update the requestType to Standard, but keep history
        request.requestType = PROMOTION_TYPES.STANDARD;
        return request.save();
      });

      await Promise.all(updatePromises);
      console.log(`[Cron] Successfully updated ${expiredRequests.length} expired service requests to non-promoted.`);
    } else {
      console.log(`[Cron] No expired promoted service requests found.`);
    }
  } catch (error) {
    console.error(`[Cron] Error processing expired promotions:`, error);
  }
};

const startPromotionCron = () => {
  console.log('[Cron] Starting promotion expiration job...');
  
  // Run once immediately on startup
  processExpiredPromotions();

  // Run every 6 Hour = 6 * 60 * 60 * 1000 ms
  const SIX_HOUR = 6 * 60 * 60 * 1000;
  setInterval(processExpiredPromotions, SIX_HOUR);
};

module.exports = {
  startPromotionCron,
  processExpiredPromotions
};

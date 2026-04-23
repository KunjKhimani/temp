const CommissionPromoCode = require("../model/commissionPromoCode.model");

const processPromoCodeStatuses = async () => {
  try {
    const now = new Date();
    console.log(`[PromoCodeCron] Checking for promo code status updates at ${now.toISOString()}...`);

    // 1. Activate codes that have reached their start date
    const toActivate = await CommissionPromoCode.updateMany(
      {
        isActive: false,
        startDate: { $lte: now },
        endDate: { $gt: now },
        $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }]
      },
      { $set: { isActive: true } }
    );

    // 2. Deactivate codes that have passed their end date
    const toDeactivate = await CommissionPromoCode.updateMany(
      {
        isActive: true,
        $or: [
          { endDate: { $lte: now } },
          { $and: [{ usageLimit: { $ne: null } }, { $expr: { $gte: ["$usedCount", "$usageLimit"] } }] }
        ]
      },
      { $set: { isActive: false } }
    );

    if (toActivate.modifiedCount > 0 || toDeactivate.modifiedCount > 0) {
      console.log(`[PromoCodeCron] Activated: ${toActivate.modifiedCount}, Deactivated: ${toDeactivate.modifiedCount}`);
    } else {
      console.log(`[PromoCodeCron] No promo code status updates needed.`);
    }
  } catch (error) {
    console.error(`[PromoCodeCron] Error processing promo code statuses:`, error);
  }
};

const startPromoCodeCron = () => {
  console.log('[PromoCodeCron] Starting promo code status job...');

  // Run once immediately on startup
  processPromoCodeStatuses();

  // Run every 6 Hour
  const SIX_HOUR = 6 * 60 * 60 * 1000;
  // const SIX_HOUR = 10 * 1000;
  setInterval(processPromoCodeStatuses, SIX_HOUR);
};

module.exports = {
  startPromoCodeCron,
  processPromoCodeStatuses
};

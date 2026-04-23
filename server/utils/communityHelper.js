const CommunityPayment = require("../model/communityPayment.model");
const TransactionLog = require("../model/TransactionLog.model");
const PromotionSettings = require("../model/promotionSettings.model");
const { createPayment: createSquarePayment } = require("./squareService");
const { hasUsedFreeCommunityOfferForItem } = require("./communityUtils");

/**
 * Get community offer plans from database
 */
const getCommunityOfferPlans = async () => {
  try {
    console.log(`[getCommunityOfferPlans] Fetching PromotionSettings...`);
    const settings = await PromotionSettings.findOne();
    console.log(`[getCommunityOfferPlans] Settings found:`, settings ? 'Yes' : 'No');
    
    if (!settings) {
      console.log(`[getCommunityOfferPlans] No PromotionSettings found`);
      throw { status: 500, message: "No promotion settings found in database." };
    }
    
    if (!settings.communityOffer.enabled) {
      console.log(`[getCommunityOfferPlans] Community offers disabled`);
      throw { status: 400, message: "Community offers are currently disabled." };
    }
    
    console.log(`[getCommunityOfferPlans] Community offer plans from DB:`, settings.communityOffer.plans);
    
    // Convert database plans to expected format
    const plans = {};
    settings.communityOffer.plans.forEach(plan => {
      plans[plan.durationMonths] = {
        durationMonths: plan.durationMonths,
        feeUsd: plan.price
      };
    });
    
    console.log(`[getCommunityOfferPlans] Converted plans:`, plans);
    return plans;
  } catch (error) {
    console.error("Error fetching community offer plans:", error);
    throw { status: 500, message: "Community offer configuration is not available right now. Please try again later." };
  }
};

/**
 * Common logic for activating a community offer on an item.
 * Works for Services, Products, ServiceRequests, and RequestedProducts.
 */
const activateCommunityOfferLogic = async ({
  user,
  item,
  itemType,
  durationMonths,
  sourceId,
  existingPaymentId, // Support for consolidated payments
}) => {
  console.log(`[activateCommunityOfferLogic] Starting with durationMonths: ${durationMonths}, itemType: ${itemType}`);
  
  // Get dynamic plans from database
  const communityPlans = await getCommunityOfferPlans();
  console.log(`[activateCommunityOfferLogic] Available plans:`, Object.keys(communityPlans));
  
  const plan = communityPlans[durationMonths];
  if (!plan) {
    console.log(`[activateCommunityOfferLogic] Plan not found for duration: ${durationMonths}`);
    throw { status: 400, message: `Invalid community plan duration. Available durations: ${Object.keys(communityPlans).join(', ')} months.` };
  }
  
  // Additional validation: ensure duration is a valid number and positive
  if (!Number.isInteger(durationMonths) || durationMonths < 1) {
    throw { status: 400, message: "Duration must be a positive integer (1 month or more)." };
  }
  
  console.log(`[activateCommunityOfferLogic] Found plan:`, plan);

  const feeUsd = plan.feeUsd;
  const now = new Date();
  console.log(`[activateCommunityOfferLogic] Fee: $${feeUsd}`);

  // 1. Check for ANY currently active community offer (Global check)
  console.log(`[activateCommunityOfferLogic] Checking for active offers on item: ${item._id}`);
  const activeOffer = await CommunityPayment.findOne({
    item: item._id,
    communityOfferUntill: { $gt: now },
    status: "succeeded"
  });

  if (activeOffer) {
    console.log(`[activateCommunityOfferLogic] Found active offer:`, activeOffer);
    throw {
      status: 400,
      message: "This listing already has an active community offer. You can only activate a new offer once the current one expires.",
    };
  }
  console.log(`[activateCommunityOfferLogic] No active offer found, proceeding...`);

  // 2. Validation for Free Plan (One-time per listing)
  if (feeUsd === 0) {
    const alreadyUsed = await hasUsedFreeCommunityOfferForItem(item._id);
    if (alreadyUsed) {
      throw {
        status: 400,
        message: "You have already used your one-time free community offer for this listing. Please choose a 2 or 3 month plan to re-list.",
      };
    }
  }

  // 2. Process Square Payment (if paid)
  let paymentId = existingPaymentId || null;
  let paymentProvider = existingPaymentId ? "Square" : "System";

  if (feeUsd > 0 && !existingPaymentId) {
    console.log(`[activateCommunityOfferLogic] Processing paid payment: $${feeUsd}`);
    if (!sourceId) {
      throw { status: 400, message: `Payment is required for the ${durationMonths} month community plan.` };
    }

    try {
      console.log(`[activateCommunityOfferLogic] Creating Square payment...`);
      const paymentResponse = await createSquarePayment({
        sourceId,
        amount: Math.round(feeUsd * 100),
        currency: "USD",
        idempotencyKey: `comm-act-${Date.now()}-${String(item._id).slice(-8)}`,
        note: `Community Activation (${durationMonths} months) for ${itemType}: ${item.title || item.name || item._id}`,
      });

      console.log(`[activateCommunityOfferLogic] Square payment response:`, paymentResponse);

      if (!paymentResponse?.payment?.id) {
        throw new Error("Community activation payment failed.");
      }
      paymentId = paymentResponse.payment.id;
      paymentProvider = "Square";
      console.log(`[activateCommunityOfferLogic] Payment successful, ID: ${paymentId}`);
    } catch (paymentError) {
      console.error(`[CommunityHelper] Square Error:`, paymentError.message);
      throw {
        status: 400,
        message: "Community payment failed: " + (paymentError.response?.data?.errors?.[0]?.detail || paymentError.message),
      };
    }
  } else if (!paymentId) {
    console.log(`[activateCommunityOfferLogic] Processing free plan (fee: $${feeUsd})`);
    // Free plan - only set if not already paid via consolidated payment
    paymentId = `comm-free-${Date.now()}-${item._id}`;
  }

  // 3. Create CommunityPayment record
  console.log(`[activateCommunityOfferLogic] Creating CommunityPayment record...`);
  const communityOfferUntill = new Date();
  communityOfferUntill.setMonth(communityOfferUntill.getMonth() + durationMonths);

  const cp = await CommunityPayment.create({
    user: user._id,
    item: item._id,
    itemType: itemType,
    amount: feeUsd,
    currency: "USD",
    durationMonths: durationMonths,
    communityOfferUntill: communityOfferUntill,
    isFreePlan: durationMonths === 1 && feeUsd === 0,
    paymentId: paymentId,
    paymentProvider: paymentProvider,
    status: "succeeded",
    note: feeUsd > 0 
      ? `Paid community activation (${durationMonths} months) for ${itemType}` 
      : `Free community activation (1 month) for ${itemType}`,
  });

  console.log(`[activateCommunityOfferLogic] CommunityPayment created with ID: ${cp._id}`);

  // 4. Log to TransactionLog
  console.log(`[activateCommunityOfferLogic] Creating TransactionLog...`);
  const transactionLog = await TransactionLog.create({
    buyer: user._id,
    seller: user._id,
    type: itemType.toLowerCase().includes("service") ? "service" : "product",
    purchasedItem: item._id,
    itemModel: itemType,
    totalAmount: feeUsd,
    sellerCommission: 0,
    adminCommission: feeUsd,
    currency: "USD",
    status: "succeeded",
    paymentProvider: paymentProvider,
    transactionId: paymentId,
    isCommunity: true,
    metadata: { 
      communityOffer: true, 
      communityId: cp._id, // Reference to the CommunityPayment record
      durationMonths: durationMonths,
      listingId: item._id
    },
  });

  console.log(`[activateCommunityOfferLogic] TransactionLog created with ID: ${transactionLog._id}`);
  console.log(`[activateCommunityOfferLogic] SUCCESS: All records created successfully`);
  return cp;
};

module.exports = {
  getCommunityOfferPlans,
  activateCommunityOfferLogic,
};

const PromotionSettings = require("../model/promotionSettings.model");
const TransactionLog = require("../model/TransactionLog.model");
const SellerCommissionOverride = require("../model/sellerCommissionOverride.model");

/**
 * Get special deal settings from database
 */
const getSpecialDealSettings = async () => {
  try {
    const settings = await PromotionSettings.findOne();
    if (!settings || !settings.specialDeal.enabled) {
      throw { status: 400, message: "Special deals are currently disabled." };
    }
    
    return settings.specialDeal;
  } catch (error) {
    console.error("Error fetching special deal settings:", error);
    throw { status: 500, message: "Special deal configration is not available right now. Please try again later." };
  }
};

/**
 * Validate special deal data against promotion settings
 */
const validateSpecialDealData = async (specialDealData) => {
  const settings = await getSpecialDealSettings();
  
  const {
    description,
    actualPrice,
    sellingPrice,
    itemType = 'service' // Can be 'service', 'product', 'serviceRequest', 'requestedProduct'
  } = specialDealData;
  
  // Check if special deals are allowed for this item type
  const isRequest = itemType.includes('Request') || itemType.includes('request');
  if (isRequest && !settings.allowForRequests) {
    throw { status: 400, message: "Special deals are not allowed for Requested service and Requested Product." };
  }
  
  // Validate required fields based on settings
  if (settings.requireOriginalPrice && (!actualPrice || actualPrice <= 0)) {
    throw { status: 400, message: "Original price is required for special deals." };
  }
  
  if (settings.requireDiscountedPrice && (!sellingPrice || sellingPrice <= 0)) {
    throw { status: 400, message: "Discounted price is required for special deals." };
  }
  
  // Validate price relationship based on item type
  const isRequestType = itemType.toLowerCase().includes('request');
  if (isRequestType) {
    // For requests, sellingPrice must be GREATER than actualPrice (a bounty/bonus)
    if (actualPrice && sellingPrice && Number(sellingPrice) <= Number(actualPrice)) {
      throw { status: 400, message: "Special deal price must be greater than original price for requests." };
    }
  } else {
    // For services/products, sellingPrice must be LESS than actualPrice (a discount)
    if (actualPrice && sellingPrice && Number(sellingPrice) >= Number(actualPrice)) {
      throw { status: 400, message: "Discounted price must be less than original price." };
    }
  }
  
  if (!description || description.trim().length === 0) {
    throw { status: 400, message: "Special deal description is required." };
  }
  
  return {
    activationFee: settings.activationFee,
    badgeLabel: settings.badgeLabel,
    expirationDays: settings.expirationDays,
    validatedData: {
      description: description.trim(),
      actualPrice: Number(actualPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0
    }
  };
};

/**
 * Get featured promotion plans from database
 */
const getFeaturedPromotionPlans = async () => {
  try {
    const settings = await PromotionSettings.findOne();
    if (!settings || !settings.featured.enabled) {
      throw { status: 400, message: "Featured promotions are currently disabled." };
    }
    
    // Convert database plans to the expected format
    const plans = {};
    settings.featured.plans.forEach(plan => {
      plans[plan.durationMonths] = {
        durationMonths: plan.durationMonths,
        price: plan.price
      };
    });
    
    return {
      plans,
      allowStacking: settings.featured.allowStacking,
      badgeLabel: settings.featured.badgeLabel
    };
  } catch (error) {
    console.error("Error fetching featured promotion plans:", error);
    throw { status: 500, message: "Featured promotion configuration is not available right now. Please try again later." };
  }
};

/**
 * Check if multiple promotions are allowed
 */
const checkMultiplePromotionsAllowed = async () => {
  try {
    const settings = await PromotionSettings.findOne();
    return settings?.rules?.allowMultiplePromotions || false;
  } catch (error) {
    console.error("Error checking promotion rules:", error);
    return false; // Default to false for safety
  }
};

/**
 * Get promotion eligibility for item type
 */
const getPromotionEligibility = async (itemType) => {
  try {
    const settings = await PromotionSettings.findOne();
    if (!settings) return null;
    
    const isRequest = itemType.includes('Request') || itemType.includes('request');
    const isOffer = itemType.includes('Service') || itemType.includes('Product');
    
    return {
      allowFeatured: isOffer ? settings.rules.eligibility.allowOffersPromotion : 
                 isRequest ? settings.rules.eligibility.allowRequestsPromotion : false,
      allowSpecialDeal: isOffer ? true : 
                        isRequest ? settings.rules.eligibility.allowSpecialDealForRequests : false,
      allowCommunity: isOffer ? true : 
                     isRequest ? settings.rules.eligibility.allowCommunityForRequests : false,
      // Add the field names that the controller expects
      allowRequestsPromotion: isRequest ? settings.rules.eligibility.allowRequestsPromotion : false
    };
  } catch (error) {
    console.error("Error checking promotion eligibility:", error);
    return null;
  }
};

/**
 * Get featured promotion plans from database
 */
const getFeaturedPlans = async () => {
  try {
    console.log(`[getFeaturedPlans] Fetching PromotionSettings...`);
    const settings = await PromotionSettings.findOne();
    console.log(`[getFeaturedPlans] Settings found:`, settings ? 'Yes' : 'No');
    
    if (!settings) {
      console.log(`[getFeaturedPlans] No PromotionSettings found`);
      throw { status: 500, message: "No promotion settings found in database." };
    }
    
    if (!settings.featured.enabled) {
      console.log(`[getFeaturedPlans] Featured promotions disabled`);
      throw { status: 400, message: "Featured promotions are currently disabled." };
    }
    
    console.log(`[getFeaturedPlans] Featured plans from DB:`, settings.featured.plans);
    
    // Convert database plans to the expected format
    const plans = {};
    settings.featured.plans.forEach(plan => {
      console.log(`[getFeaturedPlans] Processing plan: ${plan.durationMonths} months, price: $${plan.price}`);
      plans[plan.durationMonths] = {
        durationMonths: plan.durationMonths,
        price: plan.price
      };
    });
    
    console.log(`[getFeaturedPlans] Converted plans:`, plans);
    
    return {
      plans,
      allowStacking: settings.featured.allowStacking,
      badgeLabel: settings.featured.badgeLabel
    };
  } catch (error) {
    console.error("Error fetching featured promotion plans:", error);
    throw { status: 500, message: "Featured promotion configuration is not available right now. Please try again later." };
  }
};

/**
 * Validate featured promotion data against promotion settings
 */
const validateFeaturedData = async (durationMonthsInput) => {
  try {
    const durationMonths = parseInt(durationMonthsInput, 10);
    console.log(`[validateFeaturedData] Validating duration: ${durationMonths} (from input: ${durationMonthsInput})`);
    const featuredPlans = await getFeaturedPlans();
    console.log(`[validateFeaturedData] Available plans:`, Object.keys(featuredPlans.plans));
    
    const plan = featuredPlans.plans[durationMonths];
    
    if (!plan) {
      const availableDurations = Object.keys(featuredPlans.plans).sort((a, b) => parseInt(a) - parseInt(b));
      console.log(`[validateFeaturedData] Duration ${durationMonths} not found. Available: ${availableDurations.join(', ')}`);
      const error = new Error(`Invalid promotion plan duration. Available durations: ${availableDurations.join(', ')} months.`);
      error.status = 400;
      throw error;
    }
    
    // Additional validation: ensure duration is a valid number and positive
    if (!Number.isInteger(durationMonths) || durationMonths < 1) {
      const error = new Error("Duration must be a positive integer (1 month or more).");
      error.status = 400;
      throw error;
    }
    
    return {
      price: plan.price,
      durationMonths: plan.durationMonths,
      allowStacking: featuredPlans.allowStacking,
      badgeLabel: featuredPlans.badgeLabel
    };
  } catch (error) {
    console.error("Error validating featured data:", error);
    // If the error already has a status property, re-throw it as-is
    if (error.status) {
      throw error;
    }
    // Otherwise, create a generic error
    const genericError = new Error("Featured promotion validation failed.");
    genericError.status = 500;
    throw genericError;
  }
};

/**
 * Get commission rates from database
 */
const getCommissionRates = async () => {
  try {
    const settings = await PromotionSettings.findOne();
    if (!settings || !settings.commission) {
      // Return default commission rates if not configured
      return {
        type: 'percentage',
        standard: { offerPercent: 0, requestPercent: 0 },
        featured: { offerPercent: 0, requestPercent: 0 },
        specialDeal: { offerPercent: 0, requestPercent: 0 },
        community: { free: 0, donation: 0, lowCostPercent: 0 }
      };
    }
    
    return settings.commission;
  } catch (error) {
    console.error("Error fetching commission rates:", error);
    // Return default rates on error
    return {
      type: 'percentage',
      standard: { offerPercent: 0, requestPercent: 0 },
      featured: { offerPercent: 0, requestPercent: 0 },
      specialDeal: { offerPercent: 0, requestPercent: 0 },
      community: { free: 0, donation: 0, lowCostPercent: 0 }
    };
  }
};

/**
 * Calculate commission amounts based on rates and total amount
 */
const calculateCommission = (totalAmount, commissionRate, commissionType) => {
  if (commissionType === 'percentage') {
    return parseFloat((totalAmount * commissionRate / 100).toFixed(2));
  } else if (commissionType === 'flat') {
    return parseFloat(commissionRate.toFixed(2));
  }
  return 0;
};

/**
 * Activate featured promotion logic
 * Similar to community offer logic but for featured promotions
 */
const activateFeaturedPromotionLogic = async ({
  user,
  item,
  itemType,
  durationMonths,
  sourceId,
  existingPaymentId
}) => {
  try {
    console.log(`[activateFeaturedPromotionLogic] Starting with durationMonths: ${durationMonths}, itemType: ${itemType}`);
    
    // Validate featured promotion data
    const validation = await validateFeaturedData(durationMonths);
    console.log(`[activateFeaturedPromotionLogic] Validation:`, validation);
    
    const price = validation.price;
    const now = new Date();
    
    // Check for existing active featured promotion
    // This would depend on your FeaturedPayment model structure
    // For now, we'll create the transaction log directly
    
    // Create TransactionLog for featured promotion
    const transactionLog = await TransactionLog.create({
      buyer: user._id,
      seller: user._id,
      type: itemType.toLowerCase().includes("service") ? "service" : "product",
      purchasedItem: item._id,
      itemModel: itemType,
      totalAmount: price,
      sellerCommission: 0,
      adminCommission: price,
      currency: "USD",
      status: "succeeded",
      paymentProvider: existingPaymentId ? "Square" : "System",
      transactionId: existingPaymentId || `featured-${Date.now()}-${item._id}`,
      isFeatured: true,
      metadata: { 
        featuredPromotion: true, 
        durationMonths: durationMonths,
        listingId: item._id,
        badgeLabel: validation.badgeLabel
      },
    });

    console.log(`[activateFeaturedPromotionLogic] TransactionLog created with ID: ${transactionLog._id}`);
    console.log(`[activateFeaturedPromotionLogic] SUCCESS: Featured promotion activated successfully`);
    
    return {
      success: true,
      transactionId: transactionLog._id,
      price: price,
      durationMonths: durationMonths,
      badgeLabel: validation.badgeLabel
    };
    
  } catch (error) {
    console.error(`[activateFeaturedPromotionLogic] Error:`, error.message);
    throw {
      status: error.status || 500,
      message: error.message || "Failed to activate featured promotion"
    };
  }
};

/**
 * Calculate commission based on dynamic database settings
 * Handles Offer vs Request, Promotion Levels, and Min/Max constraints.
 */
const calculateDynamicCommission = async (totalAmount, item, itemType) => {
  try {
    console.log(`[CommissionDebug] --- START ---`);
    console.log(`[CommissionDebug] itemType: ${itemType}, totalAmount: ${totalAmount}`);
    console.log(`[CommissionDebug] item keys: ${Object.keys(item.toObject ? item.toObject() : item)}`);
    console.log(`[CommissionDebug] item.isCommunity: ${item.isCommunity}`);
    console.log(`[CommissionDebug] item.service.isCommunity: ${item.service?.isCommunity}`);

    // 1. Identify Seller ID
    const sellerId = item.seller?._id || item.seller || item.sellerId;
    
    // 2. Fetch Global Settings (Layer 1)
    const settings = await PromotionSettings.findOne();
    if (!settings || !settings.commission) {
      return {
        adminCommission: 0,
        sellerCommission: totalAmount,
        appliedRate: 0,
        appliedType: 'none'
      };
    }

    const { commission: globalCommission } = settings;
    
    // 3. Check for Active Seller Override (Layer 2)
    let activeOverride = null;
    if (sellerId) {
      const override = await SellerCommissionOverride.findOne({ sellerId });
      if (override && override.isActive()) {
        activeOverride = override;
      }
    }

    const isRequest = itemType.toLowerCase().includes('request') || itemType.toLowerCase().includes('requested');
    
    // Determine Promotion Level
    let level = 'standard';
    
    // 3.5 Robust level detection
    const checkSpecial = (it) => it.isSpecial || it.specialOffer || it.specialDealDetails?.isSpecialDeal;
    const checkPromoted = (it) => it.isPromoted || it.promotionDetails?.isPromoted;
    const checkCommunity = (it) => it.isCommunity || (it.service && it.service.isCommunity);
    
    const hasSpecial = checkSpecial(item) || (item.items && item.items.some(checkSpecial));
    const hasPromoted = checkPromoted(item) || (item.items && item.items.some(checkPromoted));
    const hasCommunity = checkCommunity(item) || (item.items && item.items.some(checkCommunity));

    if (hasSpecial) {
      level = 'specialDeal';
    } else if (hasPromoted) {
      level = 'featured';
    } else if (hasCommunity) {
      level = 'community';
    }

    let adminCommission = 0;
    let appliedRate = 0;
    let usedOverride = false;

    // 4. Resolve Commission (Override vs Global)
    const effectiveCommission = activeOverride || globalCommission;
    usedOverride = !!activeOverride;

    // 5. Determine the rate
    const overridePercent = activeOverride?.percentage;
    console.log(`[CommissionDebug] activeOverride: ${!!activeOverride}, overridePercent: ${overridePercent}`);
    
    if (overridePercent !== null && overridePercent !== undefined) {
      appliedRate = overridePercent;
      appliedType = 'override';
    } else {
      console.log(`[CommissionDebug] Entering fallback block (Global Settings)`);
      // Fallback to Global Settings logic
      const standardRates = globalCommission.standard || { offerPercent: 0, requestPercent: 0 };
      const standardPercent = isRequest ? (standardRates.requestPercent ?? 0) : (standardRates.offerPercent ?? 0);
      console.log(`[CommissionDebug] Detected level: ${level}, standardPercent: ${standardPercent}`);

      if (level === 'community') {
        const subcategory =
          item.subcategory ||
          (item.service && item.service.subcategory) ||
          (item.items &&
            item.items.find((it) => it.product?.subcategory)?.product
              ?.subcategory);

        console.log(`[CommissionDebug] Level: community, Subcategory found: ${subcategory}`);
        console.log(`[CommissionDebug] Global Community Config:`, JSON.stringify(globalCommission.community));

        let subCommission = null;

        if (subcategory && globalCommission.community?.subcategoryCommissions) {
          subCommission = globalCommission.community.subcategoryCommissions.find(
            (sc) => sc.subcategory.trim().toLowerCase() === subcategory.trim().toLowerCase()
          );
        }

        console.log(`[CommissionDebug] Specific SubCommission found:`, JSON.stringify(subCommission));

        // If subcategory commission exists and is NOT 0, use it.
        // Otherwise, fall back to global community commission.
        if (subCommission && subCommission.lowCostPercent !== 0) {
          appliedRate = subCommission.lowCostPercent;
        } else {
          appliedRate =
            globalCommission.community?.lowCostPercent ?? standardPercent;
        }
        console.log(`[CommissionDebug] Final appliedRate for community: ${appliedRate}`);
      } else {
        const levelConfig = globalCommission[level] || globalCommission.standard;
        const levelPercent = isRequest ? levelConfig?.requestPercent : levelConfig?.offerPercent;
        appliedRate = (level !== 'standard' && (levelPercent === null || levelPercent === undefined || levelPercent === 0)) 
          ? standardPercent 
          : (levelPercent ?? 0);
      }
      appliedType = 'global';
    }
    
    adminCommission = parseFloat((totalAmount * appliedRate / 100).toFixed(2));

    // Apply Constraints (Min/Max) - Only from Global Settings
    let minApplied = false;
    let maxApplied = false;

    if (adminCommission < globalCommission.minimumAmount) {
      adminCommission = globalCommission.minimumAmount;
      minApplied = true;
    }

    if (globalCommission.maximumCap > 0 && adminCommission > globalCommission.maximumCap) {
      adminCommission = globalCommission.maximumCap;
      maxApplied = true;
    }

    const sellerCommission = parseFloat((totalAmount - adminCommission).toFixed(2));

    return {
      adminCommission,
      sellerCommission,
      appliedRate,
      level,
      usedOverride,
      constraints: { minApplied, maxApplied }
    };
  } catch (error) {
    console.error("Error calculating dynamic commission:", error);
    return {
      adminCommission: 0,
      sellerCommission: totalAmount,
      appliedRate: 0,
      level: 'error'
    };
  }
};

module.exports = {
  getSpecialDealSettings,
  validateSpecialDealData,
  getFeaturedPromotionPlans,
  checkMultiplePromotionsAllowed,
  getPromotionEligibility,
  getFeaturedPlans,
  validateFeaturedData,
  activateFeaturedPromotionLogic,
  getCommissionRates,
  calculateCommission,
  calculateDynamicCommission
};

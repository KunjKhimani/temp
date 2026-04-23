// controllers/serviceRequest.controller.js
const ServiceRequest = require("../model/serviceRequest.model");
const SpecialOffer = require("../model/specialOffer.model");
const User = require("../model/user.model"); // If needed for user checks
const mongoose = require("mongoose");
const path = require("path"); // For file uploads
const fs = require("fs").promises; // For file system operations (async)
const PROMOTION_TYPES = require("../utils/promotionTypes");
const ServiceRequestOrder = require("../model/ServiceRequestOrderSchema"); // Import the new ServiceRequestOrder model
const {
  createAndDispatchNotification,
} = require("../services/notification.service");
const {
  createPaymentIntent,
  retrievePaymentIntent,
  createTransfer, // NEW: For releasing funds to seller
  createRefund, // NEW: For processing refunds
  confirmBackendPaymentIntent,
  repopulatePendingIntent,
} = require("../utils/stripeService");
const {
  newOfferReceivedEmail,
  offerRejectedEmailToSeller,
  offerAcceptedEmailToSeller,
} = require("../utils/sendEmail");
const TransactionLog = require("../model/TransactionLog.model");
const { getSquareConfig, createPayment: createSquarePayment, completePayment: completeSquarePayment } = require("../utils/squareService");
const SpecialOfferPayment = require("../model/specialOfferPayment.model");
const CommunityPayment = require("../model/communityPayment.model");
const { hasUsedFreeCommunityOfferForItem } = require("../utils/communityUtils");
const { activateCommunityOfferLogic } = require("../utils/communityHelper");
const { validateSpecialDealData, getPromotionEligibility, getFeaturedPlans, validateFeaturedData, activateFeaturedPromotionLogic, getCommissionRates, calculateDynamicCommission } = require("../utils/promotionHelper");
const { getFeaturedSortStage } = require("../utils/sortingHelper");

const SPECIAL_OFFER_ACTIVATION_FEE_CENTS = 500; // $5.00

const PROMOTION_PLAN_CONFIG = Object.freeze({
  1: { durationMonths: 1, feeUsd: 4.99 },
  3: { durationMonths: 3, feeUsd: 9.9 },
  6: { durationMonths: 6, feeUsd: 15.99 },
});

const PROMOTION_PRICING_PROFILES = Object.freeze({
  DEFAULT: "default",
  COMMUNITY_OFFERS: "community_offers",
});

// (Handled via dynamic promotion settings in helper)

const DEFAULT_PROMOTION_DURATION_MONTHS = 1;

const getPromotionPlanConfig = async (
  durationMonthsInput,
  pricingProfile = PROMOTION_PRICING_PROFILES.DEFAULT
) => {
  try {
    if (pricingProfile === PROMOTION_PRICING_PROFILES.COMMUNITY_OFFERS) {
      // Use dynamic community plans
      const { getCommunityOfferPlans } = require("../utils/communityHelper");
      const communityPlans = await getCommunityOfferPlans();
      const parsedDuration = Number(durationMonthsInput);
      const normalizedDuration = communityPlans[parsedDuration]
        ? parsedDuration
        : DEFAULT_PROMOTION_DURATION_MONTHS;
      return communityPlans[normalizedDuration];
    } else {
      // Use dynamic featured plans
      const featuredPlans = await getFeaturedPlans();
      const parsedDuration = Number(durationMonthsInput);
      const normalizedDuration = featuredPlans.plans[parsedDuration]
        ? parsedDuration
        : DEFAULT_PROMOTION_DURATION_MONTHS;
      return featuredPlans.plans[normalizedDuration];
    }
  } catch (error) {
    console.error("[getPromotionPlanConfig] Error:", error.message);
    // Fallback to default if dynamic fetch fails
    return {
      durationMonths: DEFAULT_PROMOTION_DURATION_MONTHS,
      feeUsd: 4.99 // Default featured price
    };
  }
};

const parseBooleanLike = (value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
};

const processArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    const p = JSON.parse(field);
    return Array.isArray(p) ? p : [p];
  } catch (e) {
    return [field];
  }
};

const verifyPromotionStatus = (req) => {
  if (req && req.promotionDetails && req.promotionDetails.isPromoted && req.promotionDetails.promotedUntil) {
    if (new Date(req.promotionDetails.promotedUntil) < new Date()) {
      req.promotionDetails.isPromoted = false;
      req.requestType = PROMOTION_TYPES.STANDARD;
    }
  }
  return req;
};


// ... (createServiceRequest - assumed to be mostly unchanged for this scope)
const createServiceRequest = async (req, res) => {
  console.log(`[createServiceRequest] REQUEST RECEIVED! Method: ${req.method}, URL: ${req.url}`);
  try {
    const buyerId = req.user._id;
    const buyerUser = req.user;
    let {
      title,
      description,
      category,
      subcategory,
      budgetMin,
      budgetMax,
      budgetType,
      desiredDeliveryTime,
      locationPreference,
      onSiteAddresses,
      tags,
      invitedProviders,
      requiredSkills,
      experienceLevel,
      scopeUnit,
      scopeQuantity,
      scopeDetails,
      promotionDurationMonths,
      promotionPricingProfile,
      listAsSpecialDeal,
      specialDealDescription,
      specialDealActualPrice,
      specialDealSellingPrice,
      isSpecial,               // New SpecialOffer fields
      specialDescription,
      actualPrice,
      sellingPrice,
      isCommunity,            // New Community field
      durationMonths,         // Duration field for community/promotion (plural)
      durationMonth,          // Duration field for community/promotion (singular)
      specialDealDuration,    // New field for seller-defined expiration (in days)
      specialOfferSourceId,    // Added for Square payment
      communityOfferSourceId, // Added for Square payment for community
      sourceId,               // Generic sourceId fallback
    } = req.body;

    // Parse numeric fields
    const promotionDuration = parseInt(promotionDurationMonths || req.body.promotionDurationMonth, 10);
    
    // Default requestType to "standard" if missing or invalid
    let requestType = req.body.requestType;
    if (!requestType || !Object.values(PROMOTION_TYPES).includes(requestType)) {
      requestType = PROMOTION_TYPES.STANDARD;
    }

    const normalizedPromotionPricingProfile =
      promotionPricingProfile === PROMOTION_PRICING_PROFILES.COMMUNITY_OFFERS || parseBooleanLike(isCommunity)
        ? PROMOTION_PRICING_PROFILES.COMMUNITY_OFFERS
        : PROMOTION_PRICING_PROFILES.DEFAULT;

    const isSpecialDealSelected = parseBooleanLike(listAsSpecialDeal) || parseBooleanLike(isSpecial);
    const isCommunitySelected = parseBooleanLike(isCommunity);

    if (req.user.isSeller && !isSpecialDealSelected && !isCommunitySelected) {
      return res.status(400).json({
        message: "Only Buyer account can access this function",
      });
    }

    // Check promotion eligibility for ServiceRequest
    try {
      const eligibility = await getPromotionEligibility("ServiceRequest");
      
      if (isSpecialDealSelected && !eligibility?.allowSpecialDeal) {
        console.log(`[createServiceRequest] Special deal not allowed`);
        return res.status(400).json({
          message: "Special deals are not allowed for service requests.",
        });
      }
      
      if (isCommunitySelected && !eligibility?.allowCommunity) {
        console.log(`[createServiceRequest] Community offer not allowed`);
        return res.status(400).json({
          message: "Community offers are not allowed for service requests.",
        });
      }
      
      if (requestType === PROMOTION_TYPES.PROMOTED && !eligibility?.allowRequestsPromotion) {
        console.log(`[createServiceRequest] Featured promotion not allowed`);
        return res.status(400).json({
          message: "Featured promotions are not allowed for service requests.",
        });
      }
      
    } catch (eligibilityError) {
      console.error("[createServiceRequest] Promotion Eligibility Check Error:", eligibilityError.message);
      console.error("[createServiceRequest] Error stack:", eligibilityError.stack);
      // Continue with request if eligibility check fails, but log the error
    }
    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Title, description, and category are required.",
      });
    }


    // --- VALIDATION AND PRICING CALCULATION ---
    let promotionFeeUsd = 0;
    let promotionDurationInMonths = 0;
    let promotionPlan = { durationMonths: 0, feeUsd: 0 };

    if (requestType === PROMOTION_TYPES.PROMOTED) {
      promotionPlan = await getPromotionPlanConfig(
        promotionDuration,
        normalizedPromotionPricingProfile
      );
      promotionFeeUsd = promotionPlan.feeUsd;
      promotionDurationInMonths = promotionPlan.durationMonths;
    }

    let featuredValidationResult = null;
    if (requestType === PROMOTION_TYPES.PROMOTED && promotionDuration) {
      try {
        const featuredValidation = await validateFeaturedData(promotionDuration);
        promotionFeeUsd = featuredValidation.price;
        promotionDurationInMonths = featuredValidation.durationMonths;
        featuredValidationResult = featuredValidation;
      } catch (validationError) {
        return res.status(validationError.status || 400).json({
          message: validationError.message || "Featured promotion validation failed.",
        });
      }
    }

    let parsedSpecialDealDetails = null;
    let specialDealFeeUsd = 0;
    if (isSpecialDealSelected) {
      try {
        const specialDealData = {
          description: specialDescription || specialDealDescription || "",
          actualPrice: Number(specialDealActualPrice || actualPrice),
          sellingPrice: Number(specialDealSellingPrice || sellingPrice),
          itemType: "ServiceRequest",
        };
        const validation = await validateSpecialDealData(specialDealData);
        parsedSpecialDealDetails = validation.validatedData;
        specialDealFeeUsd = validation.activationFee;
      } catch (validationError) {
        return res.status(validationError.status || 400).json({
          message: validationError.message || "Special deal validation failed.",
        });
      }
    }

    const totalCheckoutFeeUsd = promotionFeeUsd + specialDealFeeUsd;
        

    let parsedOnSiteAddresses = [];
    if (locationPreference === "on-site") {
      if (onSiteAddresses) {
        try {
          parsedOnSiteAddresses =
            typeof onSiteAddresses === "string"
              ? JSON.parse(onSiteAddresses)
              : onSiteAddresses;
          if (!Array.isArray(parsedOnSiteAddresses)) {
            parsedOnSiteAddresses = [parsedOnSiteAddresses];
          }
          if (
            parsedOnSiteAddresses.some((addr) => !addr.city || !addr.country)
          ) {
            return res.status(400).json({
              message:
                "Each on-site address must include at least city and country.",
            });
          }
        } catch (e) {
          return res
            .status(400)
            .json({ message: "Invalid format for on-site addresses." });
        }
      }
      if (parsedOnSiteAddresses.length === 0) {
        return res.status(400).json({
          message: "At least one address is required for on-site requests.",
        });
      }
    }

    const parsedTags = processArrayField(tags);
    const parsedRequiredSkills = processArrayField(requiredSkills);
    let parsedInvitedProviders = processArrayField(invitedProviders).filter(
      (id) => mongoose.Types.ObjectId.isValid(id)
    );

    if (
      requestType === PROMOTION_TYPES.STANDARD &&
      parsedInvitedProviders.length > 20
    ) {
      parsedInvitedProviders = parsedInvitedProviders.slice(0, 20);
    }

    let attachmentPaths = [];
    if (req.files && req.files.length > 0) {
      attachmentPaths = req.files.map((file) => {
        const uploadsBaseDir = path.join(__dirname, "..", "uploads");
        const relativePath = path.relative(uploadsBaseDir, file.path);
        return relativePath.replace(/\\/g, "/");
      });
    }

    const serviceRequestData = {
      title,
      description,
      category,
      subcategory: subcategory || undefined,
      budget: {
        min:
          budgetMin && !isNaN(parseFloat(budgetMin))
            ? parseFloat(budgetMin)
            : undefined,
        max:
          budgetMax && !isNaN(parseFloat(budgetMax))
            ? parseFloat(budgetMax)
            : undefined,
        type: budgetType || "open_to_offers",
        currency: "USD",
      },
      desiredDeliveryTime: desiredDeliveryTime || undefined,
      locationPreference: locationPreference || "flexible",
      onSiteAddresses:
        locationPreference === "on-site" ? parsedOnSiteAddresses : [],
      attachments: attachmentPaths,
      tags: parsedTags,
      createdBy: buyerId,
      status:
        totalCheckoutFeeUsd > 0
          ? "pending_promotion_payment"
          : "open",
      invitedProviders: parsedInvitedProviders,
      requiredSkills: parsedRequiredSkills,
      experienceLevel: experienceLevel || "any",
      scopeOfWork: {
        unit: scopeUnit || undefined,
        quantity:
          scopeQuantity && !isNaN(parseFloat(scopeQuantity))
            ? parseFloat(scopeQuantity)
            : undefined,
        details: scopeDetails || undefined,
      },
      requestType: requestType,
      promotionDetails: {
        isPromoted: false,
        feeAmount: promotionFeeUsd,
        feeCurrency: "USD",
        durationMonths:
          requestType === PROMOTION_TYPES.PROMOTED
            ? promotionDurationInMonths
            : undefined,
      },
      specialDealDetails: {
        isSpecialDeal: isSpecialDealSelected,
        activationFeeAmount: specialDealFeeUsd || undefined,
        activationFeeCurrency: isSpecialDealSelected ? "USD" : undefined,
        description: parsedSpecialDealDetails?.description,
        actualPrice: parsedSpecialDealDetails?.actualPrice,
        sellingPrice: parsedSpecialDealDetails?.sellingPrice,
      },
      isCommunity: parseBooleanLike(isCommunity) || normalizedPromotionPricingProfile === PROMOTION_PRICING_PROFILES.COMMUNITY_OFFERS,
    };

    const serviceRequest = new ServiceRequest(serviceRequestData);

    // --- COMMUNITY OFFER HANDLING (Initial Creation) ---
    if (isCommunitySelected) {
      const requestedDuration = parseInt(durationMonths || durationMonth, 10) || 1;
      const effectiveSourceId = communityOfferSourceId || specialOfferSourceId || sourceId;

      try {
        const cp = await activateCommunityOfferLogic({
          user: req.user,
          item: serviceRequest,
          itemType: "ServiceRequest",
          durationMonths: requestedDuration,
          sourceId: effectiveSourceId,
        });

        serviceRequest.communityPayment = cp._id;
        serviceRequest.isCommunity = true;
        await serviceRequest.save();
      } catch (activationError) {
        console.error("[createServiceRequest] Community Activation Error:", activationError.message);
        if (activationError.status) {
          throw activationError;
        }
      }
    }


    // --- Special Offer Handling (Square Activation Fee) ---
    // Only process Square payment if it's NOT being handled by the unified Stripe checkout
    let activationPaymentId = null;
    if (isSpecialDealSelected) {
      // Validation already performed at line 287

      // Handle Square Payment for Activation ONLY if no unified checkout is present
      const effectiveSourceId = specialOfferSourceId || communityOfferSourceId || sourceId;
      if (totalCheckoutFeeUsd === 0 && !effectiveSourceId) {
        return res.status(400).json({
          message: "Payment is required to list this service request as a special deal.",
        });
      }

      if (effectiveSourceId && totalCheckoutFeeUsd === 0) {
        try {
          const paymentResponse = await createSquarePayment({
            sourceId: effectiveSourceId,
            amount: specialDealFeeUsd * 100,
            currency: "USD",
            idempotencyKey: `act-sp-srvreq-${Date.now()}-${String(buyerId).slice(-8)}`,
            note: `Special Offer Activation Fee for Service Request: ${title}`,
          });

          if (!paymentResponse?.payment?.id) {
            return res.status(400).json({
              message: "Special offer activation payment failed. Please try again.",
            });
          }
          activationPaymentId = paymentResponse.payment.id;
        } catch (paymentError) {
          console.error("[createServiceRequest] Payment error:", paymentError.message);
          return res.status(400).json({
            message: "Payment failed: " + (paymentError.response?.data?.errors?.[0]?.detail || paymentError.message),
          });
        }
      }

      serviceRequest.isSpecial = true;
    }

    const savedServiceRequest = await serviceRequest.save();

    // --- FEATURED PROMOTION ACTIVATION (After serviceRequest is created) ---
    if (featuredValidationResult && requestType === PROMOTION_TYPES.PROMOTED) {
      console.log(`[createServiceRequest] Activating featured promotion for saved serviceRequest...`);
      try {
        const featuredActivation = await activateFeaturedPromotionLogic({
          user: req.user,
          item: savedServiceRequest,
          itemType: "ServiceRequest",
          durationMonths: promotionDurationMonths,
          sourceId: sourceId,
          existingPaymentId: null
        });
        
        console.log(`[createServiceRequest] Featured activation successful:`, featuredActivation);
      } catch (activationError) {
        console.error("[createServiceRequest] Featured Activation Error:", activationError.message);
        // Don't fail the whole request if featured activation fails
      }
    }

    if (savedServiceRequest.isSpecial) {
      const aPrice = parseFloat(actualPrice);
      const sPrice = parseFloat(sellingPrice);

      // Calculate expiration if duration is provided
      let expiresAt = null;
      const durationDays = parseInt(specialDealDuration, 10);
      
      if (durationDays && durationDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
      }

      const specialOffer = new SpecialOffer({
        item: savedServiceRequest._id,
        itemType: "ServiceRequest",
        description: specialDescription || specialDealDescription,
        actualPrice: aPrice,
        sellingPrice: sPrice,
        priceDifference: parseFloat((sPrice - aPrice).toFixed(2)),
        discountPercentage: 0,
        durationDays: durationDays || undefined,
        expiresAt: expiresAt,
        status: "active",
      });

      const savedOffer = await specialOffer.save();
      savedServiceRequest.specialOffer = savedOffer._id;
      await savedServiceRequest.save();

      if (activationPaymentId) {
        const paymentId = activationPaymentId;
        // Create SpecialOfferPayment record
        await SpecialOfferPayment.create({
          user: buyerId,
          item: savedServiceRequest._id,
          itemType: "ServiceRequest",
          amount: SPECIAL_OFFER_ACTIVATION_FEE_CENTS / 100,
          currency: "USD",
          paymentId: paymentId,
          status: "succeeded",
          note: `Activated special offer for service request: ${savedServiceRequest.title}`,
        });

        // Calculate dynamic commissions for TransactionLog
        const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
          specialDealFeeUsd,
          savedServiceRequest,
          "serviceRequest"
        );

        // Log the transaction
        await TransactionLog.create({
          buyer: buyerId,
          seller: buyerId,
          type: "service",
          purchasedItem: savedServiceRequest._id,
          itemModel: "ServiceRequest",
          totalAmount: specialDealFeeUsd,
          sellerCommission: 0,
          adminCommission: specialDealFeeUsd,
          currency: "USD",
          status: "succeeded",
          paymentProvider: "Square",
          transactionId: paymentId,
          isSpecial: true,
          isCommunity: savedServiceRequest.isCommunity,
          specialOffer: savedOffer._id,
          metadata: { activationFee: true, commissionLevel: level },
        }).catch(err => console.error("Error logging special offer activation:", err));
      }
    }

    let stripeResponse = null;
    if (totalCheckoutFeeUsd > 0) {
      const stripeAmount = Math.round(totalCheckoutFeeUsd * 100);
      const stripeMetadata = {
        promotion_order_type: "service_request_promotion",
        buyer_id: buyerId.toString(),
        service_request_id: savedServiceRequest._id.toString(),
        promotion_duration_months: String(promotionDurationInMonths),
        promotion_pricing_profile: normalizedPromotionPricingProfile,
        promotion_fee_usd: String(promotionFeeUsd),
        special_deal_fee_usd: String(specialDealFeeUsd),
        special_deal_enabled: String(isSpecialDealSelected),
        is_community: String(serviceRequestData.isCommunity),
      };
      const checkoutDescriptionParts = [];
      if (promotionFeeUsd > 0) {
        checkoutDescriptionParts.push(
          `promotion (${promotionDurationInMonths} month${promotionDurationInMonths > 1 ? "s" : ""
          })`
        );
      }
      if (specialDealFeeUsd > 0) {
        checkoutDescriptionParts.push("special deal activation");
      }
      const stripeDescription = `Payment for ${checkoutDescriptionParts.join(
        " + "
      )} on Service Request: ${savedServiceRequest.title.substring(0, 30)}...`;

      stripeResponse = await createPaymentIntent(
        stripeAmount,
        "usd",
        stripeMetadata,
        stripeDescription
      );

      if (
        !stripeResponse.success ||
        !stripeResponse.paymentIntent?.client_secret
      ) {
        await ServiceRequest.findByIdAndDelete(savedServiceRequest._id);
        return res.status(500).json({
          message:
            stripeResponse.message ||
            "Failed to initialize promotion payment.",
        });
      }

      const promotionOrderData = {
        serviceRequestId: savedServiceRequest._id,
        buyer: buyerId,
        amount: totalCheckoutFeeUsd,
        totalPrice: totalCheckoutFeeUsd,

        currency: "USD",
        status: "pending-payment",
        paymentIntentId: stripeResponse.paymentIntent.id, // Now included
        paymentIntentClientSecret: stripeResponse.paymentIntent.client_secret,
        isSpecial: isSpecialDealSelected,
        actualPriceAtOrder: parsedSpecialDealDetails?.actualPrice,
        sellingPriceAtOrder: parsedSpecialDealDetails?.sellingPrice,
      };

      const promotionOrder = new ServiceRequestOrder(promotionOrderData);
      try {
        const savedPromotionOrder = await promotionOrder.save();

        savedServiceRequest.promotionDetails.promotionOrderId =
          savedPromotionOrder._id;
        savedServiceRequest.promotionDetails.paymentId =
          stripeResponse.paymentIntent.id;
        await savedServiceRequest.save();

        // --- CREATE PENDING COMMUNITY PAYMENT ---
        if (serviceRequestData.isCommunity) {
          await CommunityPayment.create({
            user: buyerId,
            item: savedServiceRequest._id,
            itemType: "ServiceRequest",
            amount: totalCheckoutFeeUsd,
            currency: "USD",
            durationMonths: promotionDurationInMonths,
            communityOfferUntill: new Date(new Date().setMonth(new Date().getMonth() + promotionDurationInMonths)),
            paymentId: stripeResponse.paymentIntent.id,
            paymentProvider: "Stripe",
            status: "pending",
            note: `Community promotion for: ${savedServiceRequest.title}`,
          }).then(cp => {
            savedServiceRequest.communityPayment = cp._id;
            return savedServiceRequest.save();
          }).catch(err => console.error("Error creating pending community payment:", err));
        }

        return res.status(201).json({
          message:
            "Service request created. Please complete payment to publish it.",
          serviceRequest: savedServiceRequest,
          promotionOrder: {
            _id: savedPromotionOrder._id,
            totalPrice: savedPromotionOrder.totalPrice,
            currency: savedPromotionOrder.currency,
            status: savedPromotionOrder.status,
            paymentIntentId: stripeResponse.paymentIntent.id,
          },
          paymentBreakdown: {
            promotionFee: promotionFeeUsd,
            specialDealFee: specialDealFeeUsd,
            totalFee: totalCheckoutFeeUsd,
            currency: "USD",
          },
          isCommunity: serviceRequestData.isCommunity,
          clientSecret: stripeResponse.paymentIntent.client_secret,
          paymentRequired: true,
        });
      } catch (orderError) {
        await ServiceRequest.findByIdAndDelete(savedServiceRequest._id);
        console.error(
          "Error creating service request promotion order:",
          orderError.message,
          orderError.stack
        );
        if (orderError.name === "ValidationError") {
          return res.status(400).json({
            message: "Promotion Order Validation Error",
            errors: orderError.errors,
          });
        }
        return res
          .status(500)
          .json({ message: "Internal Server Error creating promotion order." });
      }
    } else {
      if (requestType === PROMOTION_TYPES.PROMOTED) {
        const promotedUntilDate = new Date();
        promotedUntilDate.setMonth(
          promotedUntilDate.getMonth() + promotionDurationInMonths
        );
        savedServiceRequest.promotionDetails.isPromoted = true;
        savedServiceRequest.promotionDetails.promotedUntil = promotedUntilDate;
        await savedServiceRequest.save();
      }

      if (parsedInvitedProviders.length > 0) {
        const io = req.app.get("socketio");
        const buyerName = buyerUser.name || buyerUser.companyName || "A buyer";
        for (const providerId of parsedInvitedProviders) {
          if (providerId.toString() === buyerId.toString()) continue;
          const providerUser = await User.findById(providerId)
            .select("name email")
            .lean();
          const providerNameForEmail = providerUser
            ? providerUser.name
            : "Service Provider";

          createAndDispatchNotification(
            {
              recipientId: providerId,
              senderId: buyerId,
              type: "SERVICE_REQUEST_INVITATION",
              title: "You've Been Invited to a Service Request!",
              message: `${buyerName} invited you to: "${savedServiceRequest.title.substring(
                0,
                50
              )}..."`,
              link: `/service-request/${savedServiceRequest._id}`,
              relatedResource: savedServiceRequest._id,
              relatedResourceType: "ServiceRequest",
              io,
            },
            {
              emailTemplateFunc: "serviceRequestInvitationEmail",
              emailTemplateArgs: [
                providerNameForEmail,
                providerUser?.email,
                buyerName,
                savedServiceRequest.title,
                `${process.env.CLIENT_URL || "http://localhost:5173"
                }/service-request/${savedServiceRequest._id}`,
              ],
            }
          ).catch((err) =>
            console.error(`Error dispatching invitation to ${providerId}:`, err)
          );
        }
      }
      res.status(201).json({
        message: "Service request created successfully.",
        serviceRequest: savedServiceRequest,
        isCommunity: savedServiceRequest.isCommunity,
        paymentRequired: false,
      });

      // --- LOG COMMUNITY TRANSACTION IF FREE ---
      if (savedServiceRequest.isCommunity && totalCheckoutFeeUsd === 0) {
        await TransactionLog.create({
          buyer: buyerId,
          seller: buyerId, // Self-transaction for promotion if free
          type: "service",
          purchasedItem: savedServiceRequest._id,
          itemModel: "ServiceRequest",
          totalAmount: 0,
          sellerCommission: 0,
          adminCommission: 0,
          currency: "USD",
          status: "succeeded",
          paymentProvider: "System",
          transactionId: `comm-free-${savedServiceRequest._id}`,
          isCommunity: true,
          metadata: { communityOffer: true, freePromotion: true },
        }).catch(err => console.error("Error logging free community transaction:", err));

        // --- CREATE SUCCESSFUL COMMUNITY PAYMENT (FREE) ---
        await CommunityPayment.create({
          user: buyerId,
          item: savedServiceRequest._id,
          itemType: "ServiceRequest",
          amount: 0,
          currency: "USD",
          durationMonths: promotionDurationInMonths,
          communityOfferUntill: new Date(new Date().setMonth(new Date().getMonth() + promotionDurationInMonths)),
          paymentId: `comm-free-${savedServiceRequest._id}`,
          paymentProvider: "System",
          status: "succeeded",
          note: `Free community promotion for: ${savedServiceRequest.title}`,
        }).then(cp => {
          savedServiceRequest.communityPayment = cp._id;
          return savedServiceRequest.save();
        }).catch(err => console.error("Error creating free community payment:", err));
      }
    }
  } catch (error) {
    console.error(
      "Error creating service request:",
      error.message,
      error.stack
    );
    if (
      error.name === "ValidationError" &&
      error.errors &&
      error.errors["promotionDetails.promotionOrderId"] === undefined
    ) {
      return res.status(400).json({
        message: "Service Request Validation Error",
        errors: error.errors,
      });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error creating service request." });
  }
};

// --- SELLER SUBMITS AN OFFER/BID ON A SERVICE REQUEST ---
const submitOfferOnServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sellerId = req.user._id; // Seller making the offer
    const sellerUser = req.user; // Full seller user object for name

    const {
      message,
      proposedPrice,
      priceType, // 'fixed', 'per_hour', etc.
      proposedDeliveryTime,
      availabilityDate,
      availabilityTimeSlot, // 'morning', 'afternoon', 'evening', 'flexible', 'specific_time'
      specificTime, // If availabilityTimeSlot is 'specific_time'
      linkedServiceId, // Optional ID of seller's existing service
    } = req.body;

    if (!message || proposedPrice === undefined || !priceType) {
      return res.status(400).json({
        message:
          "Message, proposed price, and price type are required for an offer.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid service request ID." });
    }
    if (linkedServiceId && !mongoose.Types.ObjectId.isValid(linkedServiceId)) {
      return res.status(400).json({ message: "Invalid linked service ID." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId).populate(
      "createdBy",
      "name email"
    ); // Populate buyer for notification

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (serviceRequest.status !== "open") {
      return res.status(400).json({
        message: `Cannot submit offer. Request status is "${serviceRequest.status}".`,
      });
    }
    if (serviceRequest.createdBy._id.equals(sellerId)) {
      return res.status(400).json({
        message: "You cannot make an offer on your own service request.",
      });
    }
    const existingOffer = serviceRequest.offersReceived.find((offer) =>
      offer.seller.equals(sellerId)
    );
    if (existingOffer) {
      return res.status(400).json({
        message: "You have already submitted an offer for this request.",
      });
    }

    const newOffer = {
      seller: sellerId,
      message,
      proposedPrice: Number(proposedPrice),
      priceType,
      proposedDeliveryTime: proposedDeliveryTime || undefined,
      availabilityDate: availabilityDate
        ? new Date(availabilityDate)
        : undefined,
      availabilityTimeSlot: availabilityTimeSlot || undefined,
      specificTime:
        availabilityTimeSlot === "specific_time" && specificTime
          ? specificTime
          : undefined,
      linkedServiceId: linkedServiceId || null,
      status: "pending",
    };

    serviceRequest.offersReceived.push(newOffer);
    // Optionally change SR status
    // if (serviceRequest.offersReceived.length === 1 && serviceRequest.status === 'open') {
    //   serviceRequest.status = "in-discussion";
    // }
    const updatedServiceRequest = await serviceRequest.save();

    const io = req.app.get("socketio");
    const sellerName =
      sellerUser.name || sellerUser.companyName || "A service provider";
    const buyerOfRequest = serviceRequest.createdBy;

    if (buyerOfRequest && buyerOfRequest._id) {
      createAndDispatchNotification(
        {
          recipientId: buyerOfRequest._id,
          senderId: sellerId,
          type: "NEW_OFFER_ON_SERVICE_REQUEST",
          title: "New Offer Received!",
          message: `${sellerName} submitted an offer on your request: "${updatedServiceRequest.title.substring(
            0,
            40
          )}..."`,
          link: `/service-request/${updatedServiceRequest._id}`,
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: newOfferReceivedEmail,
          emailTemplateArgs: [
            buyerOfRequest.name || "User",
            buyerOfRequest.email,
            sellerName,
            updatedServiceRequest.title,
            `${process.env.CLIENT_URL || "http://localhost:5173"
            }/service-request/${updatedServiceRequest._id}`,
          ],
        }
      ).catch((err) =>
        console.error("Error sending new offer notification:", err)
      );
    }

    res.status(201).json({
      message: "Offer submitted successfully.",
      serviceRequest: updatedServiceRequest,
      offer: updatedServiceRequest.offersReceived.find((o) =>
        o.seller.equals(sellerId)
      ),
    });
  } catch (error) {
    console.error(
      "Error submitting offer on service request:",
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error submitting offer." });
  }
};

// --- CONFIRM PROMOTION PAYMENT AND ACTIVATE REQUEST ---
const confirmPromotionPayment = async (req, res) => {
  console.log("[confirmPromotionPayment] req.params:", req.params);
  console.log("[confirmPromotionPayment] req.body:", req.body);

  const { requestId } = req.params;
  const serviceRequestId = requestId; // Alias
  const { paymentIntentId, sourceId } = req.body;
  const buyerId = req.user._id;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(serviceRequestId) ||
      !paymentIntentId
    ) {
      console.error(
        `Validation failed in confirmPromotionPayment: serviceRequestId='${serviceRequestId}' (isValid: ${mongoose.Types.ObjectId.isValid(
          serviceRequestId
        )}), paymentIntentId='${paymentIntentId}'`
      );

      return res.status(400).json({
        message: "Service Request ID and Payment Intent ID are required.",
      });
    }

    const serviceRequest = await ServiceRequest.findById(
      serviceRequestId
    ).populate("createdBy", "name companyName");

    if (!serviceRequest) {
      /* ... */
      return res.status(404).json({ message: "Service request not found." });
    }
    if (serviceRequest.createdBy._id.toString() !== buyerId.toString()) {
      /* ... */
      return res
        .status(403)
        .json({ message: "Unauthorized to confirm this payment." });
    }
    const isPromotedRequest =
      serviceRequest.requestType === PROMOTION_TYPES.PROMOTED;
    const hasSpecialDealActivation = Boolean(
      serviceRequest.specialDealDetails?.isSpecialDeal
    );

    if (!isPromotedRequest && !hasSpecialDealActivation) {
      /* ... */
      return res
        .status(400)
        .json({ message: "This request has no payable upgrade." });
    }
    if (
      serviceRequest.status === "open" &&
      (serviceRequest.promotionDetails?.isPromoted || hasSpecialDealActivation)
    ) {
      return res.status(200).json({
        message: "Request payment already confirmed.",
        serviceRequest,
      });
    }
    if (serviceRequest.status !== "pending_promotion_payment") {
      return res.status(400).json({
        message: `Request status is '${serviceRequest.status}', not 'pending_promotion_payment'. Cannot confirm payment.`,
      });
    }
    const amountInCents = Math.round((serviceRequest.amountToBePaid || 0) * 100);

    // Resilience: If server restarted and we lost the in-memory intent map, re-populate it
    if (paymentIntentId.startsWith("pending_")) {
      await repopulatePendingIntent(
        paymentIntentId,
        amountInCents,
        `Promotion: ${serviceRequest.title.substring(0, 50)}`
      );
    }

    const stripeVerification = sourceId
      ? await confirmBackendPaymentIntent(paymentIntentId, sourceId)
      : await retrievePaymentIntent(paymentIntentId); // Uses retrievePaymentIntent
    if (
      !stripeVerification.success ||
      stripeVerification.paymentIntent?.status !== "succeeded"
    ) {
      if (serviceRequest.promotionDetails?.promotionOrderId) {
        await ServiceRequestOrder.findByIdAndUpdate(
          serviceRequest.promotionDetails.promotionOrderId,
          { status: "failed" }
        );
      }

      return res.status(400).json({
        message:
          stripeVerification.message ||
          "Payment verification with Stripe failed or payment not successful.",
        stripeStatus: stripeVerification.paymentIntent?.status,
      });
    }

    if (serviceRequest.promotionDetails?.promotionOrderId) {
      const promotionOrder = await ServiceRequestOrder.findById(
        serviceRequest.promotionDetails.promotionOrderId
      );
      if (promotionOrder) {
        if (promotionOrder.status !== "succeeded") {
          promotionOrder.status = "succeeded";
          promotionOrder.paymentTimestamp = new Date();
          await promotionOrder.save();
        }
      } else {
        console.warn(
          `ServiceRequestOrder ${serviceRequest.promotionDetails.promotionOrderId} not found for SR ${serviceRequest._id}. This is unexpected.`
        );
      }
    } else {
      console.warn(
        `No promotionOrderId found on ServiceRequest ${serviceRequest._id} during promotion confirmation.`
      );
    }

    serviceRequest.status = "open";
    if (isPromotedRequest) {
      serviceRequest.promotionDetails.isPromoted = true;
      const promotionDurationInMonths =
        Number(serviceRequest.promotionDetails?.durationMonths) > 0
          ? Number(serviceRequest.promotionDetails.durationMonths)
          : DEFAULT_PROMOTION_DURATION_MONTHS;
      const promotedUntilDate = new Date();
      promotedUntilDate.setMonth(
        promotedUntilDate.getMonth() + promotionDurationInMonths
      );
      serviceRequest.promotionDetails.promotedUntil = promotedUntilDate;
    }
    const savedServiceRequest = await serviceRequest.save();

    // --- UPDATE COMMUNITY PAYMENT STATUS ---
    if (savedServiceRequest.communityPayment) {
      await CommunityPayment.findByIdAndUpdate(savedServiceRequest.communityPayment, {
        status: "succeeded",
        paymentId: paymentIntentId, // Ensure it matches the actual intent used
      }).catch(err => console.error("Error updating community payment status:", err));
    }

    if (
      savedServiceRequest.invitedProviders &&
      savedServiceRequest.invitedProviders.length > 0
    ) {
      /* ... (invitation logic) ... */
    }
    res.status(200).json({
      message: "Service request payment confirmed successfully.",
      serviceRequest: savedServiceRequest,
    });
  } catch (error) {
    console.error(
      "Error confirming promotion payment:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error confirming promotion payment." });
  }
};

// ... (verifyPromotionPaymentController also uses retrievePaymentIntent - ensure import is available)
const verifyPromotionPaymentController = async (req, res) => {
  const { paymentIntentId } = req.body;
  const userId = req.user._id;
  try {
    if (!paymentIntentId) {
      return res
        .status(400)
        .json({ success: false, message: "Payment Intent ID is required." });
    }
    const stripeVerification = await retrievePaymentIntent(paymentIntentId); // Uses retrievePaymentIntent
    // ... rest of verifyPromotionPaymentController
    if (!stripeVerification.success || !stripeVerification.paymentIntent) {
      return res.status(400).json({
        success: false,
        message:
          stripeVerification.message ||
          "Failed to retrieve payment intent from Stripe.",
      });
    }
    const intent = stripeVerification.paymentIntent;
    const serviceRequestId = intent.metadata?.service_request_id;
    if (intent.metadata?.buyer_id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Payment intent does not belong to the current user.",
      });
    }
    if (intent.status === "succeeded") {
      const serviceRequest = await ServiceRequest.findById(
        serviceRequestId
      ).lean();
      if (
        serviceRequest &&
        serviceRequest.status === "open" &&
        (serviceRequest.promotionDetails?.isPromoted ||
          serviceRequest.specialDealDetails?.isSpecialDeal)
      ) {
        return res.status(200).json({
          success: true,
          status: "succeeded",
          message: "Payment successfully verified and request is active.",
          serviceRequestId: serviceRequestId,
        });
      } else if (
        serviceRequest &&
        ["pending_payment", "pending_promotion_payment"].includes(
          serviceRequest.status
        )
      ) {
        return res.status(200).json({
          success: true,
          status: "processing",
          message: "Payment successful with Stripe, finalizing request payment...",
          serviceRequestId: serviceRequestId,
        });
      }
    }
    return res.status(200).json({
      success: intent.status === "succeeded",
      status: intent.status,
      message: `Payment status: ${intent.status}.`,
      serviceRequestId: serviceRequestId,
    });
  } catch (error) {
    console.error("Error in verifyPromotionPaymentController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during payment verification.",
    });
  }
};

// --- GET ALL OPEN SERVICE REQUESTS (For Sellers to browse) ---
const getOpenServiceRequests = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      budgetMin,
      budgetMax,
      location,
      locationPreference, // "on-site", "remote", "flexible"
      page = 1,
      limit = 10,
      q, // Text search query
    } = req.query;

    const currentPage = parseInt(page, 10) || 1;
    const itemsPerPage = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * itemsPerPage;

    const filter = {
      status: {
        $in: [
          "open",
          "AWAITING_SCHEDULE",
          "SCHEDULE_NEGOTIATION",
          "SCHEDULE_CONFIRMED",
          "AWAITING_PAYMENT",
        ],
      },
      // Exclude requests where an offer has been accepted and the service is in a "closed" state
      $or: [
        { awardedOfferId: { $eq: null } }, // No offer awarded yet
        {
          $and: [
            { awardedOfferId: { $ne: null } }, // An offer has been awarded
            {
              status: {
                $nin: ["payment_succeeded", "IN_PROGRESS", "COMPLETED"],
              },
            }, // But not in these "closed" states
          ],
        },
      ],
    };

    // Exclude requests created by the current user or where the current user is the awarded seller
    if (req.user && req.user._id) {
      filter.$and = filter.$and || [];
      filter.$and.push({ createdBy: { $ne: req.user._id } });
      filter.$and.push({ awardedSellerId: { $ne: req.user._id } });
    }
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (locationPreference) filter.locationPreference = locationPreference;
    if (budgetMin !== undefined && !isNaN(Number(budgetMin))) {
      filter["budget.min"] = { $gte: Number(budgetMin) };
    }
    if (budgetMax !== undefined && !isNaN(Number(budgetMax))) {
      filter["budget.max"] = { $lte: Number(budgetMax) };
    }

    if (location) {
      const locationRegex = new RegExp(location.trim(), "i");
      filter.$or = [
        { locationPreference: "remote" },
        { locationPreference: "flexible" },
        { "onSiteAddresses.city": locationRegex },
        { "onSiteAddresses.country": locationRegex },
        { "onSiteAddresses.state": locationRegex },
        { "onSiteAddresses.street": locationRegex },
      ];
    }

    if (q && String(q).trim() !== "") {
      filter.$text = { $search: String(q).trim() };
    }

    // Handle text search with fallback
    // If no results from text search, try without $text operator
    const now = new Date();
    const aggregatePipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "communitypayments",
          localField: "communityPayment",
          foreignField: "_id",
          as: "cpDetails"
        }
      },
      {
        $unwind: {
          path: "$cpDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      // HIDE if it's a community item but plan is expired
      {
        $match: {
          $or: [
            { isCommunity: { $ne: true } },
            { "cpDetails.communityOfferUntill": { $gt: now } }
          ]
        }
      }
    ];

    const countPipeline = [...aggregatePipeline, { $count: "total" }];
    const countResult = await ServiceRequest.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    const requests = await ServiceRequest.aggregate([
      ...aggregatePipeline,
      getFeaturedSortStage(),
      { 
        $sort: { 
          sortPriority: -1, 
          createdAt: -1 
        } 
      },
      { $skip: skip },
      { $limit: itemsPerPage }
    ]);

    await ServiceRequest.populate(requests, [
      {
        path: "createdBy",
        select: "name profilePicture accountType companyName representativeName isVerified"
      },
      { path: "specialOffer" },
      { path: "communityPayment" }
    ]);

    const normalizedRequests = requests.map(item => {
      const cp = item.communityPayment;
      item.isCommunityActive = cp ? (new Date() < new Date(cp.communityOfferUntill)) : false;
      item.communityStartDate = cp ? cp.createdAt : null;
      item.communityExpiryDate = cp ? cp.communityOfferUntill : null;
      return verifyPromotionStatus(item);
    });

    res.status(200).json({
      serviceRequests: normalizedRequests,
      pagination: {
        currentPage: currentPage,
        totalPages: Math.ceil(total / itemsPerPage) || 1,
        totalItems: total,
        limit: itemsPerPage,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching open service requests:",
      error.message,
      error.stack
    );
    res.status(500).json({
      message: "Internal Server Error while fetching service requests.",
    });
  }
};

// --- GET MY SERVICE REQUESTS (For Buyer who created them) ---
const getMyServiceRequests = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { createdBy: buyerId };

    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const requestsQuery = ServiceRequest.find(filter)
      // .populate(createdBy) // Maybe populate offersReceived if implemented
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalQuery = ServiceRequest.countDocuments(filter);
    const [requests, total] = await Promise.all([
      requestsQuery
        .populate("createdBy", "name email accountType companyName")
        .populate("specialOffer")
        .lean(),
      totalQuery,
    ]);

    const validatedRequests = requests.map(verifyPromotionStatus);

    res.status(200).json({
      serviceRequests: validatedRequests,

      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)) || 1,
        totalItems: total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(
      "Error fetching my service requests:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// --- GET A SINGLE SERVICE REQUEST BY ID ---
const getServiceRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate(
        "createdBy",
        "name profilePicture accountType companyName representativeName isVerified"
      )
      .populate({
        // Populate seller details for each offer
        path: "offersReceived.seller",
        select:
          "name profilePicture accountType companyName representativeName isVerified",
      })
      .populate({
        // Populate linked service details for each offer if present
        path: "offersReceived.linkedServiceId",
        select: "title price priceType category", // Select fields you want from linked service
      })
      .populate("specialOffer")
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewerId',
          select: 'name profilePicture'
        },
        match: { status: 'approved' }
      });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    if (req.user) {
      const isOwner =
        req.user && serviceRequest.createdBy._id.equals(req.user._id);
      // Adjust access control as needed
      if (
        !isOwner &&
        serviceRequest.status !== "open" &&
        (!req.user || (!req.user.isSeller && !req.user.isAdmin))
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized or request not open." });
      }
    }
    const serviceRequestObj = serviceRequest.toObject ? serviceRequest.toObject() : serviceRequest;
    res.status(200).json(verifyPromotionStatus(serviceRequestObj));
  } catch (error) {
    console.error(
      "Error fetching service request by ID:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// --- UPDATE A SERVICE REQUEST (Buyer Action - only owner, if status allows) ---
const updateServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    const isOwner = serviceRequest.createdBy.equals(userId);
    const isAwardedSeller =
      serviceRequest.awardedSellerId && serviceRequest.awardedSellerId.equals(userId);

    if (!isOwner && !isAwardedSeller) {
      return res.status(403).json({
        message: "You are not authorized to update this service request.",
      });
    }

    // Define allowed statuses for updates. Sellers can update once awarded.
    const allowedStatuses = [
      "open",
      "AWAITING_SCHEDULE",
      "SCHEDULE_NEGOTIATION",
      "SCHEDULE_CONFIRMED",
      "IN_PROGRESS",
    ];

    if (!allowedStatuses.includes(serviceRequest.status)) {
      return res.status(400).json({
        message: `Cannot update request with status: ${serviceRequest.status}.`,
      });
    }

    // Fields that can be updated by buyer
    const {
      title,
      description,
      category,
      subcategory,
      budgetMin,
      budgetMax,
      budgetType,
      desiredDeliveryTime,
      locationPreference,
      onSiteAddresses, // Now explicitly handled
      tags,
      requiredSkills, // New field
      experienceLevel, // New field
      scopeUnit, // New field
      scopeQuantity, // New field
      scopeDetails, // New field
      status,
      existingAttachments, // Array of paths to keep
      removedAttachments, // Array of paths to remove
      isSpecial,          // Added for SpecialOffer
      specialDescription, // Added for SpecialOffer
      actualPrice,
      sellingPrice,
      specialDealDuration, // duration in days
      isCommunity,          // New Community field
      durationMonths,       // New Duration field
      specialOfferSourceId, // Added for Square payment
      communityOfferSourceId, // Explicit field for community payment
    } = req.body;

    if (title) serviceRequest.title = title;
    if (description) serviceRequest.description = description;
    if (category) serviceRequest.category = category;
    serviceRequest.subcategory = subcategory || serviceRequest.subcategory;

    if (isCommunity !== undefined) {
      serviceRequest.isCommunity = parseBooleanLike(isCommunity);
    }

    // Budget updates
    if (budgetType) serviceRequest.budget.type = budgetType;
    serviceRequest.budget.min =
      budgetMin !== undefined && !isNaN(parseFloat(budgetMin))
        ? parseFloat(budgetMin)
        : undefined;
    serviceRequest.budget.max =
      budgetMax !== undefined && !isNaN(parseFloat(budgetMax))
        ? parseFloat(budgetMax)
        : undefined;

    if (desiredDeliveryTime)
      serviceRequest.desiredDeliveryTime = desiredDeliveryTime;

    // Location and On-site Addresses
    if (locationPreference) {
      serviceRequest.locationPreference = locationPreference;
      if (locationPreference === "on-site") {
        if (onSiteAddresses) {
          try {
            const parsedOnSiteAddresses =
              typeof onSiteAddresses === "string"
                ? JSON.parse(onSiteAddresses)
                : onSiteAddresses;
            if (Array.isArray(parsedOnSiteAddresses)) {
              serviceRequest.onSiteAddresses = parsedOnSiteAddresses.filter(
                (addr) => addr.city && addr.country
              ); // Basic validation
            } else {
              serviceRequest.onSiteAddresses = [];
            }
          } catch (e) {
            console.error("Error parsing onSiteAddresses:", e);
            serviceRequest.onSiteAddresses = []; // Fallback to empty
          }
        } else {
          serviceRequest.onSiteAddresses = [];
        }
      } else {
        serviceRequest.onSiteAddresses = []; // Clear if not on-site
      }
    }

    // Tags
    if (tags !== undefined) {
      serviceRequest.tags = processArrayField(tags);
    }

    // Required Skills
    if (requiredSkills !== undefined) {
      serviceRequest.requiredSkills = processArrayField(requiredSkills);
    }

    // Experience Level
    if (experienceLevel) serviceRequest.experienceLevel = experienceLevel;

    // Scope of Work
    if (scopeUnit !== undefined)
      serviceRequest.scopeOfWork.unit = scopeUnit || undefined;
    if (scopeQuantity !== undefined)
      serviceRequest.scopeOfWork.quantity = !isNaN(parseFloat(scopeQuantity))
        ? parseFloat(scopeQuantity)
        : undefined;
    if (scopeDetails !== undefined)
      serviceRequest.scopeOfWork.details = scopeDetails || undefined;

    // Handle attachment updates
    const uploadsBaseDir = path.join(__dirname, "..", "uploads");
    let currentAttachments = serviceRequest.attachments || [];

    // 1. Process files to remove
    if (removedAttachments && Array.isArray(removedAttachments)) {
      for (const filePath of removedAttachments) {
        const fullPath = path.join(uploadsBaseDir, filePath);
        try {
          await fs.unlink(fullPath);
          console.log(`Successfully deleted file: ${fullPath}`);
          // Remove from currentAttachments array
          currentAttachments = currentAttachments.filter((p) => p !== filePath);
        } catch (err) {
          console.error(`Failed to delete file ${fullPath}:`, err);
          // Log error but don't block the update, as the file might not exist or permissions issue
        }
      }
    }

    // 2. Add newly uploaded files
    if (req.files && req.files.length > 0) {
      const newAttachmentPaths = req.files.map((file) => {
        const relativePath = path.relative(uploadsBaseDir, file.path);
        return relativePath.replace(/\\/g, "/"); // Normalize path for DB
      });
      currentAttachments = [...currentAttachments, ...newAttachmentPaths];
    }

    // 3. Ensure only kept existing attachments are in the final array (frontend sends existingAttachments[])
    // This step is crucial if frontend sends ALL existing attachments that should remain.
    // If frontend sends only 'removedAttachments' and 'newlySelectedFiles', then the filtering above is sufficient.
    // Assuming frontend sends `existingAttachments` as the list of paths that *should* remain.
    if (existingAttachments && Array.isArray(existingAttachments)) {
      // Filter currentAttachments to only include those explicitly sent by frontend as 'existingAttachments'
      // and any newly uploaded files.
      const frontendKeptPaths = existingAttachments.map(String); // Ensure strings
      const newlyUploadedPaths = (req.files || []).map((file) => {
        const relativePath = path.relative(uploadsBaseDir, file.path);
        return relativePath.replace(/\\/g, "/");
      });

      // Combine paths that frontend explicitly kept with newly uploaded ones
      serviceRequest.attachments = [
        ...new Set([...frontendKeptPaths, ...newlyUploadedPaths]),
      ];
    } else {
      // If frontend doesn't send existingAttachments, rely on the filtering done by removedAttachments
      serviceRequest.attachments = currentAttachments;
    }

    // Buyer might close their own request
    if (status && status === "closed") {
      serviceRequest.status = "closed";
    }

    // --- Special Offer Handling (Square Activation Fee) ---
    if (isSpecial === true || isSpecial === "true") {
      const aPrice = actualPrice !== undefined ? parseFloat(actualPrice) : (serviceRequest.specialOffer ? (await SpecialOffer.findById(serviceRequest.specialOffer))?.actualPrice : undefined);
      const sPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : (serviceRequest.specialOffer ? (await SpecialOffer.findById(serviceRequest.specialOffer))?.sellingPrice : undefined);

      const validation = await validateSpecialDealData({
        description: specialDescription || (serviceRequest.specialOffer ? (await SpecialOffer.findById(serviceRequest.specialOffer))?.description : "Special Deal Request"),
        actualPrice: aPrice,
        sellingPrice: sPrice,
        itemType: "ServiceRequest",
      });

      const specialFeeUsd = validation.activationFee;

      let specialOffer;
      if (serviceRequest.specialOffer) {
        specialOffer = await SpecialOffer.findById(serviceRequest.specialOffer);
      }

      // Handle Square Payment for Activation (if not already paid for this item)
      const existingPayment = await SpecialOfferPayment.findOne({
        item: serviceRequest._id,
        itemType: "ServiceRequest",
        status: "succeeded",
      });

      let activationPaymentId = existingPayment?.paymentId;
      if (!activationPaymentId) {
        if (!specialOfferSourceId) {
          return res.status(400).json({
            message: "Payment is required to list this service request as a special deal.",
          });
        }

        try {
          const paymentResponse = await createSquarePayment({
            sourceId: specialOfferSourceId,
            amount: specialFeeUsd * 100,
            currency: "USD",
            idempotencyKey: `act-sp-srvreq-upd-${Date.now()}-${String(userId).slice(-8)}`,
            note: `Special Offer Activation Fee for Service Request Update: ${serviceRequest.title}`,
          });

          if (!paymentResponse?.payment?.id) {
            return res.status(400).json({
              message: "Special offer activation payment failed. Please try again.",
            });
          }
          activationPaymentId = paymentResponse.payment.id;

          // Create SpecialOfferPayment record
          await SpecialOfferPayment.create({
            user: userId,
            item: serviceRequest._id,
            itemType: "ServiceRequest",
            amount: specialFeeUsd,
            currency: "USD",
            paymentId: activationPaymentId,
            status: "succeeded",
            note: `Activated special offer for service request update: ${serviceRequest.title}`,
          });

          // Log the transaction
          await TransactionLog.create({
            buyer: userId,
            seller: userId,
            type: "service",
            purchasedItem: serviceRequest._id,
            itemModel: "ServiceRequest",
            totalAmount: specialFeeUsd,
            sellerCommission: 0,
            adminCommission: specialFeeUsd,
            currency: "USD",
            status: "succeeded",
            paymentProvider: "Square",
            transactionId: activationPaymentId,
            isSpecial: true,
            specialOffer: savedOffer._id,
            metadata: { activationFee: true },
          });
        } catch (paymentError) {
          console.error("[updateServiceRequest] Payment error:", paymentError.message);
          return res.status(400).json({
            message: "Payment failed: " + (paymentError.response?.data?.errors?.[0]?.detail || paymentError.message),
          });
        }
      }

      if (!specialOffer) {
        // Calculate expiration if duration is provided
        let expiresAt = null;
        const durationDays = parseInt(specialDealDuration, 10);
        
        if (durationDays && durationDays > 0) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + durationDays);
        }

        specialOffer = new SpecialOffer({
          item: serviceRequest._id,
          itemType: "ServiceRequest",
          description: specialDescription,
          actualPrice: aPrice,
          sellingPrice: sPrice,
          priceDifference: parseFloat((sPrice - aPrice).toFixed(2)),
          discountPercentage: Math.round(((aPrice - sPrice) / aPrice) * 100),
          durationDays: durationDays || undefined,
          expiresAt: expiresAt,
          status: "active",
        });
      } else {
        if (specialDescription !== undefined) specialOffer.description = specialDescription;
        specialOffer.actualPrice = aPrice;
        specialOffer.sellingPrice = sPrice;
        specialOffer.priceDifference = parseFloat((aPrice - sPrice).toFixed(2));
        specialOffer.discountPercentage = Math.round(((aPrice - sPrice) / aPrice) * 100);
        specialOffer.status = "active";
 
        // Update expiration if duration is provided during update
        const durationDays = parseInt(specialDealDuration, 10);
        if (durationDays !== undefined && !isNaN(durationDays)) {
          if (durationDays > 0) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);
            specialOffer.expiresAt = expiresAt;
            specialOffer.durationDays = durationDays;
          } else {
            specialOffer.expiresAt = null;
            specialOffer.durationDays = 0;
          }
        }
      }

      const savedOffer = await specialOffer.save();
      serviceRequest.isSpecial = true;
      serviceRequest.specialOffer = savedOffer._id;
    } else if (isSpecial === false || isSpecial === "false") {
      if (serviceRequest.specialOffer) {
        await SpecialOffer.findByIdAndDelete(serviceRequest.specialOffer);
        serviceRequest.specialOffer = undefined;
      }
      serviceRequest.isSpecial = false;
    }

    await serviceRequest.save();

    // --- COMMUNITY RE-ACTIVATION / EXTENSION HANDLING ---
    if (parseBooleanLike(isCommunity)) {
      const requestedDuration = parseInt(durationMonths, 10) || 1;
      // NO COMMUNITY ACTIVATION IN PUT REQUEST (Dedicated API instead)
    }

    res.status(200).json({
      message: "Service request updated successfully.",
      serviceRequest,
    });
  } catch (error) {
    console.error(
      "Error updating service request:",
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error updating service request." });
  }
};

// --- DELETE/CLOSE A SERVICE REQUEST (Buyer Action - only owner) ---
const deleteServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const buyerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (!serviceRequest.createdBy.equals(buyerId) && !req.user.isAdmin) {
      // Admin can also delete
      return res.status(403).json({
        message: "You can only delete/close your own service requests.",
      });
    }

    // Instead of hard delete, often better to change status to "closed" or "cancelled"
    serviceRequest.status = "closed";
    await serviceRequest.save();
    res.status(200).json({ message: "Service request closed." });

    // For hard delete:
    // TODO: Delete associated attachments from storage if any
    // await ServiceRequest.findByIdAndDelete(requestId);
    // res.status(200).json({ message: "Service request deleted successfully." });
  } catch (error) {
    console.error(
      "Error deleting service request:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error deleting service request." });
  }
};

// --- NEW: BUYER INVITES PROVIDERS TO A SERVICE REQUEST ---
const inviteProvidersToServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const buyerId = req.user._id;
    const buyerUser = req.user; // For sender name in notification
    let { providerIds } = req.body; // Expect an array of provider User IDs

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid service request ID." });
    }
    if (
      !Array.isArray(providerIds) ||
      providerIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
    ) {
      return res.status(400).json({
        message:
          "Invalid provider IDs format. Expecting an array of valid User IDs.",
      });
    }
    if (providerIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select at least one provider to invite." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (!serviceRequest.createdBy.equals(buyerId)) {
      return res.status(403).json({
        message: "You can only invite providers to your own service requests.",
      });
    }
    if (serviceRequest.status !== "open") {
      return res.status(400).json({
        message: `Cannot invite providers. Request status is "${serviceRequest.status}".`,
      });
    }

    const currentInvitedCount = serviceRequest.invitedProviders.length;
    const newUniqueProviderIds = providerIds.filter(
      (id) =>
        !serviceRequest.invitedProviders.some((invitedId) =>
          invitedId.equals(id)
        ) && id !== buyerId.toString() // Ensure not already invited and not inviting self
    );

    if (newUniqueProviderIds.length === 0) {
      return res.status(400).json({
        message:
          "All selected providers have already been invited or are invalid.",
      });
    }

    let finalProvidersToInvite = newUniqueProviderIds;
    if (serviceRequest.requestType === PROMOTION_TYPES.STANDARD) {
      const remainingSlots = 20 - currentInvitedCount;
      if (remainingSlots <= 0) {
        return res.status(400).json({
          message:
            "Standard requests are limited to 20 invitations. Limit reached.",
        });
      }
      finalProvidersToInvite = newUniqueProviderIds.slice(0, remainingSlots);
    }

    if (finalProvidersToInvite.length === 0) {
      return res.status(400).json({
        message:
          "Invitation limit reached for standard post with selected providers.",
      });
    }

    serviceRequest.invitedProviders.push(...finalProvidersToInvite);
    await serviceRequest.save();

    // Send notifications to newly invited providers
    const io = req.app.get("socketio");
    const buyerName = buyerUser.name || buyerUser.companyName || "A buyer";
    let successfullyInvitedCount = 0;

    for (const providerId of finalProvidersToInvite) {
      const providerUser = await User.findById(providerId)
        .select("name email")
        .lean();
      const providerNameForEmail = providerUser
        ? providerUser.name
        : "Service Provider";

      createAndDispatchNotification(
        {
          recipientId: providerId,
          senderId: buyerId,
          type: "SERVICE_REQUEST_INVITATION",
          title: "You've Been Invited to a Service Request!",
          message: `${buyerName} invited you to their request: "${serviceRequest.title.substring(
            0,
            50
          )}..."`,
          link: `/service-request/${serviceRequest._id}`,
          relatedResource: serviceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: "serviceRequestInvitationEmail",
          emailTemplateArgs: [
            providerNameForEmail,
            buyerName,
            serviceRequest.title,
            `${process.env.CLIENT_URL || "http://localhost:5173"
            }/service-request/${serviceRequest._id}`,
          ],
        }
      )
        .then((result) => {
          if (result.success) successfullyInvitedCount++;
        })
        .catch((err) =>
          console.error(
            `Error dispatching invite (manual) to ${providerId}:`,
            err
          )
        );
    }

    res.status(200).json({
      message: `${finalProvidersToInvite.length} provider(s) invited successfully. Total invited: ${serviceRequest.invitedProviders.length}.`,
      serviceRequest, // Send back updated request
    });
  } catch (error) {
    console.error(
      "Error inviting providers to service request:",
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error inviting providers." });
  }
};

// --- NEW: GET ALL OFFERS FOR A SPECIFIC SERVICE REQUEST (Buyer view) ---
const getOffersForServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id; // Buyer checking their own request's offers

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid service request ID." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate({
        path: "offersReceived.seller",
        select:
          "name profilePicture accountType companyName representativeName isVerified rating averageRating reviewCount", // Get more seller details
      })
      .populate({
        path: "offersReceived.linkedServiceId",
        select: "title price priceType media category slug", // Get more details of linked service
      })
      .select("title createdBy offersReceived status"); // Select only necessary fields from SR

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    // Authorization: Only the creator of the service request can see all offers
    if (!serviceRequest.createdBy.equals(userId)) {
      // If it's a seller who made an offer, they should only see their own offer (not implemented here, but a consideration)
      // For now, only owner sees all offers.
      return res.status(403).json({
        message: "You are not authorized to view offers for this request.",
      });
    }

    res.status(200).json({
      offers: serviceRequest.offersReceived.sort(
        (a, b) => b.createdAt - a.createdAt
      ), // Sort by newest first
      serviceRequestTitle: serviceRequest.title,
      serviceRequestStatus: serviceRequest.status,
    });
  } catch (error) {
    console.error(
      "Error fetching offers for service request:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Internal Server Error fetching offers." });
  }
};

// --- BUYER ACCEPTS AN OFFER ---
const buyerAcceptOffer = async (req, res) => {
  const { requestId, offerId } = req.params;
  const buyerId = req.user._id;
  // const { buyerMessage } = req.body; // buyerMessage is already in OfferSubSchema

  if (
    !mongoose.Types.ObjectId.isValid(requestId) ||
    !mongoose.Types.ObjectId.isValid(offerId)
  ) {
    return res.status(400).json({ message: "Invalid Request ID or Offer ID." });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId).populate(
      "offersReceived.seller",
      "name email stripeAccountId"
    ); // For Stripe Connect

    if (!serviceRequest)
      return res.status(404).json({ message: "Service request not found." });
    if (!serviceRequest.createdBy.equals(buyerId)) {
      return res
        .status(403)
        .json({ message: "You can only accept offers on your own requests." });
    }
    if (
      serviceRequest.status !== "open" &&
      serviceRequest.status !== "in-discussion"
    ) {
      return res.status(400).json({
        message: `Request is not in a state to accept offers (current status: ${serviceRequest.status}).`,
      });
    }

    const offerToAccept = serviceRequest.offersReceived.id(offerId);
    if (!offerToAccept)
      return res
        .status(404)
        .json({ message: "Offer not found on this request." });
    if (
      offerToAccept.status !== "pending" &&
      offerToAccept.status !== "counter_accepted_by_seller"
    ) {
      // Seller might have accepted buyer's counter
      return res.status(400).json({
        message: `This offer is not pending acceptance (current status: ${offerToAccept.status}).`,
      });
    }

    serviceRequest.offersReceived.forEach((offer) => {
      if (offer.status === "pending" && !offer._id.equals(offerId)) {
        offer.status = "rejected_by_buyer";
      }
      if (offer.status === "countered_by_buyer" && !offer._id.equals(offerId)) {
        offer.status = "rejected_by_buyer";
      }
    });

    offerToAccept.status = "accepted";
    // offerToAccept.buyerResponseMessage = buyerMessage || offerToAccept.buyerResponseMessage;

    serviceRequest.status = "AWAITING_SCHEDULE"; // NEW STATUS
    serviceRequest.awardedOfferId = offerToAccept._id;
    serviceRequest.awardedSellerId = offerToAccept.seller._id;
    serviceRequest.amountToBePaid = offerToAccept.proposedPrice; // STORE AMOUNT

    // Clear any previous scheduling attempts if re-accepting
    serviceRequest.currentScheduleProposal = undefined;
    serviceRequest.confirmedSchedule = undefined;
    serviceRequest.schedulingConfirmedByBuyer = false;
    serviceRequest.schedulingConfirmedBySeller = false;
    serviceRequest.rescheduleCount = 0;

    const updatedServiceRequest = await serviceRequest.save();

    const io = req.app.get("socketio");
    const buyerUser = await User.findById(buyerId)
      .select("name companyName")
      .lean();
    const buyerDisplayName =
      buyerUser?.name || buyerUser?.companyName || "The Buyer";
    const sellerToNotify = offerToAccept.seller; // This should be populated from above

    if (sellerToNotify && sellerToNotify._id) {
      createAndDispatchNotification(
        {
          recipientId: sellerToNotify._id,
          senderId: buyerId,
          type: "SERVICE_REQUEST_OFFER_ACCEPTED",
          title: "Your Offer Was Accepted!",
          message: `${buyerDisplayName} has accepted your offer for: "${updatedServiceRequest.title.substring(
            0,
            40
          )}..."`,
          link: `/service-request/${updatedServiceRequest._id}`, // Adjust link as needed
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: offerAcceptedEmailToSeller,
          emailTemplateArgs: [
            sellerToNotify.name || "Service Provider",
            sellerToNotify.email,
            buyerDisplayName,
            updatedServiceRequest.title,
            `${process.env.CLIENT_URL || "http://localhost:5173"
            }/seller/service-requests/offers/${updatedServiceRequest._id}`,
          ],
        }
      ).catch((err) =>
        console.error("Error sending offer accepted notification:", err)
      );
    }

    res.status(200).json({
      message: "Offer accepted successfully. You can now proceed to schedule.",
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error("Error accepting offer:", error.message, error.stack);
    res.status(500).json({ message: "Internal server error accepting offer." });
  }
};

// --- PROPOSE OR CONFIRM SCHEDULE ---
const proposeOrConfirmSchedule = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;
  const { proposedDate, proposedTimeSlot, specificTimeDetails, notes, action } =
    req.body; // action: 'propose' or 'confirm'

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid service request ID." });
  }
  if (!action || !["propose", "confirm"].includes(action)) {
    return res
      .status(400)
      .json({ message: "Invalid action. Must be 'propose' or 'confirm'." });
  }
  if (action === "propose" && (!proposedDate || !proposedTimeSlot)) {
    return res.status(400).json({
      message: "Proposed date and time slot are required for proposal.",
    });
  }

  try {
    const sr = await ServiceRequest.findById(requestId)
      .populate("createdBy", "name email")
      .populate("awardedSellerId", "name email");

    if (!sr)
      return res.status(404).json({ message: "Service request not found." });

    const isBuyer = sr.createdBy._id.equals(userId);
    const isSeller =
      sr.awardedSellerId && sr.awardedSellerId._id.equals(userId);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        message: "You are not authorized to manage schedule for this request.",
      });
    }
    if (!["AWAITING_SCHEDULE", "SCHEDULE_NEGOTIATION"].includes(sr.status)) {
      return res.status(400).json({
        message: `Cannot manage schedule. Request status is "${sr.status}".`,
      });
    }

    let notificationRecipient = null;
    let notificationTitle = "";
    let notificationMessage = "";

    const initiatorName =
      req.user?.name || req.user?.companyName || (isBuyer ? "Buyer" : "Seller");

    if (action === "propose") {
      // Min date validation (e.g., from offer.availabilityDate or SR.desiredDeliveryTime) should be on frontend mostly.
      // Backend can do a basic check against today.
      if (new Date(proposedDate) < new Date().setHours(0, 0, 0, 0)) {
        return res
          .status(400)
          .json({ message: "Proposed schedule date cannot be in the past." });
      }

      sr.currentScheduleProposal = {
        proposedBy: userId,
        proposedDate: new Date(proposedDate),
        proposedTimeSlot,
        specificTimeDetails:
          proposedTimeSlot === "specific_time"
            ? specificTimeDetails
            : undefined,
        notes: notes || "",
        proposalStatus: isBuyer
          ? "pending_seller_confirmation"
          : "pending_buyer_confirmation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sr.schedulingConfirmedByBuyer = isBuyer;
      sr.schedulingConfirmedBySeller = isSeller;
      sr.status = "SCHEDULE_NEGOTIATION";
      sr.rescheduleCount = (sr.rescheduleCount || 0) + 1;
      sr.lastScheduleUpdateBy = userId;

      notificationRecipient = isBuyer ? sr.awardedSellerId : sr.createdBy;
      notificationTitle = "New Schedule Proposal";
      notificationMessage = `${initiatorName} proposed a schedule for "${sr.title.substring(
        0,
        30
      )}...". Please review.`;
    } else if (action === "confirm") {
      if (
        !sr.currentScheduleProposal ||
        !sr.currentScheduleProposal.proposalStatus
      ) {
        return res
          .status(400)
          .json({ message: "No active schedule proposal to confirm." });
      }
      if (
        (isBuyer &&
          sr.currentScheduleProposal.proposalStatus !==
          "pending_buyer_confirmation") ||
        (isSeller &&
          sr.currentScheduleProposal.proposalStatus !==
          "pending_seller_confirmation")
      ) {
        return res
          .status(400)
          .json({ message: "It's not your turn to confirm this proposal." });
      }

      if (isBuyer) sr.schedulingConfirmedByBuyer = true;
      if (isSeller) sr.schedulingConfirmedBySeller = true;

      if (sr.schedulingConfirmedByBuyer && sr.schedulingConfirmedBySeller) {
        sr.confirmedSchedule = {
          date: sr.currentScheduleProposal.proposedDate,
          timeSlot: sr.currentScheduleProposal.proposedTimeSlot,
          specificTime: sr.currentScheduleProposal.specificTimeDetails,
          notes: sr.currentScheduleProposal.notes,
          confirmedByBuyerAt: isBuyer
            ? new Date()
            : sr.currentScheduleProposal.updatedAt, // a bit tricky if we don't store first confirmation time
          confirmedBySellerAt: isSeller
            ? new Date()
            : sr.currentScheduleProposal.updatedAt,
          confirmedAt: new Date(),
        };
        sr.status = "SCHEDULE_CONFIRMED";
        sr.currentScheduleProposal = undefined; // Clear proposal
        // sr.paymentStatus = "pending"; // Already default, buyer will initiate payment

        notificationRecipient = isBuyer ? sr.awardedSellerId : sr.createdBy; // Notify both actually
        notificationTitle = "Schedule Confirmed!";
        notificationMessage = `The schedule for "${sr.title.substring(
          0,
          30
        )}..." has been confirmed by both parties. ${isBuyer ? "Seller" : "Buyer"
          } will proceed to payment.`;
        // Send two notifications or a general one
      } else {
        // This case should ideally not happen if each confirms the other's proposal.
        // If it does, it means one party confirmed their own proposal, which is not the flow.
        return res.status(400).json({
          message: "Waiting for the other party's confirmation first.",
        });
      }
    }

    const updatedSr = await sr.save();

    if (notificationRecipient && notificationRecipient._id) {
      const io = req.app.get("socketio");
      createAndDispatchNotification({
        recipientId: notificationRecipient._id,
        senderId: userId,
        type: "SERVICE_REQUEST_SCHEDULE_PROPOSED", // Added missing type
        title: notificationTitle,
        message: notificationMessage,
        link: `/service-request/${updatedSr._id}`, // Add link
        relatedResource: updatedSr._id, // Add relatedResource
        relatedResourceType: "ServiceRequest", // Add relatedResourceType
        io: req.app.get("socketio"), // Pass io explicitly
        status: "sent", // Set status to 'sent' as it's dispatched
      });
      // If schedule is fully confirmed, notify the other party as well.
      if (updatedSr.status === "SCHEDULE_CONFIRMED") {
        const otherParty = isBuyer ? sr.awardedSellerId : sr.createdBy;
        if (
          otherParty &&
          otherParty._id.toString() !== notificationRecipient._id.toString()
        ) {
          createAndDispatchNotification({
            recipientId: otherParty._id,
            senderId: userId,
            type: "SERVICE_REQUEST_SCHEDULE_CONFIRMED",
            title: "Schedule Confirmed!",
            message: `The schedule for "${updatedSr.title.substring(
              0,
              30
            )}..." has been confirmed. ${sr.createdBy._id.equals(otherParty._id)
              ? "Please proceed to payment."
              : "Awaiting buyer payment."
              }`,
            link: `/service-request/${updatedSr._id}`,
            relatedResource: updatedSr._id,
            relatedResourceType: "ServiceRequest",
            io,
            status: "sent", // Set status to 'sent' as it's dispatched
          });
        }
      }
    }

    res
      .status(200)
      .json({ message: "Schedule updated.", serviceRequest: updatedSr });
  } catch (error) {
    console.error("Error in proposeOrConfirmSchedule:", error);
    res
      .status(500)
      .json({ message: "Internal server error managing schedule." });
  }
};

// --- NEW: INITIATE PAYMENT FOR SERVICE REQUEST (After Scheduling) ---
const initiateServicePayment = async (req, res) => {
  const { requestId } = req.params;
  const buyerId = req.user._id;
  const sq = getSquareConfig();

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid service request ID." });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate("awardedSellerId", "name email stripeAccountId") // Need seller's Stripe account ID
      .populate("createdBy", "name email")
      .populate({
        path: "offersReceived.seller", // Populate seller details within offers
        select: "name email stripeAccountId",
      });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (!serviceRequest.createdBy._id.equals(buyerId)) {
      return res.status(403).json({
        message: "You are not authorized to initiate payment for this request.",
      });
    }
    // Check if the service request is in the correct status for payment initiation
    if (serviceRequest.status !== "SCHEDULE_CONFIRMED") {
      return res.status(400).json({
        message: `Cannot initiate payment. Request status is "${serviceRequest.status}". It must be 'SCHEDULE_CONFIRMED'.`,
      });
    }
    if (!serviceRequest.awardedOfferId) {
      return res.status(400).json({
        message: "No offer has been awarded for this service request.",
      });
    }
    // if (
    //TODO   !serviceRequest.awardedSellerId ||
    //TODO   !serviceRequest.awardedSellerId.stripeAccountId
    // ) {
    //   return res.status(400).json({
    //     message: "Awarded seller's Stripe account is not configured.",
    //   });
    // }
    if (
      serviceRequest.paymentIntentId &&
      serviceRequest.paymentStatus === "pending"
    ) {
      return res.status(200).json({
        message: "Payment already initiated and pending.",
        serviceRequest,
        paymentRequired: true,
        paymentProvider: "square",
        square: {
          applicationId: sq.applicationId,
          locationId: sq.locationId,
          amount: Math.round((serviceRequest.amountToBePaid || 0) * 100),
          currency: "USD",
        },
      });
    }
    if (serviceRequest.paymentStatus === "succeeded") {
      return res.status(200).json({
        message: "Payment already succeeded for this service request.",
        serviceRequest,
      });
    }

    const awardedOffer = serviceRequest.offersReceived.find(
      (offer) =>
        offer._id.toString() === serviceRequest.awardedOfferId.toString()
    );
    if (!awardedOffer) {
      return res
        .status(404)
        .json({ message: "Awarded offer details not found on this request." });
    }

    const amountToCharge = Math.round(awardedOffer.proposedPrice * 100); // Amount in cents
    if (amountToCharge <= 0) {
      return res.status(400).json({
        message: "Cannot process payment for zero or negative amount.",
      });
    }

    // Create a new ServiceRequestOrder document with payment intent details
    const pendingPaymentId = `pending_${new mongoose.Types.ObjectId().toString()}`;
    const newServiceRequestOrder = new ServiceRequestOrder({
      serviceRequestId: serviceRequest._id, // Link to the service request
      buyer: buyerId,
      seller: serviceRequest.awardedSellerId._id,
      service: awardedOffer.linkedServiceId, // Can be null now, as per updated schema
      totalPrice: awardedOffer.proposedPrice,
      currency: "USD", // Assuming USD, or get from awardedOffer
      status: "pending-payment",
      paymentIntentId: pendingPaymentId,
      paymentIntentClientSecret: "square_pending",
      scheduledDateTime: serviceRequest.confirmedSchedule?.date, // Use confirmed schedule
      selectedTimeSlot: {
        slotDate: serviceRequest.confirmedSchedule?.date,
        startTime: serviceRequest.confirmedSchedule?.timeSlot,
      },
      notes: serviceRequest.confirmedSchedule?.notes,
      isCommunity: serviceRequest.isCommunity,
      subcategory: serviceRequest.subcategory,
    });
    const savedServiceRequestOrder = await newServiceRequestOrder.save();

    // Create transaction log for service request order attempt
    try {
      await TransactionLog.create({
        buyer: buyerId,
        seller: serviceRequest.awardedSellerId._id,
        type: "service",
        purchasedItem: savedServiceRequestOrder._id,
        itemModel: "ServiceRequestOrder",
        totalAmount: awardedOffer.proposedPrice,
        sellerCommission: 0, // Will be calculated on payment confirmation
        adminCommission: 0, // Will be calculated on payment confirmation
        status: "pending", // Order is pending payment
        paymentProvider: "square",
        transactionId: pendingPaymentId,
        isSpecial: serviceRequest.isSpecial,
        specialOffer: serviceRequest.specialOffer,
        isCommunity: serviceRequest.isCommunity,
        metadata: {
          orderAttempt: true,
          orderStatus: "pending-payment",
          serviceRequestId: serviceRequest._id
        }
      });
      console.log(`[createServiceRequestOrder] TransactionLog created for service request order attempt ${savedServiceRequestOrder._id}`);
    } catch (logError) {
      console.error(`[createServiceRequestOrder] Failed to create TransactionLog:`, logError);
    }

    // Update ServiceRequest with payment intent details
    serviceRequest.paymentIntentId = pendingPaymentId;
    serviceRequest.paymentIntentClientSecret = "square_pending";
    serviceRequest.amountToBePaid = awardedOffer.proposedPrice;
    serviceRequest.paymentStatus = "pending";
    serviceRequest.orderId = savedServiceRequestOrder._id; // Link to the new ServiceRequestOrder
    serviceRequest.status = "payment_pending"; // New status

    const updatedServiceRequest = await serviceRequest.save();

    // Notify seller that payment is pending
    const io = req.app.get("socketio");
    const buyerUser = await User.findById(buyerId)
      .select("name companyName")
      .lean();
    const buyerDisplayName =
      buyerUser?.name || buyerUser?.companyName || "The Buyer";
    createAndDispatchNotification(
      {
        recipientId: serviceRequest.awardedSellerId._id,
        senderId: buyerId,
        type: "SERVICE_REQUEST_PAYMENT_PENDING",
        title: "Payment Initiated for Your Service Request!",
        message: `${buyerDisplayName} has initiated payment for "${serviceRequest.title.substring(
          0,
          30
        )}...". Awaiting completion.`,
        link: `/service-request/${serviceRequest._id}`, // Link for seller to see pending payment
        relatedResource: serviceRequest._id,
        relatedResourceType: "ServiceRequest",
        io,
        status: "sent", // Set status to 'sent' as it's dispatched
      },
      {
        emailTemplateFunc: "serviceRequestPaymentInitiatedEmailToSeller", // Create this template
        emailTemplateArgs: [
          serviceRequest.awardedSellerId.name || "Service Provider",
          buyerDisplayName,
          serviceRequest.title,
          awardedOffer.proposedPrice,
          `${process.env.CLIENT_URL || "http://localhost:5173"
          }/seller/service-requests/in-progress/${serviceRequest._id}`,
        ],
      }
    ).catch((err) =>
      console.error("Error sending payment initiated notification:", err)
    );

    res.status(200).json({
      message: "Payment initiated successfully. Please complete the payment.",
      serviceRequest: updatedServiceRequest,
      paymentRequired: true,
      paymentProvider: "square",
      square: {
        applicationId: sq.applicationId,
        locationId: sq.locationId,
        amount: amountToCharge,
        currency: "USD",
      },
    });
  } catch (error) {
    console.error(
      "Error initiating service payment:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error initiating payment." });
  }
};

// --- NEW: CONFIRM SERVICE PAYMENT (Webhook or Client-side) ---
const confirmServicePayment = async (req, res) => {
  const { requestId } = req.params;
  const { sourceId, idempotencyKey } = req.body;

  if (!mongoose.Types.ObjectId.isValid(requestId) || !sourceId) {
    return res
      .status(400)
      .json({ message: "Invalid Request ID or missing Square sourceId." });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate("createdBy", "name email")
      .populate("awardedSellerId", "name email");

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (serviceRequest.paymentStatus === "succeeded") {
      return res
        .status(200)
        .json({ message: "Payment already succeeded.", serviceRequest });
    }
    if (serviceRequest.status !== "payment_pending") {
      return res.status(400).json({
        message: `Service request is not in 'payment_pending' status (current: ${serviceRequest.status}).`,
      });
    }

    const amountInCents = Math.round((serviceRequest.amountToBePaid || 0) * 100);
    const createResp = await createSquarePayment({
      sourceId,
      amount: amountInCents,
      currency: "USD",
      idempotencyKey:
        idempotencyKey || `service-request-${serviceRequest._id.toString()}`,
      autocomplete: false,
      note: `Service request payment ${serviceRequest._id.toString()}`,
    });

    const paymentId = createResp?.payment?.id;
    if (!paymentId) {
      serviceRequest.paymentStatus = "failed";
      await serviceRequest.save();
      if (serviceRequest.orderId) {
        await ServiceRequestOrder.findByIdAndUpdate(serviceRequest.orderId, {
          status: "failed",
        });
      }
      return res.status(400).json({
        message: "Square payment creation failed.",
        squareErrors: createResp?.errors || null,
      });
    }

    const completeResp = await completeSquarePayment(paymentId);
    const paymentStatus = completeResp?.payment?.status;
    if (paymentStatus !== "COMPLETED") {
      serviceRequest.paymentStatus = "failed";
      await serviceRequest.save();
      if (serviceRequest.orderId) {
        await ServiceRequestOrder.findByIdAndUpdate(serviceRequest.orderId, {
          status: "failed",
        });
      }
      return res.status(400).json({
        message: "Payment verification failed or not completed.",
        squareStatus: paymentStatus || "UNKNOWN",
      });
    }

    // Payment succeeded
    serviceRequest.paymentIntentId = paymentId;
    serviceRequest.paymentIntentClientSecret = "square_completed";
    serviceRequest.paymentStatus = "succeeded";
    serviceRequest.status = "payment_succeeded"; // New status

    // --- CALCULATE AND LOG COMMISSION (Dynamic from Database) ---
    const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
      serviceRequest.amountToBePaid || 0,
      serviceRequest,
      "serviceRequest"
    );

    // Update existing transaction log
    try {
      await TransactionLog.findOneAndUpdate(
        { 
          purchasedItem: serviceRequest.orderId,
          itemModel: "ServiceRequestOrder",
          status: "pending"
        },
        {
          sellerCommission: sellerCommission,
          adminCommission: adminCommission,
          status: "succeeded",
          paymentProvider: "Square",
          transactionId: paymentId,
          isCommunity: level === 'community',
          $unset: {
            "metadata.orderAttempt": "",
            "metadata.orderStatus": ""
          },
          $set: {
            "metadata.paymentConfirmed": true,
            "metadata.confirmedAt": new Date()
          }
        },
        { new: true }
      );
      console.log(`[confirmServicePayment] TransactionLog updated for service request ${serviceRequest._id}`);
    } catch (logError) {
      console.error(`[confirmServicePayment] Failed to update TransactionLog:`, logError);
      // Fallback: create new transaction log if update fails
      try {
        await TransactionLog.findOneAndUpdate(
          {
            purchasedItem: serviceRequest.orderId,
            itemModel: "ServiceRequestOrder",
            status: "pending"
          },
          {
            $set: {
              buyer: serviceRequest.createdBy._id,
              seller: serviceRequest.awardedSellerId._id,
              type: "service",
              totalAmount: serviceRequest.amountToBePaid || 0,
              sellerCommission: sellerCommission,
              adminCommission: adminCommission,
              currency: "USD",
              status: "succeeded",
              paymentProvider: "Square",
              transactionId: paymentId,
            }
          },
          { upsert: true, new: true }
        );
        console.log(`[confirmServicePayment] Fallback TransactionLog created for service request ${serviceRequest._id}`);
      } catch (fallbackError) {
        console.error(`[confirmServicePayment] Failed to create fallback TransactionLog:`, fallbackError);
      }
    }

    const updatedServiceRequest = await serviceRequest.save();

    // Update linked ServiceRequestOrder status
    if (serviceRequest.orderId) {
      await ServiceRequestOrder.findByIdAndUpdate(serviceRequest.orderId, {
        status: "succeeded", // Use 'succeeded' for the order status
      });
    }

    // Notify both buyer and seller
    const io = req.app.get("socketio");
    const buyerUser = serviceRequest.createdBy;
    const sellerUser = serviceRequest.awardedSellerId;

    if (buyerUser && buyerUser._id) {
      createAndDispatchNotification(
        {
          recipientId: buyerUser._id,
          senderId: sellerUser._id, // Or system
          type: "SERVICE_REQUEST_PAYMENT_SUCCESS",
          title: "Payment Successful!",
          message: `Your payment for "${serviceRequest.title.substring(
            0,
            30
          )}..." was successful. The project is now officially in progress!`,
          link: `/service-request/${serviceRequest._id}`,
          relatedResource: serviceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: "serviceRequestPaymentSuccessEmailToBuyer", // Create this template
          emailTemplateArgs: [
            buyerUser.name || "Buyer",
            serviceRequest.title,
            `${process.env.CLIENT_URL || "http://localhost:5173"
            }/service-request/${serviceRequest._id}`,
          ],
        }
      ).catch((err) =>
        console.error(
          "Error sending payment success notification to buyer:",
          err
        )
      );
    }

    if (sellerUser && sellerUser._id) {
      createAndDispatchNotification(
        {
          recipientId: sellerUser._id,
          senderId: buyerUser._id, // Or system
          type: "SERVICE_REQUEST_PAYMENT_SUCCESS",
          title: "Payment Received!",
          message: `Payment for "${serviceRequest.title.substring(
            0,
            30
          )}..." has been successfully processed. The project is now officially in progress!`,
          link: `/service-request/${serviceRequest._id}`,
          relatedResource: serviceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: "serviceRequestPaymentSuccessEmailToSeller", // Create this template
          emailTemplateArgs: [
            sellerUser.name || "Seller",
            serviceRequest.title,
            `${process.env.CLIENT_URL || "http://localhost:5173"
            }/seller/service-requests/in-progress/${serviceRequest._id}`,
          ],
        }
      ).catch((err) =>
        console.error(
          "Error sending payment success notification to seller:",
          err
        )
      );
    }

    res.status(200).json({
      message:
        "Payment confirmed and service request status updated to in-progress.",
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error(
      "Error confirming service payment:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error confirming payment." });
  }
};

// --- BUYER REJECTS AN OFFER ---
const buyerRejectOffer = async (req, res) => {
  const { requestId } = req.params;
  const buyerId = req.user._id;
  const { rejectionReason } = req.body; // Get reason from request body

  if (
    !mongoose.Types.ObjectId.isValid(requestId) ||
    !mongoose.Types.ObjectId.isValid(offerId)
  ) {
    return res.status(400).json({ message: "Invalid Request ID or Offer ID." });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId).populate(
      "offersReceived.seller", // Populate for notification
      "name email"
    );

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (!serviceRequest.createdBy.equals(buyerId)) {
      return res
        .status(403)
        .json({ message: "You can only reject offers on your own requests." });
    }

    const offerToReject = serviceRequest.offersReceived.find((offer) =>
      offer._id.equals(offerId)
    );
    if (!offerToReject) {
      return res
        .status(404)
        .json({ message: "Offer not found on this request." });
    }

    // Buyer can reject a 'pending' offer (original from seller)
    // or a 'countered_by_buyer' offer (their own counter that seller might not have responded to yet, or buyer changed mind)
    if (
      offerToReject.status !== "pending" &&
      offerToReject.status !== "countered_by_buyer"
    ) {
      return res.status(400).json({
        message: `Offer status is '${offerToReject.status}'. Cannot reject at this stage directly.`,
      });
    }

    offerToReject.status = "rejected_by_buyer";
    if (rejectionReason) {
      offerToReject.buyerRejectionReason = rejectionReason.substring(0, 500); // Maxlength from schema
    }
    offerToReject.counterOfferDetails = undefined; // Clear any pending counter from buyer if they are rejecting it now

    // If all offers are now resolved (accepted, rejected, withdrawn), SR status might change.
    // For now, SR status could remain 'open' or 'in-discussion'.
    // If SR was 'in-discussion' because of this offer, it might stay 'in-discussion'.

    const updatedServiceRequest = await serviceRequest.save();

    const io = req.app.get("socketio");
    const buyerUser = await User.findById(buyerId)
      .select("name companyName")
      .lean();
    const buyerDisplayName =
      buyerUser?.name || buyerUser?.companyName || "The Buyer";
    const sellerToNotify = offerToReject.seller;

    if (sellerToNotify && sellerToNotify._id) {
      createAndDispatchNotification(
        {
          recipientId: sellerToNotify._id,
          senderId: buyerId,
          type: "SERVICE_REQUEST_OFFER_REJECTED",
          title: "Update on Your Offer",
          message: `Regarding your offer for "${updatedServiceRequest.title.substring(
            0,
            40
          )}...", the buyer has chosen not to proceed with it at this time. Reason: ${rejectionReason || "Not specified"
            }.`,
          link: `/service-requests/browse`, // Link for seller to see their offers page
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: offerRejectedEmailToSeller,
          emailTemplateArgs: [
            sellerToNotify.name || "Service Provider",
            sellerToNotify.email,
            updatedServiceRequest.title,
            rejectionReason || "No specific reason provided.",
          ],
        }
      ).catch((err) =>
        console.error("Error sending offer rejected notification:", err)
      );
    }

    res.status(200).json({
      message: "Offer rejected.",
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error("Error rejecting offer:", error.message, error.stack);
    res.status(500).json({ message: "Internal server error rejecting offer." });
  }
};

// --- BUYER/SELLER CONFIRMS SCHEDULE OR RESCHEDULES ---
// This is a more complex flow, for now, let's assume buyer sets the schedule after accepting
const setScheduleForServiceRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id; // Could be buyer or seller initiating/confirming
  const { scheduledDate, scheduledTimeSlot, specificTimeDetails, notes } =
    req.body;

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid service request ID." });
  }
  if (!scheduledDate || !scheduledTimeSlot) {
    return res
      .status(400)
      .json({ message: "Scheduled date and time slot are required." });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId).populate(
      "createdBy awardedSellerId",
      "name email stripeAccountId" // Populate stripeAccountId for transfers
    );
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    // Authorization: only buyer or awarded seller can schedule
    const isBuyer = serviceRequest.createdBy._id.equals(userId);
    const isAwardedSeller =
      serviceRequest.awardedSellerId &&
      serviceRequest.awardedSellerId._id.equals(userId);

    if (!isBuyer && !isAwardedSeller) {
      return res.status(403).json({
        message: "You are not authorized to schedule this service request.",
      });
    }

    // Check if the request is in a state where scheduling is allowed
    if (
      serviceRequest.status !== "offer_accepted" &&
      serviceRequest.status !== "scheduling_pending" &&
      serviceRequest.status !== "scheduled"
    ) {
      return res.status(400).json({
        message: `Cannot schedule. Request status is "${serviceRequest.status}".`,
      });
    }

    const isReschedule = serviceRequest.status === "scheduled";
    const oldScheduledDate = serviceRequest.scheduledDate;
    const oldScheduledTimeSlot = serviceRequest.scheduledTimeSlot;

    // Update scheduling details
    serviceRequest.scheduledDate = new Date(scheduledDate);
    serviceRequest.scheduledTimeSlot = scheduledTimeSlot;
    serviceRequest.scheduledSpecificTime =
      scheduledTimeSlot === "specific_time" && specificTimeDetails
        ? specificTimeDetails
        : undefined;
    serviceRequest.schedulingNotes = notes || ""; // Allow notes to be empty or updated

    // Handle confirmation logic
    if (isBuyer) {
      serviceRequest.schedulingConfirmedByBuyer = true;
      // If seller has already confirmed, or if buyer is setting it for the first time
      if (serviceRequest.schedulingConfirmedBySeller || !isReschedule) {
        serviceRequest.status = "scheduled";
      } else {
        serviceRequest.status = "scheduling_pending"; // Awaiting seller confirmation
      }
    } else if (isAwardedSeller) {
      serviceRequest.schedulingConfirmedBySeller = true;
      // If buyer has already confirmed, or if seller is setting it for the first time
      if (serviceRequest.schedulingConfirmedByBuyer || !isReschedule) {
        serviceRequest.status = "scheduled";
      } else {
        serviceRequest.status = "scheduling_pending"; // Awaiting buyer confirmation
      }
    }

    // Handle rescheduling count and last initiator
    if (isReschedule) {
      serviceRequest.rescheduleCount =
        (serviceRequest.rescheduleCount || 0) + 1;
      serviceRequest.lastRescheduleBy = userId;
    }

    const updatedServiceRequest = await serviceRequest.save();

    // --- Notify the other party ---
    const io = req.app.get("socketio");
    const initiator = await User.findById(userId)
      .select("name companyName")
      .lean();
    const initiatorName = initiator?.name || initiator?.companyName || "A user";
    let recipientForNotification, recipientNameForEmail, linkForRecipient;
    let notificationTitle, notificationMessage;

    linkForRecipient = `/service-request/${updatedServiceRequest._id}`;

    if (updatedServiceRequest.status === "scheduled") {
      notificationTitle = "Service Request Scheduled!";
      notificationMessage = `${initiatorName} has confirmed the schedule for: "${updatedServiceRequest.title.substring(
        0,
        30
      )}..."`;
      if (isReschedule) {
        notificationTitle = "Service Request Rescheduled!";
        notificationMessage = `${initiatorName} has proposed a reschedule for: "${updatedServiceRequest.title.substring(
          0,
          30
        )}...". Please review and confirm.`;
      }
    } else if (updatedServiceRequest.status === "scheduling_pending") {
      notificationTitle = "Schedule Proposed/Updated!";
      notificationMessage = `${initiatorName} has proposed a schedule for: "${updatedServiceRequest.title.substring(
        0,
        30
      )}...". Please review and confirm.`;
    }

    if (recipientForNotification && recipientForNotification._id) {
      createAndDispatchNotification(
        {
          recipientId: recipientForNotification._id,
          senderId: userId,
          type: "SERVICE_REQUEST_SCHEDULE_UPDATE", // Generic type for schedule changes
          title: notificationTitle,
          message: notificationMessage,
          link: linkForRecipient,
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: "serviceRequestScheduleUpdateEmail", // Create this template
          emailTemplateArgs: [
            recipientNameForEmail,
            initiatorName,
            updatedServiceRequest.title,
            new Date(updatedServiceRequest.scheduledDate).toLocaleDateString(),
            updatedServiceRequest.scheduledTimeSlot,
            updatedServiceRequest.scheduledSpecificTime,
            updatedServiceRequest.schedulingNotes,
            linkForRecipient,
            updatedServiceRequest.status, // Pass status to email template for conditional messaging
            isReschedule, // Pass reschedule flag
            oldScheduledDate
              ? new Date(oldScheduledDate).toLocaleDateString()
              : "N/A",
            oldScheduledTimeSlot || "N/A",
          ],
        }
      ).catch((err) =>
        console.error("Error sending schedule notification:", err)
      );
    }
    // --- End Notification ---

    res.status(200).json({
      message: `Service request status updated to ${updatedServiceRequest.status}.`,
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error("Error setting schedule:", error);
    res
      .status(500)
      .json({ message: "Internal server error managing schedule." });
  }
};

// --- BUYER/SELLER MARKS SERVICE REQUEST AS WORK IN PROGRESS ---
const markServiceRequestInProgress = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid service request ID." });
  }
  try {
    const serviceRequest = await ServiceRequest.findById(requestId).populate(
      "createdBy awardedSellerId", // Populate for notifications
      "name email"
    );
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    const isBuyer = serviceRequest.createdBy._id.equals(userId);
    const isAwardedSeller =
      serviceRequest.awardedSellerId &&
      serviceRequest.awardedSellerId._id.equals(userId);

    if (!isBuyer && !isAwardedSeller) {
      return res.status(403).json({
        message: "You are not authorized to update this request's progress.",
      });
    }
    // Can only be marked in progress if payment has succeeded
    if (serviceRequest.status !== "payment_succeeded") {
      return res.status(400).json({
        message: `Request must have 'payment_succeeded' status to mark as in progress (current: ${serviceRequest.status}).`,
      });
    }

    serviceRequest.status = "IN_PROGRESS";
    const updatedServiceRequest = await serviceRequest.save();

    // --- Notify other party ---
    const io = req.app.get("socketio");
    const initiatorUser = await User.findById(userId)
      .select("name companyName")
      .lean();
    const initiatorName =
      initiatorUser?.name ||
      initiatorUser?.companyName ||
      (isBuyer ? "The Buyer" : "The Service Provider");
    let recipient, recipientType, link;

    if (isBuyer) {
      recipient = serviceRequest.awardedSellerId;
      recipientType = "Seller";
      link = `/service-request/${updatedServiceRequest._id}`;
    } else {
      // isAwardedSeller
      recipient = serviceRequest.createdBy;
      recipientType = "Buyer";
      link = `/service-request/${updatedServiceRequest._id}`;
    }

    if (recipient && recipient._id && !recipient._id.equals(userId)) {
      // Don't notify self
      createAndDispatchNotification(
        {
          recipientId: recipient._id,
          senderId: userId,
          type: "SERVICE_REQUEST_IN_PROGRESS",
          title: "Service Request Started!",
          message: `${initiatorName} has marked the service request "${updatedServiceRequest.title.substring(
            0,
            30
          )}..." as In Progress.`,
          link: link,
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
          status: "sent", // Set status to 'sent' as it's dispatched
        },
        {
          // Add email notification if desired
          // emailTemplateFunc: 'serviceRequestInProgressEmail',
          // emailTemplateArgs: [recipient.name || recipientType, initiatorName, updatedServiceRequest.title, link]
        }
      ).catch((err) =>
        console.error("Error sending in-progress notification:", err)
      );
    }

    res.status(200).json({
      message: "Service request marked as in-progress.",
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error(
      "Error marking request in-progress:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error marking request in-progress." });
  }
};

// --- BUYER/SELLER MARKS SERVICE REQUEST AS COMPLETED (Seller usually initiates, Buyer approves) ---
const markServiceRequestAsCompletedByParty = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;
  // const { notes } = req.body; // Optional completion notes

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid service request ID." });
  }
  try {
    const serviceRequest = await ServiceRequest.findById(requestId).populate(
      "createdBy awardedSellerId",
      "name email"
    );
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    const isBuyer = serviceRequest.createdBy._id.equals(userId);
    const isAwardedSeller =
      serviceRequest.awardedSellerId &&
      serviceRequest.awardedSellerId._id.equals(userId);

    if (!isBuyer && !isAwardedSeller) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    if (
      serviceRequest.status !== "IN_PROGRESS" &&
      serviceRequest.status !== "PENDING_COMPLETION"
    ) {
      return res.status(400).json({
        message: `Request is not in a state to be marked completed (current: ${serviceRequest.status}).`,
      });
    }

    let nextStatus = serviceRequest.status;
    let notificationRecipient = null;
    let notificationType = "";
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationLink = "";
    let emailTemplate = "";
    let emailArgs = [];

    const initiator = await User.findById(userId)
      .select("name companyName")
      .lean();
    const initiatorName = initiator?.name || initiator?.companyName || "A user";

    if (isAwardedSeller) {
      if (serviceRequest.status === "IN_PROGRESS") {
        serviceRequest.status = "PENDING_COMPLETION";
        notificationRecipient = serviceRequest.createdBy;
        notificationType = "SERVICE_REQUEST_COMPLETION_PENDING_BUYER";
        notificationTitle = "Service Completed - Awaiting Your Approval";
        notificationMessage = `${initiatorName} has marked the service request "${serviceRequest.title.substring(
          0,
          30
        )}..." as completed. Please review and approve.`;
        notificationLink = `/service-request/${serviceRequest._id}`; // Buyer views to approve
        emailTemplate = "serviceRequestPendingApprovalEmailToBuyer";
        emailArgs = [
          serviceRequest.createdBy.name || "Buyer",
          initiatorName,
          serviceRequest.title,
          notificationLink,
        ];
      } else {
        return res
          .status(400)
          .json({ message: "Seller has already marked this as completed." });
      }
    } else if (isBuyer) {
      if (
        serviceRequest.status === "PENDING_COMPLETION" ||
        serviceRequest.status === "IN_PROGRESS"
      ) {
        // Buyer can mark completed directly if seller hasn't
        serviceRequest.status = "COMPLETED";
        // Notify seller that buyer marked as complete
        notificationRecipient = serviceRequest.awardedSellerId;
        notificationType = "SERVICE_REQUEST_COMPLETED_BY_BUYER_SELLER";
        notificationTitle = "Service Request Completed!";
        notificationMessage = `${initiatorName} has marked the service request "${serviceRequest.title.substring(
          0,
          30
        )}..." as completed.`;
        notificationLink = `/service-request/${serviceRequest._id}`; // Seller views completed
        emailTemplate = "serviceRequestCompletedEmailToSeller";
        emailArgs = [
          serviceRequest.awardedSellerId?.name || "Seller",
          initiatorName,
          serviceRequest.title,
          notificationLink,
        ];

        // TODO: Trigger payment release to seller if an order/escrow system is in place
        // TODO: Allow buyer to leave a review for the seller/service
      } else {
        return res
          .status(400)
          .json({ message: "Request not in a state to be approved by buyer." });
      }
    }

    const updatedServiceRequest = await serviceRequest.save();

    // Send notification
    if (notificationRecipient && notificationRecipient._id) {
      const io = req.app.get("socketio");
      createAndDispatchNotification(
        {
          recipientId: notificationRecipient._id,
          senderId: userId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          link: notificationLink,
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
          status: "sent", // Set status to 'sent' as it's dispatched
        },
        { emailTemplateFunc: emailTemplate, emailTemplateArgs: emailArgs }
      ).catch((err) =>
        console.error("Error sending completion status notification:", err)
      );
    }

    res.status(200).json({
      message: `Service request status updated to ${updatedServiceRequest.status}.`,
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error("Error marking request completed:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- NEW: BUYER SUBMITS A COUNTER-OFFER ---
const buyerSubmitCounterOffer = async (req, res) => {
  const { requestId, offerId } = req.params; // offerId is the original seller's offer being countered
  const buyerId = req.user._id;
  const { price, priceType, deliveryTime, message } = req.body; // Counter offer terms

  if (
    !mongoose.Types.ObjectId.isValid(requestId) ||
    !mongoose.Types.ObjectId.isValid(offerId)
  ) {
    return res.status(400).json({ message: "Invalid Request ID or Offer ID." });
  }
  if (price === undefined || !priceType || !message) {
    return res.status(400).json({
      message:
        "Price, price type, and message are required for a counter-offer.",
    });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId).populate(
      "offersReceived.seller",
      "name email"
    );

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (!serviceRequest.createdBy.equals(buyerId)) {
      return res.status(403).json({
        message: "You can only submit counter-offers on your own requests.",
      });
    }
    if (
      serviceRequest.status !== "open" &&
      serviceRequest.status !== "in-discussion"
    ) {
      return res.status(400).json({
        message: `Cannot submit counter-offer. Request status is "${serviceRequest.status}".`,
      });
    }

    const originalOffer = serviceRequest.offersReceived.find((offer) =>
      offer._id.equals(offerId)
    );
    if (!originalOffer) {
      return res
        .status(404)
        .json({ message: "Original offer not found on this request." });
    }
    if (originalOffer.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only counter a currently pending offer." });
    }

    originalOffer.status = "countered_by_buyer";
    originalOffer.counterOfferDetails = {
      price: Number(price),
      priceType,
      deliveryTime: deliveryTime || undefined,
      message: message.substring(0, 1000), // Maxlength from schema
      counteredAt: new Date(),
    };
    // Ensure SR status reflects ongoing discussion
    if (serviceRequest.status === "open") {
      serviceRequest.status = "in-discussion";
    }

    const updatedServiceRequest = await serviceRequest.save();

    const io = req.app.get("socketio");
    const buyerUser = await User.findById(buyerId)
      .select("name companyName")
      .lean();
    const buyerDisplayName =
      buyerUser?.name || buyerUser?.companyName || "The Buyer";
    const sellerToNotify = originalOffer.seller;

    if (sellerToNotify && sellerToNotify._id) {
      createAndDispatchNotification(
        {
          recipientId: sellerToNotify._id,
          senderId: buyerId,
          type: "SERVICE_REQUEST_COUNTER_OFFER",
          title: "You've Received a Counter-Offer!",
          message: `${buyerDisplayName} has made a counter-offer to your proposal for: "${updatedServiceRequest.title.substring(
            0,
            30
          )}..."`,
          link: `/service-request/${updatedServiceRequest._id}`, // Link for seller to view the counter
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: "counterOfferEmailToSeller",
          emailTemplateArgs: [
            sellerToNotify.name || "Service Provider",
            sellerToNotify.email,
            buyerDisplayName,
            updatedServiceRequest.title,
            `${process.env.CLIENT_URL || "http://localhost:5173"
            }/seller/service-requests/offers/${updatedServiceRequest._id}`,
            // You might want to pass counter details in emailArgs too
            originalOffer.counterOfferDetails.message,
            originalOffer.counterOfferDetails.price,
            originalOffer.counterOfferDetails.priceType,
          ],
        }
      ).catch((err) =>
        console.error("Error sending counter-offer notification:", err)
      );
    }

    res.status(200).json({
      message:
        "Counter-offer submitted successfully. Awaiting seller response.",
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error(
      "Error submitting counter-offer:",
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Internal server error submitting counter-offer." });
  }
};

// --- NEW: SELLER RESPONDS TO A BUYER'S COUNTER-OFFER ---
const sellerRespondToCounterOffer = async (req, res) => {
  const { requestId, offerId } = req.params;
  const sellerId = req.user._id;
  const { accepted, sellerResponseMessage } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(requestId) ||
    !mongoose.Types.ObjectId.isValid(offerId)
  ) {
    return res.status(400).json({ message: "Invalid Request ID or Offer ID." });
  }
  if (typeof accepted !== "boolean") {
    return res.status(400).json({
      message:
        "Decision to accept or reject the counter-offer is required ('accepted' field must be true or false).",
    });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId).populate(
      "createdBy",
      "name email"
    );

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    const offerWithCounter = serviceRequest.offersReceived.find((offer) =>
      offer._id.equals(offerId)
    );

    if (!offerWithCounter) {
      return res.status(404).json({ message: "Offer not found." });
    }
    if (!offerWithCounter.seller.equals(sellerId)) {
      return res
        .status(403)
        .json({ message: "You are not the seller of this offer." });
    }
    if (offerWithCounter.status !== "countered_by_buyer") {
      return res.status(400).json({
        message:
          "This offer does not have a pending counter-offer from the buyer.",
      });
    }
    // Ensure counterOfferDetails exists before trying to access its properties
    if (!offerWithCounter.counterOfferDetails) {
      return res
        .status(400)
        .json({ message: "Counter offer details are missing for this offer." });
    }

    const buyerToNotify = serviceRequest.createdBy;
    const sellerUser = await User.findById(sellerId)
      .select("name companyName")
      .lean();
    const sellerDisplayName =
      sellerUser?.name || sellerUser?.companyName || "The Service Provider";

    if (accepted) {
      // Seller accepts buyer's counter. The offer's main terms are updated.
      // The offer status becomes 'pending' again, for the buyer to give the *final* acceptance.
      offerWithCounter.proposedPrice =
        offerWithCounter.counterOfferDetails.price;
      offerWithCounter.priceType =
        offerWithCounter.counterOfferDetails.priceType;
      if (offerWithCounter.counterOfferDetails.deliveryTime !== undefined) {
        offerWithCounter.proposedDeliveryTime =
          offerWithCounter.counterOfferDetails.deliveryTime;
      }

      // CORRECTED: Use offerWithCounter.message for the original message part
      let combinedMessage = offerWithCounter.message || ""; // Start with the existing offer message (which might be seller's original)

      // Check if the current message already contains a buyer's counter, if so, don't re-append it.
      // This logic assumes the original offer message is preserved before buyer's counter message was appended.
      // A more robust way would be to store originalOfferMessage separately if needed.
      // For now, we just append, assuming buyer's counter message is distinct.
      if (offerWithCounter.counterOfferDetails.message) {
        combinedMessage += `\n\n--- Buyer's Counter ---\n${offerWithCounter.counterOfferDetails.message}`;
      }

      if (sellerResponseMessage) {
        combinedMessage += `\n\n--- Seller's Response to Counter (Agreed) ---\n${sellerResponseMessage}`;
      } else {
        combinedMessage += `\n\n--- Seller's Response to Counter ---\nTerms agreed.`;
      }
      offerWithCounter.message = combinedMessage.substring(0, 2000);

      offerWithCounter.status = "pending"; // Back to pending for buyer's final explicit "Accept Offer"
      offerWithCounter.counterOfferDetails = undefined; // Clear counter details as they are now incorporated or void
    } else {
      // Seller rejected buyer's counter
      offerWithCounter.status = "counter_rejected_by_seller";
      if (sellerResponseMessage) {
        offerWithCounter.buyerResponseMessage = `Seller rejected counter: ${sellerResponseMessage.substring(
          0,
          1000
        )}`;
      } else {
        offerWithCounter.buyerResponseMessage =
          "Seller declined the counter-offer.";
      }
      // Optionally clear counterOfferDetails here too if they are no longer relevant
      // offerWithCounter.counterOfferDetails = undefined;
    }

    const updatedServiceRequest = await serviceRequest.save();

    const io = req.app.get("socketio");
    if (buyerToNotify && buyerToNotify._id) {
      createAndDispatchNotification(
        {
          recipientId: buyerToNotify._id,
          senderId: sellerId,
          type: accepted
            ? "COUNTER_OFFER_ACCEPTED_BY_SELLER"
            : "COUNTER_OFFER_REJECTED_BY_SELLER",
          title: accepted
            ? "Counter-Offer Terms Agreed!"
            : "Update on Your Counter-Offer",
          message: accepted
            ? `${sellerDisplayName} has agreed to your counter-offer terms for "${updatedServiceRequest.title.substring(
              0,
              30
            )}...". Please review and accept the offer to proceed.`
            : `${sellerDisplayName} has declined your counter-offer for "${updatedServiceRequest.title.substring(
              0,
              30
            )}...". ${sellerResponseMessage ||
            "No specific reason provided by seller."
            }`, // Added fallback
          link: `/service-request/${updatedServiceRequest._id}`,
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: "counterOfferResponseEmailToBuyer", // Make sure this email template exists
          emailTemplateArgs: [
            buyerToNotify.name || "User",
            buyerToNotify.email,
            sellerDisplayName,
            updatedServiceRequest.title,
            accepted,
            sellerResponseMessage ||
            (accepted ? "Terms agreed." : "Counter-offer declined."),
            `${process.env.CLIENT_URL || "http://localhost:5173"
            }/service-request/${updatedServiceRequest._id}`,
          ],
        }
      ).catch((err) =>
        console.error("Error sending counter-offer response notification:", err)
      );
    }

    res.status(200).json({
      message: `Counter-offer ${accepted
        ? "terms agreed, awaiting buyer final acceptance"
        : "rejected by you"
        }.`,
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error(
      "Error responding to counter-offer:",
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Internal server error responding to counter-offer." });
  }
};

// --- NEW: BUYER REQUESTS A REFUND ---
const requestRefundForServiceRequest = async (req, res) => {
  const { requestId } = req.params;
  const buyerId = req.user._id;
  const { cancellationReason, refundNotes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid service request ID." });
  }
  if (!cancellationReason) {
    return res.status(400).json({
      message: "Cancellation reason is required to request a refund.",
    });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate("createdBy", "name email")
      .populate("awardedSellerId", "name email");

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (!serviceRequest.createdBy._id.equals(buyerId)) {
      return res.status(403).json({
        message: "You are not authorized to request a refund for this request.",
      });
    }
    if (serviceRequest.paymentStatus !== "succeeded") {
      return res.status(400).json({
        message: `Payment for this service request has not succeeded (current status: ${serviceRequest.paymentStatus}). No refund can be requested.`,
      });
    }
    if (serviceRequest.refundStatus !== "none") {
      return res.status(400).json({
        message: `A refund has already been requested or processed for this service request (current status: ${serviceRequest.refundStatus}).`,
      });
    }

    serviceRequest.cancellationReason = cancellationReason.substring(0, 1000);
    serviceRequest.refundRequestedBy = buyerId;
    serviceRequest.refundStatus = "pending";
    serviceRequest.refundNotes = refundNotes || "";
    serviceRequest.status = "cancelled_with_refund_pending"; // New status

    const updatedServiceRequest = await serviceRequest.save();

    // Update linked ServiceRequestOrder status
    if (updatedServiceRequest.orderId) {
      await ServiceRequestOrder.findByIdAndUpdate(
        updatedServiceRequest.orderId,
        {
          status: "refund-requested",
        }
      );
    }

    // Notify seller and admin (if applicable) about refund request
    const io = req.app.get("socketio");
    const buyerUser = updatedServiceRequest.createdBy;
    const sellerUser = updatedServiceRequest.awardedSellerId;

    if (sellerUser && sellerUser._id) {
      createAndDispatchNotification(
        {
          recipientId: sellerUser._id,
          senderId: buyerId,
          type: "SERVICE_REQUEST_REFUND_REQUESTED",
          title: "Refund Requested for Your Service!",
          message: `${buyerUser.name || "The Buyer"
            } has requested a refund for "${updatedServiceRequest.title.substring(
              0,
              30
            )}..."`,
          link: `/service-request/${updatedServiceRequest._id}`, // Link for seller to review
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        {
          emailTemplateFunc: "serviceRequestRefundRequestedEmailToSeller", // Create this template
          emailTemplateArgs: [
            sellerUser.name || "Seller",
            buyerUser.name || "Buyer",
            updatedServiceRequest.title,
            cancellationReason,
            `${process.env.CLIENT_URL || "http://localhost:5173"
            }/seller/service-requests/refunds/${updatedServiceRequest._id}`,
          ],
        }
      ).catch((err) =>
        console.error(
          "Error sending refund request notification to seller:",
          err
        )
      );
    }

    // TODO: Notify admin for review

    res.status(200).json({
      message:
        "Refund request submitted successfully. It is now pending review.",
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error("Error requesting refund:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Internal server error requesting refund." });
  }
};

// --- NEW: ADMIN/SYSTEM PROCESSES A REFUND REQUEST ---
const processRefundForServiceRequest = async (req, res) => {
  const { requestId } = req.params;
  const adminId = req.user._id; // Assuming admin user
  const { action, refundAmount, adminNotes } = req.body; // action: "approve" or "reject"

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid service request ID." });
  }
  if (!["approve", "reject"].includes(action)) {
    return res
      .status(400)
      .json({ message: "Invalid action. Must be 'approve' or 'reject'." });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate("createdBy", "name email")
      .populate("awardedSellerId", "name email stripeAccountId");

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }
    // Authorization: Only admin can process refunds
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to process refunds." });
    }
    if (serviceRequest.refundStatus !== "pending") {
      return res.status(400).json({
        message: `Refund request is not in 'pending' status (current: ${serviceRequest.refundStatus}).`,
      });
    }
    if (serviceRequest.paymentIntentId === null) {
      return res.status(400).json({
        message:
          "No payment intent found for this service request. Cannot process refund.",
      });
    }

    let updatedServiceRequest;
    let notificationTitle = "";
    let notificationMessage = "";
    let emailTemplate = "";
    let emailArgs = [];

    if (action === "approve") {
      const amountToRefund = refundAmount
        ? Math.round(refundAmount * 100)
        : undefined; // In cents
      const serviceRequestOrder = await ServiceRequestOrder.findById(
        serviceRequest.orderId
      );
      if (!serviceRequestOrder) {
        return res.status(500).json({
          message:
            "Associated service request order not found for refund processing.",
        });
      }
      const maxRefundableAmount = Math.round(
        serviceRequestOrder.totalPrice * 100
      );

      if (
        amountToRefund !== undefined &&
        amountToRefund > maxRefundableAmount
      ) {
        return res.status(400).json({
          message: `Refund amount (${refundAmount}) exceeds original payment (${serviceRequestOrder.totalPrice}).`,
        });
      }

      const refundResponse = await createRefund(
        serviceRequest.paymentIntentId,
        amountToRefund
      );

      if (!refundResponse.success) {
        console.error("Stripe refund failed:", refundResponse.message);
        return res.status(500).json({
          message:
            refundResponse.message || "Failed to process refund with Stripe.",
        });
      }

      serviceRequest.refundStatus = "processed";
      serviceRequest.refundAmount = refundResponse.refund.amount / 100; // Store in USD
      serviceRequest.status = "cancelled_refunded"; // New status
      serviceRequest.refundNotes = adminNotes || serviceRequest.refundNotes;

      // Update linked ServiceRequestOrder status
      if (serviceRequest.orderId) {
        await ServiceRequestOrder.findByIdAndUpdate(serviceRequest.orderId, {
          status: "refunded",
          "refundDetails.refundId": refundResponse.refund.id,
          "refundDetails.amount": refundResponse.refund.amount / 100,
          "refundDetails.reason": adminNotes || "Approved by admin",
          "refundDetails.status": "succeeded",
          "refundDetails.processedAt": new Date(),
        });
      }

      notificationTitle = "Your Refund Has Been Processed!";
      notificationMessage = `Your refund request for "${serviceRequest.title.substring(
        0,
        30
      )}..." has been processed. Amount: $${serviceRequest.refundAmount}.`;
      emailTemplate = "serviceRequestRefundProcessedEmailToBuyer";
      emailArgs = [
        serviceRequest.createdBy.name || "Buyer",
        serviceRequest.title,
        serviceRequest.refundAmount,
        adminNotes || "Refund approved.",
        `${process.env.CLIENT_URL || "http://localhost:5173"}/service-request/${serviceRequest._id
        }`,
      ];
    } else {
      // action === "reject"
      serviceRequest.refundStatus = "rejected";
      serviceRequest.refundNotes = adminNotes || "";
      serviceRequest.status = "closed"; // Or back to previous status like 'in_progress' if work can resume

      // Update linked ServiceRequestOrder status
      if (serviceRequest.orderId) {
        await ServiceRequestOrder.findByIdAndUpdate(serviceRequest.orderId, {
          status: "refund-rejected",
        });
      }

      notificationTitle = "Update on Your Refund Request";
      notificationMessage = `Your refund request for "${serviceRequest.title.substring(
        0,
        30
      )}..." has been rejected. Reason: ${adminNotes || "No specific reason provided."
        }`;
      emailTemplate = "serviceRequestRefundRejectedEmailToBuyer";
      emailArgs = [
        serviceRequest.createdBy.name || "Buyer",
        serviceRequest.title,
        adminNotes || "Refund rejected.",
        `${process.env.CLIENT_URL || "http://localhost:5173"}/service-request/${serviceRequest._id
        }`,
      ];
    }

    updatedServiceRequest = await serviceRequest.save();

    // Notify buyer
    const io = req.app.get("socketio");
    if (
      updatedServiceRequest.createdBy &&
      updatedServiceRequest.createdBy._id
    ) {
      createAndDispatchNotification(
        {
          recipientId: updatedServiceRequest.createdBy._id,
          senderId: adminId, // Admin is sender
          type: "SERVICE_REQUEST_REFUND_STATUS_UPDATE",
          title: notificationTitle,
          message: notificationMessage,
          link: `/service-request/${updatedServiceRequest._id}`,
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
        },
        { emailTemplateFunc: emailTemplate, emailTemplateArgs: emailArgs }
      ).catch((err) =>
        console.error("Error sending refund status notification to buyer:", err)
      );
    }

    res.status(200).json({
      message: `Refund request ${action}ed successfully.`,
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error("Error processing refund:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Internal server error processing refund." });
  }
};

// --- NEW: Dispute a Service Request ---
const disputeServiceRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id; // Assuming the user disputing is the buyer

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid service request ID." });
  }

  try {
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate("createdBy", "name email")
      .populate("awardedSellerId", "name email");

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    // Only the buyer can dispute their own service request
    if (!serviceRequest.createdBy._id.equals(userId)) {
      return res.status(403).json({
        message: "You are not authorized to dispute this service request.",
      });
    }

    // Only allow dispute if the service is in progress or pending completion
    if (
      serviceRequest.status !== "IN_PROGRESS" &&
      serviceRequest.status !== "PENDING_COMPLETION"
    ) {
      return res.status(400).json({
        message: `Cannot dispute service request with current status: ${serviceRequest.status}.`,
      });
    }

    serviceRequest.status = "DISPUTED";
    const updatedServiceRequest = await serviceRequest.save();

    // Notify the seller and potentially an admin about the dispute
    const io = req.app.get("socketio");
    const buyerUser = updatedServiceRequest.createdBy;
    const sellerUser = updatedServiceRequest.awardedSellerId;

    if (sellerUser && sellerUser._id) {
      createAndDispatchNotification(
        {
          recipientId: sellerUser._id,
          senderId: userId,
          type: "SERVICE_REQUEST_DISPUTED",
          title: "Service Request Disputed!",
          message: `${buyerUser.name || "The Buyer"
            } has disputed the service request: "${updatedServiceRequest.title.substring(
              0,
              30
            )}..."`,
          link: `/service-request/${updatedServiceRequest._id}`, // Link for seller to review dispute
          relatedResource: updatedServiceRequest._id,
          relatedResourceType: "ServiceRequest",
          io,
          status: "sent",
        },
        {
          // Add email template for seller dispute notification
          // emailTemplateFunc: "serviceRequestDisputedEmailToSeller",
          // emailTemplateArgs: [sellerUser.name, buyerUser.name, updatedServiceRequest.title, link]
        }
      ).catch((err) =>
        console.error("Error sending dispute notification to seller:", err)
      );
    }

    // TODO: Potentially notify admin for dispute resolution

    res.status(200).json({
      message: "Service request successfully disputed.",
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error(
      "Error disputing service request:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error disputing service request." });
  }
};

module.exports = {
  createServiceRequest,
  getOpenServiceRequests,
  getMyServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  confirmPromotionPayment,
  verifyPromotionPaymentController,
  submitOfferOnServiceRequest,
  inviteProvidersToServiceRequest,
  getOffersForServiceRequest,
  buyerAcceptOffer,
  buyerRejectOffer,
  setScheduleForServiceRequest,
  markServiceRequestInProgress,
  markServiceRequestAsCompletedByParty,
  initiateServicePayment, // Added
  confirmServicePayment, // Added
  requestRefundForServiceRequest, // New
  processRefundForServiceRequest, // New
  buyerSubmitCounterOffer,
  sellerRespondToCounterOffer,
  proposeOrConfirmSchedule,
  disputeServiceRequest,
};

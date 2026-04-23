// service.controller.js

const Service = require("../model/service.model");
const SpecialOffer = require("../model/specialOffer.model");
const Order = require("../model/order.model");
const ServiceRequestOrder = require("../model/ServiceRequestOrderSchema");
const TransactionLog = require("../model/TransactionLog.model");
const User = require("../model/user.model");
const path = require("path");
const mongoose = require("mongoose");
const { createPayment } = require("../utils/squareService");
const SpecialOfferPayment = require("../model/specialOfferPayment.model");
const CommunityPayment = require("../model/communityPayment.model");
const { hasUsedFreeCommunityOfferForItem } = require("../utils/communityUtils");
const { activateCommunityOfferLogic } = require("../utils/communityHelper");
const { validateSpecialDealData, getPromotionEligibility, calculateDynamicCommission } = require("../utils/promotionHelper");
const { getFeaturedSortStage } = require("../utils/sortingHelper");
const SPECIAL_OFFER_ACTIVATION_FEE_CENTS = 500; // $5.00

// (Handled via COMMUNITY_OFFERS_PLAN_CONFIG in helper)
const {
  parse: parseDateFns,
  format: formatDateFns,
  isValid: isValidDateFns,
} = require("date-fns");

const parseBooleanLike = (value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
};

/**
 * @desc Create a new service
 * @route POST /api/services
 * @access Private (Seller)
 */
const createService = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      priceType,
      type,
      category,
      subcategory,
      coreSkills,
      keyDeliverables,
      experienceLevel,
      availabilityType,
      availabilityInfo,
      travelFee,
      isSpecial,
      specialDescription,
      actualPrice,
      sellingPrice,
      isCommunity,
      durationMonths, // plural support
      durationMonth,  // singular support
      specialDealDuration, // duration in days
      specialOfferSourceId,
      communityOfferSourceId,
      sourceId,
    } = req.body;

    const isSpecialSelected = parseBooleanLike(isSpecial);
    const isCommunitySelected = parseBooleanLike(isCommunity);

    if (!req.user.isSeller && !isSpecialSelected && !isCommunitySelected) {
      return res.status(403).json({
        message: "Only sellers can create standard services.",
      });
    }

    if (!title || !description || !price || !type || !priceType || !availabilityType) {
      return res.status(400).json({
        message: "Missing required fields.",
      });
    }

    // ✅ Create base service
    const service = new Service({
      title,
      description,
      price: parseFloat(price),
      priceType,
      type,
      category,
      subcategory,
      coreSkills,
      keyDeliverables,
      experienceLevel,
      availabilityType,
      availabilityInfo,
      travelFee,
      createdBy: req.user._id,
      status: "active",
      isCommunity: isCommunitySelected,
      isSpecial: isSpecialSelected,
    });

    const savedService = await service.save();

    // ================= PAYMENT =================
    const requestedDuration = parseInt(durationMonths || durationMonth, 10) || 1;

    let communityFeeUsd = 0;
    let specialFeeUsd = 0;

    if (isCommunitySelected) {
      const { getCommunityOfferPlans } = require("../utils/communityHelper");
      const plans = await getCommunityOfferPlans();
      communityFeeUsd = plans[requestedDuration]?.feeUsd || 0;
    }

    if (isSpecialSelected) {
      const validation = await validateSpecialDealData({
        description: specialDescription,
        actualPrice: Number(actualPrice),
        sellingPrice: Number(sellingPrice),
        itemType: "Service",
      });
      specialFeeUsd = validation.activationFee;
    }

    const totalFeeUsd = communityFeeUsd + specialFeeUsd;
    const effectiveSourceId =
      communityOfferSourceId || specialOfferSourceId || sourceId;

    let paymentId = null;

    if (totalFeeUsd > 0) {
      if (!effectiveSourceId) {
        return res.status(400).json({
          message: "Payment source required.",
        });
      }

      const payment = await createPayment({
        sourceId: effectiveSourceId,
        amount: Math.round(totalFeeUsd * 100),
        currency: "USD",
        idempotencyKey: `srv-${Date.now()}`,
        note: "Service activation",
      });

      if (!payment?.payment?.id) {
        return res.status(400).json({ message: "Payment failed" });
      }

      paymentId = payment.payment.id;
    }

    // ================= SPECIAL OFFER =================
    if (isSpecialSelected) {
      const aPrice = parseFloat(actualPrice);
      const sPrice = parseFloat(sellingPrice);

      // Calculate expiration if duration is provided
      let expiresAt = null;
      const durationDays = parseInt(specialDealDuration, 10);
      
      if (durationDays && durationDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
      }

      const specialOffer = await SpecialOffer.create({
        item: savedService._id,
        itemType: "Service",
        description: specialDescription,
        actualPrice: aPrice,
        sellingPrice: sPrice,
        priceDifference: aPrice - sPrice,
        discountPercentage: Math.round(((aPrice - sPrice) / aPrice) * 100),
        durationDays: durationDays || undefined,
        expiresAt: expiresAt,
        status: "active",
      });

      savedService.specialOffer = specialOffer._id;
      savedService.price = sPrice;

      if (paymentId && specialFeeUsd > 0) {
        await SpecialOfferPayment.create({
          user: req.user._id,
          item: savedService._id,
          itemType: "Service",
          amount: specialFeeUsd,
          currency: "USD",
          paymentId,
        });

        // Log transaction for special deal activation
        const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
          specialFeeUsd,
          savedService,
          "service"
        );
        
        const transLog = await TransactionLog.create({
          buyer: req.user._id,
          seller: req.user._id,
          type: "service",
          purchasedItem: savedService._id,
          itemModel: "Service",
          totalAmount: specialFeeUsd,
          sellerCommission: 0,
          adminCommission: specialFeeUsd,
          currency: "USD",
          status: "succeeded",
          paymentProvider: "Square",
          transactionId: paymentId,
          isSpecial: true,
          isCommunity: savedService.isCommunity,
          specialOffer: specialOffer._id,
          metadata: { activationFee: true, commissionLevel: level },
        }).catch(err => console.error("Error logging special offer activation:",err));
        
      }
    }

    // ================= COMMUNITY =================
    if (isCommunitySelected) {
      try {
        const cp = await activateCommunityOfferLogic({
          user: req.user,
          item: savedService,
          itemType: "Service",
          durationMonths: requestedDuration,
          sourceId: effectiveSourceId,
          existingPaymentId: paymentId,
        });

        savedService.communityPayment = cp._id;
        savedService.isCommunity = true;
        // Log transaction for community activation (only if it wasn't already logged as part of special fee or if it has its own fee)
        if (paymentId && communityFeeUsd > 0 && !isSpecialSelected) {
           const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
            communityFeeUsd,
            savedService,
            "service"
          );

          await TransactionLog.create({
            buyer: req.user._id,
            seller: req.user._id,
            type: "service",
            purchasedItem: savedService._id,
            itemModel: "Service",
            totalAmount: communityFeeUsd,
            sellerCommission: 0,
            adminCommission: communityFeeUsd,
            currency: "USD",
            status: "succeeded",
            paymentProvider: "Square",
            transactionId: paymentId,
            isCommunity: true,
            metadata: { activationFee: true, communityOffer: true, commissionLevel: level },
          }).catch(err => console.error("Error logging community activation:", err));
        }
      } catch (err) {
        console.error("Community activation error:", err.message);
      }
    }

    await savedService.save();

    return res.status(201).json(savedService);
  } catch (error) {
    console.error("Error creating service:", error);

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc Get all publicly available services (filtered by seller verification)
 * @route GET /api/services
 * @access Public
 */
const getServices = async (req, res) => {
  const { category, subcategory, type, provider, page = 1, limit = 10 } = req.query;
  const filter = {};

  if (category) filter.category = { $regex: new RegExp(category, "i") };
  if (subcategory)
    filter.subcategory = { $regex: new RegExp(subcategory, "i") };
  if (type) filter.type = { $regex: new RegExp(type, "i") };

  try {
    if (!req.user || !req.user.isAdmin) {
      const verifiedSellerUsers = await User.find(
        {
          isVerified: true,
          isSeller: true,
        },
        "_id"
      ).lean();
      const verifiedSellerIds = verifiedSellerUsers.map((u) => u._id);

      filter.status = "active";
      
      // Rule: type == remote -> skip verification requirement
      filter.$or = [
        { type: "remote" },
        { createdBy: { $in: verifiedSellerIds } }
      ];

      if (provider && mongoose.Types.ObjectId.isValid(provider)) {
        // If provider is specified, it must still satisfy the $or rule (verified or service is remote)
        filter.createdBy = provider;
      } else if (provider) {
        return res.status(200).json({
          services: [],
          pagination: {
            currentPage: Number(page),
            totalPages: 0,
            totalServices: 0,
            limit: Number(limit),
          },
        });
      }
    } else {
      // Admin user
      if (provider && mongoose.Types.ObjectId.isValid(provider)) {
        filter.createdBy = provider;
      }
      // Admin can see services with any status by default, or add a status query param
      if (req.query.status) {
        filter.status = req.query.status;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

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
    const countResult = await Service.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    const services = await Service.aggregate([
      ...aggregatePipeline,
      getFeaturedSortStage(),
      { 
        $sort: { 
          sortPriority: -1, 
          createdAt: -1 
        } 
      },
      { $skip: skip },
      { $limit: Number(limit) }
    ]);

    await Service.populate(services, [
      {
        path: "createdBy",
        select: "name email profilePicture isVerified accountType companyName representativeName"
      },
      { path: "specialOffer" },
      { path: "communityPayment" }
    ]);

    const normalizedServices = services.map(item => {
      const cp = item.communityPayment;
      item.isCommunityActive = cp ? (new Date() < new Date(cp.communityOfferUntill)) : false;
      item.communityStartDate = cp ? cp.createdAt : null;
      item.communityExpiryDate = cp ? cp.communityOfferUntill : null;
      return item;
    });

    return res.status(200).json({
      services: normalizedServices,
      totalItems: total,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalServices: total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

/**
 * @desc Get services created by the logged-in user
 * @route GET /api/services/my-services
 * @access Private (Seller)
 */
const getMyServices = async (req, res) => {
  try {
    if (!req.user.isSeller) {
      return res
        .status(403)
        .json({ message: "You must be a seller to view your services." });
    }

    const { page = 1, limit = 10, status } = req.query; // Allow filtering by status for own services
    const filter = { createdBy: req.user._id };

    if (status) {
      filter.status = status; // e.g., "active", "inactive", "paused", "pending_verification"
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const servicesQuery = Service.find(filter)
      // No need to populate createdBy as it's the current user
      .populate("specialOffer")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalQuery = Service.countDocuments(filter);

    const [services, total] = await Promise.all([servicesQuery, totalQuery]);

    return res.status(200).json({
      services,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalServices: total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching 'my services':", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching your services." });
  }
};

/**
 * @desc Get a service by ID (respecting seller verification for public, owner sees all)
 * @route GET /api/services/:id
 * @access Public (conditionally) / Private (Owner)
 */
const getServiceById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID format." });
    }
    // Populate all necessary fields including new availability fields
    const service = await Service.findById(req.params.id)
      .populate(
        "createdBy",
        "name email profilePicture isVerified bio accountType companyName representativeName"
      )
      .populate("specialOffer")
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewerId',
          select: 'name profilePicture'
        },
        match: { status: 'approved' }
      });

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    // Allow viewing if active, or if user is owner or admin (even if inactive)
    const isOwner = req.user && service.createdBy && service.createdBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      // Relaxed check: allow viewing if active even if seller is not verified yet (as per user request)
      if (!service.createdBy || service.status !== "active") {
        return res.status(404).json({
          message: "Service not found or is currently unavailable.",
        });
      }
    }
    const reviews = service.reviews || [];
    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0;

    // NEW: If user is owner, add transaction details if sold
    let result = service.toObject();
    if (req.user && service.createdBy && service.createdBy._id.toString() === req.user._id.toString()) {
      try {
        const orderIds = await Order.find({
          service: req.params.id,
          status: { $in: ["awaiting-seller-confirmation", "accepted", "scheduled", "in-progress", "completed"] }
        }).distinct("_id");

        const serviceRequestOrderIds = await ServiceRequestOrder.find({
          service: req.params.id,
          status: { $in: ["succeeded", "in-progress", "completed"] }
        }).distinct("_id");

        const allOrderIds = [...orderIds, ...serviceRequestOrderIds];

        if (allOrderIds.length > 0) {
          const transaction = await TransactionLog.findOne({
            purchasedItem: { $in: allOrderIds }
            // refPath handles different models automatically in TransactionLog model definition
          }).sort({ createdAt: -1 });

          if (transaction) {
            result.transactionDetails = transaction;
          }
        }
      } catch (error) {
        console.error("Error fetching transaction details for service owner:", error);
      }
    }

    return res.status(200).json({
      service: result,
      average_rating: avgRating,
      review_count: reviewCount,
    });
  } catch (error) {
    console.error("Error fetching service by ID:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Update a service
 * @route PUT /api/services/:id
 * @access Private (Owner or Admin)
 */
const updateService = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID format." });
    }
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    const isOwner = service.createdBy.equals(req.user._id);
    if (!isOwner && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this service." });
    }

    const {
      title,
      description,
      price,
      priceType,
      type,
      category,
      subcategory,
      availabilityType,
      availabilityInfo,
      availableTimeSlots, // New availability fields
      travelFee,
      status,
      isSpecial,        // Special offer fields
      specialDescription,
      actualPrice,
      sellingPrice,
      specialDealDuration, // duration in days
      isCommunity,            // New Community field
      durationMonths,         // New Duration field
      specialOfferSourceId, // Added for Square payment (also used for community if paid)
      communityOfferSourceId, // Explicit field for community payment
      sourceId, // Added generic sourceId fallback
    } = req.body;

    // Update basic fields
    if (title !== undefined) service.title = title;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = parseFloat(price);
    if (priceType !== undefined) service.priceType = priceType;
    if (type !== undefined) service.type = type;
    if (category !== undefined) service.category = category;
    if (subcategory !== undefined) service.subcategory = subcategory;
    if (isCommunity !== undefined) service.isCommunity = parseBooleanLike(isCommunity);

    // --- Special Offer Handling ---
    if (isSpecial === true || isSpecial === "true") {
      const aPrice = actualPrice !== undefined ? parseFloat(actualPrice) : (service.specialOffer ? (await SpecialOffer.findById(service.specialOffer))?.actualPrice : undefined);
      const sPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : (service.specialOffer ? (await SpecialOffer.findById(service.specialOffer))?.sellingPrice : undefined);

      const validation = await validateSpecialDealData({
        description: specialDescription || (service.specialOffer ? (await SpecialOffer.findById(service.specialOffer))?.description : "Special Deal"),
        actualPrice: aPrice,
        sellingPrice: sPrice,
        itemType: "Service",
      });

      const specialFeeUsd = validation.activationFee;

      let specialOffer;
      if (service.specialOffer) {
        specialOffer = await SpecialOffer.findById(service.specialOffer);
      }

      // Handle Square Payment for Activation (if not already paid for this item)
      const existingPayment = await SpecialOfferPayment.findOne({
        item: service._id,
        itemType: "Service",
        status: "succeeded",
      });

      let activationPaymentId = existingPayment?.paymentId;
      if (!activationPaymentId) {
        const effectiveSourceId = specialOfferSourceId || communityOfferSourceId || sourceId;
        if (!effectiveSourceId) {
          return res.status(400).json({
            message: "Payment is required to list this service as a special deal.",
          });
        }

        try {
          const paymentResponse = await createPayment({
            sourceId: effectiveSourceId,
            amount: specialFeeUsd * 100,
            currency: "USD",
            idempotencyKey: `act-sp-srv-upd-${Date.now()}-${String(req.user._id).slice(-8)}`,
            note: `Special Offer Activation Fee for Service Update: ${service.title}`,
          });

          if (!paymentResponse?.payment?.id) {
            return res.status(400).json({
              message: "Special offer activation payment failed. Please try again.",
            });
          }
          activationPaymentId = paymentResponse.payment.id;

          // Create SpecialOfferPayment record
          await SpecialOfferPayment.create({
            user: req.user._id,
            item: service._id,
            itemType: "Service",
            amount: specialFeeUsd,
            currency: "USD",
            paymentId: activationPaymentId,
            status: "succeeded",
            note: `Activated special offer for service update: ${service.title}`,
          });

          // Calculate dynamic commissions for TransactionLog
          const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
            SPECIAL_OFFER_ACTIVATION_FEE_CENTS / 100,
            service,
            "service"
          );

          // Log the transaction
          await TransactionLog.create({
            buyer: req.user._id,
            seller: req.user._id,
            type: "service",
            purchasedItem: service._id,
            itemModel: "Service",
            totalAmount: specialFeeUsd,
            sellerCommission: 0,
            adminCommission: specialFeeUsd,
            currency: "USD",
            status: "succeeded",
            paymentProvider: "Square",
            transactionId: activationPaymentId,
            isSpecial: true,
            specialOffer: savedOffer._id,
            metadata: { activationFee: true, commissionLevel: level },
          });
        } catch (paymentError) {
          console.error("[updateService] Payment error:", paymentError.message);
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
          item: service._id,
          itemType: "Service",
          description: specialDescription,
          actualPrice: aPrice,
          sellingPrice: sPrice,
          priceDifference: parseFloat((aPrice - sPrice).toFixed(2)),
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
      service.isSpecial = true;
      service.specialOffer = savedOffer._id;
      service.price = sPrice; // Update main price
    } else if (isSpecial === false || isSpecial === "false") {
      if (service.specialOffer) {
        // Instead of deleting, just set to inactive to preserve history
        await SpecialOffer.findByIdAndUpdate(service.specialOffer, { status: "inactive" });
      }
      service.isSpecial = false;
    }

    // Update availability
    if (availabilityType !== undefined)
      service.availabilityType = availabilityType;
    if (availabilityInfo !== undefined)
      service.availabilityInfo = availabilityInfo; // Allow setting to empty string to clear
    if (availableTimeSlots !== undefined) {
      // If sent, update it (even if empty array to clear slots)
      if (service.availabilityType === "scheduled_slots") {
        if (!Array.isArray(availableTimeSlots)) {
          return res
            .status(400)
            .json({ message: "availableTimeSlots must be an array." });
        }
        service.availableTimeSlots = availableTimeSlots;
      } else {
        service.availableTimeSlots = []; // Clear if type is not scheduled_slots
      }
    }

    let rawLocations = req.body.locations;
    let rawTags = req.body.tags;
    // ... (location and tags update logic as before) ...
    if (rawLocations !== undefined) {
      try {
        const parsedLocations =
          typeof rawLocations === "string"
            ? JSON.parse(rawLocations)
            : rawLocations;
        service.locations = Array.isArray(parsedLocations)
          ? parsedLocations.map((loc) => String(loc).trim())
          : [];
      } catch (e) {
        service.locations = [];
      }
    }
    if (rawTags !== undefined) {
      try {
        const parsedTags =
          typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
        service.tags = Array.isArray(parsedTags)
          ? parsedTags.map((tag) => String(tag).trim())
          : [];
      } catch (e) {
        service.tags = [];
      }
    }

    if (req.files && req.files.length > 0) {
      const newMediaPaths = req.files.map((file) => {
        let subfolder = "others";
        if (file.fieldname === "media") subfolder = "services";
        return `${subfolder}/${file.filename}`.replace(/\\/g, "/");
      });
      // TODO: Logic to delete old files from service.media that are not in newMediaPaths
      service.media = newMediaPaths;
    } else if (req.body.media !== undefined && req.body.media === null) {
      // Explicitly clearing media
      // TODO: Delete all existing media files
      service.media = [];
    } else if (req.body.media !== undefined && Array.isArray(req.body.media)) {
      // Client sends array of existing paths to keep
      service.media = req.body.media.filter((item) => typeof item === "string");
    }

    if (service.type === "on-site") {
      service.travelFee =
        travelFee !== undefined ? parseFloat(travelFee) : service.travelFee;
    } else {
      service.travelFee = undefined; // Or 0, depending on your logic
    }

    if (status !== undefined && (isOwner || req.user.isAdmin)) {
      if (isOwner && !req.user.isVerified && status === "active") {
        return res.status(403).json({
          message:
            "Your account is not verified. You cannot activate services.",
        });
      }
      service.status = status;
    }

    const savedService = await service.save();

    // NO COMMUNITY ACTIVATION IN PUT REQUEST (Dedicated API instead)

    return res.status(200).json({
      message: "Service updated successfully.",
      service: savedService,
    });
  } catch (error) {
    console.error("Error updating service:", error.message, error.stack);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
/**
 * @desc Delete a service
 * @route DELETE /api/services/:id
 * @access Private (Owner or Admin)
 */
const deleteService = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID format." });
    }
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    if (!service.createdBy.equals(req.user._id) && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this service." });
    }

    // Delete all orders associated with this service
    await Order.deleteMany({ service: req.params.id });

    // Add logic here to delete associated media files from storage (fs.unlink)

    await Service.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ message: "Service and associated orders deleted successfully." });
  } catch (error) {
    console.error("Error deleting service:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Search for publicly available services (respecting seller verification)
 * @route GET /api/services/search
 * @access Public
 */
const searchServices = async (req, res) => {
  try {
    const {
      type,
      location,
      startDateTime,
      serviceCategory,
      q, // Added q parameter
      providerName,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};
    filter.status = "active"; // Public search should only find active services

    let providerIdsFromNameSearch = null;

    if (providerName && providerName.trim() !== "") {
      const providers = await User.find(
        { name: new RegExp(providerName, "i"), isSeller: true },
        "_id isVerified"
      ).lean();

      if (!req.user || !req.user.isAdmin) {
        providerIdsFromNameSearch = providers
          // .filter((p) => p.isVerified) // Relaxed verification check
          .map((p) => p._id);
      } else {
        providerIdsFromNameSearch = providers.map((p) => p._id);
      }

      if (providerIdsFromNameSearch.length === 0) {
        return res.status(200).json({
          services: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalServices: 0,
            limit: Number(limit),
          },
        });
      }
      filter.createdBy = { $in: providerIdsFromNameSearch };
    }

    if (type) {
      filter.type = new RegExp(type, "i");
    }
    if (location) {
      filter.locations = { $in: [new RegExp(location, "i")] };
    }
    const mainSearchTerm = q || serviceCategory; // Support both q and serviceCategory
    if (mainSearchTerm) {
      const scRegex = new RegExp(mainSearchTerm, "i");
      filter.$or = [
        { category: scRegex },
        { subcategory: scRegex },
        { title: scRegex },
        { description: scRegex },
        { tags: { $in: [scRegex] } },
      ];
    }
    if (startDateTime) {
      filter["availability.startDate"] = { $lte: new Date(startDateTime) };
      filter["availability.endDate"] = { $gte: new Date(startDateTime) };
    }

    if (!req.user || !req.user.isAdmin) {
      const verifiedSellerUsers = await User.find(
        { 
          // isVerified: true, 
          isSeller: true 
        },
        "_id"
      ).lean();
      const generalVerifiedSellerIds = verifiedSellerUsers.map((u) => u._id);

      if (filter.createdBy && filter.createdBy.$in) {
        filter.createdBy.$in = filter.createdBy.$in.filter(
          (idFromProviderSearch) =>
            generalVerifiedSellerIds.some((verifiedId) =>
              verifiedId.equals(idFromProviderSearch)
            )
        );
        if (filter.createdBy.$in.length === 0) {
          return res.status(200).json({
            services: [],
            pagination: {
              currentPage: Number(page),
              totalPages: 0,
              totalServices: 0,
              limit: Number(limit),
            },
          });
        }
      } else {
        filter.createdBy = { $in: generalVerifiedSellerIds };
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const aggregatePipeline = [
      { $match: filter },
      getFeaturedSortStage(),
      { $sort: { sortPriority: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) }
    ];

    const services = await Service.aggregate(aggregatePipeline);
    await Service.populate(services, {
      path: "createdBy",
      select: "name email profilePicture isVerified"
    });
    await Service.populate(services, "specialOffer");

    const total = await Service.countDocuments(filter);

    return res.status(200).json({
      services,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalServices: total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error in searchServices:", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

/**
 * @desc Get latest publicly available services (respecting seller verification)
 * @route GET /api/services/latest
 * @access Public
 */
const getLatestServices = async (req, res) => {
  try {
    const filter = {};
    filter.status = "active"; // Public latest should only find active services

    if (!req.user || !req.user.isAdmin) {
      const verifiedSellerUsers = await User.find(
        {
          // isVerified: true,
          isSeller: true,
        },
        "_id"
      ).lean();
      const verifiedSellerIds = verifiedSellerUsers.map((u) => u._id);
      filter.createdBy = { $in: verifiedSellerIds };
    }

    const services = await Service.aggregate([
      { $match: filter },
      getFeaturedSortStage(),
      { $sort: { sortPriority: -1, createdAt: -1 } },
      { $limit: 6 }
    ]);

    await Service.populate(services, [
      { path: "createdBy" },
      { path: "specialOffer" }
    ]);
    return res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching latest services:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Add a review to a service
 * @route POST /api/services/:serviceId/reviews/add  (Note: path changed for consistency)
 * @access Private (Authenticated Verified User)
 */
const addReview = async (req, res) => {
  try {
    // const { serviceId, rating, comment } = req.body; // if serviceId is in body
    const { rating, comment } = req.body;
    const { serviceId } = req.params; // if serviceId is in params

    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ error: "Invalid service ID." });
    }

    if (!req.user.isVerified) {
      return res
        .status(403)
        .json({ error: "Your account must be verified to add a review." });
    }

    if (!rating || !comment) {
      return res
        .status(400)
        .json({ error: "Rating and comment are required." });
    }
    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const serviceToReview = await Service.findById(serviceId).populate(
      "createdBy"
    );
    if (!serviceToReview) {
      return res.status(404).json({ error: "Service not found." });
    }

    const isOwner =
      req.user &&
      serviceToReview.createdBy &&
      serviceToReview.createdBy._id.equals(req.user._id);

    if (!isOwner && (!req.user || !req.user.isAdmin)) {
      if (
        !serviceToReview.createdBy ||
        !serviceToReview.createdBy.isVerified ||
        serviceToReview.status !== "active"
      ) {
        return res.status(404).json({
          message: "Service not found or is currently unavailable for review.",
        });
      }
    }

    if (serviceToReview.createdBy._id.equals(userId)) {
      return res
        .status(403)
        .json({ error: "You cannot review your own service." });
    }

    const existingReview = serviceToReview.reviews.find((review) =>
      review.user.equals(userId)
    );
    if (existingReview) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this service." });
    }

    const review = {
      user: userId,
      rating: numRating,
      comment: String(comment).trim(),
      createdAt: new Date(),
    };

    serviceToReview.reviews.push(review);
    await serviceToReview.save();

    return res
      .status(201)
      .json({ message: "Review added successfully", review });
  } catch (error) {
    console.error("Error adding review:", error.message);
    return res
      .status(500)
      .json({ error: "An error occurred while adding the review" });
  }
};

/**
 * @desc Delete multiple services by IDs
 * @route DELETE /api/admin/services/bulk-delete
 * @access Private (Admin)
 */
const deleteMultipleServicesAdmin = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can perform this action." });
    }

    const { serviceIds } = req.body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res
        .status(400)
        .json({ message: "An array of service IDs is required." });
    }

    // Validate all IDs are valid Mongoose ObjectIds
    const invalidIds = serviceIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ message: "One or more provided service IDs are invalid." });
    }

    // Delete all orders associated with the services being deleted
    await Order.deleteMany({ service: { $in: serviceIds } });

    // Find and delete services
    const deleteResult = await Service.deleteMany({ _id: { $in: serviceIds } });

    if (deleteResult.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No services found with the provided IDs." });
    }

    return res.status(200).json({
      message: `${deleteResult.deletedCount} services deleted successfully.`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting multiple services:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createService,
  getServices,
  getMyServices,
  getServiceById,
  updateService,
  deleteService,
  searchServices,
  getLatestServices,
  addReview,
  deleteMultipleServicesAdmin, // Export the new function
};

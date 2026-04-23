// controllers/requestedProduct.controller.js
const RequestedProduct = require("../model/requestedProduct.model");
const SpecialOffer = require("../model/specialOffer.model");
const User = require("../model/user.model");
const mongoose = require("mongoose");
const path = require("path");
const TransactionLog = require("../model/TransactionLog.model");
const SpecialOfferPayment = require("../model/specialOfferPayment.model");
const CommunityPayment = require("../model/communityPayment.model");
const { createPayment } = require("../utils/squareService");
const { hasUsedFreeCommunityOfferForItem } = require("../utils/communityUtils");
const { activateCommunityOfferLogic, getCommunityOfferPlans } = require("../utils/communityHelper");
const { getFeaturedSortStage } = require("../utils/sortingHelper");
const { getCommissionRates, calculateDynamicCommission, validateSpecialDealData } = require("../utils/promotionHelper");

const parseBooleanLike = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const SPECIAL_OFFER_ACTIVATION_FEE_CENTS = 500; // $5.00

// --- CREATE REQUESTED PRODUCT (User Action) ---
const createRequestedProduct = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      description,
      targetPrice,
      priceUnit,
      quantityRequested,
      category,
      subcategory,
      tags,
      deliveryLocation,
      fulfillmentDeadline,
      isSpecial,
      specialDescription,
      actualPrice,
      sellingPrice,
      isCommunity,
      specialDealDuration,    // New field for seller-defined expiration (in days)
      communityOfferSourceId,
      specialOfferSourceId,
      sourceId, // Added generic sourceId fallback
    } = req.body;

    const isSpecialSelected = parseBooleanLike(isSpecial);
    const isCommunitySelected = parseBooleanLike(isCommunity);

    if (req.user.isSeller && !isSpecialSelected && !isCommunitySelected) {
      return res.status(403).json({
        message: "Only Buyer account can access this function",
      });
    }

    let missingFields = [];
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (quantityRequested === undefined || quantityRequested === "")
      missingFields.push("quantity requested");
    if (!priceUnit) missingFields.push("price unit");
    if (!category) missingFields.push("category");
    if (!deliveryLocation) missingFields.push("delivery location");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}.`,
      });
    }

    const imagePaths = req.files
      ? req.files.map((file) => {
        const uploadsBaseDir = path.join(__dirname, "..", "uploads");
        const relativePath = path.relative(uploadsBaseDir, file.path);
        return relativePath.replace(/\\/g, "/");
      })
      : [];

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsedTags)) parsedTags = [parsedTags];
      } catch (e) {
        console.warn("[createRequestedProduct] Failed to parse tags:", tags);
        parsedTags = [];
      }
    }

    const requestedProduct = new RequestedProduct({
      name,
      description,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      priceUnit,
      quantityRequested: parseInt(quantityRequested, 10),
      category,
      subcategory,
      images: imagePaths,
      tags: parsedTags,
      deliveryLocation,
      fulfillmentDeadline: fulfillmentDeadline ? new Date(fulfillmentDeadline) : undefined,
      requestedBy: userId,
      status: "pending",
      isSpecial: isSpecialSelected,
      specialDescription,
      actualPrice,
      sellingPrice,
      isCommunity: isCommunitySelected,
    });

    const savedRequestedProduct = await requestedProduct.save();

    // --- CONSOLIDATED PAYMENT CALCULATION ---
    const requestedDuration = parseInt(req.body.durationMonths || req.body.durationMonth, 10) || 1;
    let communityFeeUsd = 0;
    if (isCommunitySelected) {
      try {
        const communityPlans = await getCommunityOfferPlans();
        const plan = communityPlans[requestedDuration];
        communityFeeUsd = plan?.feeUsd || 0;
      } catch (communityError) {
        console.error("[createRequestedProduct] Community Plan Error:", communityError.message);
        return res.status(communityError.status || 400).json({
          message: communityError.message || "Failed to get community offer plans."
        });
      }
    }

    let specialFeeUsd = 0;
    if (isSpecialSelected) {
      try {
        const validation = await validateSpecialDealData({
          description: specialDescription,
          actualPrice: Number(actualPrice),
          sellingPrice: Number(sellingPrice),
          itemType: "RequestedProduct",
        });
        specialFeeUsd = validation.activationFee;
      } catch (validationError) {
        return res.status(validationError.status || 400).json({ message: validationError.message });
      }
    }
    
    const totalFeeUsd = communityFeeUsd + specialFeeUsd;
    const effectiveSourceId = communityOfferSourceId || specialOfferSourceId || sourceId;

    let consolidatedPaymentId = null;

    if (totalFeeUsd > 0) {
      if (!effectiveSourceId) {
        return res.status(400).json({ message: "Payment is required for the selected activation(s)." });
      }

      try {
        const paymentResponse = await createPayment({
          sourceId: effectiveSourceId,
          amount: Math.round(totalFeeUsd * 100),
          currency: "USD",
          idempotencyKey: `cons-reqprod-${Date.now()}-${String(userId).slice(-8)}`,
          note: `Consolidated Activation Fee (Comm: ${communityFeeUsd}, Spec: ${specialFeeUsd}) for Requested Product: ${name}`,
        });

        if (!paymentResponse?.payment?.id) {
          return res.status(400).json({ message: "Activation payment failed. Please try again." });
        }
        consolidatedPaymentId = paymentResponse.payment.id;
      } catch (paymentError) {
        console.error("[createRequestedProduct] Consolidated Payment Error:", paymentError.message);
        return res.status(400).json({
          message: "Payment failed: " + (paymentError.response?.data?.errors?.[0]?.detail || paymentError.message),
        });
      }
    }

    // --- COMMUNITY OFFER HANDLING ---
    if (isCommunitySelected) {
      try {
        const cp = await activateCommunityOfferLogic({
          user: req.user,
          item: savedRequestedProduct,
          itemType: "RequestedProduct",
          durationMonths: requestedDuration,
          sourceId: effectiveSourceId,
          existingPaymentId: consolidatedPaymentId, // Pass the consolidated ID
        });

        await savedRequestedProduct.save();

        // Log transaction for community activation (only if it wasn't already logged as part of special fee)
        if (consolidatedPaymentId && communityFeeUsd > 0 && !isSpecialSelected) {
           const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
            communityFeeUsd,
            savedRequestedProduct,
            "requestedProduct"
          );

          await TransactionLog.create({
            buyer: userId,
            seller: userId,
            type: "product",
            purchasedItem: savedRequestedProduct._id,
            itemModel: "RequestedProduct",
            totalAmount: communityFeeUsd,
            sellerCommission: 0,
            adminCommission: communityFeeUsd,
            currency: "USD",
            status: "succeeded",
            paymentProvider: "Square",
            transactionId: consolidatedPaymentId,
            isCommunity: true,
            metadata: { activationFee: true, communityOffer: true, commissionLevel: level },
          }).catch(err => console.error("Error logging community activation:", err));
        }
      } catch (activationError) {
        console.error("[createRequestedProduct] Community Activation Error:", activationError.message);
        if (activationError.status) throw activationError;
      }
    }

    // --- Special Offer Handling ---
    if (isSpecialSelected) {
      // Validation already performed before payment

      // Calculate expiration if duration is provided
      let expiresAt = null;
      const durationDays = parseInt(specialDealDuration, 10);
      
      if (durationDays && durationDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
      }

      const specialOffer = new SpecialOffer({
        item: savedRequestedProduct._id,
        itemType: "RequestedProduct",
        description: specialDescription,
        actualPrice: aPrice,
        sellingPrice: sPrice,
        priceDifference: parseFloat((sPrice - aPrice).toFixed(2)),
        discountPercentage: 0,
        durationDays: durationDays || undefined,
        expiresAt: expiresAt,
        status: "active",
      });

      const savedOffer = await specialOffer.save();
      savedRequestedProduct.specialOffer = savedOffer._id;
      await savedRequestedProduct.save();

      if (consolidatedPaymentId && specialFeeUsd > 0) {
        // Create SpecialOfferPayment record
        await SpecialOfferPayment.create({
          user: userId,
          item: savedRequestedProduct._id,
          itemType: "RequestedProduct",
          amount: specialFeeUsd,
          currency: "USD",
          paymentId: consolidatedPaymentId,
          status: "succeeded",
          note: `Activated special offer for requested product (Consolidated): ${savedRequestedProduct.name}`,
        });

        // Calculate dynamic commissions for TransactionLog
        const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
          specialFeeUsd,
          savedRequestedProduct,
          "requestedProduct"
        );

        // Log transaction
        await TransactionLog.create({
          buyer: userId,
          seller: userId,
          type: "product",
          purchasedItem: savedRequestedProduct._id,
          itemModel: "RequestedProduct",
          totalAmount: specialFeeUsd,
          sellerCommission: 0,
          adminCommission: specialFeeUsd,
          currency: "USD",
          status: "succeeded",
          paymentProvider: "Square",
          transactionId: consolidatedPaymentId,
          isSpecial: true,
          isCommunity: savedRequestedProduct.isCommunity,
          specialOffer: savedOffer._id,
          metadata: { activationFee: true, consolidated: true, commissionLevel: level },
        }).catch(err => console.error("Error logging special offer activation:", err));
      }
    }

    res.status(201).json({
      message: "Requested product created successfully",
      requestedProduct: savedRequestedProduct,
    });
  } catch (error) {
    console.error(
      "[createRequestedProduct Controller] Error creating requested product:",
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res
        .status(400)
        .json({ message: "Validation Error", errors: validationErrors });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error creating requested product." });
  }
};

// --- UPDATE REQUESTED PRODUCT (Requester or Admin Action) ---
const updateRequestedProduct = async (req, res) => {
  const { requestedProductId } = req.params;
  const userId = req.user._id; // Authenticated user
  const isAdmin = req.user.isAdmin;

  if (!mongoose.Types.ObjectId.isValid(requestedProductId)) {
    return res
      .status(400)
      .json({ message: "Invalid Requested Product ID format." });
  }

  try {
    const requestedProduct = await RequestedProduct.findById(
      requestedProductId
    );
    if (!requestedProduct) {
      return res.status(404).json({ message: "Requested product not found." });
    }

    const isOwner = requestedProduct.requestedBy.toString() === userId.toString();
    const isFulfiller = requestedProduct.fulfilledBy && requestedProduct.fulfilledBy.toString() === userId.toString();

    // Only the requester, the fulfiller, or an admin can update the request
    if (!isOwner && !isFulfiller && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this requested product." });
    }

    const {
      name,
      description,
      targetPrice,
      priceUnit,
      quantityRequested,
      category,
      subcategory,
      tags,
      deliveryLocation,
      fulfillmentDeadline,
      status, // Allow status update by admin/fulfilledBy
      fulfilledBy, // Allow setting fulfilledBy by admin/seller
      fulfillmentDate, // Allow setting fulfillmentDate by admin/seller
      existingImages,
      isSpecial,      // Special offer fields
      removedAttachments, // Array of paths to remove
      specialDescription,
      actualPrice,
      sellingPrice,
      isCommunity,          // New Community field
      durationMonths,       // New Duration field
      specialOfferSourceId, // Added for Square payment
      communityOfferSourceId, // Explicit field for community payment
      sourceId, // Added generic sourceId fallback
    } = req.body;

    if (name) requestedProduct.name = name;
    if (description) requestedProduct.description = description;
    if (targetPrice !== undefined)
      requestedProduct.targetPrice = parseFloat(targetPrice);
    if (priceUnit) requestedProduct.priceUnit = priceUnit;
    if (quantityRequested !== undefined)
      requestedProduct.quantityRequested = parseInt(quantityRequested, 10);
    if (category) requestedProduct.category = category;
    if (subcategory) requestedProduct.subcategory = subcategory;

    if (isCommunity !== undefined) {
      requestedProduct.isCommunity = parseBooleanLike(isCommunity);
    }
    if (deliveryLocation) requestedProduct.deliveryLocation = deliveryLocation;
    if (fulfillmentDeadline !== undefined)
      requestedProduct.fulfillmentDeadline = fulfillmentDeadline
        ? new Date(fulfillmentDeadline)
        : undefined;

    if (tags) {
      try {
        requestedProduct.tags =
          typeof tags === "string" ? JSON.parse(tags) : tags;
        if (!Array.isArray(requestedProduct.tags))
          requestedProduct.tags = [requestedProduct.tags];
      } catch (e) {
        requestedProduct.tags = requestedProduct.tags || [];
      }
    }

    // Admin or the fulfilling user can update status and fulfillment details
    if (
      isAdmin ||
      (fulfilledBy && fulfilledBy.toString() === userId.toString())
    ) {
      if (status) requestedProduct.status = status;
      if (fulfilledBy) requestedProduct.fulfilledBy = fulfilledBy;
      if (fulfillmentDate !== undefined)
        requestedProduct.fulfillmentDate = fulfillmentDate
          ? new Date(fulfillmentDate)
          : undefined;
    }

    // --- Special Offer Handling (Activation Fee) ---
    if (isSpecial === true || isSpecial === "true") {
      const aPrice = actualPrice !== undefined ? parseFloat(actualPrice) : (requestedProduct.specialOffer ? (await SpecialOffer.findById(requestedProduct.specialOffer))?.actualPrice : undefined);
      const sPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : (requestedProduct.specialOffer ? (await SpecialOffer.findById(requestedProduct.specialOffer))?.sellingPrice : undefined);

      if (isNaN(aPrice) || isNaN(sPrice)) {
        return res.status(400).json({
          message: "Actual price and selling price are required for special offers.",
        });
      }

      if (sPrice <= aPrice) {
        return res.status(400).json({
          message: "Selling price must be greater than actual price.",
        });
      }

      let specialOffer;
      if (requestedProduct.specialOffer) {
        specialOffer = await SpecialOffer.findById(requestedProduct.specialOffer);
      }

      // Handle Square Payment for Activation (if not already paid for this item)
      const existingPayment = await SpecialOfferPayment.findOne({
        item: requestedProduct._id,
        itemType: "RequestedProduct",
        status: "succeeded",
      });

      let activationPaymentId = existingPayment?.paymentId;
      if (!activationPaymentId) {
        const effectiveSourceId = specialOfferSourceId || communityOfferSourceId || sourceId;
        if (!effectiveSourceId) {
          return res.status(400).json({
            message: "Payment is required to list this product request as a special deal.",
          });
        }

        try {
          const paymentResponse = await createPayment({
            sourceId: specialOfferSourceId,
            amount: SPECIAL_OFFER_ACTIVATION_FEE_CENTS,
            currency: "USD",
            idempotencyKey: `act-sp-req-prod-upd-${Date.now()}-${String(userId).slice(-8)}`,
            note: `Special Offer Activation Fee for Requested Product Update: ${requestedProduct.name}`,
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
            item: requestedProduct._id,
            itemType: "RequestedProduct",
            amount: SPECIAL_OFFER_ACTIVATION_FEE_CENTS / 100,
            currency: "USD",
            paymentId: activationPaymentId,
            status: "succeeded",
            note: `Activated special offer for requested product update: ${requestedProduct.name}`,
          });

          // Calculate dynamic commissions for TransactionLog
          const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
            SPECIAL_OFFER_ACTIVATION_FEE_CENTS / 100,
            requestedProduct,
            "requestedProduct"
          );

        // Log the transaction
          await TransactionLog.create({
            buyer: userId,
            seller: userId,
            type: "product",
            purchasedItem: requestedProduct._id,
            itemModel: "RequestedProduct",
            totalAmount: SPECIAL_OFFER_ACTIVATION_FEE_CENTS / 100,
            sellerCommission: 0,
            adminCommission: SPECIAL_OFFER_ACTIVATION_FEE_CENTS / 100,
            currency: "USD",
            status: "succeeded",
            paymentProvider: "Square",
            transactionId: activationPaymentId,
            isSpecial: true,
            specialOffer: savedOffer._id,
            metadata: { activationFee: true, commissionLevel: level },
          });
        } catch (paymentError) {
          console.error("[updateRequestedProduct] Payment error:", paymentError.message);
          return res.status(400).json({
            message: "Payment failed: " + (paymentError.response?.data?.errors?.[0]?.detail || paymentError.message),
          });
        }
      }

      if (!specialOffer) {
        specialOffer = new SpecialOffer({
          item: requestedProduct._id,
          itemType: "RequestedProduct",
        });
      }

      if (specialDescription !== undefined) specialOffer.description = specialDescription;
      specialOffer.actualPrice = aPrice;
      specialOffer.sellingPrice = sPrice;
      specialOffer.priceDifference = parseFloat((aPrice - sPrice).toFixed(2));
      specialOffer.discountPercentage = Math.round(((aPrice - sPrice) / aPrice) * 100);
      specialOffer.status = "active";

      const savedOffer = await specialOffer.save();
      requestedProduct.isSpecial = true;
      requestedProduct.specialOffer = savedOffer._id;
    } else if (isSpecial === false || isSpecial === "false") {
      if (requestedProduct.specialOffer) {
        await SpecialOffer.findByIdAndDelete(requestedProduct.specialOffer);
        requestedProduct.specialOffer = undefined;
      }
      requestedProduct.isSpecial = false;
    }

    let currentImagePaths = requestedProduct.images || [];
    if (existingImages !== undefined) {
      try {
        currentImagePaths = JSON.parse(existingImages);
        if (!Array.isArray(currentImagePaths)) currentImagePaths = [];
      } catch (e) {
        console.warn(
          "Could not parse existingImages, keeping current requested product images.",
          e
        );
      }
    }

    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map((file) => {
        const uploadsBaseDir = path.join(__dirname, "..", "uploads");
        const relativePath = path.relative(uploadsBaseDir, file.path);
        return relativePath.replace(/\\/g, "/");
      });
      currentImagePaths = [...currentImagePaths, ...newImagePaths];
    }

    requestedProduct.images = currentImagePaths.slice(0, 10); // Max 10 images

    const updatedRequestedProduct = await requestedProduct.save();

    // NO COMMUNITY ACTIVATION IN PUT REQUEST (Dedicated API instead)

    res.status(200).json({
      message: "Requested product updated successfully.",
      requestedProduct: updatedRequestedProduct,
    });
  } catch (error) {
    console.error(
      `[updateRequestedProduct Controller] Error updating requested product ${requestedProductId}:`,
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res
        .status(400)
        .json({ message: "Validation Error", errors: validationErrors });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error updating requested product." });
  }
};

// --- GET ALL REQUESTED PRODUCTS (Public, with filtering/pagination) ---
const getRequestedProducts = async (req, res) => {
  try {
    const {
      category,
      status, // e.g., 'pending', 'accepted', 'fulfilled'
      minTargetPrice,
      maxTargetPrice,
      priceUnit,
      sortBy,
      page = 1,
      limit = 12,
      searchTerm,
      requestedBy, // Filter by the user who made the request
      fulfilledBy, // Filter by the user who fulfilled the request
      deliveryLocation,
      isSpecial,      // Added for special deal filtering
    } = req.query;

    const query = {}; // No default status filter for public view, allow all or specific filters

    if (category) query.category = category;
    if (status) query.status = status;
    if (priceUnit) query.priceUnit = priceUnit;
    if (deliveryLocation) query.deliveryLocation = deliveryLocation;

    // Applying special deal filter if provided
    if (isSpecial !== undefined) {
      query.isSpecial = parseBooleanLike(isSpecial);
    }

    if (requestedBy) {
      if (!mongoose.Types.ObjectId.isValid(requestedBy)) {
        return res
          .status(400)
          .json({ message: "Invalid Requester ID format." });
      }
      query.requestedBy = requestedBy;
    }
    if (fulfilledBy) {
      if (!mongoose.Types.ObjectId.isValid(fulfilledBy)) {
        return res
          .status(400)
          .json({ message: "Invalid Fulfiller ID format." });
      }
      query.fulfilledBy = fulfilledBy;
    }

    if (minTargetPrice || maxTargetPrice) {
      query.targetPrice = {};
      if (minTargetPrice) query.targetPrice.$gte = parseFloat(minTargetPrice);
      if (maxTargetPrice) query.targetPrice.$lte = parseFloat(maxTargetPrice);
    }
    if (searchTerm) {
      query.$text = { $search: searchTerm };
    }

    const sortOptions = {};
    if (sortBy === "targetPrice_asc") sortOptions.targetPrice = 1;
    else if (sortBy === "targetPrice_desc") sortOptions.targetPrice = -1;
    else if (sortBy === "newest") sortOptions.createdAt = -1;
    else if (sortBy === "oldest") sortOptions.createdAt = 1;
    else if (sortBy === "deadline_asc") sortOptions.fulfillmentDeadline = 1;
    else sortOptions.createdAt = -1;

    const now = new Date();
    const aggregatePipeline = [
      { $match: query },
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
    const countResult = await RequestedProduct.aggregate(countPipeline);
    const count = countResult[0]?.total || 0;

    const requestedProducts = await RequestedProduct.aggregate([
      ...aggregatePipeline,
      getFeaturedSortStage(),
      { 
        $sort: { 
          sortPriority: -1, 
          ...sortOptions 
        } 
      },
      { $skip: (parseInt(page, 10) - 1) * parseInt(limit, 10) },
      { $limit: parseInt(limit, 10) }
    ]);

    await RequestedProduct.populate(requestedProducts, [
      {
        path: "requestedBy",
        select: "name companyName profilePicture accountType representativeName _id isVerified"
      },
      {
        path: "fulfilledBy",
        select: "name companyName profilePicture accountType representativeName _id isVerified"
      },
      { path: "specialOffer" },
      { path: "communityPayment" }
    ]);

    const normalizedRequestedProducts = requestedProducts.map(item => {
      const cp = item.communityPayment;
      item.isCommunityActive = cp ? (new Date() < new Date(cp.communityOfferUntill)) : false;
      item.communityStartDate = cp ? cp.createdAt : null;
      item.communityExpiryDate = cp ? cp.communityOfferUntill : null;
      return item;
    });

    res.status(200).json({
      requestedProducts: normalizedRequestedProducts,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error(
      "Error fetching requested products:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error fetching requested products." });
  }
};

// --- GET SINGLE REQUESTED PRODUCT BY ID (Public) ---
const getRequestedProductById = async (req, res) => {
  try {
    const { requestedProductId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestedProductId)) {
      return res
        .status(400)
        .json({ message: "Invalid Requested Product ID format." });
    }

    const requestedProduct = await RequestedProduct.findById(requestedProductId)
      .populate(
        "requestedBy",
        "name companyName profilePicture _id accountType representativeName isVerified"
      )
      .populate(
        "fulfilledBy",
        "name companyName profilePicture _id accountType representativeName isVerified"
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

    if (!requestedProduct) {
      return res.status(404).json({ message: "Requested product not found." });
    }

    // Allow viewing if user is the requester, the fulfiller, or an admin
    // Or if the status is 'fulfilled' (publicly viewable completed requests)
    // Allow public viewing of any requested product.
    // If a user is authenticated, apply additional authorization checks.
    if (req.user) {
      const isRequester =
        requestedProduct.requestedBy.toString() === req.user._id.toString();
      const isFulfiller =
        requestedProduct.fulfilledBy &&
        requestedProduct.fulfilledBy.toString() === req.user._id.toString();
      const isAdmin = req.user.isAdmin;

      // If the user is authenticated but not the requester, fulfiller, or admin,
      // and the product is not fulfilled, then deny access.
      if (
        !isRequester &&
        !isFulfiller &&
        !isAdmin &&
        requestedProduct.status !== "fulfilled"
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this requested product." });
      }
    }
    // If req.user is undefined (public access), no further checks are needed here,
    // as the requirement is for the detail page to be publicly available.

    res.status(200).json(requestedProduct);
  } catch (error) {
    console.error(
      `Error fetching requested product ${req.params.requestedProductId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error fetching requested product." });
  }
};

// --- DELETE REQUESTED PRODUCT (Requester or Admin Action) ---
const deleteRequestedProduct = async (req, res) => {
  const { requestedProductId } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.isAdmin;

  if (!mongoose.Types.ObjectId.isValid(requestedProductId)) {
    return res
      .status(400)
      .json({ message: "Invalid Requested Product ID format." });
  }

  try {
    const requestedProduct = await RequestedProduct.findById(
      requestedProductId
    );
    if (!requestedProduct) {
      return res.status(404).json({ message: "Requested product not found." });
    }

    // Only the requester or an admin can delete the request
    if (
      requestedProduct.requestedBy.toString() !== userId.toString() &&
      !isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this requested product." });
    }

    await RequestedProduct.findByIdAndDelete(requestedProductId);
    res
      .status(200)
      .json({ message: "Requested product deleted successfully." });
  } catch (error) {
    console.error(
      `Error deleting requested product ${requestedProductId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error deleting requested product." });
  }
};

// --- SEARCH REQUESTED PRODUCTS (Public, with advanced filtering) ---
const searchRequestedProducts = async (req, res) => {
  try {
    const {
      q, // The main search term for text search
      category,
      minTargetPrice,
      maxTargetPrice,
      priceUnit,
      tags,
      requestedBy,
      fulfilledBy,
      status,
      deliveryLocation,
      sortBy,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    if (q && q.trim() !== "") {
      query.$text = { $search: q.trim() };
    }

    if (category) {
      query.category = category;
    }
    if (priceUnit) {
      query.priceUnit = priceUnit;
    }
    if (deliveryLocation) {
      query.deliveryLocation = deliveryLocation;
    }
    if (status) {
      query.status = status;
    }

    if (requestedBy) {
      if (!mongoose.Types.ObjectId.isValid(requestedBy)) {
        return res
          .status(400)
          .json({ message: "Invalid Requester ID format." });
      }
      query.requestedBy = requestedBy;
    }
    if (fulfilledBy) {
      if (!mongoose.Types.ObjectId.isValid(fulfilledBy)) {
        return res
          .status(400)
          .json({ message: "Invalid Fulfiller ID format." });
      }
      query.fulfilledBy = fulfilledBy;
    }

    if (minTargetPrice || maxTargetPrice) {
      query.targetPrice = {};
      if (minTargetPrice) query.targetPrice.$gte = parseFloat(minTargetPrice);
      if (maxTargetPrice) query.targetPrice.$lte = parseFloat(maxTargetPrice);
    }
    if (tags) {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      if (tagArray.length > 0) {
        query.tags = {
          $in: tagArray.map((tag) => new RegExp(`^${tag}$`, "i")),
        };
      }
    }

    if (Object.keys(query).length === 0) {
      return res.status(400).json({
        message: "Please provide a search term or at least one filter.",
        requestedProducts: [],
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages: 1,
          totalItems: 0,
          limit: parseInt(limit, 10),
        },
      });
    }

    const sortCriteria = {};
    if (sortBy) {
      if (sortBy === "relevance" && q && q.trim() !== "") {
        sortCriteria.score = { $meta: "textScore" };
      } else if (sortBy === "targetPrice_asc") {
        sortCriteria.targetPrice = 1;
      } else if (sortBy === "targetPrice_desc") {
        sortCriteria.targetPrice = -1;
      } else if (sortBy === "newest") {
        sortCriteria.createdAt = -1;
      } else if (sortBy === "oldest") {
        sortCriteria.createdAt = 1;
      } else if (sortBy === "deadline_asc") {
        sortCriteria.fulfillmentDeadline = 1;
      }
    }

    if (Object.keys(sortCriteria).length === 0) {
      if (q && q.trim() !== "") {
        sortCriteria.score = { $meta: "textScore" };
      } else {
        sortCriteria.createdAt = -1;
      }
    }

    const projection = {};
    if (
      q &&
      q.trim() !== "" &&
      (sortCriteria.score || sortBy === "relevance")
    ) {
      projection.score = { $meta: "textScore" };
    }

    // --- Database Query ---
    const pipeline = [
      { $match: query },
      getFeaturedSortStage()
    ];

    if (q && q.trim() !== "") {
      pipeline.push({ 
        $addFields: { 
          score: { $meta: "textScore" } 
        } 
      });
    }

    pipeline.push({ $sort: { sortPriority: -1, ...sortCriteria } });
    pipeline.push({ $skip: (parseInt(page, 10) - 1) * parseInt(limit, 10) });
    pipeline.push({ $limit: parseInt(limit, 10) });

    const totalPipeline = [
      { $match: query },
      { $count: "total" }
    ];
    const totalResult = await RequestedProduct.aggregate(totalPipeline);
    const count = totalResult[0]?.total || 0;

    const requestedProducts = await RequestedProduct.aggregate(pipeline);
    
    await RequestedProduct.populate(requestedProducts, [
      {
        path: "requestedBy",
        select: "name companyName profilePicture accountType representativeName _id isVerified"
      },
      {
        path: "fulfilledBy",
        select: "name companyName profilePicture accountType representativeName _id isVerified"
      },
      { path: "specialOffer" }
    ]);

    res.status(200).json({
      requestedProducts,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error(
      "Error searching requested products:",
      error.message,
      error.stack
    );
    if (
      error.name === "MongoError" &&
      error.message.includes("text index required for $text query")
    ) {
      return res.status(500).json({
        message:
          "Search functionality is temporarily unavailable (missing text index).",
      });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error searching requested products." });
  }
};

// --- GET MY REQUESTED PRODUCTS (Requester Action - requests created by the logged-in user) ---
const getMyRequestedProducts = async (req, res) => {
  try {
    const requesterId = req.user._id;

    const {
      category,
      status,
      sortBy,
      page = 1,
      limit = 8,
      searchTerm,
    } = req.query;

    const query = { requestedBy: requesterId };

    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }
    if (searchTerm && searchTerm.trim() !== "") {
      query.$text = { $search: searchTerm.trim() };
    }

    const sortOptions = {};
    if (sortBy === "targetPrice_asc") sortOptions.targetPrice = 1;
    else if (sortBy === "targetPrice_desc") sortOptions.targetPrice = -1;
    else if (sortBy === "newest") sortOptions.createdAt = -1;
    else if (sortBy === "oldest") sortOptions.createdAt = 1;
    else if (sortBy === "name_asc") sortOptions.name = 1;
    else if (sortBy === "name_desc") sortOptions.name = -1;
    else if (sortBy === "deadline_asc") sortOptions.fulfillmentDeadline = 1;
    else sortOptions.createdAt = -1;

    const count = await RequestedProduct.countDocuments(query);
    const requestedProducts = await RequestedProduct.find(query)
      .populate(
        "fulfilledBy",
        "name companyName profilePicture accountType representativeName _id isVerified"
      ) // Populate fulfiller if needed
      .populate("specialOffer")
      .sort(sortOptions)
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .lean();

    res.status(200).json({
      requestedProducts,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error(
      "Error fetching 'My Requested Products':",
      error.message,
      error.stack
    );
    res.status(500).json({
      message: "Internal Server Error fetching your requested products.",
    });
  }
};

module.exports = {
  createRequestedProduct,
  getRequestedProducts,
  getRequestedProductById,
  updateRequestedProduct,
  deleteRequestedProduct,
  searchRequestedProducts,
  getMyRequestedProducts,
};

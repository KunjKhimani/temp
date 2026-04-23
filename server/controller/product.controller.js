// controllers/product.controller.js
const Product = require("../model/product.model");
const SpecialOffer = require("../model/specialOffer.model");
const User = require("../model/user.model"); // To verify seller status, if needed beyond middleware
const TransactionLog = require("../model/TransactionLog.model");
const ProductOrder = require("../model/productOrder.model");
const mongoose = require("mongoose");
const path = require("path");
const { createPayment } = require("../utils/squareService");
const SpecialOfferPayment = require("../model/specialOfferPayment.model");
const CommunityPayment = require("../model/communityPayment.model");

const { hasUsedFreeCommunityOfferForItem } = require("../utils/communityUtils");
const { activateCommunityOfferLogic, getCommunityOfferPlans } = require("../utils/communityHelper");
const { getFeaturedSortStage } = require("../utils/sortingHelper");
const { getCommissionRates, calculateDynamicCommission, validateSpecialDealData } = require("../utils/promotionHelper");

const SPECIAL_OFFER_ACTIVATION_FEE_CENTS = 500; // $5.00

// (Handled via COMMUNITY_OFFERS_PLAN_CONFIG in helper)

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

// --- CREATE PRODUCT (Seller Action) ---
const createProduct = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      description,
      price,
      priceUnit, // New field
      category,
      subcategory,
      stock,
      tags, // Array of strings
      additionalInfo, // Optional
      isSpecial,        // Special offer fields
      specialDescription,
      actualPrice,
      sellingPrice,
      isCommunity,            // New Community field
      durationMonths,         // New Duration field (plural)
      durationMonth,          // New Duration field (singular support)
      specialDealDuration,    // New field for seller-defined expiration (in days)
      specialOfferSourceId, // Added for Square payment (also used for community if paid)
      communityOfferSourceId, // Explicit field for community payment
      sourceId, // Added generic sourceId fallback
    } = req.body;

    const isSpecialSelected = parseBooleanLike(isSpecial);
    const isCommunitySelected = parseBooleanLike(isCommunity);

    if (!req.user.isSeller && !isSpecialSelected && !isCommunitySelected) {
      return res
        .status(403)
        .json({ message: "Only sellers can create standard products." });
    }

    // Validation for core required fields
    let missingFields = [];
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (price === undefined || price === "") missingFields.push("price");
    if (!priceUnit) missingFields.push("price unit");
    if (!category) missingFields.push("category");
    if (stock === undefined || stock === "") missingFields.push("stock");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}.`,
      });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one product image is required." });
    }

    const imagePaths = req.files.map((file) => {
      const uploadsBaseDir = path.join(__dirname, "..", "uploads");
      const relativePath = path.relative(uploadsBaseDir, file.path);
      return relativePath.replace(/\\/g, "/");
    });

    // Parse tags if they are sent as a JSON string from FormData
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsedTags)) parsedTags = [parsedTags]; // Ensure it's an array
      } catch (e) {
        console.warn(
          "[createProduct Controller] Failed to parse tags, defaulting to empty array. Tags received:",
          tags
        );
        parsedTags = [];
      }
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      priceUnit,
      category,
      subcategory,
      stock: parseInt(stock, 10),
      images: imagePaths,
      tags: parsedTags,
      additionalInfo: additionalInfo || undefined,
      status: parseInt(stock, 10) > 0 ? "active" : "out-of-stock", // Auto-set status based on stock
      createdBy: userId,
      isCommunity: isCommunitySelected,
    };

    const product = new Product(productData);
    const savedProduct = await product.save();

    // --- CONSOLIDATED PAYMENT CALCULATION ---
    const requestedDuration = parseInt(durationMonths || durationMonth, 10) || 1;
    
    let communityFeeUsd = 0;
    if (isCommunitySelected) {
      try {
        const communityPlans = await getCommunityOfferPlans();
        const plan = communityPlans[requestedDuration];
        communityFeeUsd = plan?.feeUsd || 0;
      } catch (communityError) {
        console.error("[createProduct] Community Plan Error:", communityError.message);
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
          itemType: "Product",
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
          idempotencyKey: `cons-prod-${Date.now()}-${String(userId).slice(-8)}`,
          note: `Consolidated Activation Fee (Comm: ${communityFeeUsd}, Spec: ${specialFeeUsd}) for Product: ${name}`,
        });

        if (!paymentResponse?.payment?.id) {
          return res.status(400).json({ message: "Activation payment failed. Please try again." });
        }
        consolidatedPaymentId = paymentResponse.payment.id;
      } catch (paymentError) {
        console.error("[createProduct] Consolidated Payment Error:", paymentError.message);
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
          item: savedProduct,
          itemType: "Product",
          durationMonths: requestedDuration,
          sourceId: effectiveSourceId,
          existingPaymentId: consolidatedPaymentId, // Pass the consolidated ID
        });

        savedProduct.communityPayment = cp._id;
        savedProduct.isCommunity = true;
        await savedProduct.save();
      } catch (activationError) {
        console.error("[createProduct] Community Activation Error:", activationError.message);
        if (activationError.status) throw activationError;
      }
    }

    // --- Special Offer Handling ---
    if (isSpecialSelected) {
      // Validation already performed before payment
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
        item: savedProduct._id,
        itemType: "Product",
        description: specialDescription,
        actualPrice: aPrice,
        sellingPrice: sPrice,
        priceDifference: parseFloat((aPrice - sPrice).toFixed(2)),
        discountPercentage: Math.round(((aPrice - sPrice) / aPrice) * 100),
        durationDays: durationDays || undefined,
        expiresAt: expiresAt,
        status: "active",
      });

      const savedOffer = await specialOffer.save();
      savedProduct.specialOffer = savedOffer._id;
      savedProduct.isSpecial = true;
      await savedProduct.save();

      if (consolidatedPaymentId && specialFeeUsd > 0) {
        await SpecialOfferPayment.create({
          user: userId,
          item: savedProduct._id,
          itemType: "Product",
          amount: specialFeeUsd,
          currency: "USD",
          paymentId: consolidatedPaymentId,
          status: "succeeded",
          note: `Activated special offer for product (Consolidated): ${name}`,
        });

        const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
          specialFeeUsd,
          savedProduct,
          "product"
        );

        await TransactionLog.create({
          buyer: userId,
          seller: userId,
          type: "product",
          purchasedItem: savedProduct._id,
          itemModel: "Product",
          totalAmount: specialFeeUsd,
          sellerCommission: 0,
          adminCommission: specialFeeUsd,
          currency: "USD",
          status: "succeeded",
          paymentProvider: "Square",
          transactionId: consolidatedPaymentId,
          isSpecial: true,
          isCommunity: savedProduct.isCommunity,
          specialOffer: savedOffer._id,
          metadata: { activationFee: true, consolidated: true, commissionLevel: level },
        }).catch(err => console.error("Error logging special offer activation:", err));
      }
    }

    res.status(201).json({ 
      message: "Product created successfully", 
      product: savedProduct 
    });
  } catch (error) {
    console.error(
      "[createProduct Controller] Error creating product:",
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
      .json({ message: "Internal Server Error creating product." });
  }
};

// --- UPDATE PRODUCT (Seller Action, owner of product) ---
const updateProduct = async (req, res) => {
  const { productId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.isAdmin;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID format." });
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      const isOwner = product.createdBy.toString() === userId.toString();

      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this product." });
      }
    const {
      name,
      description,
      price,
      priceUnit,
      category,
      subcategory,
      stock,
      tags,
      additionalInfo,
      existingImages, // existingImages is a JSON string array of kept image paths/URLs
      isSpecial,      // Special offer fields
      specialDescription,
      actualPrice,
      sellingPrice,
      specialDealDuration, // duration in days
      isCommunity,      // New Community field
      durationMonths,   // Tiered duration (1, 2, 3)
      specialOfferSourceId, // Added for Square payment
      communityOfferSourceId, // Explicit field for community payment
      sourceId, // Added generic sourceId fallback
    } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (priceUnit) product.priceUnit = priceUnit;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (stock !== undefined) {
      product.stock = parseInt(stock, 10);
      // Update status based on new stock, respecting 'inactive'
      if (product.stock <= 0) {
        product.status = "out-of-stock";
      } else if (product.status === "out-of-stock" && product.stock > 0) {
        product.status = "active";
      }
      // If seller explicitly sets status to 'inactive', that should be handled if 'status' field is sent
      // For now, assuming 'status' field is not sent for updates, and it's derived from stock or manually set elsewhere
    }

    if (tags !== undefined) {
      product.tags = processArrayField(tags).map((tag) => String(tag).trim());
    }
    if (additionalInfo !== undefined) product.additionalInfo = additionalInfo;
    if (isCommunity !== undefined) product.isCommunity = parseBooleanLike(isCommunity);

    // --- Special Offer Handling ---
    if (isSpecial === true || isSpecial === "true") {
      const aPrice = actualPrice !== undefined ? parseFloat(actualPrice) : (product.specialOffer ? (await SpecialOffer.findById(product.specialOffer))?.actualPrice : undefined);
      const sPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : (product.specialOffer ? (await SpecialOffer.findById(product.specialOffer))?.sellingPrice : undefined);

      if (isNaN(aPrice) || isNaN(sPrice)) {
        return res.status(400).json({
          message: "Actual price and selling price are required for special offers.",
        });
      }

      if (sPrice >= aPrice) {
        return res.status(400).json({
          message: "Selling price must be less than actual price.",
        });
      }

      let specialOffer;
      if (product.specialOffer) {
        specialOffer = await SpecialOffer.findById(product.specialOffer);
      }

      let specialFeeUsd = 0;
      if (isSpecial === true || isSpecial === "true") {
        const aPrice = actualPrice !== undefined ? parseFloat(actualPrice) : specialOffer?.actualPrice;
        const sPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : specialOffer?.sellingPrice;

        const validation = await validateSpecialDealData({
          description: specialDescription || specialOffer?.description || "Special Deal",
          actualPrice: aPrice,
          sellingPrice: sPrice,
          itemType: "Product",
        });
        specialFeeUsd = validation.activationFee;
      }

      // Handle Square Payment for Activation (if not already paid for this item)
      const existingPayment = await SpecialOfferPayment.findOne({
        item: product._id,
        itemType: "Product",
        status: "succeeded",
      });

      let activationPaymentId = existingPayment?.paymentId;
      if (!activationPaymentId) {
        const effectiveSourceId = specialOfferSourceId || communityOfferSourceId || sourceId;
        if (!effectiveSourceId) {
          return res.status(400).json({
            message: "Payment is required to list this product as a special deal.",
          });
        }

        try {
          const paymentResponse = await createPayment({
            sourceId: effectiveSourceId,
            amount: specialFeeUsd * 100,
            currency: "USD",
            idempotencyKey: `act-sp-upd-${Date.now()}-${String(userId).slice(-8)}`,
            note: `Special Offer Activation Fee for Product Update: ${product.name}`,
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
            item: product._id,
            itemType: "Product",
            amount: specialFeeUsd,
            currency: "USD",
            paymentId: activationPaymentId,
            status: "succeeded",
            note: `Activated special offer for product update: ${product.name}`,
          });

          // Calculate dynamic commissions for TransactionLog
          const { adminCommission, sellerCommission, level } = await calculateDynamicCommission(
            SPECIAL_OFFER_ACTIVATION_FEE_CENTS / 100,
            product,
            "product"
          );

          // Log the transaction
          await TransactionLog.create({
            buyer: userId,
            seller: userId,
            type: "product",
            purchasedItem: product._id,
            itemModel: "Product",
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
          console.error("[updateProduct] Payment error:", paymentError.message);
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
          item: product._id,
          itemType: "Product",
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
      product.isSpecial = true;
      product.specialOffer = savedOffer._id;
      product.price = sPrice; // Update main price
    } else if (isSpecial === false || isSpecial === "false") {
      if (product.specialOffer) {
        await SpecialOffer.findByIdAndDelete(product.specialOffer);
        product.specialOffer = undefined;
      }
      product.isSpecial = false;
    }

    let currentImagePaths = product.images || [];
    // Process existingImages: these are the URLs/paths the client wants to keep
    if (existingImages !== undefined) {
      try {
        currentImagePaths = JSON.parse(existingImages);
        if (!Array.isArray(currentImagePaths)) currentImagePaths = [];
      } catch (e) {
        console.warn(
          "Could not parse existingImages, keeping current product images.",
          e
        );
        // Keep product.images as is if parsing fails
      }
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map((file) => {
        const uploadsBaseDir = path.join(__dirname, "..", "uploads");
        const relativePath = path.relative(uploadsBaseDir, file.path);
        return relativePath.replace(/\\/g, "/");
      });
      currentImagePaths = [...currentImagePaths, ...newImagePaths];
    }

    // Ensure at least one image if all were removed and no new ones added
    if (currentImagePaths.length === 0) {
      return res
        .status(400)
        .json({ message: "Product must have at least one image." });
    }
    product.images = currentImagePaths.slice(0, 10); // Max 10 images

    const updatedProduct = await product.save();

    // --- COMMUNITY RE-ACTIVATION / EXTENSION HANDLING ---
    const isCommunitySelected = parseBooleanLike(isCommunity);
    if (isCommunitySelected) {
      const requestedDuration = parseInt(durationMonths, 10) || 1;
      // NO COMMUNITY ACTIVATION IN PUT REQUEST (Dedicated API instead)
    }
    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      `[updateProduct Controller] Error updating product ${productId}:`,
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
      .json({ message: "Internal Server Error updating product." });
  }
};

// --- GET ALL PRODUCTS (Public, with filtering/pagination) ---
const getProducts = async (req, res) => {
  try {
    const {
      category,
      // subcategory, // Removed
      // brand, // Removed
      minPrice,
      maxPrice,
      // status, // Status filter might be simplified or based on stock > 0
      sortBy,
      page = 1,
      limit = 12,
      searchTerm,
      sellerId,
    } = req.query;

    const query = { status: "active" }; // Default to active products

    if (category) query.category = category;
    // if (subcategory) query.subcategory = subcategory; // Removed
    // if (brand) query.brand = brand; // Removed

    if (sellerId) query.createdBy = sellerId;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (searchTerm) {
      // Ensure you have a text index on 'name', 'description', 'tags' in your Product model
      query.$text = { $search: searchTerm };
    }

    const sortOptions = {};
    if (sortBy === "price_asc") sortOptions.price = 1;
    else if (sortBy === "price_desc") sortOptions.price = -1;
    else if (sortBy === "newest") sortOptions.createdAt = -1;
    else if (sortBy === "rating") sortOptions.averageRating = -1;
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
    const countResult = await Product.aggregate(countPipeline);
    const count = countResult[0]?.total || 0;

    const products = await Product.aggregate([
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

    await Product.populate(products, [
      {
        path: "createdBy",
        select: "name companyName profilePicture accountType representativeName _id isVerified"
      },
      { path: "specialOffer" },
      { path: "communityPayment" }
    ]);

    const normalizedProducts = products.map(item => {
      const cp = item.communityPayment;
      item.isCommunityActive = cp ? (new Date() < new Date(cp.communityOfferUntill)) : false;
      item.communityStartDate = cp ? cp.createdAt : null;
      item.communityExpiryDate = cp ? cp.communityOfferUntill : null;
      return item;
    });

    res.status(200).json({
      products: normalizedProducts,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error fetching products." });
  }
};

// --- GET SINGLE PRODUCT BY ID (Public) ---
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID format." });
    }

    const product = await Product.findById(productId)
      .populate(
        "createdBy",
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

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    await product.populate("communityPayment");

    // --- ADD STATUS FLAGS ---
    const cp = product.communityPayment;
    const isCommunityActive = cp ? (new Date() < new Date(cp.communityOfferUntill)) : false;
    
    // Check if expired and shouldn't be seen
    const isOwner = req.user && product.createdBy && req.user._id.toString() === product.createdBy._id.toString();
    const isAdmin = req.user && req.user.isAdmin;

    if (product.isCommunity && !isCommunityActive && !isOwner && !isAdmin) {
      return res.status(404).json({ message: "This community offer has expired." });
    }

    const productObj = product.toObject();
    productObj.isCommunityActive = isCommunityActive;
    productObj.communityStartDate = cp ? cp.createdAt : null;
    productObj.communityExpiryDate = cp ? cp.communityOfferUntill : null;

    if (!["active", "out-of-stock"].includes(product.status) && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "This product is not currently available." });
    }

    // NEW: If user is owner, add transaction details if sold
    let result = productObj;
    if (isOwner) {
      try {
        const productOrders = await ProductOrder.find({
          "items.product": productId,
          status: { $in: ["awaiting-seller-confirmation", "seller-confirmed", "processing", "shipped", "delivered", "completed"] }
        }).distinct("_id");

        if (productOrders.length > 0) {
          const transaction = await TransactionLog.findOne({
            purchasedItem: { $in: productOrders },
            itemModel: "ProductOrder"
          }).sort({ createdAt: -1 });

          if (transaction) {
            result.transactionDetails = transaction;
          }
        }
      } catch (error) {
        console.error("Error fetching transaction details for product owner:", error);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(
      `Error fetching product ${req.params.productId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error fetching product." });
  }
};

// --- DELETE PRODUCT (Seller Action, owner of product) ---
const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  const sellerId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid Product ID format." });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    if (product.createdBy.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this product." });
    }

    // TODO: Implement actual deletion of images from storage (fs.unlink or cloud storage SDK)
    // product.images.forEach(imagePath => { /* delete logic */ });

    await Product.findByIdAndDelete(productId);
    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error(
      `Error deleting product ${productId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error deleting product." });
  }
};

// --- SEARCH PRODUCTS (Public, with advanced filtering) ---
const searchProducts = async (req, res) => {
  try {
    const {
      q, // The main search term for text search
      category,
      minPrice,
      maxPrice,
      priceUnit,
      tags, // Comma-separated string of tags (e.g., "electronics,portable,audio")
      sellerId,
      sortBy, // e.g., 'relevance', 'price_asc', 'price_desc', 'newest', 'rating'
      page = 1,
      limit = 12,
    } = req.query;

    const query = { status: "active" }; // Default to active products

    // --- Text Search (if 'q' is provided) ---
    if (q && q.trim() !== "") {
      // Assumes text index on 'name' and 'description' as per your model:
      // ProductSchema.index({ name: "text", description: "text" });
      // If you want to include tags in the text search, modify your index:
      // ProductSchema.index({ name: "text", description: "text", tags: "text" });
      query.$text = { $search: q.trim() };
    }

    // --- Filters ---
    if (category) {
      query.category = category;
    }
    if (priceUnit) {
      query.priceUnit = priceUnit;
    }
    if (sellerId) {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(400).json({ message: "Invalid Seller ID format." });
      }
      query.createdBy = sellerId;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (tags) {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag); // Remove empty strings

      if (tagArray.length > 0) {
        // Case-insensitive search for tags. Assumes tags are stored as simple strings.
        query.tags = {
          $in: tagArray.map((tag) => new RegExp(`^${tag}$`, "i")),
        };
      }
    }

    // --- Check if any search criteria is provided ---
    // If no 'q' and no other filters, it might be better to return a message or an empty set.
    if (Object.keys(query).length === 1 && query.status === "active") {
      // Only status: 'active' means no real criteria
      return res.status(400).json({
        message: "Please provide a search term or at least one filter.",
        products: [],
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages: 1,
          totalItems: 0,
          limit: parseInt(limit, 10),
        },
      });
    }

    // --- Sorting ---
    const sortCriteria = {};
    // The `sortBy` parameter determines the primary sort field.
    // If `q` is present, relevance score can be a secondary sort or the default.
    if (sortBy) {
      if (sortBy === "relevance" && q && q.trim() !== "") {
        sortCriteria.score = { $meta: "textScore" };
      } else if (sortBy === "price_asc") {
        sortCriteria.price = 1;
      } else if (sortBy === "price_desc") {
        sortCriteria.price = -1;
      } else if (sortBy === "newest") {
        sortCriteria.createdAt = -1;
      } else if (sortBy === "rating") {
        sortCriteria.averageRating = -1;
      }
      // Add more sort options as needed
    }

    // Default sorting if no specific `sortBy` is provided or if `sortBy` was 'relevance' without 'q'
    if (Object.keys(sortCriteria).length === 0) {
      if (q && q.trim() !== "") {
        // If there's a text search term, default to sorting by relevance
        sortCriteria.score = { $meta: "textScore" };
      } else {
        // Otherwise, default to newest
        sortCriteria.createdAt = -1;
      }
    }

    // --- Projection (needed for textScore) ---
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
      // For text search, we need the score
      pipeline.push({ 
        $addFields: { 
          score: { $meta: "textScore" } 
        } 
      });
    }

    pipeline.push({ $sort: { sortPriority: -1, ...sortCriteria } });
    pipeline.push({ $skip: (parseInt(page, 10) - 1) * parseInt(limit, 10) });
    pipeline.push({ $limit: parseInt(limit, 10) });

    const totalPipeline = [{ $match: query }, { $count: "total" }];
    const totalResult = await Product.aggregate(totalPipeline);
    const count = totalResult[0]?.total || 0;

    const products = await Product.aggregate(pipeline);
    
    await Product.populate(products, [
      {
        path: "createdBy",
        select: "name companyName profilePicture accountType representativeName _id isVerified"
      },
      { path: "specialOffer" }
    ]);

    res.status(200).json({
      products,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error searching products:", error.message, error.stack);
    // Specific error for missing text index
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
      .json({ message: "Internal Server Error searching products." });
  }
};

// --- GET MY PRODUCTS (Seller Action - products created by the logged-in seller) ---
const getMyProducts = async (req, res) => {
  try {
    const sellerId = req.user._id; // Assuming authMiddleware and sellerAuth have run

    const {
      category,
      status, // Allow filtering by status (e.g., 'active', 'inactive', 'out-of-stock')
      sortBy,
      page = 1,
      limit = 8, // Default limit for "My Products" page, can be adjusted
      searchTerm, // Optional: Allow seller to search within their own products
    } = req.query;

    const query = { createdBy: sellerId };

    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }
    if (searchTerm && searchTerm.trim() !== "") {
      // If allowing text search on name/description for their own products
      query.$text = { $search: searchTerm.trim() };
    }

    const sortOptions = {};
    if (sortBy === "price_asc") sortOptions.price = 1;
    else if (sortBy === "price_desc") sortOptions.price = -1;
    else if (sortBy === "newest") sortOptions.createdAt = -1;
    else if (sortBy === "oldest") sortOptions.createdAt = 1;
    else if (sortBy === "name_asc") sortOptions.name = 1;
    else if (sortBy === "name_desc") sortOptions.name = -1;
    else if (sortBy === "stock_asc") sortOptions.stock = 1;
    else if (sortBy === "stock_desc") sortOptions.stock = -1;
    else sortOptions.createdAt = -1; // Default to newest

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      // No need to populate createdBy for "My Products" as it's the current user,
      // but if you display seller info on a generic "manage products" card, you might.
      // .populate("createdBy", "name companyName") // Usually not needed here
      .populate("specialOffer")
      .sort(sortOptions)
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .lean();

    res.status(200).json({
      products,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching 'My Products':", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error fetching your products." });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  getMyProducts,
};

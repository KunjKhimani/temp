const Review = require("../model/review.model");
const ProductOrder = require("../model/productOrder.model");
const Order = require("../model/order.model");
const Product = require("../model/product.model");
const Service = require("../model/service.model");
const ServiceRequest = require("../model/serviceRequest.model");
const RequestedProduct = require("../model/requestedProduct.model");
const mongoose = require("mongoose");

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Buyer)
exports.createReview = async (req, res) => {
  const { orderId, orderModel, listingId: bodyListingId, listingModel: bodyListingModel, rating, comment } = req.body;
  const reviewerId = req.user._id;

  try {
    const numericRating = Number(rating);
    const sanitizedComment = String(comment || "").trim();

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    if (!sanitizedComment) {
      return res.status(400).json({ message: "Comment is required." });
    }

    // 1. Validate order existence and status
    let order;
    if (orderModel === "ProductOrder") {
      order = await ProductOrder.findById(orderId);
    } else if (orderModel === "Order") {
      order = await Order.findById(orderId);
    } else if (orderModel === "ServiceRequest") {
      order = await ServiceRequest.findById(orderId);
    } else if (orderModel === "RequestedProduct") {
      order = await RequestedProduct.findById(orderId);
    } else {
      return res.status(400).json({ message: "Invalid order model type." });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check if user is the buyer/requester
    const buyerField = orderModel === "RequestedProduct" ? "requestedBy" :
      orderModel === "ServiceRequest" ? "createdBy" : "buyer";

    if (order[buyerField].toString() !== reviewerId.toString()) {
      return res.status(403).json({ message: "You are not authorized to review this order." });
    }

    // Check if status is completed/fulfilled for each order type.
    const allowedStatuses = {
      ProductOrder: ["completed", "delivered"],
      Order: ["completed"],
      ServiceRequest: ["COMPLETED", "completed"],
      RequestedProduct: ["fulfilled"],
    };
    const statusAllowedForReview =
      allowedStatuses[orderModel]?.includes(order.status) || false;

    if (!statusAllowedForReview) {
      const requiredStatusText =
        orderModel === "RequestedProduct"
          ? "fulfilled"
          : orderModel === "ProductOrder"
            ? "delivered/completed"
            : "completed";
      return res.status(400).json({
        message: `Reviews are only allowed for ${requiredStatusText} orders.`,
      });
    }

    // 2. Check for duplicate review
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({ message: "A review already exists for this order." });
    }

    // 3. Determine listing (Product or Service)
    let listingId, listingModel;
    if (bodyListingId && bodyListingModel) {
      listingId = bodyListingId;
      listingModel = bodyListingModel;
    } else if (orderModel === "ProductOrder") {
      if (order.items && order.items.length > 0) {
        listingId = order.items[0].product;
        listingModel = "Product";
      } else {
        return res.status(400).json({ message: "Product order has no items." });
      }
    } else if (orderModel === "Order") {
      listingId = order.service;
      listingModel = "Service";
    } else if (orderModel === "ServiceRequest") {
      if (order.awardedSellerId) {
        listingId = order._id;
        listingModel = "ServiceRequest";
      } else {
        return res.status(400).json({ message: "Service request has no awarded seller." });
      }
    } else if (orderModel === "RequestedProduct") {
      listingId = order._id;
      listingModel = "RequestedProduct";
    }

    const expectedListingModelByOrder = {
      ProductOrder: "Product",
      Order: "Service",
      ServiceRequest: "ServiceRequest",
      RequestedProduct: "RequestedProduct",
    };

    if (listingModel !== expectedListingModelByOrder[orderModel]) {
      return res.status(400).json({
        message: `listingModel must be ${expectedListingModelByOrder[orderModel]} for orderModel ${orderModel}.`,
      });
    }

    if (orderModel === "Order" && String(order.service) !== String(listingId)) {
      return res.status(400).json({ message: "listingId does not match the order service." });
    }

    if (orderModel === "ProductOrder") {
      const isListingInOrder =
        Array.isArray(order.items) &&
        order.items.some((item) => String(item.product) === String(listingId));
      if (!isListingInOrder) {
        return res.status(400).json({ message: "listingId does not match any product in this order." });
      }
    }

    if (
      (orderModel === "ServiceRequest" || orderModel === "RequestedProduct") &&
      String(order._id) !== String(listingId)
    ) {
      return res.status(400).json({ message: "listingId must match the order id for this order type." });
    }

    // 4. Create Review
    const review = new Review({
      orderId,
      orderModel,
      listingId,
      listingModel,
      reviewerId,
      rating: numericRating,
      comment: sanitizedComment,
      status: "approved", // Default approved
    });

    await review.save();

    // 5. Add review reference to the parent model
    if (orderModel === "ServiceRequest") {
      await ServiceRequest.findByIdAndUpdate(
        orderId,
        { $push: { reviews: review._id } }
      );
    } else if (orderModel === "RequestedProduct") {
      await RequestedProduct.findByIdAndUpdate(
        orderId,
        { $push: { reviews: review._id } }
      );
    } else if (orderModel === "ProductOrder" || orderModel === "Order") {
      // Add review reference to the listing model (Product or Service)
      if (listingModel === "Product" || listingModel === "Service") {
        const Listing = listingModel === "Product" ? Product : Service;
        await Listing.findByIdAndUpdate(
          listingId,
          { $push: { reviews: review._id } }
        );
      }
    }

    // 6. Update Rating in Listing model
    if (listingModel === "Product" || listingModel === "Service") {
      const Listing = listingModel === "Product" ? Product : Service;
      const listing = await Listing.findById(listingId);

      if (listing) {
        const newReviewCount = (listing.reviewCount || 0) + 1;
        const newAverageRating =
          ((listing.averageRating || 0) * (listing.reviewCount || 0) + numericRating) / newReviewCount;

        listing.averageRating = Number(newAverageRating.toFixed(1));
        listing.reviewCount = newReviewCount;
        await listing.save();
      }
    } else if (listingModel === "ServiceRequest" || listingModel === "RequestedProduct") {
      // Update ratings for the request models themselves
      const RequestModel = listingModel === "ServiceRequest" ? ServiceRequest : RequestedProduct;
      const request = await RequestModel.findById(listingId);

      if (request) {
        const newReviewCount = (request.reviewCount || 0) + 1;
        const newAverageRating =
          ((request.averageRating || 0) * (request.reviewCount || 0) + numericRating) / newReviewCount;

        request.averageRating = Number(newAverageRating.toFixed(1));
        request.reviewCount = newReviewCount;
        await request.save();
      }
    }

    res.status(201).json({
      success: true,
      data: review,
    });

  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// @desc    Get paginated reviews for a specific item
// @route   GET /api/reviews/item/:listingId
// @access  Public
exports.getItemReviews = async (req, res) => {
  const { listingId } = req.params;
  const { page = 1, limit = 10, status = 'approved', reviewerId } = req.query;

  try {
    // Validate listingId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID format." });
    }

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Build filter
    const filter = { listingId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (reviewerId && mongoose.Types.ObjectId.isValid(reviewerId)) {
      filter.reviewerId = reviewerId;
    }

    // Get reviews and total count in parallel
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("reviewerId", "name profilePicture")
        .populate("orderId", "status createdAt")
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error("Error fetching item reviews:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// @desc    Get all reviews for admin with filtering
// @route   GET /api/reviews/admin
// @access  Private (Admin)
exports.getAdminReviews = async (req, res) => {
  const { 
    reviewerId, 
    listingId, 
    page = 1, 
    limit = 10, 
    search, 
    accountType, 
    isSeller, 
    isVerified 
  } = req.query;
  
  const filter = {};

  if (reviewerId) filter.reviewerId = reviewerId;
  if (listingId) filter.listingId = listingId;

  try {
    // If filtering by reviewer properties, we first find matching users
    if (search || accountType || isSeller !== undefined || isVerified !== undefined) {
      const userFilter = {};
      if (search) {
        userFilter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      if (accountType && accountType !== "all") userFilter.accountType = accountType;
      if (isSeller && isSeller !== "all") userFilter.isSeller = isSeller === "true";
      if (isVerified && isVerified !== "all") userFilter.isVerified = isVerified === "true";

      const users = await mongoose.model("User").find(userFilter).select("_id");
      const userIds = users.map((u) => u._id);
      filter.reviewerId = { $in: userIds };
    }
    const skip = (page - 1) * limit;

    const reviews = await Review.find(filter)
      .populate("reviewerId", "name email isSeller isAdmin")
      .populate("listingId", "name title images media")
      .populate("orderId", "status totalPrice createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// @desc    Update review status (Approve/Hide)
// @route   PATCH /api/reviews/admin/:id/status
// @access  Private (Admin)
exports.updateReviewStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "hidden"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  try {
    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

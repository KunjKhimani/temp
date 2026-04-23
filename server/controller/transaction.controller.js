const mongoose = require("mongoose");
const TransactionLog = require("../model/TransactionLog.model");
const User = require("../model/user.model");
const ProductOrder = require("../model/productOrder.model");
const ServiceRequestOrder = require("../model/ServiceRequestOrderSchema");
const ServiceRequest = require("../model/serviceRequest.model");
const asyncHandler = require("express-async-handler");

// @desc    Get transaction history
// @route   GET /api/transactions
// @access  Private (Admin or Seller)
const getTransactionHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    startDate,
    endDate,
    status,
    search,
    orderId, // Add explicit orderId filter
    purpose,
    transactionId: exactTransactionId
  } = req.query;

  let query = {};
  const now = new Date();

  // Role-based filtering
  if (req.user.isAdmin) {
    query = {};
  } else {
    // Buyers and Sellers can see transactions where they are involved
    query.$or = [{ buyer: req.user._id }, { seller: req.user._id }];
  }

  // Type Filter (product or service)
  if (type && ["product", "service"].includes(type.toLowerCase())) {
    query.type = type.toLowerCase();
  }

  // Purpose Filter (Mapping the user requested categories)
  if (purpose) {
    const p = purpose.toLowerCase().trim();
    if (p === "special" || p === "special_deal") {
      query.isSpecial = true;
    } else if (p === "community" || p === "community_offer") {
      query.isCommunity = true;
    } else if (p === "service_request") {
      query.itemModel = { $in: ["ServiceRequest", "ServiceRequestOrder"] };
    } else if (p === "requested_product") {
      query.itemModel = "RequestedProduct";
    } else if (p === "product") {
      query.type = "product";
      // Optional: strictly exclude community/special if desired
      // query.isCommunity = { $ne: true };
      // query.isSpecial = { $ne: true };
    } else if (p === "service") {
      query.type = "service";
    } else if (p === "standard") {
      query.isSpecial = false;
      query.isCommunity = false;
      query.itemModel = { $nin: ["ServiceRequestOrder", "RequestedProduct", "ServiceRequest"] };
    }
  }

  // Date Range Filter
  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // start of the day
      query.createdAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // end of the day
      query.createdAt.$lte = end;
    }
  }

  // 1. Explicit Order ID filter
  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    query.purchasedItem = new mongoose.Types.ObjectId(orderId);
  }

  // 2. Exact Transaction ID filter
  if (exactTransactionId) {
    query.transactionId = exactTransactionId;
  }

  // Handle Search and Status Filters (requires pre-querying related models)
  let statusCondition = null;

  // 1. Filter by Order Status or TransactionLog Status if provided
  if (status) {
    const [prodOrders, servOrders] = await Promise.all([
      ProductOrder.find({ status }).distinct("_id"),
      ServiceRequestOrder.find({ status }).distinct("_id")
    ]);
    const matchingOrderIds = [...prodOrders, ...servOrders];

    statusCondition = {
      $or: [
        { status: status },
        { purchasedItem: { $in: matchingOrderIds } }
      ]
    };
  }

  // 2. Handle Search if provided
  let searchCondition = null;
  if (search) {
    const searchRegex = new RegExp(search, "i");

    // a. Search Users (Buyers/Sellers)
    const matchingUserIds = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }]
    }).distinct("_id");

    // b. Search Product Titles
    const matchingProdOrderIds = await ProductOrder.find({
      "items.nameAtOrder": searchRegex
    }).distinct("_id");

    // c. Search Service Titles
    const matchingServiceRequestIds = await ServiceRequest.find({
      title: searchRegex
    }).distinct("_id");
    const matchingServOrderIds = await ServiceRequestOrder.find({
      serviceRequestId: { $in: matchingServiceRequestIds }
    }).distinct("_id");

    const allMatchingOrderIds = [...matchingProdOrderIds, ...matchingServOrderIds];

    // Build the search OR condition
    searchCondition = {
      $or: [
        { transactionId: searchRegex },
        { buyer: { $in: matchingUserIds } },
        { seller: { $in: matchingUserIds } },
        { purchasedItem: { $in: allMatchingOrderIds } }
      ]
    };

    // Add ID search if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(search)) {
      const searchId = new mongoose.Types.ObjectId(search);
      searchCondition.$or.push({ _id: searchId });
      searchCondition.$or.push({ purchasedItem: searchId });
    }
  }

  // Combine conditions into $and
  if (statusCondition || searchCondition) {
    query.$and = query.$and || [];
    if (statusCondition) query.$and.push(statusCondition);
    if (searchCondition) query.$and.push(searchCondition);
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const transactions = await TransactionLog.find(query)
    .populate("buyer", "name email")
    .populate("seller", "name email")
    .populate("purchasedItem")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Manually populate nested serviceRequestId to avoid StrictPopulateError with refPath
  await TransactionLog.populate(transactions, [
    {
      path: "purchasedItem.serviceRequestId",
      select: "title",
      model: "ServiceRequest",
    },
    {
      path: "purchasedItem.service",
      select: "title",
      model: "Service",
    }
  ]);

  const totalQuery = TransactionLog.countDocuments(query);

  const [total, statsResult] = await Promise.all([
    totalQuery,
    TransactionLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          adminRevenue: { $sum: "$adminCommission" },
          sellerRevenue: { $sum: "$sellerCommission" },
        },
      },
    ]),
  ]);

  const stats = statsResult[0] || {
    totalRevenue: 0,
    adminRevenue: 0,
    sellerRevenue: 0,
  };

  const formattedTransactions = transactions.map((transaction) => {
    const txObj = transaction.toObject();
    if (txObj.purchasedItem) {
      if (txObj.itemModel === "ProductOrder" && txObj.purchasedItem.items?.length > 0) {
        txObj.purchasedItem.title = txObj.purchasedItem.items[0].nameAtOrder;
      } else if (txObj.itemModel === "ServiceRequestOrder" && txObj.purchasedItem.serviceRequestId) {
        txObj.purchasedItem.title = txObj.purchasedItem.serviceRequestId.title;
      } else if (txObj.itemModel === "Order" && txObj.purchasedItem.service) {
        txObj.purchasedItem.title = txObj.purchasedItem.service.title;
      } else if (txObj.itemModel === "RequestedProduct") {
        txObj.purchasedItem.title = txObj.purchasedItem.name;
      } else if (txObj.itemModel === "ServiceRequest") {
        txObj.purchasedItem.title = txObj.purchasedItem.title;
      }
    } else {
      // Fallback if purchasedItem is missing or deleted
      txObj.purchasedItem = {
        title: `Logged Item (${txObj.itemModel || "N/A"})`,
        status: txObj.status || "N/A"
      };
    }
    return txObj;
  });

  res.status(200).json({
    success: true,
    count: transactions.length,
    totalItems: total,
    stats,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
    data: formattedTransactions, // Use formatted data
  });
});

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private (Admin or Seller)
const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Try finding by TransactionLog ID first, then by purchasedItem ID (Order ID)
  let transaction = await TransactionLog.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
      { purchasedItem: mongoose.Types.ObjectId.isValid(id) ? id : null }
    ]
  })
    .populate("buyer", "name email")
    .populate("seller", "name email")
    .populate("purchasedItem");

  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  // Populate nested serviceRequestId and service
  await TransactionLog.populate(transaction, [
    {
      path: "purchasedItem.serviceRequestId",
      select: "title",
      model: "ServiceRequest",
    },
    {
      path: "purchasedItem.service",
      select: "title",
      model: "Service",
    }
  ]);

  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  // Check permissions: Admin or Seller (Owner)
  const isSeller = transaction.seller._id.toString() === req.user._id.toString();

  if (!req.user.isAdmin && !isSeller) {
    return res.status(403).json({ message: "Not authorized to view this transaction" });
  }

  const txObj = transaction.toObject();
  if (txObj.purchasedItem) {
    if (txObj.itemModel === "ProductOrder" && txObj.purchasedItem.items?.length > 0) {
      txObj.purchasedItem.title = txObj.purchasedItem.items[0].nameAtOrder;
    } else if (txObj.itemModel === "ServiceRequestOrder" && txObj.purchasedItem.serviceRequestId) {
      txObj.purchasedItem.title = txObj.purchasedItem.serviceRequestId.title;
    } else if (txObj.itemModel === "Order" && txObj.purchasedItem.service) { // Added Order logic
      txObj.purchasedItem.title = txObj.purchasedItem.service.title;
    }
  }

  res.status(200).json({
    success: true,
    data: txObj,
  });
});

module.exports = {
  getTransactionHistory,
  getTransactionById,
};
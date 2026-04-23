const Product = require("../model/product.model");
const ProductOrder = require("../model/productOrder.model"); // To link products to orders
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const mongoose = require("mongoose");

// @desc    Get product analytics data for admin dashboard
// @route   GET /api/products/analytics
// @access  Private (Admin Only)
const getProductAnalytics = asyncHandler(async (req, res) => {
  // Total number of products
  const totalProducts = await Product.countDocuments({});

  // Products by category (assuming 'category' field exists in Product model)
  const productsByCategory = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // New products in the last 30 days (monthly trend)
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();
  const newProductsLast30Days = await Product.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Products trend over the last 6 months
  const sixMonthsAgo = moment().subtract(6, "months").startOf("month").toDate();
  const productsMonthlyTrend = await Product.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Top 5 most sold products (requires joining with ProductOrder model)
  const topSellingProducts = await ProductOrder.aggregate([
    {
      $unwind: "$items", // Assuming 'items' is an array of products in ProductOrder
    },
    {
      $group: {
        _id: "$items.product", // Assuming 'product' field holds the Product ObjectId
        totalSold: { $sum: "$items.quantity" },
      },
    },
    {
      $lookup: {
        from: "products", // The collection name for Product model
        localField: "_id",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $project: {
        _id: 0,
        productName: "$productDetails.title", // Assuming 'title' is the product name
        totalSold: 1,
      },
    },
    {
      $sort: { totalSold: -1 },
    },
    {
      $limit: 5,
    },
  ]);

  // Products by stock status (e.g., in stock, out of stock - assuming a 'stock' field)
  const productsByStockStatus = await Product.aggregate([
    {
      $group: {
        _id: { $cond: [{ $gt: ["$stock", 0] }, "In Stock", "Out of Stock"] },
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    message: "Product analytics fetched successfully",
    data: {
      totalProducts,
      productsByCategory,
      newProductsLast30Days,
      productsMonthlyTrend,
      topSellingProducts,
      productsByStockStatus,
    },
  });
});

module.exports = {
  getProductAnalytics,
};

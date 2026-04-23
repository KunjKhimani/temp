const ProductOrder = require("../model/productOrder.model");
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const mongoose = require("mongoose");

// @desc    Get product order analytics data for admin dashboard
// @route   GET /api/product-orders/analytics
// @access  Private (Admin Only)
const getProductOrderAnalytics = asyncHandler(async (req, res) => {
  // Total number of product orders
  const totalProductOrders = await ProductOrder.countDocuments({});

  // Product orders by status
  const productOrdersByStatus = await ProductOrder.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" }, // Assuming 'totalPrice' field exists in ProductOrder model
      },
    },
  ]);

  // Total revenue from product orders
  const totalProductOrderRevenueResult = await ProductOrder.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" },
      },
    },
  ]);
  const totalProductOrderRevenue =
    totalProductOrderRevenueResult.length > 0
      ? totalProductOrderRevenueResult[0].total
      : 0;

  // New product orders in the last 30 days (monthly trend)
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();
  const newProductOrdersLast30Days = await ProductOrder.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Product orders trend over the last 6 months
  const sixMonthsAgo = moment().subtract(6, "months").startOf("month").toDate();
  const productOrdersMonthlyTrend = await ProductOrder.aggregate([
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
        revenue: { $sum: "$totalPrice" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Average product order value
  const averageProductOrderValueResult = await ProductOrder.aggregate([
    {
      $group: {
        _id: null,
        average: { $avg: "$totalPrice" },
      },
    },
  ]);
  const averageProductOrderValue =
    averageProductOrderValueResult.length > 0
      ? averageProductOrderValueResult[0].average
      : 0;

  res.status(200).json({
    message: "Product Order analytics fetched successfully",
    data: {
      totalProductOrders,
      productOrdersByStatus,
      totalProductOrderRevenue,
      newProductOrdersLast30Days,
      productOrdersMonthlyTrend,
      averageProductOrderValue,
    },
  });
});

module.exports = {
  getProductOrderAnalytics,
};

const Order = require("../model/order.model");
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const mongoose = require("mongoose");

// @desc    Get order analytics data for admin dashboard
// @route   GET /api/orders/analytics
// @access  Private (Admin Only)
const getOrderAnalytics = asyncHandler(async (req, res) => {
  // Total number of orders
  const totalOrders = await Order.countDocuments({});

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$price" }, // Assuming 'price' field exists in Order model
      },
    },
  ]);

  // Total revenue
  const totalRevenueResult = await Order.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$price" },
      },
    },
  ]);
  const totalRevenue =
    totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

  // New orders in the last 30 days (monthly trend)
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();
  const newOrdersLast30Days = await Order.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Orders trend over the last 6 months
  const sixMonthsAgo = moment().subtract(6, "months").startOf("month").toDate();
  const ordersMonthlyTrend = await Order.aggregate([
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
        revenue: { $sum: "$price" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Average order value
  const averageOrderValueResult = await Order.aggregate([
    {
      $group: {
        _id: null,
        average: { $avg: "$price" },
      },
    },
  ]);
  const averageOrderValue =
    averageOrderValueResult.length > 0 ? averageOrderValueResult[0].average : 0;

  res.status(200).json({
    message: "Order analytics fetched successfully",
    data: {
      totalOrders,
      ordersByStatus,
      totalRevenue,
      newOrdersLast30Days,
      ordersMonthlyTrend,
      averageOrderValue,
    },
  });
});

module.exports = {
  getOrderAnalytics,
};

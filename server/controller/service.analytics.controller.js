const Service = require("../model/service.model");
const Review = require("../model/review.model"); // To link services to reviews
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const mongoose = require("mongoose");

// @desc    Get service analytics data for admin dashboard
// @route   GET /api/services/analytics
// @access  Private (Admin Only)
const getServiceAnalytics = asyncHandler(async (req, res) => {
  // Total number of services
  const totalServices = await Service.countDocuments({});

  // Services by category (assuming 'category' field exists in Service model)
  const servicesByCategory = await Service.aggregate([
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

  // New services in the last 30 days (monthly trend)
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();
  const newServicesLast30Days = await Service.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Services trend over the last 6 months
  const sixMonthsAgo = moment().subtract(6, "months").toDate(); // Define sixMonthsAgo
  const servicesMonthlyTrend = await Service.aggregate([
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

  // Top 5 most viewed services (if you have a 'views' field)
  const topViewedServices = await Service.find({})
    .sort({ views: -1 }) // Assuming a 'views' field
    .limit(5)
    .select("title views");

  // Services by status (e.g., active, paused, pending approval - assuming a 'status' field)
  const servicesByStatus = await Service.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Average rating of services (requires joining with Review model)
  const averageServiceRating = await Review.aggregate([
    {
      $match: {
        service: { $exists: true }, // Only reviews related to services
      },
    },
    {
      $group: {
        _id: "$service",
        averageRating: { $avg: "$rating" },
      },
    },
    {
      $lookup: {
        from: "services", // The collection name for Service model
        localField: "_id",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $unwind: "$serviceDetails",
    },
    {
      $project: {
        _id: 0,
        serviceName: "$serviceDetails.title",
        averageRating: 1,
      },
    },
    {
      $sort: { averageRating: -1 },
    },
    {
      $limit: 5, // Top 5 services by average rating
    },
  ]);

  res.status(200).json({
    message: "Service analytics fetched successfully",
    data: {
      totalServices,
      servicesByCategory,
      newServicesLast30Days,
      servicesMonthlyTrend,
      topViewedServices,
      servicesByStatus,
      averageServiceRating,
    },
  });
});

module.exports = {
  getServiceAnalytics,
};

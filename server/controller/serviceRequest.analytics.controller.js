const ServiceRequest = require("../model/serviceRequest.model");
const Service = require("../model/service.model"); // To link requests to services
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const mongoose = require("mongoose");

// @desc    Get service request analytics data for admin dashboard
// @route   GET /api/service-requests/analytics
// @access  Private (Admin Only)
const getServiceRequestAnalytics = asyncHandler(async (req, res) => {
  // Total number of service requests
  const totalServiceRequests = await ServiceRequest.countDocuments({});

  // Service requests by status
  const serviceRequestsByStatus = await ServiceRequest.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // New service requests in the last 30 days (monthly trend)
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();
  const newServiceRequestsLast30Days = await ServiceRequest.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Service requests trend over the last 6 months
  const sixMonthsAgo = moment().subtract(6, "months").startOf("month").toDate();
  const serviceRequestsMonthlyTrend = await ServiceRequest.aggregate([
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

  // Top 5 most requested services (if serviceId is stored in ServiceRequest)
  // This assumes ServiceRequest has a 'service' field referencing Service model
  const topRequestedServices = await ServiceRequest.aggregate([
    {
      $group: {
        _id: "$service", // Assuming 'service' field holds the Service ObjectId
        count: { $sum: 1 },
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
        serviceName: "$serviceDetails.title", // Assuming 'title' is the service name
        count: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 5,
    },
  ]);

  res.status(200).json({
    message: "Service Request analytics fetched successfully",
    data: {
      totalServiceRequests,
      serviceRequestsByStatus,
      newServiceRequestsLast30Days,
      serviceRequestsMonthlyTrend,
      topRequestedServices,
    },
  });
});

module.exports = {
  getServiceRequestAnalytics,
};

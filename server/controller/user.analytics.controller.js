const User = require("../model/user.model"); // Assuming you have a User model
const asyncHandler = require("express-async-handler");
const moment = require("moment");

// @desc    Get user analytics data for admin dashboard
// @route   GET /api/user-analytics/analytics
// @access  Private (Admin Only)
const getUserAnalytics = asyncHandler(async (req, res) => {
  // Total number of users
  const totalUsers = await User.countDocuments({});

  // New users in the last 30 days
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();
  const newUsersLast30Days = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // User registration trend over the last 6 months
  const sixMonthsAgo = moment().subtract(6, "months").toDate();
  const userRegistrationMonthlyTrend = await User.aggregate([
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

  // Users by role (assuming 'role' field exists in User model)
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    message: "User analytics fetched successfully",
    data: {
      totalUsers,
      newUsersLast30Days,
      userRegistrationMonthlyTrend,
      usersByRole,
    },
  });
});

module.exports = {
  getUserAnalytics,
};

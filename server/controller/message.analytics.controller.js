const Message = require("../model/message.model");
const asyncHandler = require("express-async-handler");
const moment = require("moment");

// @desc    Get message analytics data for admin dashboard
// @route   GET /api/messages/analytics
// @access  Private (Admin Only)
const getMessageAnalytics = asyncHandler(async (req, res) => {
  // Total number of messages
  const totalMessages = await Message.countDocuments({});

  // New messages in the last 7 days
  const sevenDaysAgo = moment().subtract(7, "days").toDate();
  const newMessagesLast7Days = await Message.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  // You can add more specific analytics here, e.g.:
  // - Messages sent by specific users
  // - Messages per conversation

  res.status(200).json({
    message: "Message analytics fetched successfully",
    data: {
      totalMessages,
      newMessagesLast7Days,
    },
  });
});

module.exports = {
  getMessageAnalytics,
};

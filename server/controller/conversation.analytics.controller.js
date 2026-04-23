const Conversation = require("../model/conversation.model");
const asyncHandler = require("express-async-handler");
const moment = require("moment");

// @desc    Get conversation analytics data for admin dashboard
// @route   GET /api/conversations/analytics
// @access  Private (Admin Only)
const getConversationAnalytics = asyncHandler(async (req, res) => {
  // Total number of conversations
  const totalConversations = await Conversation.countDocuments({});

  // New conversations in the last 7 days
  const sevenDaysAgo = moment().subtract(7, "days").toDate();
  const newConversationsLast7Days = await Conversation.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  // You can add more specific analytics here, e.g.:
  // - Conversations by status (if you have a status field)
  // - Average messages per conversation
  // - Conversations created by specific users/sellers

  res.status(200).json({
    message: "Conversation analytics fetched successfully",
    data: {
      totalConversations,
      newConversationsLast7Days,
    },
  });
});

module.exports = {
  getConversationAnalytics,
};

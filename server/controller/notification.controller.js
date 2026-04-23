// controller/notification.controller.js
const mongoose = require("mongoose");
const Notification = require("../model/notification.model");
const asyncHandler = require("express-async-handler"); // To handle async errors

// --- GET User's Notifications (Paginated) ---
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { recipient: userId };

  // Find notifications for the user with pagination and sorting
  const notifications = await Notification.find(query)
    .populate("sender", "name profilePicture") // Populate sender info
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean for performance

  // Get total count for pagination info
  const totalCount = await Notification.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    notifications,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  });
});

// --- GET Unread Notification Count ---
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
  res.status(200).json({ count });
});

// --- Mark a Specific Notification as Read ---
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notificationId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ message: "Invalid notification ID format." });
  }

  const updatedNotification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId }, // Ensure user owns the notification
    { isRead: true },
    { new: true } // Return the updated document
  ).lean();

  if (!updatedNotification) {
    return res
      .status(404)
      .json({ message: "Notification not found or you are not authorized." });
  }

  // --- Emit Socket Event for Real-time Update ---
  const io = req.app.get("socketio");
  if (io) {
    // Send the updated notification or just an ID/count update
    io.to(userId.toString()).emit("notification_read", {
      notificationId: updatedNotification._id,
    });
    // Consider also emitting an unread count update event
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
    io.to(userId.toString()).emit("unread_count_update", {
      count: unreadCount,
    });
    console.log(
      `[Socket.IO] Emitted notification_read & count update to room: ${userId}`
    );
  }

  res.status(200).json({
    message: "Notification marked as read.",
    notification: updatedNotification,
  });
});

// --- Mark All Notifications as Read ---
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updateResult = await Notification.updateMany(
    { recipient: userId, isRead: false }, // Find all unread for this user
    { isRead: true }
  );

  const countUpdated = updateResult.modifiedCount || 0;

  // --- Emit Socket Event for Real-time Update ---
  const io = req.app.get("socketio");
  if (io) {
    // Tell the client all are read, so it can update UI and badge
    io.to(userId.toString()).emit("all_notifications_read");
    // Send the new zero count
    io.to(userId.toString()).emit("unread_count_update", { count: 0 });
    console.log(
      `[Socket.IO] Emitted all_notifications_read & count update to room: ${userId}`
    );
  }

  res
    .status(200)
    .json({ message: `Marked ${countUpdated} notification(s) as read.` });
});

// --- Delete a Specific Notification ---
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notificationId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ message: "Invalid notification ID format." });
  }

  const deletedNotification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId, // Ensure user owns the notification
  });

  if (!deletedNotification) {
    return res
      .status(404)
      .json({ message: "Notification not found or you are not authorized." });
  }

  // --- Emit Socket Event for Real-time Update ---
  const io = req.app.get("socketio");
  if (io) {
    io.to(userId.toString()).emit("notification_deleted", {
      notificationId: deletedNotification._id,
    });
    // Update unread count if the deleted one was unread
    if (!deletedNotification.isRead) {
      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });
      io.to(userId.toString()).emit("unread_count_update", {
        count: unreadCount,
      });
    }
    console.log(
      `[Socket.IO] Emitted notification_deleted & possibly count update to room: ${userId}`
    );
  }

  res.status(200).json({ message: "Notification deleted successfully." }); // Or 204 No Content
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

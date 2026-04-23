// route/notification.route.js
const express = require("express");
const asyncHandler = require("express-async-handler");
const { authMiddleware } = require("../middleware/auth.js"); // Your authentication middleware
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controller/notification.controller.js");

const router = express.Router();

// Apply auth middleware to all notification routes
router.use(asyncHandler(authMiddleware));

// GET /api/notification - Get user's notifications (paginated)
router.get("/", asyncHandler(getNotifications));

// GET /api/notification/unread-count - Get count of unread notifications
router.get("/unread-count", asyncHandler(getUnreadCount));

// PATCH /api/notification/read-all - Mark all notifications as read
router.patch("/read-all", asyncHandler(markAllAsRead));

// PATCH /api/notification/:id/read - Mark a specific notification as read
router.patch("/:id/read", asyncHandler(markAsRead));

// DELETE /api/notification/:id - Delete a specific notification
router.delete("/:id", asyncHandler(deleteNotification));

module.exports = router;

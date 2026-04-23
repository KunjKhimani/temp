// src/services/notificationApi.js
import { API } from "./apis"; // Import the configured Axios instance

// --- NOTIFICATION API Calls ---

// Get paginated notifications for the logged-in user
const getNotifications = (params = {}) => {
  const queryParams = new URLSearchParams(params); // e.g., { page: 1, limit: 10 }
  return API.get(`/notification?${queryParams.toString()}`);
};

// Get the count of unread notifications
const getUnreadCount = () => API.get("/notification/unread-count");

// Mark a specific notification as read
const markAsRead = (notificationId) =>
  API.patch(`/notification/${notificationId}/read`);

// Mark all notifications as read for the user
const markAllAsRead = () => API.patch("/notification/read-all");

// Delete a specific notification
const deleteNotification = (notificationId) =>
  API.delete(`/notification/${notificationId}`);

export const notificationApi = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

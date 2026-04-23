/* eslint-disable no-unused-vars */
// src/store/thunks/notificationThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { notificationApi } from "../../services/notificationApi"; // Use the separated API module

// Fetch paginated notifications
export const fetchNotifications = createAsyncThunk(
  "notification/fetchNotifications",
  async (params = { page: 1, limit: 10 }, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotifications(params);
      // Expecting { notifications: [], pagination: { ... } }
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch notifications" }
      );
    }
  }
);

// Fetch unread count
export const fetchUnreadCount = createAsyncThunk(
  "notification/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getUnreadCount();
      // Expecting { count: number }
      return response.data.count;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch unread count" }
      );
    }
  }
);

// Mark a single notification as read
export const markNotificationRead = createAsyncThunk(
  "notification/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAsRead(notificationId);
      // Return the ID of the notification marked as read for reducer update
      return { notificationId };
    } catch (error) {
      console.error(
        `Error marking notification ${notificationId} as read:`,
        error
      );
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to mark notification as read",
        }
      );
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsRead = createAsyncThunk(
  "notification/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.markAllAsRead();
      // No specific payload needed, reducer will handle setting all to read
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to mark all notifications as read",
        }
      );
    }
  }
);

// Delete a notification
export const deleteUserNotification = createAsyncThunk(
  "notification/delete",
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      // Return the ID of the deleted notification for reducer update
      return { notificationId };
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete notification" }
      );
    }
  }
);

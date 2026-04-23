// src/store/slice/notificationSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteUserNotification,
} from "../thunks/notificationThunks";

const initialState = {
  notifications: [],
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10, // Default limit
  },
  unreadCount: 0,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed' (for list fetching)
  countStatus: "idle", // Status for fetching count
  error: null, // General error for the slice
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // Add a notification (e.g., from socket event)
    addNotification: (state, action) => {
      const newNotification = action.payload;
      // Add to the beginning of the list
      state.notifications.unshift(newNotification);
      // Increment unread count
      state.unreadCount += 1;
      // Optional: Prune the list if it gets too long client-side?
      // if (state.notifications.length > SOME_LIMIT) state.notifications.pop();
    },
    // Decrement count locally when marking as read
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    // Set count locally (e.g., from socket event)
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    clearNotificationState: () => initialState, // Reset state on logout etc.
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Notifications List ---
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to load notifications";
      })

      // --- Fetch Unread Count ---
      .addCase(fetchUnreadCount.pending, (state) => {
        state.countStatus = "loading";
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.countStatus = "succeeded";
        state.unreadCount = action.payload; // Payload is just the count
      })
      .addCase(fetchUnreadCount.rejected, (state) => {
        state.countStatus = "failed";
        // Keep existing count on error, maybe log it
        console.error("Failed to fetch unread count");
      })

      // --- Mark As Read ---
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const { notificationId } = action.payload;
        const index = state.notifications.findIndex(
          (n) => n._id === notificationId
        );
        if (index !== -1 && !state.notifications[index].isRead) {
          state.notifications[index].isRead = true;
          if (state.unreadCount > 0) {
            state.unreadCount -= 1; // Decrement count if it was unread
          }
        }
      })
      // No pending/rejected needed unless you want loading indicators for this action

      // --- Mark All As Read ---
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      // No pending/rejected needed unless you want loading indicators

      // --- Delete Notification ---
      .addCase(deleteUserNotification.fulfilled, (state, action) => {
        const { notificationId } = action.payload;
        const index = state.notifications.findIndex(
          (n) => n._id === notificationId
        );
        if (index !== -1) {
          const wasUnread = !state.notifications[index].isRead;
          state.notifications.splice(index, 1); // Remove from array
          if (wasUnread && state.unreadCount > 0) {
            state.unreadCount -= 1; // Decrement if it was unread
          }
          // Adjust pagination count if needed, though a refetch might be simpler
          if (state.pagination.totalItems > 0) state.pagination.totalItems -= 1;
        }
      });
    // No pending/rejected needed unless you want loading indicators
  },
});

export const {
  addNotification,
  decrementUnreadCount,
  setUnreadCount,
  clearNotificationState,
  clearNotificationError,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// --- Selectors ---
export const selectAllNotifications = (state) =>
  state.notification.notifications;
export const selectNotificationPagination = (state) =>
  state.notification.pagination;
export const selectUnreadNotificationCount = (state) =>
  state.notification.unreadCount;
export const selectNotificationStatus = (state) => state.notification.status;
export const selectNotificationError = (state) => state.notification.error;

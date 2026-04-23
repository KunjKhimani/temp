import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// Import all necessary API functions
import {
  getUnverifiedUsers,
  verifyUser,
  getAllUsers,
  createUser,
  deleteMultipleUsers as deleteMultipleUsersApi, // Renamed to avoid conflict
  updateUserStatus as updateUserStatusApi, // Renamed to avoid conflict
} from "../../services/apis";

// --- Async Thunks ---

export const fetchUnverifiedUsers = createAsyncThunk(
  "admin/fetchUnverifiedUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUnverifiedUsers();
      // Assuming the API now returns both unverified sellers and buyers
      // If the backend key 'sellers' is changed to 'users' or similar, update here.
      if (
        response.data &&
        (Array.isArray(response.data.sellers) ||
          Array.isArray(response.data.users))
      ) {
        return response.data;
      }
      console.error(
        "Unexpected response structure for unverified users:",
        response.data
      );
      return rejectWithValue(
        "Invalid data structure received for unverified users."
      );
    } catch (err) {
      console.error("Error fetching unverified users:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch unverified users"
      );
    }
  }
);

export const updateUserVerification = createAsyncThunk(
  "admin/verifyUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await verifyUser(userId);
      if (response.data?.user?._id) {
        return response.data.user;
      }
      if (response.data?.message) {
        // Fallback for responses with only message
        return { _id: userId, isVerified: true }; // Assume verification was successful
      }
      console.error("Unexpected verification response:", response.data);
      return rejectWithValue(
        "Verification succeeded but response format was unexpected."
      );
    } catch (err) {
      console.error(`Error verifying user ${userId}:`, err);
      return rejectWithValue(
        err.response?.data?.message || `Failed to verify user ${userId}`
      );
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  "admin/fetchAllUsers",
  async (params, { getState, rejectWithValue }) => {
    try {
      const queryParams = { ...getState().admin.currentParams, ...params };
      const response = await getAllUsers(queryParams);
      if (response.data && response.data.data && response.data.pagination) {
        return {
          data: response.data.data,
          pagination: response.data.pagination,
          appliedParams: queryParams,
        };
      }
      console.error(
        "Unexpected response structure for all users:",
        response.data
      );
      return rejectWithValue("Invalid data structure received for all users.");
    } catch (err) {
      console.error("Error fetching all users:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch all users"
      );
    }
  }
);

export const adminCreateUserThunk = createAsyncThunk(
  "admin/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await createUser(userData);
      if (response.data && response.data.user) {
        return response.data;
      }
      console.error(
        "Unexpected response structure creating user:",
        response.data
      );
      return rejectWithValue(
        "Invalid data structure received after creating user."
      );
    } catch (err) {
      console.error("Error creating user via admin:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to create user"
      );
    }
  }
);

export const deleteMultipleUsers = createAsyncThunk(
  "admin/deleteMultipleUsers",
  async (userIds, { rejectWithValue }) => {
    try {
      const response = await deleteMultipleUsersApi(userIds);
      if (response.data && response.data.message) {
        return { userIds, message: response.data.message };
      }
      console.error(
        "Unexpected response structure deleting multiple users:",
        response.data
      );
      return rejectWithValue(
        "Invalid data structure received after deleting multiple users."
      );
    } catch (err) {
      console.error("Error deleting multiple users:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete multiple users"
      );
    }
  }
);

export const updateUserStatusThunk = createAsyncThunk(
  "admin/updateUserStatus",
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const response = await updateUserStatusApi(userId, status);
      if (response.data && response.data.user) {
        return response.data.user;
      }
      return rejectWithValue("Failed to update user status.");
    } catch (err) {
      console.error("Error updating user status:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to update user status"
      );
    }
  }
);


const initialState = {
  unverifiedUsers: [],
  unverifiedPagination: null,
  fetchUnverifiedStatus: "idle",
  fetchUnverifiedError: null,

  verifyUserStatus: "idle",
  verifyUserError: null,

  createUserStatus: "idle",
  createUserError: null,
  lastCreatedUser: null,

  deleteMultipleUsersStatus: "idle",
  deleteMultipleUsersError: null,

  statusUpdateStatus: "idle",
  statusUpdateError: null,

  allUsers: [],
  allUsersPagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  },
  currentParams: {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    filters: {},
  },
  fetchAllStatus: "idle",
  fetchAllError: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminErrors: (state) => {
      state.fetchUnverifiedError = null;
      state.verifyUserError = null;
      state.fetchAllError = null;
      state.createUserError = null;
      state.deleteMultipleUsersError = null; // Clear new error state
      state.statusUpdateError = null;
    },
    setAllUsersParams: (state, action) => {
      const newFilters = action.payload.filters;
      const oldFilters = state.currentParams.filters;
      const newSortBy = action.payload.sortBy;
      const oldSortBy = state.currentParams.sortBy;
      const newSortOrder = action.payload.sortOrder;
      const oldSortOrder = state.currentParams.sortOrder;

      const filtersChanged =
        JSON.stringify(newFilters ?? {}) !== JSON.stringify(oldFilters ?? {});
      const sortChanged =
        (newSortBy && newSortBy !== oldSortBy) ||
        (newSortOrder && newSortOrder !== oldSortOrder);

      if (filtersChanged || sortChanged) {
        state.currentParams = {
          ...state.currentParams,
          ...action.payload,
          page: 1,
        };
      } else {
        state.currentParams = { ...state.currentParams, ...action.payload };
      }
    },
    updateUserInAllUsersList: (state, action) => {
      const updatedUser = action.payload;
      state.allUsers = state.allUsers.map((user) =>
        user._id === updatedUser._id ? { ...user, ...updatedUser } : user
      );
    },
    removeUserFromAllUsersList: (state, action) => {
      const userIdToRemove = action.payload;
      state.allUsers = state.allUsers.filter(
        (user) => user._id !== userIdToRemove
      );
      if (state.allUsersPagination.totalItems > 0) {
        state.allUsersPagination.totalItems -= 1;
      }
    },
    resetCreateUserStatus: (state) => {
      state.createUserStatus = "idle";
      state.createUserError = null;
      state.lastCreatedUser = null;
    },
    resetDeleteMultipleUsersStatus: (state) => {
      state.deleteMultipleUsersStatus = "idle";
      state.deleteMultipleUsersError = null;
    },
    resetStatusUpdateStatus: (state) => {
      state.statusUpdateStatus = "idle";
      state.statusUpdateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnverifiedUsers.pending, (state) => {
        state.fetchUnverifiedStatus = "pending";
        state.fetchUnverifiedError = null;
      })
      .addCase(fetchUnverifiedUsers.fulfilled, (state, action) => {
        state.fetchUnverifiedStatus = "succeeded";
        // The key 'sellers' might now include both sellers and buyers needing verification.
        // If backend changes this key to 'users', update action.payload.sellers to action.payload.users
        state.unverifiedUsers =
          action.payload.sellers || action.payload.users || [];
        state.unverifiedPagination = action.payload.pagination || null;
      })
      .addCase(fetchUnverifiedUsers.rejected, (state, action) => {
        state.fetchUnverifiedStatus = "failed";
        state.fetchUnverifiedError = action.payload;
      })

      .addCase(updateUserVerification.pending, (state) => {
        state.verifyUserStatus = "pending";
        state.verifyUserError = null;
      })
      .addCase(updateUserVerification.fulfilled, (state, action) => {
        state.verifyUserStatus = "succeeded";
        const verifiedUser = action.payload; // Expecting the updated user object
        // Remove from the unverified list
        state.unverifiedUsers = state.unverifiedUsers.filter(
          (user) => user._id !== verifiedUser._id
        );
        // Update the user in the allUsers list if they exist there
        state.allUsers = state.allUsers.map((user) =>
          user._id === verifiedUser._id
            ? { ...user, ...verifiedUser, isVerified: true }
            : user
        );
      })
      .addCase(updateUserVerification.rejected, (state, action) => {
        state.verifyUserStatus = "failed";
        state.verifyUserError = action.payload;
      })

      .addCase(fetchAllUsers.pending, (state) => {
        state.fetchAllStatus = "pending";
        state.fetchAllError = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.fetchAllStatus = "succeeded";
        state.allUsers = action.payload.data;
        state.allUsersPagination = action.payload.pagination;
        // state.currentParams = action.payload.appliedParams; // Optionally update if backend returns them
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.fetchAllStatus = "failed";
        state.fetchAllError = action.payload;
      })

      .addCase(adminCreateUserThunk.pending, (state) => {
        state.createUserStatus = "pending";
        state.createUserError = null;
        state.lastCreatedUser = null;
      })
      .addCase(adminCreateUserThunk.fulfilled, (state, action) => {
        state.createUserStatus = "succeeded";
        state.lastCreatedUser = action.payload.user;
        // Optionally, add to allUsers list or trigger a refetch
      })
      .addCase(adminCreateUserThunk.rejected, (state, action) => {
        state.createUserStatus = "failed";
        state.createUserError = action.payload;
      })

      // --- Cases for deleteMultipleUsers ---
      .addCase(deleteMultipleUsers.pending, (state) => {
        state.deleteMultipleUsersStatus = "pending";
        state.deleteMultipleUsersError = null;
      })
      .addCase(deleteMultipleUsers.fulfilled, (state, action) => {
        state.deleteMultipleUsersStatus = "succeeded";
        const { userIds } = action.payload;
        // Remove deleted users from the allUsers list
        state.allUsers = state.allUsers.filter(
          (user) => !userIds.includes(user._id)
        );
        // Adjust totalItems count
        state.allUsersPagination.totalItems =
          state.allUsersPagination.totalItems - userIds.length;
        if (state.allUsersPagination.totalItems < 0) {
          state.allUsersPagination.totalItems = 0;
        }
        // If the current page becomes empty, or if the total items are less than what's needed for the current page,
        // consider refetching or adjusting the page number. For simplicity, we'll just let the next fetch handle it.
      })
      .addCase(deleteMultipleUsers.rejected, (state, action) => {
        state.deleteMultipleUsersStatus = "failed";
        state.deleteMultipleUsersError = action.payload;
      })

      // --- Cases for updateUserStatus ---
      .addCase(updateUserStatusThunk.pending, (state) => {
        state.statusUpdateStatus = "pending";
        state.statusUpdateError = null;
      })
      .addCase(updateUserStatusThunk.fulfilled, (state, action) => {
        state.statusUpdateStatus = "succeeded";
        const updatedUser = action.payload;
        // Update the user in the allUsers list
        state.allUsers = state.allUsers.map((user) =>
          user._id === updatedUser._id ? { ...user, ...updatedUser } : user
        );
      })
      .addCase(updateUserStatusThunk.rejected, (state, action) => {
        state.statusUpdateStatus = "failed";
        state.statusUpdateError = action.payload;
      });
  },
});

export const {
  clearAdminErrors,
  setAllUsersParams,
  updateUserInAllUsersList,
  removeUserFromAllUsersList,
  resetCreateUserStatus,
  resetDeleteMultipleUsersStatus, // Export the new action
  resetStatusUpdateStatus,
} = adminSlice.actions;

export default adminSlice.reducer;

// Selectors
export const selectUnverifiedUsers = (state) => state.admin.unverifiedUsers;
export const selectUnverifiedPagination = (state) =>
  state.admin.unverifiedPagination;
export const selectFetchUnverifiedStatus = (state) =>
  state.admin.fetchUnverifiedStatus;
export const selectFetchUnverifiedError = (state) =>
  state.admin.fetchUnverifiedError;

export const selectVerifyUserStatus = (state) => state.admin.verifyUserStatus;
export const selectVerifyUserError = (state) => state.admin.verifyUserError;

export const selectAllAdminUsers = (state) => state.admin.allUsers;
export const selectAllAdminUsersPagination = (state) =>
  state.admin.allUsersPagination;
export const selectAllAdminUsersParams = (state) => state.admin.currentParams;
export const selectFetchAllStatus = (state) => state.admin.fetchAllStatus;
export const selectFetchAllError = (state) => state.admin.fetchAllError;

export const selectCreateUserStatus = (state) => state.admin.createUserStatus;
export const selectCreateUserError = (state) => state.admin.createUserError;
export const selectLastCreatedUser = (state) => state.admin.lastCreatedUser;

// New selectors for multiple user deletion
export const selectDeleteMultipleUsersStatus = (state) =>
  state.admin.deleteMultipleUsersStatus;
export const selectDeleteMultipleUsersError = (state) =>
  state.admin.deleteMultipleUsersError;

export const selectIsAdminBusy = (state) =>
  state.admin.fetchUnverifiedStatus === "pending" ||
  state.admin.verifyUserStatus === "pending" ||
  state.admin.fetchAllStatus === "pending" ||
  state.admin.createUserStatus === "pending" ||
  state.admin.deleteMultipleUsersStatus === "pending" ||
  state.admin.statusUpdateStatus === "pending"; // Include new status

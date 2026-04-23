/* eslint-disable no-unused-vars */
// src/store/slice/userSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  login,
  register,
  verifyCode,
  resendCode,
  forgot,
  reset,
  removeUser,
  fetchServiceProviders, // This thunk is defined in userThunks.js
  updateUserIntent, // New thunk
  fetchUserAnalytics, // New thunk for user analytics
  createAdminUserThunk, // Import the new thunk
  updateUserThunk, // Added update thunk
} from "../thunks/userThunks";
import { API } from "../../services/apis";

const userFromLocalStorage = localStorage.getItem("user");
const tokenFromLocalStorage = localStorage.getItem("token");

const initialState = {
  // User Auth State
  user: userFromLocalStorage ? JSON.parse(userFromLocalStorage) : null,
  loading: false, // General auth loading
  error: null, // General auth error
  isLoggedIn: !!localStorage.getItem("token"),

  // User Analytics State
  userAnalytics: null,
  userAnalyticsLoading: false,
  userAnalyticsError: null,

  // User Intent State
  updateIntentLoading: false,
  updateIntentError: null,

  // Admin User Creation State
  createAdminUserLoading: false,
  createAdminUserError: null,
  createAdminUserSuccess: false,

  // Admin User Update State
  updateAdminUserLoading: false,
  updateAdminUserError: null,
  updateAdminUserSuccess: false,

  // Email Verification State
  verificationLoading: false,
  verificationError: null,
  verificationSuccess: false,
  resendLoading: false,
  resendError: null,
  resendSuccessMessage: null,

  // Service Provider Fetching State (now part of userSlice)
  serviceProviders: [], // Renamed to avoid conflict if 'providers' is used elsewhere
  serviceProvidersStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  serviceProvidersError: null,
  serviceProvidersPagination: {
    currentPage: 1,
    totalPages: 1,
    totalProviders: 0,
    limit: 10,
  },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // --- User Auth Reducers ---
    saveUser(state, action) {
      const userData = action.payload;
      if (userData && typeof userData === "object") {
        state.user = { ...(state.user || {}), ...userData };
        localStorage.setItem("user", JSON.stringify(state.user));
        state.isLoggedIn = !!localStorage.getItem("token");
      }
    },
    logout(state) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("hasCompletedInitialSubmission");
      delete API.defaults.headers.common["Authorization"];
      state.isLoggedIn = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      state.verificationLoading = false;
      state.verificationError = null;
      state.verificationSuccess = false;
      state.resendLoading = false;
      state.resendError = null;
      state.resendSuccessMessage = null;
      // Also reset provider state on logout
      state.serviceProviders = [];
      state.serviceProvidersStatus = "idle";
      state.serviceProvidersError = null;
      state.serviceProvidersPagination = {
        currentPage: 1,
        totalPages: 1,
        totalProviders: 0,
        limit: 10,
      };
    },
    clearAuthError(state) {
      state.error = null;
    },
    // --- Email Verification Reducers ---
    clearVerificationError(state) {
      state.verificationError = null;
    },
    clearResendStatus(state) {
      state.resendError = null;
      state.resendSuccessMessage = null;
    },
    resetVerificationSuccess(state) {
      state.verificationSuccess = false;
    },
    // --- Service Provider Fetching Reducers (now part of userSlice) ---
    clearServiceProvidersError(state) {
      // Renamed action for clarity
      state.serviceProvidersError = null;
    },
    resetServiceProvidersStatus(state) {
      // Renamed action for clarity
      state.serviceProvidersStatus = "idle";
      state.serviceProvidersError = null;
    },
    clearServiceProvidersData(state) {
      // Renamed action for clarity
      state.serviceProviders = [];
      state.serviceProvidersStatus = "idle";
      state.serviceProvidersError = null;
      state.serviceProvidersPagination = {
        currentPage: 1,
        totalPages: 1,
        totalProviders: 0,
        limit: 10,
      };
    },
    // --- User Intent Reducers (if any specific clear actions are needed) ---
    clearUpdateIntentError(state) {
      state.updateIntentError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Update User Intent Reducers ---
      .addCase(updateUserIntent.pending, (state) => {
        state.updateIntentLoading = true;
        state.updateIntentError = null;
      })
      .addCase(updateUserIntent.fulfilled, (state, action) => {
        state.updateIntentLoading = false;
        state.updateIntentError = null;
        // The user object is already updated by saveUser dispatched in the thunk
      })
      .addCase(updateUserIntent.rejected, (state, action) => {
        state.updateIntentLoading = false;
        state.updateIntentError = action.payload;
      })
      // --- Fetch User Analytics Reducers ---
      .addCase(fetchUserAnalytics.pending, (state) => {
        state.userAnalyticsLoading = true;
        state.userAnalyticsError = null;
      })
      .addCase(fetchUserAnalytics.fulfilled, (state, action) => {
        state.userAnalyticsLoading = false;
        state.userAnalytics = action.payload;
        state.userAnalyticsError = null;
      })
      .addCase(fetchUserAnalytics.rejected, (state, action) => {
        state.userAnalyticsLoading = false;
        state.userAnalyticsError = action.payload;
        state.userAnalytics = null;
      })
      // --- Create Admin User Reducers ---
      .addCase(createAdminUserThunk.pending, (state) => {
        state.createAdminUserLoading = true;
        state.createAdminUserError = null;
        state.createAdminUserSuccess = false;
      })
      .addCase(createAdminUserThunk.fulfilled, (state, action) => {
        state.createAdminUserLoading = false;
        state.createAdminUserSuccess = true;
        state.createAdminUserError = null;
        // Optionally, you might want to add the newly created user to a list of users
        // if such a list is maintained in this slice, or just rely on a refetch.
      })
      .addCase(createAdminUserThunk.rejected, (state, action) => {
        state.createAdminUserLoading = false;
        state.createAdminUserError = action.payload;
        state.createAdminUserSuccess = false;
      })
      // --- Update Admin User Reducers ---
      .addCase(updateUserThunk.pending, (state) => {
        state.updateAdminUserLoading = true;
        state.updateAdminUserError = null;
        state.updateAdminUserSuccess = false;
      })
      .addCase(updateUserThunk.fulfilled, (state, action) => {
        state.updateAdminUserLoading = false;
        state.updateAdminUserSuccess = true;
        state.updateAdminUserError = null;
      })
      .addCase(updateUserThunk.rejected, (state, action) => {
        state.updateAdminUserLoading = false;
        state.updateAdminUserError = action.payload;
        state.updateAdminUserSuccess = false;
      })
      // --- Login Reducers ---
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isLoggedIn = false;
      })
      // --- Register Reducers ---
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Forgot Password Reducers ---
      .addCase(forgot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgot.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Reset Password Reducers ---
      .addCase(reset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reset.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(reset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Remove User Reducers ---
      .addCase(removeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Verify Code Reducers ---
      .addCase(verifyCode.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
        state.verificationSuccess = false;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.verificationLoading = false;
        state.verificationSuccess = true;
        state.verificationError = null;
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload;
        state.verificationSuccess = false;
      })
      // --- Resend Code Reducers ---
      .addCase(resendCode.pending, (state) => {
        state.resendLoading = true;
        state.resendError = null;
        state.resendSuccessMessage = null;
      })
      .addCase(resendCode.fulfilled, (state, action) => {
        state.resendLoading = false;
        state.resendSuccessMessage =
          action.payload.message || "Verification code resent.";
        state.resendError = null;
      })
      .addCase(resendCode.rejected, (state, action) => {
        state.resendLoading = false;
        state.resendError = action.payload;
        state.resendSuccessMessage = null;
      })
      // --- Fetch Service Providers Reducers (now part of userSlice) ---
      .addCase(fetchServiceProviders.pending, (state) => {
        state.serviceProvidersStatus = "loading";
        state.serviceProvidersError = null;
      })
      .addCase(fetchServiceProviders.fulfilled, (state, action) => {
        state.serviceProvidersStatus = "succeeded";
        // Assuming API response structure: { data: [providers], meta: { pagination } }
        // or { providers: [], pagination: {} }
        // or just an array of providers
        if (action.payload && Array.isArray(action.payload.data)) {
          state.serviceProviders = action.payload.data;
          if (action.payload.meta) {
            state.serviceProvidersPagination = {
              currentPage: action.payload.meta.currentPage || 1,
              totalPages: action.payload.meta.totalPages || 1,
              totalProviders: action.payload.meta.totalItems || 0,
              limit:
                action.payload.meta.perPage ||
                state.serviceProvidersPagination.limit,
            };
          }
        } else if (
          action.payload &&
          Array.isArray(action.payload.providers) &&
          action.payload.pagination
        ) {
          state.serviceProviders = action.payload.providers;
          state.serviceProvidersPagination = {
            currentPage: action.payload.pagination.currentPage || 1,
            totalPages: action.payload.pagination.totalPages || 1,
            totalProviders:
              action.payload.pagination.totalCount ||
              action.payload.pagination.totalProviders ||
              0,
            limit:
              action.payload.pagination.limit ||
              state.serviceProvidersPagination.limit,
          };
        } else if (Array.isArray(action.payload)) {
          state.serviceProviders = action.payload;
          // Reset pagination if only an array is returned without pagination info
          state.serviceProvidersPagination = {
            currentPage: 1,
            totalPages: 1,
            totalProviders: action.payload.length,
            limit: action.payload.length || 10,
          };
        } else {
          state.serviceProviders = []; // Fallback
        }
      })
      .addCase(fetchServiceProviders.rejected, (state, action) => {
        state.serviceProvidersStatus = "failed";
        state.serviceProvidersError =
          action.payload || "Failed to fetch service providers";
      });
  },
});

export const {
  saveUser,
  logout,
  clearAuthError,
  clearVerificationError,
  clearResendStatus,
  resetVerificationSuccess,
  clearUpdateIntentError, // New action
  // Export new provider-related actions
  clearServiceProvidersError,
  resetServiceProvidersStatus,
  clearServiceProvidersData,
} = userSlice.actions;

export default userSlice.reducer;

// --- Admin User Creation Selectors ---
export const selectCreateAdminUserLoading = (state) =>
  state.user.createAdminUserLoading;
export const selectCreateAdminUserError = (state) =>
  state.user.createAdminUserError;
export const selectCreateAdminUserSuccess = (state) =>
  state.user.createAdminUserSuccess;

export const selectUpdateAdminUserLoading = (state) =>
  state.user.updateAdminUserLoading;
export const selectUpdateAdminUserError = (state) =>
  state.user.updateAdminUserError;
export const selectUpdateAdminUserSuccess = (state) =>
  state.user.updateAdminUserSuccess;

// --- User Auth Selectors ---
export const selectUser = (state) => state.user.user;
export const selectIsLoggedIn = (state) => state.user.isLoggedIn;
export const selectAuthLoading = (state) => state.user.loading;
export const selectAuthError = (state) => state.user.error;

// --- User Intent Selectors ---
export const selectUpdateIntentLoading = (state) =>
  state.user.updateIntentLoading;
export const selectUpdateIntentError = (state) => state.user.updateIntentError;

// --- Email Verification Selectors ---
export const selectVerificationLoading = (state) =>
  state.user.verificationLoading;
export const selectVerificationError = (state) => state.user.verificationError;
export const selectVerificationSuccess = (state) =>
  state.user.verificationSuccess;
export const selectResendLoading = (state) => state.user.resendLoading;
export const selectResendError = (state) => state.user.resendError;
export const selectResendSuccessMessage = (state) =>
  state.user.resendSuccessMessage;

// --- Service Provider Fetching Selectors (now part of userSlice) ---
export const selectFetchedServiceProviders = (state) =>
  state.user.serviceProviders;
export const selectServiceProvidersFetchStatus = (state) =>
  state.user.serviceProvidersStatus;
export const selectServiceProvidersFetchError = (state) =>
  state.user.serviceProvidersError;
export const selectServiceProvidersFetchPagination = (state) =>
  state.user.serviceProvidersPagination;

// --- User Analytics Selectors ---
export const selectUserAnalytics = (state) => state.user.userAnalytics;
export const selectUserAnalyticsLoading = (state) =>
  state.user.userAnalyticsLoading;
export const selectUserAnalyticsError = (state) =>
  state.user.userAnalyticsError;

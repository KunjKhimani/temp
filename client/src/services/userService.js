// src/services/userService.js
import { API } from "./apis"; // We'll create/rename this next

// --- USER AUTH ---
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);
export const resetPassword = (data) => API.post("/auth/reset-password", data);

// --- EMAIL VERIFICATION ---
export const verifyEmailCode = (data) => API.post("/auth/verify-email", data);
export const resendVerificationCode = (data) =>
  API.post("/auth/resend-verification", data);

// --- USER PROFILE & MANAGEMENT ---
export const getUserById = (id) => API.get(`/user/${id}`); // Standardized to /users/:id
export const updateUserProfile = (id, data) => API.put(`/user/${id}`, data); // Standardized
export const deleteUserAccount = (id) => API.delete(`/user/${id}`); // Standardized and clearer name
export const removeUserDocument = (userId, docId) =>
  API.delete(`/user/${userId}/documents/${docId}`); // Standardized

// --- FETCHING SERVICE PROVIDERS (for Invite Modal) ---
export const getServiceProviders = (params = {}) => {
  // params: { searchTerm, limit, page }
  const queryParams = new URLSearchParams(params);
  return API.get(`/user/service-providers?${queryParams.toString()}`);
};

// --- ADMIN USER SPECIFIC ---
export const getUnverifiedSellersAdmin = (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return API.get(`/user/sellers/unverified?${queryParams.toString()}`); // Standardized
};

export const getVerifiedSellerUsersAdmin = (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return API.get(`/user/sellers/verified?${queryParams.toString()}`);
};
export const verifyUserAdmin = (id) => API.put(`/user/${id}/verify`); // Standardized path
export const getAllUsersAdmin = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  if (params.filters && typeof params.filters === "object") {
    for (const key in params.filters) {
      if (
        Object.prototype.hasOwnProperty.call(params.filters, key) &&
        params.filters[key] != null &&
        params.filters[key] !== ""
      ) {
        queryParams.append(key, params.filters[key]);
      }
    }
  }
  return API.get(`/user?${queryParams.toString()}`); // Standardized
};
export const createUserAdmin = (userData) =>
  API.post("/user/admin/create", userData); // Standardized

export const updateUserIntent = (id, data) =>
  API.put(`/user/${id}/intent`, data);

export const getUserProfile = (id) => API.get(`/user/${id}`); // Function to fetch user profile by ID

export const getUserAnalytics = () => API.get("/user/analytics");

export const checkUserContentExists = () => API.get("/user/has-content");

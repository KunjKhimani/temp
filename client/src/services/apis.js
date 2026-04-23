// services/apis.js
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const API = axios.create({ baseURL: BASE_URL });

// --- Axios Interceptors ---
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized request or token expired. Logging out.");
      // Do not redirect if on the /services page, as it should be publicly accessible
      if (
        window.location.pathname !== "/auth/signin" &&
        window.location.pathname !== "/services"
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("/auth/signin");
      }
    }
    return Promise.reject(error);
  }
);

// --- USER AUTH / PROFILE ---
const registerUser = (data) => API.post("/auth/register", data);
const loginUser = (data) => API.post("/auth/login", data);
const getUserById = (id) => API.get(`/user/${id}`); // Fetches public or own profile based on backend logic
const forgotPassword = (data) => API.post("/auth/forgot-password", data);
const resetPassword = (data) => API.post("/auth/reset-password", data);
const updateUserProfile = (id, data) => API.put(`/user/${id}`, data); // Updates user profile (self or admin)
const deleteUser = (id) => API.delete(`/user/${id}`); // Deletes a user (self or admin)
const removeDocument = (userId, docId) =>
  API.delete(`/user/${userId}/documents/${docId}`); // Removes a specific document

const checkUserContentExists = () => API.get("/user/has-content"); // New API call

// --- Admin User Specific ---
const getUnverifiedUsers = (params = {}) => {
  // Added params for potential pagination later
  const queryParams = new URLSearchParams(params);
  return API.get(`/user/sellers/unverified?${queryParams.toString()}`);
};
const verifyUser = (id) => API.put(`/user/verify/${id}`); // Admin verifies a seller
const getAllUsers = (params = {}) => {
  // Admin gets all users with filters/sort/pagination
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
  // console.log("Fetching users with params:", queryParams.toString()); // Keep for debugging if needed
  return API.get(`/user?${queryParams.toString()}`);
};
const createUser = (userData) => API.post("/user/admin/create", userData);
const deleteMultipleUsers = (userIds) =>
  API.delete("/user/admin/multiple", { data: { userIds } }); // Pass userIds in the request body for DELETE
const updateUserStatus = (id, status) => API.put(`/user/${id}/status`, { status });
const getVerifiedSellers = (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return API.get(`/user/sellers/verified?${queryParams.toString()}`);
};

const getSellersWithCommission = (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return API.get(`/admin/seller-commissions/sellers?${queryParams.toString()}`);
};

const setSellerCommission = (sellerId, data) =>
  API.post(`/admin/seller-commissions/${sellerId}/commission`, data);

const deleteSellerCommission = (sellerId) =>
  API.delete(`/admin/seller-commissions/${sellerId}/commission`);

// --- Email Verification Functions ---
const verifyEmailCode = (data) => API.post("/auth/verify-email", data); // Verify email using code
const resendVerificationCode = (data) =>
  API.post("/auth/resend-verification", data); // Resend verification code

// --- SERVICES ---
const getServices = (query) => API.get("/service", { params: query }); // Get services list (filtered/paginated)
const createService = (data) =>
  API.post("/service", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }); // Create a new service
const updateService = (id, data) => API.put(`/service/${id}`, data); // Update a service
const deleteService = (id) => API.delete(`/service/${id}`); // Delete a service
const getServiceById = (id) => API.get(`/service/${id}`); // Get details of a single service
const searchService = async (query, page = 1) => {
  // Search services
  try {
    const params = new URLSearchParams();
    for (const key in query) {
      const value = query[key];
      if (value != null && value !== "" && value !== "undefined") {
        params.append(key, value);
      }
    }
    params.append("page", page);
    const url = `/service/search?${params.toString()}`;
    // console.log("Calling API Endpoint [searchService]:", url);
    const response = await API.get(url);
    // console.log("Response data from searchService API:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error in searchService API call:",
      error.response?.data || error.message
    );
    throw error;
  }
};
const getLatestServices = () => API.get("/service/latest"); // Get latest services
const addReview = (serviceId, data) =>
  API.post(`/service/${serviceId}/reviews`, data); // Add review to a service (assuming route structure)

const getMyServices = (params = {}) => {
  // params for pagination { page, limit, status }
  const queryParams = new URLSearchParams(params);
  return API.get(`/service/my-services?${queryParams.toString()}`);
};

// --- ORDER ---
const createOrder = (data) => API.post("/order/create", data); // Create an order
const confirmPayment = (orderId, data) =>
  API.put(`/order/${orderId}/confirm`, data); // Confirm payment for an order
const getOrdersOfUser = (params = {}) => {
  // Get orders for the logged-in user (potentially filtered/paginated)
  const queryParams = new URLSearchParams(params);
  return API.get(`/order?${queryParams.toString()}`);
};
const getOrderById = (orderId) => API.get(`/order/${orderId}`); // Get single order details

// --- CHAT / CONVERSATIONS --- <--- NEW SECTION --->
const getConversations = () => API.get("/conversation"); // Get conversations for logged-in user
const createConversation = (data) => API.post("/conversation", data); // Create a new conversation { to: userId }
const getMessages = (conversationId) => API.get(`/message/${conversationId}`); // Get messages by conversation ID (composite ID)
const createMessage = (data) => API.post("/message", data); // Create message { conversationId, desc }
const markConversationAsRead = (conversationId) =>
  API.put(`/conversation/${conversationId}/read`);

// --- Exports ---
// Group exports logically

// User & Auth related
export {
  registerUser,
  loginUser,
  getUserById,
  forgotPassword,
  resetPassword,
  updateUserProfile,
  deleteUser,
  removeDocument,
  verifyEmailCode,
  resendVerificationCode,
  checkUserContentExists, // Export the new API function
};

// Admin related
export {
  getUnverifiedUsers,
  verifyUser,
  getAllUsers,
  createUser,
  deleteMultipleUsers,
  updateUserStatus,
  getVerifiedSellers,
  getSellersWithCommission,
  setSellerCommission,
  deleteSellerCommission,
};

// Service related
export {
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceById,
  searchService,
  getLatestServices,
  addReview,
  getMyServices,
};

// Order related
export { createOrder, confirmPayment, getOrdersOfUser, getOrderById };

// Chat related <--- NEW --->
export {
  getConversations,
  createConversation,
  getMessages,
  createMessage,
  markConversationAsRead,
};

// Promo Code related
export const getPromoCodes = (params = {}) => API.get("/promo-codes/admin", { params });
export const createPromoCode = (data) => API.post("/promo-codes/admin", data);
export const updatePromoCodeStatus = (id) => API.patch(`/promo-codes/admin/${id}/status`);
export const applyPromoCode = (code) => API.post("/promo-codes/apply", { code });
export const deletePromoCode = (id) => API.delete(`/promo-codes/admin/${id}`);

// Export the configured Axios instance if needed directly elsewhere
export { API };

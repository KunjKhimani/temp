// src/services/orderApi.js
import { API } from "./apis"; // Import the configured Axios instance

// --- ORDER API Calls ---

const getOrdersOfUser = (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return API.get(`/order?${queryParams.toString()}`);
};

const getOrderById = (orderId) => API.get(`/order/${orderId}`);

const createOrder = (data) => API.post("/order/create", data);

const confirmOrderPayment = (orderId, data) =>
  API.put(`/order/${orderId}/confirm-payment`, data);

const acceptOrder = (orderId) => API.put(`/order/${orderId}/accept`);

const proposeTimeChange = (orderId, data) =>
  API.post(`/order/${orderId}/propose-time-change`, data);

const confirmTimeProposal = (orderId, data) =>
  API.put(`/order/${orderId}/confirm-time-proposal`, data);

const declineOrder = (
  orderId,
  data // Seller declines
) => API.put(`/order/${orderId}/decline`, data);

const scheduleOrderSlot = (orderId, data) =>
  API.put(`/order/${orderId}/schedule`, data);

const markOrderInProgress = (orderId) =>
  API.put(`/order/${orderId}/in-progress`);

const markOrderCompleted = (orderId) => API.put(`/order/${orderId}/complete`);

const requestOrderRefund = (
  orderId,
  data // General dispute/refund
) => API.post(`/order/${orderId}/request-refund`, data);

const deleteOrder = (orderId) => API.delete(`/order/${orderId}`);

// --- NEW API Functions for Buyer's Choice Post-Decline ---
const processRefundPostDecline = (
  orderId // Buyer chooses refund after seller decline
) => API.post(`/order/${orderId}/process-refund-post-decline`);

const findAnotherSeller = (
  orderId // Buyer chooses to find another seller (placeholder for now)
) => API.post(`/order/${orderId}/find-another-seller`);
// ---

const reaffirmOriginalPreference = (orderId) =>
  API.put(`/order/${orderId}/reaffirm-preference`);

export const orderApi = {
  getOrdersOfUser,
  getOrderById,
  createOrder,
  confirmOrderPayment,
  acceptOrder,
  proposeTimeChange,
  confirmTimeProposal,
  declineOrder,
  scheduleOrderSlot,
  markOrderInProgress,
  markOrderCompleted,
  requestOrderRefund,
  deleteOrder,
  processRefundPostDecline, // << NEW
  findAnotherSeller, // << NEW
  reaffirmOriginalPreference,
};

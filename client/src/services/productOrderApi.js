// src/services/productOrderApi.js
import { API } from "./apis"; // Your configured Axios instance

// Create a new product order (buyer action)
const createProductOrder = (orderData) => {
  return API.post("/product-order/create", orderData);
};

// Confirm product order payment (buyer action)
const confirmProductOrderPayment = (orderId, paymentData) => {
  return API.put(`/product-order/${orderId}/confirm-payment`, paymentData);
};

// Get product orders for the logged-in user (can be buyer or seller)
const getMyProductOrders = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/product-order?${params.toString()}`);
};

// Get a single product order by its ID
const getProductOrderById = (orderId) => {
  return API.get(`/product-order/${orderId}`);
};

// --- Seller Actions ---
// Seller confirms they can fulfill the order
const sellerConfirmOrder = (orderId) => {
  return API.put(`/product-order/${orderId}/seller-confirm`);
};

// Seller declines the order (after payment)
const sellerDeclineOrder = (orderId, declineData) => {
  // declineData: { declineReason: "..." }
  return API.put(`/product-order/${orderId}/seller-decline`, declineData);
};

// Seller ships the order and provides tracking info
const sellerShipOrder = (orderId, shipmentData) => {
  // shipmentData: { trackingNumber: "...", shippingCarrier: "..." }
  return API.put(`/product-order/${orderId}/ship`, shipmentData);
};

// --- Buyer Actions ---
// Buyer marks the order as delivered
const buyerMarkOrderDelivered = (orderId) => {
  return API.put(`/product-order/${orderId}/delivered`);
};

// TODO: Add other actions as needed (cancel, dispute, refund request)

export const productOrderApi = {
  createProductOrder,
  confirmProductOrderPayment,
  getMyProductOrders,
  getProductOrderById,
  sellerConfirmOrder,
  sellerDeclineOrder,
  sellerShipOrder,
  buyerMarkOrderDelivered,
};

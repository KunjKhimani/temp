// src/store/thunks/productOrderThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { productOrderApi } from "../../services/productOrderApi";

// Create a new product order
export const createProductOrderThunk = createAsyncThunk(
  "productOrder/create",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await productOrderApi.createProductOrder(orderData);
      return response.data; // Expects { order: {}, clientSecret: "..." }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create product order" }
      );
    }
  }
);

// Confirm product order payment
export const confirmProductOrderPaymentThunk = createAsyncThunk(
  "productOrder/confirmPayment",
  async ({ orderId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await productOrderApi.confirmProductOrderPayment(
        orderId,
        paymentData
      );
      return response.data; // Expects { message: "...", order: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to confirm product order payment",
        }
      );
    }
  }
);

// Fetch product orders for the current user
export const fetchMyProductOrdersThunk = createAsyncThunk(
  "productOrder/fetchMyOrders",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await productOrderApi.getMyProductOrders(queryParams);
      return response.data; // Expects { orders: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch product orders" }
      );
    }
  }
);

// Fetch a single product order by ID
export const fetchProductOrderByIdThunk = createAsyncThunk(
  "productOrder/fetchById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await productOrderApi.getProductOrderById(orderId);
      return response.data; // Expects the order object
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch product order details",
        }
      );
    }
  }
);

// Seller confirms a product order
export const sellerConfirmProductOrderThunk = createAsyncThunk(
  "productOrder/sellerConfirm",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await productOrderApi.sellerConfirmOrder(orderId);
      return response.data; // Expects { message: "...", order: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to confirm product order" }
      );
    }
  }
);

// Seller declines a product order
export const sellerDeclineProductOrderThunk = createAsyncThunk(
  "productOrder/sellerDecline",
  async ({ orderId, declineData }, { rejectWithValue }) => {
    try {
      const response = await productOrderApi.sellerDeclineOrder(
        orderId,
        declineData
      );
      return response.data; // Expects { message: "...", order: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to decline product order" }
      );
    }
  }
);

// Seller ships a product order
export const sellerShipProductOrderThunk = createAsyncThunk(
  "productOrder/sellerShip",
  async ({ orderId, shipmentData }, { rejectWithValue }) => {
    try {
      const response = await productOrderApi.sellerShipOrder(
        orderId,
        shipmentData
      );
      return response.data; // Expects { message: "...", order: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update shipment details" }
      );
    }
  }
);

// Buyer marks a product order as delivered
export const buyerMarkProductOrderDeliveredThunk = createAsyncThunk(
  "productOrder/buyerMarkDelivered",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await productOrderApi.buyerMarkOrderDelivered(orderId);
      return response.data; // Expects { message: "...", order: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to mark order as delivered" }
      );
    }
  }
);

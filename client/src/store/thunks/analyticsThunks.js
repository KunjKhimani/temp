import { createAsyncThunk } from "@reduxjs/toolkit";
import * as analyticsService from "../../services/analyticsService";

export const fetchUserAnalytics = createAsyncThunk(
  "analytics/fetchUserAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getUserAnalytics();
      console.log("User Analytics Data:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching user analytics:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchConversationAnalytics = createAsyncThunk(
  "analytics/fetchConversationAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getConversationAnalytics();
      console.log("Conversation Analytics Data:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching conversation analytics:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchMessageAnalytics = createAsyncThunk(
  "analytics/fetchMessageAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getMessageAnalytics();
      console.log("Message Analytics Data:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching message analytics:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchServiceRequestAnalytics = createAsyncThunk(
  "analytics/fetchServiceRequestAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getServiceRequestAnalytics();
      console.log("Service Request Analytics Data:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching service request analytics:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchServiceAnalytics = createAsyncThunk(
  "analytics/fetchServiceAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getServiceAnalytics();
      console.log("Service Analytics Data:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching service analytics:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProductAnalytics = createAsyncThunk(
  "analytics/fetchProductAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getProductAnalytics();
      console.log("Product Analytics Data:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching product analytics:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchOrderAnalytics = createAsyncThunk(
  "analytics/fetchOrderAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getOrderAnalytics();
      console.log("Order Analytics Data:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching order analytics:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProductOrderAnalytics = createAsyncThunk(
  "analytics/fetchProductOrderAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getProductOrderAnalytics();
      console.log("Product Order Analytics Data:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching product order analytics:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAllAnalytics = () => async (dispatch) => {
  await Promise.all([
    dispatch(fetchUserAnalytics()),
    dispatch(fetchServiceRequestAnalytics()),
    dispatch(fetchProductAnalytics()),
    dispatch(fetchOrderAnalytics()),
    dispatch(fetchProductOrderAnalytics()),
    dispatch(fetchConversationAnalytics()),
    dispatch(fetchMessageAnalytics()),
    dispatch(fetchServiceAnalytics()),
  ]);
};

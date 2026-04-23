/* eslint-disable no-unused-vars */
// src/store/thunks/orderThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { orderApi } from "../../services/orderApi"; // Use the separated API module

export const fetchOrders = createAsyncThunk(
  "order/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderApi.getOrdersOfUser();
      return response.data;
    } catch (error) {
      console.error("Error fetching orders in thunk:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch orders" }
      );
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  "order/fetchOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderApi.getOrderById(orderId);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId} in thunk:`, error);
      return rejectWithValue(
        error.response?.data || { message: `Failed to fetch order ${orderId}` }
      );
    }
  }
);

export const acceptOrderThunk = createAsyncThunk(
  "order/acceptOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderApi.acceptOrder(orderId);
      return response.data;
    } catch (error) {
      console.error(`Error accepting order ${orderId} in thunk:`, error);
      return rejectWithValue(
        error.response?.data || { message: `Failed to accept order ${orderId}` }
      );
    }
  }
);

export const proposeTimeChangeThunk = createAsyncThunk(
  "order/proposeTimeChange",
  async (
    { orderId, proposedTimePreferences, sellerMessage },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderApi.proposeTimeChange(orderId, {
        proposedTimePreferences,
        sellerMessage,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to propose time change" }
      );
    }
  }
);

export const confirmTimeProposalThunk = createAsyncThunk(
  "order/confirmTimeProposal",
  async ({ orderId, acceptedTimePreference }, { rejectWithValue }) => {
    try {
      const response = await orderApi.confirmTimeProposal(orderId, {
        acceptedTimePreference,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to confirm time proposal" }
      );
    }
  }
);

export const declineOrderThunk = createAsyncThunk(
  "order/declineOrder",
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await orderApi.declineOrder(orderId, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error declining order ${orderId} in thunk:`, error);
      return rejectWithValue(
        error.response?.data || {
          message: `Failed to decline order ${orderId}`,
        }
      );
    }
  }
);

// MODIFIED scheduleOrderSlotThunk
export const scheduleOrderSlotThunk = createAsyncThunk(
  "order/scheduleSlot",
  async (payload, { rejectWithValue }) => {
    // Payload is now expected to be an object: { orderId, scheduleData, isReschedule }
    // as passed from OrderDetailPage:
    // const payload = {
    //   orderId: orderDetail._id,
    //   scheduleData: scheduleDataFromModal,
    //   isReschedule: isReschedulingModalOpen,
    // };
    const { orderId, scheduleData, isReschedule } = payload;
    try {
      // The backend expects the full payload (including isReschedule) as the second argument (data)
      const apiPayload = {
        scheduleData,
        isReschedule,
      };
      const response = await orderApi.scheduleOrderSlot(orderId, apiPayload);
      return response.data;
    } catch (error) {
      console.error(
        `Error ${
          isReschedule ? "rescheduling" : "scheduling"
        } slot for order ${orderId} in thunk:`,
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || {
          message: `Failed to ${
            isReschedule ? "reschedule" : "schedule"
          } slot for order ${orderId}`,
        }
      );
    }
  }
);
// END MODIFIED scheduleOrderSlotThunk

export const markOrderInProgressThunk = createAsyncThunk(
  "order/markInProgress",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderApi.markOrderInProgress(orderId);
      return response.data;
    } catch (error) {
      console.error(`Error marking order ${orderId} in-progress:`, error);
      return rejectWithValue(
        error.response?.data || { message: `Failed to mark order in-progress` }
      );
    }
  }
);

export const markOrderCompletedThunk = createAsyncThunk(
  "order/markCompleted",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderApi.markOrderCompleted(orderId);
      return response.data;
    } catch (error) {
      console.error(`Error marking order ${orderId} completed:`, error);
      return rejectWithValue(
        error.response?.data || { message: `Failed to mark order completed` }
      );
    }
  }
);

export const requestOrderRefundThunk = createAsyncThunk(
  "order/requestRefund",
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await orderApi.requestOrderRefund(orderId, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error requesting refund for order ${orderId}:`, error);
      return rejectWithValue(
        error.response?.data || { message: `Failed to request refund` }
      );
    }
  }
);

export const deleteOrderThunk = createAsyncThunk(
  "order/deleteOrder",
  async (orderId, { rejectWithValue, dispatch }) => {
    try {
      const response = await orderApi.deleteOrder(orderId);
      return { orderId, message: response.data.message };
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      return rejectWithValue(
        error.response?.data || { message: `Failed to delete order` }
      );
    }
  }
);

// --- NEW Thunks for Buyer's Choice Post-Decline ---
export const processRefundPostDeclineThunk = createAsyncThunk(
  "order/processRefundPostDecline",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderApi.processRefundPostDecline(orderId);
      return response.data; // Expects { message: "...", order: updatedOrder }
    } catch (error) {
      console.error(
        `Error processing refund post-decline for order ${orderId}:`,
        error
      );
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to process refund post-decline",
        }
      );
    }
  }
);

export const findAnotherSellerThunk = createAsyncThunk(
  "order/findAnotherSeller",
  async (orderId, { rejectWithValue }) => {
    try {
      // For now, this backend endpoint might just return a success message
      // and the actual navigation to search will happen in the component.
      const response = await orderApi.findAnotherSeller(orderId);
      return response.data; // Expects { message: "...", order: updatedOrder (maybe unchanged status) }
    } catch (error) {
      console.error(
        `Error initiating 'find another seller' for order ${orderId}:`,
        error
      );
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to initiate find another seller process",
        }
      );
    }
  }
);

export const reaffirmOriginalPreferenceThunk = createAsyncThunk(
  "order/reaffirmOriginalPreference",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderApi.reaffirmOriginalPreference(orderId);
      return response.data; // Expects { message: "...", order: updatedOrder }
    } catch (error) {
      console.error(
        `Error reaffirming preference for order ${orderId}:`,
        error
      );
      return rejectWithValue(
        error.response?.data || { message: "Failed to reaffirm preference" }
      );
    }
  }
);

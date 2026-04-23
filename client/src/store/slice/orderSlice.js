// src/store/slice/orderSlice.js
import { createSlice } from "@reduxjs/toolkit";
// NEW: Import thunks from the dedicated file
import {
  fetchOrders,
  fetchOrderById,
  acceptOrderThunk,
  declineOrderThunk,
  scheduleOrderSlotThunk,
  deleteOrderThunk,
  requestOrderRefundThunk,
  markOrderInProgressThunk,
  markOrderCompletedThunk,
  proposeTimeChangeThunk,
  confirmTimeProposalThunk,
  processRefundPostDeclineThunk,
  findAnotherSellerThunk,
  reaffirmOriginalPreferenceThunk,
} from "../thunks/orderThunks";

const initialPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10,
};

const initialState = {
  orders: [], // List view
  pagination: { ...initialPagination },
  listStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  listError: null,

  currentOrderDetail: null, // Detail view
  orderStatus: "idle", // Status for detail view actions: 'idle' | 'loading' | 'succeeded' | 'failed'
  orderError: null,

  // Status specifically for update actions (accept/decline) on the current detail
  updateStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  updateError: null,

  // Keep if still used elsewhere, otherwise consider removing
  // currentOrder: null,
};

// Helper function to update order in both list and detail view
const updateOrderInState = (state, updatedOrder) => {
  if (state.currentOrderDetail?._id === updatedOrder?._id) {
    state.currentOrderDetail = {
      ...state.currentOrderDetail,
      ...updatedOrder,
    };
  }
  const listIndex = state.orders.findIndex((o) => o._id === updatedOrder?._id);
  if (listIndex !== -1) {
    state.orders[listIndex] = {
      ...state.orders[listIndex],
      ...updatedOrder,
    };
  }
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearOrderDetailState: (state) => {
      state.currentOrderDetail = null;
      state.orderStatus = "idle";
      state.orderError = null;
      state.updateStatus = "idle"; // Also reset update status
      state.updateError = null;
    },
    clearOrderErrors: (state) => {
      state.listError = null;
      state.orderError = null;
      state.updateError = null;
    },
    // addOrder: (state, action) => { // Usually handled by fetchOrders now
    //   state.orders.push(action.payload);
    // },
    // NEW: Reducer to update order status locally (e.g., from socket event)
    updateOrderStatusLocally: (state, action) => {
      const { orderId, status } = action.payload;
      // Update in the list if present
      const listIndex = state.orders.findIndex((o) => o._id === orderId);
      if (listIndex !== -1) {
        state.orders[listIndex].status = status;
      }
      // Update in the detail view if it's the current one
      if (state.currentOrderDetail?._id === orderId) {
        state.currentOrderDetail.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Orders List ---
      .addCase(fetchOrders.pending, (state) => {
        state.listStatus = "loading"; // Use listStatus
        state.listError = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        // Extract orders from action.payload.data.orders due to backend response structure
        state.orders = action.payload.data?.orders || [];
        state.pagination = action.payload.pagination || { ...initialPagination };
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload?.message || "Failed to fetch orders";
      })

      // --- Fetch Single Order Detail ---
      .addCase(fetchOrderById.pending, (state) => {
        state.orderStatus = "loading";
        state.currentOrderDetail = null;
        state.orderError = null;
        state.updateStatus = "idle"; // Reset update status on new fetch
        state.updateError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.orderStatus = "succeeded";
        state.currentOrderDetail = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.orderError =
          action.payload?.message || "Failed to fetch order details";
        state.currentOrderDetail = null;
      })

      // --- Accept Order ---
      .addCase(acceptOrderThunk.pending, (state) => {
        state.updateStatus = "loading"; // Use updateStatus for the action
        state.updateError = null;
      })
      .addCase(acceptOrderThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        // Update the current order detail if it's the one being viewed
        if (state.currentOrderDetail?._id === action.payload.order?._id) {
          state.currentOrderDetail = {
            ...state.currentOrderDetail,
            ...action.payload.order,
          };
        }
        // Also update the order in the main list if it exists there
        const index = state.orders.findIndex(
          (o) => o._id === action.payload.order?._id
        );
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload.order,
          };
        }
      })
      .addCase(acceptOrderThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload?.message || "Failed to accept order";
      })
      // --- Propose Time Change (Seller) ---
      .addCase(proposeTimeChangeThunk.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(proposeTimeChangeThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        updateOrderInState(state, action.payload.order); // Use helper
      })
      .addCase(proposeTimeChangeThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError =
          action.payload?.message || "Failed to propose time change";
      })

      // --- Confirm Time Proposal (Buyer) ---
      .addCase(confirmTimeProposalThunk.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(confirmTimeProposalThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        updateOrderInState(state, action.payload.order); // Use helper
      })
      .addCase(confirmTimeProposalThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError =
          action.payload?.message || "Failed to confirm time proposal";
      })

      // --- Process Refund Post Seller Decline (Buyer Action) ---
      .addCase(processRefundPostDeclineThunk.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(processRefundPostDeclineThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        updateOrderInState(state, action.payload.order); // Order status should now be 'buyer-cancelled-post-decline' or 'refunded'
      })
      .addCase(processRefundPostDeclineThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError =
          action.payload?.message || "Failed to process refund.";
      })

      // --- Find Another Seller (Buyer Action Post Decline - Placeholder for now) ---
      .addCase(findAnotherSellerThunk.pending, (state) => {
        state.updateStatus = "loading"; // Or a different status like 'reassigningStatus'
        state.updateError = null;
      })
      .addCase(findAnotherSellerThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        // The order object might or might not have its status changed by the backend here.
        // If backend changes status to 'buyer-requested-reassignment', update it.
        if (action.payload.order) {
          updateOrderInState(state, action.payload.order);
        }
        // Further logic (like navigation) will be in the component.
      })
      .addCase(findAnotherSellerThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload?.message || "Action failed.";
      })

      // --- Decline Order ---
      .addCase(declineOrderThunk.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(declineOrderThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        if (state.currentOrderDetail?._id === action.payload.order?._id) {
          state.currentOrderDetail = {
            ...state.currentOrderDetail,
            ...action.payload.order,
          };
        }
        const index = state.orders.findIndex(
          (o) => o._id === action.payload.order?._id
        );
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload.order,
          };
        }
      })
      .addCase(declineOrderThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError =
          action.payload?.message || "Failed to decline order";
      })
      .addCase(scheduleOrderSlotThunk.pending, (state) => {
        state.updateStatus = "loading"; // Can reuse updateStatus or have a specific scheduleStatus
        state.updateError = null;
      })
      .addCase(scheduleOrderSlotThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        if (state.currentOrderDetail?._id === action.payload.order?._id) {
          state.currentOrderDetail = {
            ...state.currentOrderDetail,
            ...action.payload.order,
          };
        }
        const index = state.orders.findIndex(
          (o) => o._id === action.payload.order?._id
        );
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload.order,
          };
        }
      })
      .addCase(scheduleOrderSlotThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError =
          action.payload?.message || "Failed to schedule order slot";
      })
      // --- Mark Order In Progress ---
      .addCase(markOrderInProgressThunk.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(markOrderInProgressThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        updateOrderInState(state, action.payload.order);
      })
      .addCase(markOrderInProgressThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload?.message || "Action failed";
      })

      // --- Mark Order Completed ---
      .addCase(markOrderCompletedThunk.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(markOrderCompletedThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        updateOrderInState(state, action.payload.order);
      })
      .addCase(markOrderCompletedThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload?.message || "Action failed";
      })

      // --- Request Order Refund ---
      .addCase(requestOrderRefundThunk.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(requestOrderRefundThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        updateOrderInState(state, action.payload.order);
      })
      .addCase(requestOrderRefundThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload?.message || "Action failed";
      })

      // --- Delete Order ---
      .addCase(deleteOrderThunk.pending, (state) => {
        state.updateStatus = "loading"; // Or a specific deleteStatus
        state.updateError = null;
      })
      .addCase(deleteOrderThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        // Remove from orders list
        state.orders = state.orders.filter(
          (order) => order._id !== action.payload.orderId
        );
        // Clear detail if it was the one deleted
        if (state.currentOrderDetail?._id === action.payload.orderId) {
          state.currentOrderDetail = null;
          state.orderStatus = "idle";
        }
        // Potentially navigate away in the component after this
      })
      .addCase(deleteOrderThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload?.message || "Failed to delete order";
      })

      // --- Buyer Reaffirms Original Preference ---
      .addCase(reaffirmOriginalPreferenceThunk.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(reaffirmOriginalPreferenceThunk.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        updateOrderInState(state, action.payload.order); // Order status should be 'awaiting-seller-confirmation'
      })
      .addCase(reaffirmOriginalPreferenceThunk.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError =
          action.payload?.message || "Failed to reaffirm preference.";
      });
  },
});

// --- Exports ---
export const {
  clearOrderDetailState,
  clearOrderErrors,
  updateOrderStatusLocally, // Export new reducer
  setCurrentOrder,
} = orderSlice.actions;
export default orderSlice.reducer;

// --- Selectors ---
export const selectOrders = (state) => state.order.orders?.data?.orders || [];
export const selectOrdersListStatus = (state) => state.order.listStatus;
export const selectOrdersListError = (state) => state.order.listError;
export const selectOrderPagination = (state) => state.order.pagination;

export const selectCurrentOrderDetail = (state) =>
  state.order.currentOrderDetail;
export const selectOrderStatus = (state) => state.order.orderStatus;
export const selectOrderError = (state) => state.order.orderError;

export const selectOrderUpdateStatus = (state) => state.order.updateStatus; // Selector for accept/decline status
export const selectOrderUpdateError = (state) => state.order.updateError; // Selector for accept/decline error

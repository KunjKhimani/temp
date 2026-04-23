// src/store/slice/productOrderSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  createProductOrderThunk,
  confirmProductOrderPaymentThunk,
  fetchMyProductOrdersThunk,
  fetchProductOrderByIdThunk,
  sellerConfirmProductOrderThunk,
  sellerDeclineProductOrderThunk,
  sellerShipProductOrderThunk,
  buyerMarkProductOrderDeliveredThunk,
} from "../thunks/productOrderThunks";

const initialPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10,
};

const initialState = {
  // For listing product orders (e.g., "My Product Orders" page)
  orders: [],
  pagination: { ...initialPagination },
  listStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  listError: null,

  // For viewing a single product order detail
  currentOrder: null,
  detailStatus: "idle",
  detailError: null,

  // For actions on orders (create, confirm payment, seller actions, etc.)
  actionStatus: "idle", // Status for the LAST action performed
  actionError: null,
  createdOrderData: null, // To store { order, clientSecret } from createProductOrderThunk
};

const productOrderSlice = createSlice({
  name: "productOrder",
  initialState,
  reducers: {
    clearProductOrderDetailState: (state) => {
      state.currentOrder = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
    clearProductOrderActionState: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    clearProductOrderListState: (state) => {
      state.orders = [];
      state.pagination = { ...initialPagination };
      state.listStatus = "idle";
      state.listError = null;
    },
    clearCreatedProductOrderData: (state) => {
      state.createdOrderData = null;
    },
  },
  extraReducers: (builder) => {
    // Helper function to handle pending, rejected for actions
    const handleActionPending = (state) => {
      state.actionStatus = "loading";
      state.actionError = null;
    };
    const handleActionRejected = (state, action) => {
      state.actionStatus = "failed";
      state.actionError = action.payload?.message || "An action failed";
    };
    // Helper function to handle fulfilled for actions that update currentOrder or list
    const handleActionFulfillment = (state, action) => {
      state.actionStatus = "succeeded";
      const updatedOrder = action.payload.order; // Assuming backend returns { order: {} }
      if (updatedOrder) {
        if (state.currentOrder?._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
        state.orders = state.orders.map((o) =>
          o._id === updatedOrder._id ? updatedOrder : o
        );
      }
    };

    builder
      // --- Create Product Order ---
      .addCase(createProductOrderThunk.pending, handleActionPending)
      .addCase(createProductOrderThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.createdOrderData = action.payload; // { order, clientSecret }
      })
      .addCase(createProductOrderThunk.rejected, handleActionRejected)

      // --- Confirm Product Order Payment ---
      .addCase(confirmProductOrderPaymentThunk.pending, handleActionPending)
      .addCase(
        confirmProductOrderPaymentThunk.fulfilled,
        handleActionFulfillment
      )
      .addCase(confirmProductOrderPaymentThunk.rejected, handleActionRejected)

      // --- Fetch My Product Orders (List) ---
      .addCase(fetchMyProductOrdersThunk.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchMyProductOrdersThunk.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.orders = action.payload.orders || [];
        state.pagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(fetchMyProductOrdersThunk.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError =
          action.payload?.message || "Failed to fetch product orders";
      })

      // --- Fetch Single Product Order by ID ---
      .addCase(fetchProductOrderByIdThunk.pending, (state) => {
        state.detailStatus = "loading";
        state.currentOrder = null; // Clear previous before fetching new
        state.detailError = null;
      })
      .addCase(fetchProductOrderByIdThunk.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.currentOrder = action.payload; // Assumes payload is the order object
      })
      .addCase(fetchProductOrderByIdThunk.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError =
          action.payload?.message || "Failed to fetch product order details";
      })

      // --- Seller Confirm Order ---
      .addCase(sellerConfirmProductOrderThunk.pending, handleActionPending)
      .addCase(
        sellerConfirmProductOrderThunk.fulfilled,
        handleActionFulfillment
      )
      .addCase(sellerConfirmProductOrderThunk.rejected, handleActionRejected)

      // --- Seller Decline Order ---
      .addCase(sellerDeclineProductOrderThunk.pending, handleActionPending)
      .addCase(
        sellerDeclineProductOrderThunk.fulfilled,
        handleActionFulfillment
      )
      .addCase(sellerDeclineProductOrderThunk.rejected, handleActionRejected)

      // --- Seller Ship Order ---
      .addCase(sellerShipProductOrderThunk.pending, handleActionPending)
      .addCase(sellerShipProductOrderThunk.fulfilled, handleActionFulfillment)
      .addCase(sellerShipProductOrderThunk.rejected, handleActionRejected)

      // --- Buyer Mark Order Delivered ---
      .addCase(buyerMarkProductOrderDeliveredThunk.pending, handleActionPending)
      .addCase(
        buyerMarkProductOrderDeliveredThunk.fulfilled,
        handleActionFulfillment
      )
      .addCase(
        buyerMarkProductOrderDeliveredThunk.rejected,
        handleActionRejected
      );
  },
});

export const {
  clearProductOrderDetailState,
  clearProductOrderActionState,
  clearProductOrderListState,
  clearCreatedProductOrderData,
} = productOrderSlice.actions;

// Selectors
export const selectProductOrderList = (state) => state.productOrder.orders;
export const selectProductOrderPagination = (state) =>
  state.productOrder.pagination;
export const selectProductOrderListStatus = (state) =>
  state.productOrder.listStatus;
export const selectProductOrderListError = (state) =>
  state.productOrder.listError;

export const selectCurrentProductOrder = (state) =>
  state.productOrder.currentOrder;
export const selectProductOrderDetailStatus = (state) =>
  state.productOrder.detailStatus;
export const selectProductOrderDetailError = (state) =>
  state.productOrder.detailError;

export const selectProductOrderActionStatus = (state) =>
  state.productOrder.actionStatus;
export const selectProductOrderActionError = (state) =>
  state.productOrder.actionError;
export const selectCreatedProductOrderData = (state) =>
  state.productOrder.createdOrderData;

export default productOrderSlice.reducer;

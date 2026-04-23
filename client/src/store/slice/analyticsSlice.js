import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUserAnalytics,
  fetchConversationAnalytics,
  fetchMessageAnalytics,
  fetchServiceRequestAnalytics,
  fetchServiceAnalytics,
  fetchProductAnalytics,
  fetchOrderAnalytics,
  fetchProductOrderAnalytics,
} from "../thunks/analyticsThunks";

const initialState = {
  user: { data: [], loading: false, error: null },
  conversation: { data: [], loading: false, error: null },
  message: { data: [], loading: false, error: null },
  serviceRequest: { data: [], loading: false, error: null },
  service: { data: [], loading: false, error: null },
  product: { data: [], loading: false, error: null },
  order: { data: [], loading: false, error: null },
  productOrder: { data: [], loading: false, error: null },
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // User Analytics
      .addCase(fetchUserAnalytics.pending, (state) => {
        state.user.loading = true;
        state.user.error = null;
      })
      .addCase(fetchUserAnalytics.fulfilled, (state, action) => {
        state.user.loading = false;
        state.user.data = action.payload;
      })
      .addCase(fetchUserAnalytics.rejected, (state, action) => {
        state.user.loading = false;
        state.user.error = action.payload;
      })
      // Conversation Analytics
      .addCase(fetchConversationAnalytics.pending, (state) => {
        state.conversation.loading = true;
        state.conversation.error = null;
      })
      .addCase(fetchConversationAnalytics.fulfilled, (state, action) => {
        state.conversation.loading = false;
        state.conversation.data = action.payload;
      })
      .addCase(fetchConversationAnalytics.rejected, (state, action) => {
        state.conversation.loading = false;
        state.conversation.error = action.payload;
      })
      // Message Analytics
      .addCase(fetchMessageAnalytics.pending, (state) => {
        state.message.loading = true;
        state.message.error = null;
      })
      .addCase(fetchMessageAnalytics.fulfilled, (state, action) => {
        state.message.loading = false;
        state.message.data = action.payload;
      })
      .addCase(fetchMessageAnalytics.rejected, (state, action) => {
        state.message.loading = false;
        state.message.error = action.payload;
      })
      // Service Request Analytics
      .addCase(fetchServiceRequestAnalytics.pending, (state) => {
        state.serviceRequest.loading = true;
        state.serviceRequest.error = null;
      })
      .addCase(fetchServiceRequestAnalytics.fulfilled, (state, action) => {
        state.serviceRequest.loading = false;
        state.serviceRequest.data = action.payload;
      })
      .addCase(fetchServiceRequestAnalytics.rejected, (state, action) => {
        state.serviceRequest.loading = false;
        state.serviceRequest.error = action.payload;
      })
      // Service Analytics
      .addCase(fetchServiceAnalytics.pending, (state) => {
        state.service.loading = true;
        state.service.error = null;
      })
      .addCase(fetchServiceAnalytics.fulfilled, (state, action) => {
        state.service.loading = false;
        state.service.data = action.payload;
      })
      .addCase(fetchServiceAnalytics.rejected, (state, action) => {
        state.service.loading = false;
        state.service.error = action.payload;
      })
      // Product Analytics
      .addCase(fetchProductAnalytics.pending, (state) => {
        state.product.loading = true;
        state.product.error = null;
      })
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        state.product.loading = false;
        state.product.data = action.payload;
      })
      .addCase(fetchProductAnalytics.rejected, (state, action) => {
        state.product.loading = false;
        state.product.error = action.payload;
      })
      // Order Analytics
      .addCase(fetchOrderAnalytics.pending, (state) => {
        state.order.loading = true;
        state.order.error = null;
      })
      .addCase(fetchOrderAnalytics.fulfilled, (state, action) => {
        state.order.loading = false;
        state.order.data = action.payload;
      })
      .addCase(fetchOrderAnalytics.rejected, (state, action) => {
        state.order.loading = false;
        state.order.error = action.payload;
      })
      // Product Order Analytics
      .addCase(fetchProductOrderAnalytics.pending, (state) => {
        state.productOrder.loading = true;
        state.productOrder.error = null;
      })
      .addCase(fetchProductOrderAnalytics.fulfilled, (state, action) => {
        state.productOrder.loading = false;
        state.productOrder.data = action.payload;
      })
      .addCase(fetchProductOrderAnalytics.rejected, (state, action) => {
        state.productOrder.loading = false;
        state.productOrder.error = action.payload;
      });
  },
});

export default analyticsSlice.reducer;

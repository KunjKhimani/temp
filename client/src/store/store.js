// store.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/userSlice";
import serviceReducer from "./slice/serviceSlice";
import profileReducer from "./slice/profileSlice";
import orderReducer from "./slice/orderSlice";
import adminReducer from "./slice/adminSlice";
import chatReducer from "./slice/chatSlice";
import notificationReducer from "./slice/notificationSlice";
import productReducer from "./slice/productSlice";
import productOrderSlice from "./slice/productOrderSlice";
import serviceRequestSlice from "./slice/serviceRequestSlice";
import snackbarSlice from "./slice/snackbarSlice";
import requestedProductReducer from "./slice/requestedProductSlice";
import analyticsReducer from "./slice/analyticsSlice";
import adminServiceReducer from "./adminServiceSlice"; // Import the new adminServiceSlice
import adminOrdersReducer from "./slice/adminOrderSlice"; // Import the new adminOrderSlice
import adminServiceRequestReducer from "./slice/adminServiceRequestSlice"; // NEW: Admin Service Request Slice
import adminProductReducer from "./slice/adminProductSlice"; // NEW: Admin Product Slice
import adminRequestedProductReducer from "./slice/adminRequestedProductSlice"; // NEW: Admin Requested Product Slice
import adminPromotionReducer from "./slice/adminPromotionSlice";
import adminReviewReducer from "./slice/adminReviewSlice";
import navigationReducer from "./slice/navigationSlice"; // NEW: Navigation Slice
import specialOfferReducer from "./slice/specialOfferSlice";
import communityOfferReducer from "./slice/communityOfferSlice";
import { userApi } from "../services/userApi";
import { adminServiceRequestApi } from "../services/adminServiceRequestApi"; // NEW: Admin Service Request API


export const store = configureStore({
  reducer: {
    user: userReducer,
    service: serviceReducer,
    profile: profileReducer,
    order: orderReducer,
    product: productReducer,
    productOrder: productOrderSlice,
    admin: adminReducer,
    chat: chatReducer,
    notification: notificationReducer,
    serviceRequest: serviceRequestSlice,
    snackbar: snackbarSlice,
    requestedProduct: requestedProductReducer,
    analytics: analyticsReducer,
    adminServices: adminServiceReducer, // Add the new adminServiceReducer
    adminOrders: adminOrdersReducer, // Add the new adminOrdersReducer
    adminServiceRequests: adminServiceRequestReducer, // NEW: Admin Service Request Reducer
    adminProducts: adminProductReducer, // NEW: Admin Product Reducer
    adminRequestedProducts: adminRequestedProductReducer, // NEW: Admin Requested Product Reducer
    adminPromotion: adminPromotionReducer,
    adminReviews: adminReviewReducer,
    navigation: navigationReducer, // NEW: Navigation Reducer
    specialOffer: specialOfferReducer,
    communityOffer: communityOfferReducer,
    [userApi.reducerPath]: userApi.reducer,
    [adminServiceRequestApi.reducerPath]: adminServiceRequestApi.reducer, // NEW: Admin Service Request API Reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types to avoid serializable check warnings for RTK Query
        ignoredActions: [
          "userApi/executeQuery/fulfilled",
          "userApi/mutation/fulfilled",
          "adminServiceRequestApi/executeQuery/fulfilled", // NEW: Ignore for adminServiceRequestApi
          "adminServiceRequestApi/mutation/fulfilled", // NEW: Ignore for adminServiceRequestApi
        ],
      },
    })
      .concat(userApi.middleware)
      .concat(adminServiceRequestApi.middleware), // NEW: Add adminServiceRequestApi middleware
  devTools: import.meta.env.REACT_APP_ENV !== "production", // Enable dev tools only in development1
});

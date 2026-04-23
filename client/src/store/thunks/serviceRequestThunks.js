// src/store/thunks/serviceRequestThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { serviceRequestApi } from "../../services/serviceRequestApi";

// Create a service request
export const createServiceRequestThunk = createAsyncThunk(
  "serviceRequest/create",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.createServiceRequest(formData); // Assuming this API call exists

      // IMPORTANT: Check if the backend signaled an error even with a 2xx status
      // This depends on your backend's response structure for such cases.
      // If your backend wraps errors in a specific way even on 2xx, handle it here.
      // For instance, if `response.data.success === false` or `response.data.error` exists
      if (response.data && response.data.message === "Unexpected field") {
        // Or a more generic error check
        return rejectWithValue(response.data); // Pass the backend's error message along
      }
      if (response.data && response.data.error) {
        // Another common pattern
        return rejectWithValue(response.data.error);
      }

      return response.data; // Expected: { message: "...", serviceRequest: newServiceRequest }
    } catch (error) {
      // This catches network errors or 4xx/5xx responses from axios
      console.error("Error in createServiceRequestThunk API call:", error);
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to create service request via API",
        }
      );
    }
  }
);

// Fetch service requests created by the current user
export const fetchMyServiceRequestsThunk = createAsyncThunk(
  "serviceRequest/fetchMyRequests",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.getMyServiceRequests(
        queryParams
      );
      return response.data; // Expects { serviceRequests: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch your service requests",
        }
      );
    }
  }
);

// Search for open service requests based on criteria
export const searchServiceRequestsThunk = createAsyncThunk(
  "serviceRequest/searchRequests", // <<< Distinct action type for search
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      // This will call the same backend endpoint as fetchOpenServiceRequestsThunk,
      // but the backend controller will apply filters based on queryParams.
      const response = await serviceRequestApi.getOpenServiceRequests(
        queryParams
      );
      return response.data; // Expects { serviceRequests: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to search service requests" }
      );
    }
  }
);

// Fetch all open service requests (for sellers/public browsing)
export const fetchOpenServiceRequestsThunk = createAsyncThunk(
  "serviceRequest/fetchOpenRequests",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.getOpenServiceRequests(
        queryParams
      );
      return response.data; // Expects { serviceRequests: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch open service requests",
        }
      );
    }
  }
);

// Fetch a single service request by its ID
export const fetchServiceRequestByIdThunk = createAsyncThunk(
  "serviceRequest/fetchById",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.getServiceRequestById(requestId);
      return response.data; // Expects the serviceRequest object
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch service request details",
        }
      );
    }
  }
);

// Update a service request
export const updateServiceRequestThunk = createAsyncThunk(
  "serviceRequest/update",
  async ({ requestId, formData }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.updateServiceRequest(
        requestId,
        formData
      );
      return response.data; // Expects { message, serviceRequest }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update service request" }
      );
    }
  }
);

// Delete a service request (permanent removal)
export const deleteServiceRequestThunk = createAsyncThunk(
  "serviceRequest/delete",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.deleteServiceRequest(requestId);
      return { requestId, ...response.data }; // Return requestId for removal from list, and message
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete service request" }
      );
    }
  }
);

// Close a service request (status change to 'closed')
export const closeServiceRequestThunk = createAsyncThunk(
  "serviceRequest/close",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.closeServiceRequest(requestId);
      return { requestId, ...response.data }; // Return requestId and updated service request data
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to close service request" }
      );
    }
  }
);

// --- Seller Actions (Phase 2) ---
// Seller claims a service request (initiates platform fee payment)
export const sellerClaimServiceRequestThunk = createAsyncThunk(
  "serviceRequest/sellerClaim",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.sellerClaimServiceRequest(
        requestId
      );
      // Expects { message, platformFeeOrder: {...}, clientSecret, serviceRequestTitle, serviceRequestId }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to claim service request" }
      );
    }
  }
);

// Seller confirms payment for the platform lead fee
export const sellerConfirmLeadFeePaymentThunk = createAsyncThunk(
  "serviceRequest/sellerConfirmFeePayment",
  async ({ platformFeeOrderId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.sellerConfirmLeadFeePayment(
        platformFeeOrderId,
        paymentData
      );
      // Expects { message, serviceRequest, platformFeeOrder }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to confirm lead fee payment",
        }
      );
    }
  }
);

// --- NEW: Confirm Promotion Payment Thunk ---
export const confirmPromotionPaymentThunk = createAsyncThunk(
  "serviceRequest/confirmPromotionPayment",
  async (
    { serviceRequestId, paymentIntentId, sourceId, idempotencyKey },
    { rejectWithValue }
  ) => {
    try {
      const response = await serviceRequestApi.confirmPromotionPayment(
        serviceRequestId,
        paymentIntentId,
        sourceId,
        idempotencyKey
      );
      // Expects { message: "...", serviceRequest: updatedServiceRequest }
      return response.data;
    } catch (error) {
      console.error("Error in confirmPromotionPaymentThunk:", error);
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to confirm promotion payment.",
        }
      );
    }
  }
);

// --- NEW: Verify Promotion Payment Thunk (for return_url page) ---
export const verifyPromotionPaymentThunk = createAsyncThunk(
  "serviceRequest/verifyPromotionPayment",
  async ({ paymentIntentId, clientSecret }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.verifyPromotionPayment(
        paymentIntentId,
        clientSecret
      );
      // Backend should respond with: { success: true, status: 'succeeded' | 'processing' | 'failed', serviceRequestId: '...', message?: '...' }
      return response.data;
    } catch (error) {
      console.error("Error in verifyPromotionPaymentThunk:", error);
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to verify promotion payment status.",
        }
      );
    }
  }
);

// --- NEW THUNKS ---

// Buyer invites providers to a service request
export const inviteProvidersToRequestThunk = createAsyncThunk(
  "serviceRequest/inviteProviders",
  async ({ requestId, providerIds }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.inviteProvidersToRequest(
        requestId,
        providerIds
      );
      return response.data; // Expects { message, serviceRequest }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to send invitations." }
      );
    }
  }
);

// Fetch all offers for a specific service request
export const fetchOffersForRequestThunk = createAsyncThunk(
  "serviceRequest/fetchOffers",
  async ({ requestId, queryParams = {} }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.getOffersForRequest(
        requestId,
        queryParams
      );
      return response.data; // Expects { offers: [], serviceRequestTitle, serviceRequestStatus }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch offers for this request.",
        }
      );
    }
  }
);

// Seller submits an offer
export const submitOfferThunk = createAsyncThunk(
  "serviceRequest/submitOffer",
  async ({ requestId, offerData }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.submitOffer(
        requestId,
        offerData
      );
      return response.data; // Expects { message, serviceRequest (updated), offer (new) }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to submit your offer." }
      );
    }
  }
);

// Buyer accepts an offer
export const buyerAcceptOfferThunk = createAsyncThunk(
  "serviceRequest/buyerAcceptOffer",
  async ({ requestId, offerId, buyerMessage = "" }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.buyerAcceptOffer(
        requestId,
        offerId,
        { buyerMessage } // Pass data object
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to accept offer." }
      );
    }
  }
);

// Buyer rejects an offer - UPDATED
export const buyerRejectOfferThunk = createAsyncThunk(
  "serviceRequest/buyerRejectOffer",
  async ({ requestId, offerId, rejectionReason = "" }, { rejectWithValue }) => {
    // Added rejectionReason
    try {
      const response = await serviceRequestApi.buyerRejectOffer(
        requestId,
        offerId,
        { rejectionReason } // Pass data object
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to reject offer." }
      );
    }
  }
);

// NEW: Buyer submits a counter-offer
export const buyerSubmitCounterOfferThunk = createAsyncThunk(
  "serviceRequest/buyerSubmitCounterOffer",
  async ({ requestId, offerId, counterOfferData }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.buyerSubmitCounterOffer(
        requestId,
        offerId,
        counterOfferData
      );
      return response.data; // Expects { message, serviceRequest (updated) }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to submit counter-offer." }
      );
    }
  }
);

// NEW: Seller responds to a counter-offer
export const sellerRespondToCounterOfferThunk = createAsyncThunk(
  "serviceRequest/sellerRespondToCounterOffer",
  async ({ requestId, offerId, responseData }, { rejectWithValue }) => {
    // responseData: { accepted: boolean, sellerResponseMessage?: string }
    try {
      const response = await serviceRequestApi.sellerRespondToCounterOffer(
        requestId,
        offerId,
        responseData
      );
      return response.data; // Expects { message, serviceRequest (updated) }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to respond to counter-offer.",
        }
      );
    }
  }
);

// Set/Update schedule for a service request
export const setScheduleForServiceRequestThunk = createAsyncThunk(
  "serviceRequest/setSchedule",
  async ({ requestId, scheduleActionPayload }, { rejectWithValue }) => {
    // scheduleData: { scheduledDate, scheduledTimeSlot, specificTimeDetails, notes }
    try {
      const response = await serviceRequestApi.setServiceRequestSchedule(
        requestId,
        scheduleActionPayload // Pass isConfirmation to API
      );
      return response.data; // Expects { message, serviceRequest (updated) }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to set schedule." }
      );
    }
  }
);

// Mark a service request as in-progress - UPDATED
export const markServiceRequestInProgressThunk = createAsyncThunk(
  "serviceRequest/markInProgress",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.markRequestInProgress(requestId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to mark request as in-progress.",
        }
      );
    }
  }
);

// Mark a service request as completed by one party
export const markServiceRequestAsCompletedByPartyThunk = createAsyncThunk(
  "serviceRequest/markCompletedByParty",
  async ({ requestId, partyData = {} }, { rejectWithValue }) => {
    // partyData might include completion notes, or identify if buyer or seller is marking
    try {
      const response = await serviceRequestApi.markRequestCompletedByParty(
        requestId,
        partyData
      );
      return response.data; // Expects { message, serviceRequest (updated) }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to mark request as completed.",
        }
      );
    }
  }
);

// NEW: Initiate payment for a service request
export const initiateServiceRequestPaymentThunk = createAsyncThunk(
  "serviceRequest/initiatePayment",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.initiateServiceRequestPayment(
        requestId
      );
      return response.data; // Expects { message, clientSecret, publishableKey, serviceRequest }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to initiate payment." }
      );
    }
  }
);

// NEW: Request a refund for a service request
export const requestServiceRefundThunk = createAsyncThunk(
  "serviceRequest/requestRefund",
  async ({ requestId, refundData }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.requestServiceRefund(
        requestId,
        refundData
      );
      return response.data; // Expects { message, serviceRequest (updated) }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to request refund." }
      );
    }
  }
);

// NEW: Confirm payment for a service request
export const confirmServicePaymentThunk = createAsyncThunk(
  "serviceRequest/confirmPayment",
  async ({ requestId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.confirmServicePayment(
        requestId,
        paymentData
      );
      return response.data; // Expects { message, serviceRequest }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to confirm payment." }
      );
    }
  }
);

// NEW: Dispute a service request
export const disputeServiceRequestThunk = createAsyncThunk(
  "serviceRequest/dispute",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await serviceRequestApi.disputeServiceRequest(requestId);
      return response.data; // Expects { message, serviceRequest }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to dispute service request.",
        }
      );
    }
  }
);

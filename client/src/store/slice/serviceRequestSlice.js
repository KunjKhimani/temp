// src/store/slice/serviceRequestSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  createServiceRequestThunk,
  fetchMyServiceRequestsThunk,
  fetchOpenServiceRequestsThunk,
  fetchServiceRequestByIdThunk,
  updateServiceRequestThunk,
  deleteServiceRequestThunk,
  searchServiceRequestsThunk,
  confirmPromotionPaymentThunk,
  // --- NEW THUNKS TO IMPORT ---
  inviteProvidersToRequestThunk,
  fetchOffersForRequestThunk,
  submitOfferThunk,
  buyerAcceptOfferThunk,
  buyerRejectOfferThunk,
  setScheduleForServiceRequestThunk,
  markServiceRequestInProgressThunk,
  markServiceRequestAsCompletedByPartyThunk,
  buyerSubmitCounterOfferThunk,
  sellerRespondToCounterOfferThunk,
} from "../thunks/serviceRequestThunks";

const initialPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10,
};

const initialState = {
  requests: [],
  pagination: { ...initialPagination },
  listStatus: "idle",
  listError: null,
  searchResults: [],
  searchPagination: { ...initialPagination },
  searchStatus: "idle",
  searchError: null,
  currentRequest: null,
  detailStatus: "idle",
  detailError: null,
  actionStatus: "idle",
  actionError: null, // Generic status for create, update, delete, invite, offer actions
  claimData: null, // For seller claiming a request (separate flow)

  // --- NEW State for offers related to currentRequest ---
  currentRequestOffers: [],
  offersStatus: "idle", // Status for fetching offers for currentRequest
  offersError: null,
};

// Helper to update a request in any list (requests, searchResults, currentRequest)
const updateRequestInState = (state, updatedRequest) => {
  if (state.currentRequest && state.currentRequest._id === updatedRequest._id) {
    state.currentRequest = { ...state.currentRequest, ...updatedRequest }; // Merge for safety
  }
  const updateList = (list) =>
    list.map((req) =>
      req._id === updatedRequest._id ? { ...req, ...updatedRequest } : req
    );
  state.requests = updateList(state.requests);
  state.searchResults = updateList(state.searchResults);
};

const serviceRequestSlice = createSlice({
  name: "serviceRequest",
  initialState,
  reducers: {
    clearServiceRequestDetailState: (state) => {
      state.currentRequest = null;
      state.detailStatus = "idle";
      state.detailError = null;
      state.currentRequestOffers = [];
      state.offersStatus = "idle";
      state.offersError = null;
    },
    clearServiceRequestActionState: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    clearServiceRequestListState: (state) => {
      state.requests = [];
      state.pagination = { ...initialPagination };
      state.listStatus = "idle";
      state.listError = null;
    },
    clearServiceRequestSearchState: (state) => {
      state.searchResults = [];
      state.searchPagination = { ...initialPagination };
      state.searchStatus = "idle";
      state.searchError = null;
    },
    clearClaimData: (state) => {
      state.claimData = null;
    },
    clearCurrentRequestOffers: (state) => {
      state.currentRequestOffers = [];
      state.offersStatus = "idle";
      state.offersError = null;
    },
  },
  extraReducers: (builder) => {
    const handleActionPending = (state) => {
      state.actionStatus = "loading";
      state.actionError = null;
    };
    const handleActionRejected = (state, action) => {
      state.actionStatus = "failed";
      state.actionError =
        action.payload?.message || action.payload || "Action failed"; // Handle plain string payload
    };
    const handleActionFulfilled = (state, action) => {
      state.actionStatus = "succeeded";
      if (action.payload && action.payload.serviceRequest) {
        updateRequestInState(state, action.payload.serviceRequest);
        // If the payload also directly contains updated offers for the current request
        if (
          state.currentRequest?._id === action.payload.serviceRequest._id &&
          action.payload.serviceRequest.offersReceived
        ) {
          state.currentRequestOffers = [
            ...action.payload.serviceRequest.offersReceived,
          ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      }
    };

    // --- Existing Thunk Handlers ---
    builder
      .addCase(createServiceRequestThunk.pending, handleActionPending)
      .addCase(createServiceRequestThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        if (
          action.payload.serviceRequest &&
          action.payload.serviceRequest.status === "open"
        ) {
          state.requests.unshift(action.payload.serviceRequest); // Add to 'my requests' list if it's immediately open
          if (state.pagination.totalItems !== undefined)
            state.pagination.totalItems++;
        }
      })
      .addCase(createServiceRequestThunk.rejected, handleActionRejected);

    builder
      .addCase(fetchMyServiceRequestsThunk.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchMyServiceRequestsThunk.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.requests = action.payload.serviceRequests || [];
        state.pagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(fetchMyServiceRequestsThunk.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError =
          action.payload?.message || "Failed to fetch your requests";
      });

    builder
      .addCase(fetchOpenServiceRequestsThunk.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchOpenServiceRequestsThunk.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.requests = action.payload.serviceRequests || [];
        state.pagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(fetchOpenServiceRequestsThunk.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError =
          action.payload?.message || "Failed to fetch open requests";
      });

    builder
      .addCase(searchServiceRequestsThunk.pending, (state) => {
        state.searchStatus = "loading";
        state.searchError = null;
      })
      .addCase(searchServiceRequestsThunk.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.searchResults = action.payload.serviceRequests || [];
        state.searchPagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(searchServiceRequestsThunk.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.searchError =
          action.payload?.message || "Failed to search service requests";
      });

    builder
      .addCase(fetchServiceRequestByIdThunk.pending, (state) => {
        state.detailStatus = "loading";
        state.currentRequest = null;
        state.detailError = null;
      })
      .addCase(fetchServiceRequestByIdThunk.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.currentRequest = action.payload;
      })
      .addCase(fetchServiceRequestByIdThunk.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError =
          action.payload?.message || "Failed to fetch request details";
      });

    builder
      .addCase(updateServiceRequestThunk.pending, handleActionPending)
      .addCase(updateServiceRequestThunk.fulfilled, handleActionFulfilled)
      .addCase(updateServiceRequestThunk.rejected, handleActionRejected);
    builder
      .addCase(deleteServiceRequestThunk.pending, handleActionPending)
      .addCase(deleteServiceRequestThunk.fulfilled, (state, action) => {
        /* ... as before, ensure it removes from all lists ... */
        state.actionStatus = "succeeded";
        const { requestId } = action.payload;
        if (state.currentRequest?._id === requestId) {
          state.currentRequest = null;
          state.detailStatus = "idle";
        }
        const filterOut = (list) => list.filter((r) => r._id !== requestId);
        state.requests = filterOut(state.requests);
        state.searchResults = filterOut(state.searchResults);
      })
      .addCase(deleteServiceRequestThunk.rejected, handleActionRejected);
    builder
      .addCase(confirmPromotionPaymentThunk.pending, handleActionPending)
      .addCase(confirmPromotionPaymentThunk.fulfilled, handleActionFulfilled)
      .addCase(confirmPromotionPaymentThunk.rejected, handleActionRejected);

    // --- NEW Thunk Handlers ---
    builder
      .addCase(inviteProvidersToRequestThunk.pending, handleActionPending)
      .addCase(inviteProvidersToRequestThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        if (action.payload.serviceRequest) {
          updateRequestInState(state, action.payload.serviceRequest); // Update invitedProviders list
        }
      })
      .addCase(inviteProvidersToRequestThunk.rejected, handleActionRejected);

    builder
      .addCase(fetchOffersForRequestThunk.pending, (state) => {
        state.offersStatus = "loading";
        state.offersError = null;
        state.currentRequestOffers = [];
      })
      .addCase(fetchOffersForRequestThunk.fulfilled, (state, action) => {
        state.offersStatus = "succeeded";
        state.currentRequestOffers = action.payload.offers || [];
      })
      .addCase(fetchOffersForRequestThunk.rejected, (state, action) => {
        state.offersStatus = "failed";
        state.offersError =
          action.payload?.message || "Failed to fetch offers.";
      });

    builder
      .addCase(submitOfferThunk.pending, handleActionPending)
      .addCase(submitOfferThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        if (action.payload.serviceRequest && action.payload.offer) {
          updateRequestInState(state, action.payload.serviceRequest); // Update offersReceived array in SR
          // If currentRequestOffers is for this SR, add new offer to it
          if (
            state.currentRequest &&
            state.currentRequest._id === action.payload.serviceRequest._id
          ) {
            state.currentRequestOffers.unshift(action.payload.offer);
          }
        }
      })
      .addCase(submitOfferThunk.rejected, handleActionRejected);

    builder
      .addCase(buyerAcceptOfferThunk.pending, handleActionPending)
      .addCase(buyerAcceptOfferThunk.fulfilled, handleActionFulfilled)
      .addCase(buyerAcceptOfferThunk.rejected, handleActionRejected);
    builder
      .addCase(buyerRejectOfferThunk.pending, handleActionPending)
      .addCase(buyerRejectOfferThunk.fulfilled, handleActionFulfilled)
      .addCase(buyerRejectOfferThunk.rejected, handleActionRejected);
    builder
      .addCase(setScheduleForServiceRequestThunk.pending, handleActionPending)
      .addCase(
        setScheduleForServiceRequestThunk.fulfilled,
        handleActionFulfilled
      )
      .addCase(
        setScheduleForServiceRequestThunk.rejected,
        handleActionRejected
      );

    // NEW: Handlers for counter offer flow
    builder
      .addCase(buyerSubmitCounterOfferThunk.pending, handleActionPending)
      .addCase(buyerSubmitCounterOfferThunk.fulfilled, handleActionFulfilled) // Expects { serviceRequest }
      .addCase(buyerSubmitCounterOfferThunk.rejected, handleActionRejected);
    builder
      .addCase(sellerRespondToCounterOfferThunk.pending, handleActionPending)
      .addCase(
        sellerRespondToCounterOfferThunk.fulfilled,
        handleActionFulfilled
      ) // Expects { serviceRequest }
      .addCase(sellerRespondToCounterOfferThunk.rejected, handleActionRejected);

    builder
      .addCase(markServiceRequestInProgressThunk.pending, handleActionPending)
      .addCase(
        markServiceRequestInProgressThunk.fulfilled,
        handleActionFulfilled
      )
      .addCase(
        markServiceRequestInProgressThunk.rejected,
        handleActionRejected
      );
    builder
      .addCase(
        markServiceRequestAsCompletedByPartyThunk.pending,
        handleActionPending
      )
      .addCase(
        markServiceRequestAsCompletedByPartyThunk.fulfilled,
        handleActionFulfilled
      )
      .addCase(
        markServiceRequestAsCompletedByPartyThunk.rejected,
        handleActionRejected
      );
  },
});

export const {
  clearServiceRequestDetailState,
  clearServiceRequestActionState,
  clearServiceRequestListState,
  clearServiceRequestSearchState,
  clearClaimData,
  clearCurrentRequestOffers,
} = serviceRequestSlice.actions;

// ... (existing selectors)
export const selectServiceRequestList = (state) =>
  state.serviceRequest.requests;
export const selectServiceRequestPagination = (state) =>
  state.serviceRequest.pagination;
export const selectServiceRequestListStatus = (state) =>
  state.serviceRequest.listStatus;
export const selectServiceRequestListError = (state) =>
  state.serviceRequest.listError;
export const selectServiceRequestSearchResults = (state) =>
  state.serviceRequest.searchResults;
export const selectServiceRequestSearchPagination = (state) =>
  state.serviceRequest.searchPagination;
export const selectServiceRequestSearchStatus = (state) =>
  state.serviceRequest.searchStatus;
export const selectServiceRequestSearchError = (state) =>
  state.serviceRequest.searchError;
export const selectCurrentServiceRequest = (state) =>
  state.serviceRequest.currentRequest;
export const selectServiceRequestDetailStatus = (state) =>
  state.serviceRequest.detailStatus;
export const selectServiceRequestDetailError = (state) =>
  state.serviceRequest.detailError;
export const selectServiceRequestActionStatus = (state) =>
  state.serviceRequest.actionStatus;
export const selectServiceRequestActionError = (state) =>
  state.serviceRequest.actionError;
export const selectServiceRequestClaimData = (state) =>
  state.serviceRequest.claimData;
// NEW Selectors for offers
export const selectCurrentRequestOffers = (state) =>
  state.serviceRequest.currentRequestOffers;
export const selectOffersStatus = (state) => state.serviceRequest.offersStatus;
export const selectOffersError = (state) => state.serviceRequest.offersError;

export default serviceRequestSlice.reducer;

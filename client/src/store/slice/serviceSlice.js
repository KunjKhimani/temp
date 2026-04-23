// src/store/slice/serviceSlice.js
import { createSlice } from "@reduxjs/toolkit";
// Import all thunks from the new serviceThunks.js file
import {
  fetchServices,
  fetchSubCategoryServices,
  addService,
  editService,
  removeService,
  searchServices,
  fetchServiceById,
  fetchLatestServices,
  fetchMyServices,
} from "../thunks/serviceThunks"; // Adjust path if needed

const initialPagination = {
  currentPage: 1,
  totalPages: 1, // Should be 0 initially if no items
  totalItems: 0,
  limit: 10,
};

const initialState = {
  // For general listing (e.g., initial view of BrowseServicesPage if no search)
  services: [],
  pagination: { ...initialPagination },
  listStatus: "idle",
  listError: null,

  currentViewService: null,
  currentViewStatus: "idle",
  currentViewError: null,

  latestServices: [],
  latestServicesStatus: "idle",
  latestServicesError: null,

  myServices: [],
  myServicesPagination: { ...initialPagination },
  myServicesStatus: "idle",
  myServicesError: null,

  // --- For Service Search Results ---
  serviceSearchResults: [], // <<<< RENAMED for clarity from searchResults.services
  serviceSearchPagination: { ...initialPagination }, // <<<< RENAMED from searchResults.pagination
  serviceSearchStatus: "idle",
  serviceSearchError: null,

  actionStatus: "idle",
  actionError: null,
};

const serviceSlice = createSlice({
  name: "service",
  initialState,
  reducers: {
    clearServiceViewState: (state) => {
      state.currentViewService = null;
      state.currentViewStatus = "idle";
      state.currentViewError = null;
    },
    clearServiceActionState: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    clearMyServicesState: (state) => {
      state.myServices = [];
      state.myServicesPagination = { ...initialPagination };
      state.myServicesStatus = "idle";
      state.myServicesError = null;
    },
    clearServiceListState: (state) => {
      // For the general 'services' list
      state.services = [];
      state.pagination = { ...initialPagination };
      state.listStatus = "idle";
      state.listError = null;
    },
    clearLatestServicesState: (state) => {
      state.latestServices = [];
      state.latestServicesStatus = "idle";
      state.latestServicesError = null;
    },
    // --- RENAMED and CORRECTED ---
    clearServiceSearchState: (state) => {
      // <<<< RENAMED from clearSearchState
      state.serviceSearchResults = [];
      state.serviceSearchPagination = { ...initialPagination };
      state.serviceSearchStatus = "idle";
      state.serviceSearchError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- FetchServices (General List) ---
      .addCase(fetchServices.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.services = action.payload.services || []; // Ensure it's an array
        state.pagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload?.message || "Failed to fetch services";
      })

      // --- FetchServiceById (Single View) ---
      .addCase(fetchServiceById.pending, (state) => {
        state.currentViewStatus = "loading";
        state.currentViewService = null;
        state.currentViewError = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.currentViewStatus = "succeeded";
        state.currentViewService = action.payload;
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.currentViewStatus = "failed";
        state.currentViewError =
          action.payload?.message || "Failed to fetch service details";
      })

      // --- FetchMyServices ---
      .addCase(fetchMyServices.pending, (state) => {
        state.myServicesStatus = "loading";
        state.myServicesError = null;
      })
      .addCase(fetchMyServices.fulfilled, (state, action) => {
        state.myServicesStatus = "succeeded";
        state.myServices = action.payload.services;
        state.myServicesPagination = action.payload.pagination;
      })
      .addCase(fetchMyServices.rejected, (state, action) => {
        state.myServicesStatus = "failed";
        state.myServicesError =
          action.payload?.message || "Failed to load your services";
      })

      // --- AddService ---
      .addCase(addService.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(addService.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.myServices.unshift(action.payload);
        if (state.myServicesPagination) {
          state.myServicesPagination.totalItems += 1;
        }
      })
      .addCase(addService.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload?.message || "Failed to add service.";
      })

      // --- EditService ---
      .addCase(editService.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(editService.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const updatedService = action.payload;
        const listUpdate = (list) =>
          list.map((s) => (s._id === updatedService._id ? updatedService : s));
        state.services = listUpdate(state.services);
        state.myServices = listUpdate(state.myServices);
        if (state.currentViewService?.service?._id === updatedService._id) {
          state.currentViewService.service = updatedService;
        }
      })
      .addCase(editService.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError =
          action.payload?.message || "Failed to update service.";
      })

      // --- RemoveService ---
      .addCase(removeService.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(removeService.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const { id: removedId } = action.payload;
        const filterOutRemoved = (list) =>
          list.filter((s) => s._id !== removedId);
        const oldMyServicesLength = state.myServices.length;
        const oldServicesLength = state.services.length;

        state.services = filterOutRemoved(state.services);
        state.myServices = filterOutRemoved(state.myServices);

        if (state.currentViewService?.service?._id === removedId)
          state.currentViewService = null;

        if (
          state.myServicesPagination &&
          state.myServices.length < oldMyServicesLength
        ) {
          state.myServicesPagination.totalItems -=
            oldMyServicesLength - state.myServices.length;
        }
        if (state.pagination && state.services.length < oldServicesLength) {
          state.pagination.totalItems -=
            oldServicesLength - state.services.length;
        }
      })
      .addCase(removeService.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError =
          action.payload?.message || "Failed to delete service.";
      })

      // --- SearchServices (Your search thunk, assuming it's named searchServices) ---
      // If your search thunk is named differently, e.g., searchServicesThunk, use that here.
      .addCase(searchServices.pending, (state) => {
        state.serviceSearchStatus = "loading";
        state.serviceSearchError = null;
      })
      .addCase(searchServices.fulfilled, (state, action) => {
        state.serviceSearchStatus = "succeeded";
        state.serviceSearchResults = action.payload.services || []; // Ensure it's an array
        state.serviceSearchPagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(searchServices.rejected, (state, action) => {
        state.serviceSearchStatus = "failed";
        state.serviceSearchError =
          action.payload?.message || "Failed to search services";
      })

      // --- FetchSubCategoryServices (can also update main services list) ---
      .addCase(fetchSubCategoryServices.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchSubCategoryServices.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.services = action.payload.services || action.payload;
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchSubCategoryServices.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError =
          action.payload?.message || "Failed to fetch subcategory services";
      })

      // --- FetchLatestServices ---
      .addCase(fetchLatestServices.pending, (state) => {
        state.latestServicesStatus = "loading";
        state.latestServicesError = null;
      })
      .addCase(fetchLatestServices.fulfilled, (state, action) => {
        state.latestServicesStatus = "succeeded";
        state.latestServices = action.payload;
      })
      .addCase(fetchLatestServices.rejected, (state, action) => {
        state.latestServicesStatus = "failed";
        state.latestServicesError =
          action.payload?.message || "Failed to fetch latest services";
      });
  },
});

export const {
  clearServiceViewState,
  clearServiceActionState,
  clearMyServicesState,
  clearServiceListState,
  clearLatestServicesState,
  clearServiceSearchState,
} = serviceSlice.actions;

// Selectors for General List
export const selectServices = (state) => state.service.services; // Renamed from selectAllServicesList for consistency
export const selectServicePagination = (state) => state.service.pagination; // Renamed
export const selectServiceListStatus = (state) => state.service.listStatus; // Renamed
export const selectServiceListError = (state) => state.service.listError;

// --- Selectors for Search ---
export const selectServiceSearchResults = (state) => state.service.serviceSearchResults;
export const selectServiceSearchPagination = (state) => state.service.serviceSearchPagination;
export const selectServiceSearchStatus = (state) => state.service.serviceSearchStatus;
export const selectServiceSearchError = (state) => state.service.serviceSearchError;

// --- Other Selectors (Keep them as they are if they work for you) ---
export const selectCurrentViewService = (state) => state.service.currentViewService;
export const selectCurrentViewStatus = (state) => state.service.currentViewStatus;
export const selectCurrentViewError = (state) => state.service.currentViewError;

export const selectLatestServices = (state) => state.service.latestServices;
export const selectLatestServicesStatus = (state) => state.service.latestServicesStatus;
export const selectLatestServicesError = (state) => state.service.latestServicesError;

export const selectMyServicesList = (state) => state.service.myServices;
export const selectMyServicesPaginationInfo = (state) => state.service.myServicesPagination;
export const selectMyServicesFetchStatus = (state) => state.service.myServicesStatus;
export const selectMyServicesFetchError = (state) => state.service.myServicesError;

export const selectServiceActionStatus = (state) => state.service.actionStatus;
export const selectServiceActionError = (state) => state.service.actionError;

export default serviceSlice.reducer;
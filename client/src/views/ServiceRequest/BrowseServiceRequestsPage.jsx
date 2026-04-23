/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/BrowseServiceRequestsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Pagination,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Button,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { selectUser } from "../../store/slice/userSlice";

import {
  fetchOpenServiceRequestsThunk, // For general listing
  searchServiceRequestsThunk, // For search results
} from "../../store/thunks/serviceRequestThunks";
import {
  selectServiceRequestList,
  selectServiceRequestPagination,
  selectServiceRequestListStatus,
  selectServiceRequestListError,
  clearServiceRequestListState,
  selectServiceRequestSearchResults,
  selectServiceRequestSearchStatus,
  selectServiceRequestSearchError,
  selectServiceRequestSearchPagination,
  clearServiceRequestSearchState,
} from "../../store/slice/serviceRequestSlice";
import ServiceRequestCard from "./ServiceRequestCard"; // Ensure this card does not have its own Grid item wrapper
import SearchMenu from "../LandingPage/components/SearchMenu"; // Use the shared SearchMenu
import NavigationButtons from "../../components/NavigationButtons";

const REQUESTS_PER_PAGE = 12;
const browseRequestsNavButtons = [
  { label: "All", to: "/services", exact: true },
  { label: "Open Service Requests", to: "/service-requests/browse" },
  { label: "Recently Added Services", to: "/services/browse" },
  { label: "Products for sale", to: "/products" },
  { label: "Requested Products", to: "/requested-products" },
];

const BrowseServiceRequestsPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useSelector(selectUser);
  const isLoggedIn = !!currentUser;

  const queryTerm = searchParams.get("q") || "";
  const locationTerm = searchParams.get("location") || "";
  const typeTerm = searchParams.get("type") || ""; // 'on-site' or 'remote' or 'flexible' for locationPreference

  const isSearching = !!(queryTerm || locationTerm || typeTerm);

  const generalRequests = useSelector(selectServiceRequestList);
  const generalPagination = useSelector(selectServiceRequestPagination);
  const generalStatus = useSelector(selectServiceRequestListStatus);
  const generalError = useSelector(selectServiceRequestListError);

  const searchResults = useSelector(selectServiceRequestSearchResults);
  const searchPaginationData = useSelector(
    selectServiceRequestSearchPagination
  );
  const searchStatusData = useSelector(selectServiceRequestSearchStatus);
  const searchErrorData = useSelector(selectServiceRequestSearchError);

  const requestsToDisplay = isSearching ? searchResults : generalRequests;
  const currentStatus = isSearching ? searchStatusData : generalStatus;
  const currentError = isSearching ? searchErrorData : generalError;
  const currentPagination = isSearching
    ? searchPaginationData
    : generalPagination;

  console.log("requestsToDisplay", requestsToDisplay);

  const currentPage = Number(searchParams.get("page")) || 1;

  const fetchRequestData = useCallback(() => {
    const query = {
      page: currentPage.toString(),
      limit: REQUESTS_PER_PAGE.toString(),
    };
    searchParams.forEach((value, key) => {
      if (value && key !== "page" && key !== "limit") query[key] = value;
    });

    if (isSearching) {
      if (
        Object.keys(query).filter((k) => k !== "page" && k !== "limit").length >
        0
      ) {
        dispatch(searchServiceRequestsThunk(query));
        dispatch(clearServiceRequestListState());
      } else {
        dispatch(
          fetchOpenServiceRequestsThunk({
            page: currentPage,
            limit: REQUESTS_PER_PAGE,
          })
        );
        dispatch(clearServiceRequestSearchState());
      }
    } else {
      dispatch(
        fetchOpenServiceRequestsThunk({
          page: currentPage,
          limit: REQUESTS_PER_PAGE,
        })
      );
      dispatch(clearServiceRequestSearchState());
    }
  }, [dispatch, searchParams, currentPage, isSearching]);

  useEffect(() => {
    fetchRequestData();
  }, [fetchRequestData]);

  const handlePageChange = (event, value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", value.toString());
    setSearchParams(newParams, { replace: true });
  };

  const handleRetry = () => {
    fetchRequestData();
  };

  const getTitle = () => {
    if (isSearching) {
      let titleParts = [];
      if (queryTerm) titleParts.push(`"${queryTerm}"`);
      if (locationTerm) titleParts.push(`in "${locationTerm}"`);
      if (typeTerm) titleParts.push(`(${typeTerm.replace("-", " ")})`);
      return titleParts.length > 0
        ? `Requests matching ${titleParts.join(", ")}`
        : "Filtered Service Requests";
    }
    return "Browse Open Service Requests";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 0.5, maxWidth: "100vw" }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        // sx={{ mb: 2 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to="/services"
          color="inherit"
          sx={{ textDecoration: "none" }}
        >
          Marketplace
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          {isSearching ? "Search Results" : "Service Requests"}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: "-30px",
          // mx: "auto",
          width: "100%",
          transform: "scale(0.8)",
          boxSizing: "border-box", // Ensure padding/border are included in width
        }}
      >
        <SearchMenu />
      </Box>

      <NavigationButtons buttons={browseRequestsNavButtons} />

      <Typography variant="h5" component="h4" fontWeight="bold" gutterBottom>
        {getTitle()}
      </Typography>

      {currentStatus === "loading" && (
        <Box textAlign="center" my={5}>
          <CircularProgress />
          <Typography mt={1}>Loading requests...</Typography>
        </Box>
      )}
      {currentStatus === "failed" && (
        <Alert
          severity="error"
          sx={{ my: 3 }}
          action={
            <Button onClick={handleRetry} color="inherit" size="small">
              RETRY
            </Button>
          }
        >
          Failed to load requests:{" "}
          {currentError || "An unknown error occurred."}
        </Alert>
      )}

      {currentStatus === "succeeded" && (
        <>
          {requestsToDisplay && requestsToDisplay.length > 0 ? (
            <Grid container spacing={3}>
              {requestsToDisplay.map((request) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={request._id}>
                  <ServiceRequestCard
                    request={request}
                    isSellerView={true}
                    isLoggedIn={isLoggedIn}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography
              textAlign="center"
              color="text.secondary"
              my={5}
              variant="h6"
            >
              {isSearching
                ? "No service requests found matching your criteria."
                : "No open service requests found."}
            </Typography>
          )}

          {currentPagination &&
            currentPagination.totalPages > 1 &&
            requestsToDisplay &&
            requestsToDisplay.length > 0 && (
              <Box display="flex" justifyContent="center" mt={5}>
                <Pagination
                  count={currentPagination.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
        </>
      )}
    </Container>
  );
};

export default BrowseServiceRequestsPage;

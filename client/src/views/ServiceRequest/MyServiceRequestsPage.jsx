/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/MyServiceRequestsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Pagination,
  Button,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { selectUser } from "../../store/slice/userSlice";
import AddIcon from "@mui/icons-material/Add";

import { fetchMyServiceRequestsThunk } from "../../store/thunks/serviceRequestThunks";
import {
  selectServiceRequestList, // This selector should give the array of requests
  selectServiceRequestPagination,
  selectServiceRequestListStatus,
  selectServiceRequestListError,
  clearServiceRequestListState, // Import if you use it in unmount
} from "../../store/slice/serviceRequestSlice";
import ServiceRequestCard from "./ServiceRequestCard"; // Ensure this card doesn't have its own Grid item wrapper

const MyServiceRequestsPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useSelector(selectUser);
  const isLoggedIn = !!currentUser;

  // Ensure requests is always an array, even if empty initially or on error
  const requests = useSelector(selectServiceRequestList) || [];
  const pagination = useSelector(selectServiceRequestPagination);
  const status = useSelector(selectServiceRequestListStatus);
  const error = useSelector(selectServiceRequestListError);

  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    const queryParams = { page: currentPage, limit: 9 };
    dispatch(fetchMyServiceRequestsThunk(queryParams));

    // Optional: Clear state on component unmount
    // return () => {
    //   dispatch(clearServiceRequestListState());
    // };
  }, [dispatch, currentPage]);

  const handlePageChange = (event, value) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("page", value.toString());
        return newParams;
      },
      { replace: true }
    );
  };

  // Added this handler for retrying the fetch
  const handleRetry = () => {
    const queryParams = { page: currentPage, limit: 9 };
    dispatch(fetchMyServiceRequestsThunk(queryParams));
  };

  if (status === "loading") {
    // Show loader on initial load or page change

    console.log(requests);
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Keep Breadcrumbs and Title for context during loading */}
        <Breadcrumbs
          separator={<ChevronRightIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <MuiLink
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </MuiLink>
          <Typography color="text.primary">My Service Requests</Typography>
        </Breadcrumbs>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            My Posted Requests
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/service-requests/create"
            startIcon={<AddIcon />}
          >
            Post New Request
          </Button>
        </Stack>
        <Box textAlign="center" my={5}>
          <CircularProgress />
          <Typography mt={1}>Loading your requests...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </MuiLink>
        <Typography color="text.primary">My Service Requests</Typography>
      </Breadcrumbs>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Posted Requests
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/service-requests/create"
          startIcon={<AddIcon />}
        >
          Post New Request
        </Button>
      </Stack>

      {status === "failed" && (
        <Alert
          severity="error"
          sx={{ my: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              RETRY
            </Button>
          }
        >
          Failed to load requests:{" "}
          {typeof error === "string"
            ? error
            : error?.message || "Unknown error"}
        </Alert>
      )}

      {status === "succeeded" && (
        <>
          {requests && requests.length > 0 ? (
            <Grid container spacing={3}>
              {requests.map((request) => {
                // Safeguard: Ensure request and request._id exist before rendering
                if (!request || !request._id) {
                  console.warn(
                    "Skipping rendering of an invalid request item:",
                    request
                  );
                  return null; // Or some placeholder/error display for this specific item
                }
                return (
                  <Grid item xs={12} sm={6} md={4} key={request._id}>
                    {/* Pass isSellerView={false} or remove if not applicable here,
                        as this page is for the user's OWN requests */}
                    <ServiceRequestCard
                      request={request}
                      isLoggedIn={isLoggedIn}
                    />
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Typography
              textAlign="center"
              color="text.secondary"
              my={5}
              variant="h6"
            >
              You haven&apos;t posted any service requests yet.
            </Typography>
          )}
          {pagination &&
            pagination.totalPages > 1 &&
            requests &&
            requests.length > 0 && (
              <Box display="flex" justifyContent="center" mt={5}>
                <Pagination
                  count={pagination.totalPages}
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

export default MyServiceRequestsPage;

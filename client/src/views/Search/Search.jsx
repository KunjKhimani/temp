/* eslint-disable no-unused-vars */
// Search.jsx
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Typography,
  Pagination,
  CircularProgress,
  Stack,
  Container,
  Link as MuiLink,
  Alert,
  Button,
} from "@mui/material";
import {
  Link as RouterLink,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Import Redux hooks and thunk/selectors
import { useDispatch, useSelector } from "react-redux";
import { searchServices } from "../../store/thunks/serviceThunks"; // Your thunk
import {
  selectSearchResults,
  selectSearchStatus,
  selectSearchError,
  selectSearchPagination, // Assuming you have a selector for pagination
} from "../../store/slice/serviceSlice"; // Assuming selectors are in serviceSlice

import ServiceCard from "../Service/ServiceCard";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Select data from Redux store ---
  const searchResults = useSelector(selectSearchResults); // e.g., state.service.searchResults.services
  const searchStatus = useSelector(selectSearchStatus); // e.g., state.service.searchStatus
  const searchError = useSelector(selectSearchError); // e.g., state.service.searchError
  const pagination = useSelector(selectSearchPagination); // e.g., state.service.searchResults.pagination

  const loading = searchStatus === "loading";
  const error = searchError; // Use the error from the store

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = pagination?.totalPages > 0 ? pagination.totalPages : 1;

  // --- Fetch Function (dispatches the thunk) ---
  const fetchSearchResults = useCallback(
    (page) => {
      const query = {};
      const type = searchParams.get("type");
      const location = searchParams.get("location");
      const startDateTime = searchParams.get("startDateTime");
      const serviceCategoryFromUrl = searchParams.get("serviceCategory"); // Key from URL
      const providerName = searchParams.get("providerName");
      const searchTerm = searchParams.get("searchTerm");

      if (type) query.type = type;
      if (location) query.location = location;
      if (startDateTime) query.startDateTime = startDateTime;
      // --- THIS IS THE IMPORTANT LINE ---
      if (serviceCategoryFromUrl)
        query.serviceCategory = serviceCategoryFromUrl; // Use the exact backend param name
      // ---
      if (providerName) query.providerName = providerName;
      if (searchTerm) query.searchTerm = searchTerm;

      query.page = page;

      console.log("[Search.jsx] URL Search Params:", searchParams.toString());
      console.log("[Search.jsx] Dispatching searchServices with query:", query);

      dispatch(searchServices(query));
    },
    [dispatch, searchParams]
  ); // searchParams is a dependency

  // --- Effect to Fetch on searchParams Change ---
  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    fetchSearchResults(pageFromUrl);

    // Optional: Clear search state when component unmounts
    return () => {
      // dispatch(clearSearchState()); // Implement this action in your slice if needed
    };
  }, [fetchSearchResults]); // fetchSearchResults is memoized by useCallback

  // --- Handler for Pagination ---
  const handlePageChange = (event, value) => {
    setSearchParams(
      (prevParams) => {
        const newParams = new URLSearchParams(prevParams);
        newParams.set("page", value.toString());
        return newParams;
      },
      { replace: true }
    );
  };

  const handleGoBack = () => navigate(-1);

  // --- Render Logic ---
  // Hooks (useSelector, useDispatch, useSearchParams, useNavigate) are called AT THE TOP LEVEL

  // Conditional rendering AFTER all hooks have been called
  let content;
  if (loading && !searchResults.length) {
    // Show loading only if no results yet
    content = (
      <Box
        p={3}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  } else if (error) {
    content = (
      <Alert severity="error" sx={{ my: 3 }}>
        {typeof error === "string"
          ? error
          : error.message || "Failed to fetch results."}
        <Button
          onClick={() => fetchSearchResults(currentPage)}
          size="small"
          sx={{ ml: 2 }}
        >
          Retry
        </Button>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          size="small"
          sx={{ ml: 1 }}
        >
          Back
        </Button>
      </Alert>
    );
  } else if (!loading && searchResults.length === 0) {
    content = (
      <Box
        p={3}
        textAlign="center"
        minHeight="300px"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No services found matching your criteria.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Try adjusting your search terms or filters.
        </Typography>
        <Button onClick={() => navigate("/")} variant="outlined">
          Back to Home
        </Button>
      </Box>
    );
  } else {
    content = (
      <>
        <Stack direction="row" flexWrap="wrap" sx={{ margin: -1.5 }}>
          {searchResults.map((service) => (
            <Box
              key={service._id}
              sx={{
                p: 1.5,
                flexBasis: { xs: "100%", sm: "50%", md: "33.33%", lg: "25%" },
                maxWidth: { xs: "100%", sm: "50%", md: "33.33%", lg: "25%" },
                boxSizing: "border-box",
              }}
            >
              <ServiceCard
                service={service}
                category={
                  service.category?.slug || service.category || "general"
                }
                subcategory={
                  service.subcategory?.slug || service.subcategory || "general"
                }
              />
            </Box>
          ))}
        </Stack>
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={5}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3, color: "text.secondary", fontSize: "0.9rem" }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          Search Results
        </Typography>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" fontWeight="bold" mb={4}>
        Search Results
      </Typography>
      {content}
    </Container>
  );
};

export default Search;

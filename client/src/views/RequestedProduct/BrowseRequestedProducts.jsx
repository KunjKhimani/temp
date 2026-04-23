/* eslint-disable no-unused-vars */
// src/views/RequestedProduct/BrowseRequestedProducts.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Button,
  Pagination,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchRequestedProducts,
  searchRequestedProductsThunk,
} from "../../store/thunks/requestedProductThunks";
import {
  selectAllRequestedProducts,
  selectRequestedProductPagination,
  selectRequestedProductListStatus,
  selectRequestedProductListError,
  clearRequestedProductListState,
  selectRequestedSearchResults,
  selectRequestedSearchStatus,
  selectRequestedSearchError,
  selectRequestedSearchPagination,
  clearRequestedProductSearchState,
} from "../../store/slice/requestedProductSlice";

import RequestedProductCard from "../../components/RequestedProductCard"; // Import the new card component
import SearchMenu from "../LandingPage/components/SearchMenu"; // Use the shared SearchMenu
import NavigationButtons from "../../components/NavigationButtons";

const REQUESTED_PRODUCTS_PER_PAGE = 12;

const requestedProductNavigationButtons = [
  { label: "All Requests", value: "all" },
  { label: "Special Deals", value: "special" },
];

const BrowseRequestedProducts = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryTerm = searchParams.get("q") || "";
  const categoryTerm = searchParams.get("category") || "";
  // Add other requested product-specific filter params if SearchMenu sets them

  const isSearching = !!(queryTerm || categoryTerm);

  const generalRequestedProducts = useSelector(selectAllRequestedProducts);
  const generalPagination = useSelector(selectRequestedProductPagination);
  const generalStatus = useSelector(selectRequestedProductListStatus);
  const generalError = useSelector(selectRequestedProductListError);

  const searchResults = useSelector(selectRequestedSearchResults);
  const searchPaginationData = useSelector(selectRequestedSearchPagination);
  const searchStatusData = useSelector(selectRequestedSearchStatus);
  const searchErrorData = useSelector(selectRequestedSearchError);

  const requestedProductsToDisplay = isSearching
    ? searchResults
    : generalRequestedProducts;
  const currentStatus = isSearching ? searchStatusData : generalStatus;
  const currentError = isSearching ? searchErrorData : generalError;
  const currentPagination = isSearching
    ? searchPaginationData
    : generalPagination;

  const currentPage = Number(searchParams.get("page")) || 1;

  const fetchRequestedProductsData = useCallback(() => {
    const query = {
      page: currentPage.toString(),
      limit: REQUESTED_PRODUCTS_PER_PAGE.toString(),
    };
    searchParams.forEach((value, key) => {
      if (value && key !== "page" && key !== "limit") query[key] = value;
    });

    if (isSearching) {
      if (
        Object.keys(query).filter((k) => k !== "page" && k !== "limit").length >
        0
      ) {
        dispatch(searchRequestedProductsThunk(query));
        dispatch(clearRequestedProductListState());
      } else {
        dispatch(
          fetchRequestedProducts({
            page: currentPage,
            limit: REQUESTED_PRODUCTS_PER_PAGE,
          }),
        );
        dispatch(clearRequestedProductSearchState());
      }
    } else {
      dispatch(
        fetchRequestedProducts({
          page: currentPage,
          limit: REQUESTED_PRODUCTS_PER_PAGE,
        }),
      );
      dispatch(clearRequestedProductSearchState());
    }
  }, [dispatch, searchParams, currentPage, isSearching]);

  useEffect(() => {
    fetchRequestedProductsData();
  }, [fetchRequestedProductsData]);

  const handlePageChange = (event, value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", value.toString());
    setSearchParams(newParams, { replace: true });
  };

  const handleRetry = () => {
    fetchRequestedProductsData();
  };

  const getTitle = () => {
    const isSpecialFilter = searchParams.get("isSpecial") === "true";

    if (isSearching) {
      let title = isSpecialFilter
        ? "Filtered Special Deal Requests"
        : "Filtered Requested Products";
      if (queryTerm) title = `Requested Products matching "${queryTerm}"`;
      if (categoryTerm && queryTerm) title += ` in category "${categoryTerm}"`;
      else if (categoryTerm)
        title = `Requested Products in category "${categoryTerm}"`;
      return title;
    }

    if (isSpecialFilter) return "Explore Special Deal Requests";
    return "Explore Requested Products";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 0.5 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
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
          {isSearching ? "Search Results" : "Requested Products"}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: "100%",
          mt: "-50px",
          transform: "scale(0.8)",
        }}
      >
        <SearchMenu />
      </Box>

      <NavigationButtons
        buttons={requestedProductNavigationButtons}
        selectedValue={
          searchParams.get("isSpecial") === "true" ? "special" : "all"
        }
        onButtonClick={(value) => {
          const newParams = new URLSearchParams(searchParams);
          if (value === "special") {
            newParams.set("isSpecial", "true");
          } else {
            newParams.delete("isSpecial");
          }
          newParams.set("page", "1"); // Reset to first page on filter change
          setSearchParams(newParams);
        }}
      />

      <Typography variant="h5" component="h5" fontWeight="bold" gutterBottom>
        {getTitle()}
      </Typography>

      {currentStatus === "loading" && (
        <Box textAlign="center" my={5}>
          <CircularProgress />
          <Typography mt={1}>Loading requested products...</Typography>
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
          Failed to load requested products:{" "}
          {currentError || "An unknown error occurred."}
        </Alert>
      )}

      {currentStatus === "succeeded" && (
        <>
          {requestedProductsToDisplay &&
          requestedProductsToDisplay.length > 0 ? (
            <Grid container spacing={3}>
              {requestedProductsToDisplay.map((requestedProduct) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={requestedProduct._id}
                >
                  <RequestedProductCard requestedProduct={requestedProduct} />
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
                ? "No requested products found matching your criteria."
                : "No requested products found. Please check back later or create a new request."}
            </Typography>
          )}

          {currentPagination &&
            currentPagination.totalPages > 1 &&
            requestedProductsToDisplay &&
            requestedProductsToDisplay.length > 0 && (
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

export default BrowseRequestedProducts;

/* eslint-disable no-unused-vars */
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
  fetchServices,
  searchServices,
} from "../../store/thunks/serviceThunks";
import {
  selectServices,
  selectServicePagination,
  selectServiceListStatus,
  selectServiceListError,
  clearServiceListState,
  selectServiceSearchResults,
  selectServiceSearchPagination,
  selectServiceSearchStatus,
  selectServiceSearchError,
  clearServiceSearchState,
} from "../../store/slice/serviceSlice";

import ServiceCard from "./ServiceCard";
import SearchMenu from "../LandingPage/components/SearchMenu"; // Adjusted path
import NavigationButtons from "../../components/NavigationButtons";

const ITEMS_PER_PAGE = 12;
const browseServicesNavButtons = [
  { label: "All", to: "/services", exact: true },
  { label: "Open Service Requests", to: "/service-requests/browse" },
  { label: "Recently Added Services", to: "/services/browse" },
  { label: "Products for sale", to: "/products" },
  { label: "Requested Products", to: "/requested-products" },
];

const BrowseServicesPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryTerm = searchParams.get("q") || "";
  const locationTerm = searchParams.get("location") || "";
  const typeTerm = searchParams.get("type") || "";
  const providerNameTerm = searchParams.get("providerName") || "";
  const startDateTerm = searchParams.get("startDate") || "";
  const startTimeTerm = searchParams.get("startTime") || "";

  const isSearching = !!(
    queryTerm ||
    locationTerm ||
    typeTerm ||
    providerNameTerm ||
    startDateTerm ||
    startTimeTerm
  );

  const generalServices = useSelector(selectServices);
  const generalPagination = useSelector(selectServicePagination);
  const generalStatus = useSelector(selectServiceListStatus);
  const generalError = useSelector(selectServiceListError);

  const searchResults = useSelector(selectServiceSearchResults);
  const searchPaginationData = useSelector(selectServiceSearchPagination);
  const searchStatusData = useSelector(selectServiceSearchStatus);
  const searchErrorData = useSelector(selectServiceSearchError);

  const servicesToDisplay = isSearching ? searchResults : generalServices;
  const currentStatus = isSearching ? searchStatusData : generalStatus;
  const currentError = isSearching ? searchErrorData : generalError;
  const currentPagination = isSearching
    ? searchPaginationData
    : generalPagination;

  const currentPage = Number(searchParams.get("page")) || 1;

  const fetchServiceData = useCallback(() => {
    const query = {
      page: currentPage.toString(),
      limit: ITEMS_PER_PAGE.toString(),
    };
    searchParams.forEach((value, key) => {
      if (value && key !== "page" && key !== "limit") {
        query[key] = value;
      }
    });

    if (isSearching) {
      if (
        Object.keys(query).filter((k) => k !== "page" && k !== "limit").length >
        0
      ) {
        dispatch(searchServices(query));
        dispatch(clearServiceListState());
      } else {
        dispatch(fetchServices({ page: currentPage, limit: ITEMS_PER_PAGE }));
        dispatch(clearServiceSearchState());
      }
    } else {
      dispatch(fetchServices({ page: currentPage, limit: ITEMS_PER_PAGE }));
      dispatch(clearServiceSearchState());
    }
  }, [dispatch, searchParams, currentPage, isSearching]);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

  const handlePageChange = (event, value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", value.toString());
    setSearchParams(newParams, { replace: true });
  };

  const handleRetry = () => {
    fetchServiceData();
  };

  const getTitle = () => {
    if (isSearching) {
      let titleParts = [];
      if (queryTerm) titleParts.push(`"${queryTerm}"`);
      if (typeTerm) titleParts.push(typeTerm.replace("-", " "));
      if (locationTerm) titleParts.push(`in "${locationTerm}"`);
      if (providerNameTerm) titleParts.push(`by "${providerNameTerm}"`);
      return titleParts.length > 0
        ? `Services matching: ${titleParts.join(", ")}`
        : "Filtered Services";
    }
    return "Explore Offered Services";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
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
          {isSearching ? "Search Results" : "Offered Services"}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          // mx: "auto",
          width: "100%",
          mt: "-50px",
          transform: "scale(0.8)",
        }}
      >
        <SearchMenu />
      </Box>

      <NavigationButtons buttons={browseServicesNavButtons} />

      <Typography variant="h5" component="h5" fontWeight="bold" gutterBottom>
        {getTitle()}
      </Typography>

      {currentStatus === "loading" && (
        <Box textAlign="center" my={5}>
          <CircularProgress />
          <Typography mt={1}>Loading services...</Typography>
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
          Failed to load services:{" "}
          {typeof currentError === "string"
            ? currentError
            : currentError?.message || "An unknown error occurred."}
        </Alert>
      )}

      {currentStatus === "succeeded" && (
        <>
          {servicesToDisplay && servicesToDisplay.length > 0 ? (
            <Grid container spacing={3}>
              {servicesToDisplay.map((service) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={service._id}>
                  <ServiceCard service={service} />
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
                ? "No services found matching your criteria."
                : "No services available at the moment."}
            </Typography>
          )}

          {currentPagination &&
            currentPagination.totalPages > 1 &&
            servicesToDisplay &&
            servicesToDisplay.length > 0 && (
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

export default BrowseServicesPage;

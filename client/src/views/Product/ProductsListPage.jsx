/* eslint-disable no-unused-vars */
// src/views/Product/ProductsListPage.jsx
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
import {
  Link as RouterLink,
  useSearchParams,
  // useNavigate, // Not directly used if SearchMenu handles navigation
} from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchProducts,
  searchProductsThunk,
} from "../../store/thunks/productThunks";
import {
  selectAllProducts,
  selectProductPagination,
  selectProductListStatus,
  selectProductListError,
  clearProductListState,
  selectProductSearchResults,
  selectProductSearchStatus,
  selectProductSearchError,
  selectProductSearchPagination,
  clearProductSearchState,
} from "../../store/slice/productSlice";

import ProductCard from "./ProductCard"; // Ensure this card does not have its own Grid item wrapper
import SearchMenu from "../LandingPage/components/SearchMenu"; // Use the shared SearchMenu
import NavigationButtons from "../../components/NavigationButtons";

const PRODUCTS_PER_PAGE = 12;
const productsNavButtons = [
  { label: "All", to: "/services", exact: true },
  { label: "Open Service Requests", to: "/service-requests/browse" },
  { label: "Recently Added Services", to: "/services/browse" },
  { label: "Products for sale", to: "/products" },
  { label: "Requested Products", to: "/requested-products" },
];

const ProductsListPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryTerm = searchParams.get("q") || "";
  const categoryTerm = searchParams.get("category") || "";
  // Add other product-specific filter params if SearchMenu sets them for products

  const isSearching = !!(
    (queryTerm || categoryTerm) /* || otherProductFilters */
  );

  const generalProducts = useSelector(selectAllProducts);
  const generalPagination = useSelector(selectProductPagination);
  const generalStatus = useSelector(selectProductListStatus);
  const generalError = useSelector(selectProductListError);

  const searchResults = useSelector(selectProductSearchResults);
  const searchPaginationData = useSelector(selectProductSearchPagination);
  const searchStatusData = useSelector(selectProductSearchStatus);
  const searchErrorData = useSelector(selectProductSearchError);

  const productsToDisplay = isSearching ? searchResults : generalProducts;
  const currentStatus = isSearching ? searchStatusData : generalStatus;
  const currentError = isSearching ? searchErrorData : generalError;
  const currentPagination = isSearching
    ? searchPaginationData
    : generalPagination;

  const currentPage = Number(searchParams.get("page")) || 1;

  const fetchProductsData = useCallback(() => {
    const query = {
      page: currentPage.toString(),
      limit: PRODUCTS_PER_PAGE.toString(),
    };
    searchParams.forEach((value, key) => {
      if (value && key !== "page" && key !== "limit") query[key] = value;
    });

    if (isSearching) {
      if (
        Object.keys(query).filter((k) => k !== "page" && k !== "limit").length >
        0
      ) {
        dispatch(searchProductsThunk(query));
        dispatch(clearProductListState());
      } else {
        dispatch(
          fetchProducts({ page: currentPage, limit: PRODUCTS_PER_PAGE }),
        );
        dispatch(clearProductSearchState());
      }
    } else {
      dispatch(fetchProducts({ page: currentPage, limit: PRODUCTS_PER_PAGE }));
      dispatch(clearProductSearchState());
    }
  }, [dispatch, searchParams, currentPage, isSearching]);

  useEffect(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  const handlePageChange = (event, value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", value.toString());
    setSearchParams(newParams, { replace: true });
  };

  const handleRetry = () => {
    fetchProductsData();
  };

  const getTitle = () => {
    if (isSearching) {
      let title = "Filtered Products";
      if (queryTerm) title = `Products matching "${queryTerm}"`;
      if (categoryTerm && queryTerm) title += ` in category "${categoryTerm}"`;
      else if (categoryTerm) title = `Products in category "${categoryTerm}"`;
      return title;
    }
    return "Explore Our Products";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 0.5 }}>
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
          {isSearching ? "Search Results" : "Products"}
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

      <NavigationButtons buttons={productsNavButtons} />

      <Typography variant="h5" component="h5" fontWeight="bold" gutterBottom>
        {getTitle()}
      </Typography>

      {/* {!isSearching && (
        <Box sx={{ my: 3 }}>
          <Typography variant="subtitle1" color="text.secondary">
            Browse our latest collection or use the search above to find exactly
            what you need.
          </Typography>
        </Box>
      )} */}

      {currentStatus === "loading" && (
        <Box textAlign="center" my={5}>
          <CircularProgress />
          <Typography mt={1}>Loading products...</Typography>
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
          Failed to load products:{" "}
          {currentError || "An unknown error occurred."}
        </Alert>
      )}

      {currentStatus === "succeeded" && (
        <>
          {productsToDisplay && productsToDisplay.length > 0 ? (
            <Grid container spacing={3}>
              {productsToDisplay.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <ProductCard product={product} />
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
                ? "No products found matching your criteria."
                : "No products available at the moment."}
            </Typography>
          )}

          {currentPagination &&
            currentPagination.totalPages > 1 &&
            productsToDisplay &&
            productsToDisplay.length > 0 && (
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

export default ProductsListPage;

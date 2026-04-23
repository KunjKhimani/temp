/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/views/ProductOrder/ProductOrdersListPage.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Pagination,
  Tabs,
  Tab,
  Paper,
  Button,
  Stack,
  Chip,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import {
  fetchMyProductOrdersThunk,
  // clearProductOrderListState,
} from "../../store/thunks/productOrderThunks";
import {
  selectProductOrderList,
  selectProductOrderPagination,
  selectProductOrderListStatus,
  selectProductOrderListError,
} from "../../store/slice/productOrderSlice";
import { selectUser } from "../../store/slice/userSlice"; // To determine role

// You might create a ProductOrderListItem or ProductOrderCard component
const ProductOrderCard = ({ order, currentUserRole }) => {
  const displayRole = currentUserRole === "buyer" ? "Seller" : "Buyer";
  const counterParty = currentUserRole === "buyer" ? order.seller : order.buyer;
  const counterPartyName =
    counterParty?.companyName || counterParty?.name || "N/A";

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={1}
        mb={1}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Order ID: #{order._id.slice(-6).toUpperCase()}
          </Typography>
          <div style={{ marginTop: "8px", marginBottom: "-10px" }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to={`/user/product-orders/${order._id}`}
            sx={{
              textDecoration: "none",
              color: "primary.main",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {order.items.length > 0
              ? order.items[0].nameAtOrder
              : "Order Details"}
            {order.items.length > 1 && ` + ${order.items.length - 1} more`}
          </Typography>
          </div>
        </Box>
        <div style={{ marginLeft: "-90px" }}>
          <Chip
              label={(order?.status || "unknown")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            color="primary"
            size="small"
            variant="outlined"
            />
        </div>
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2" color="text.secondary">
        Date: {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {displayRole}: {counterPartyName}
      </Typography>
      <Typography variant="body1" fontWeight="bold" mt={1}>
        Total: ${(order?.totalPrice || 0).toFixed(2)}
      </Typography>
      <Box mt="auto" pt={1}>
        <Button
          component={RouterLink}
          to={`/user/product-orders/${order._id}`}
          variant="outlined"
          size="small"
          fullWidth
        >
          View Details
        </Button>
      </Box>
    </Paper>
  );
};

const ProductOrdersListPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useSelector(selectUser);

  const orders = useSelector(selectProductOrderList);
  const pagination = useSelector(selectProductOrderPagination);
  const status = useSelector(selectProductOrderListStatus);
  const error = useSelector(selectProductOrderListError);

  const [activeTab, setActiveTab] = useState(
    currentUser?.isSeller ? "seller" : "buyer"
  ); // Default based on user type
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentStatusFilter = searchParams.get("status") || "";

  useEffect(() => {
    const queryParams = {
      page: currentPage,
      limit: 12, // Or your preferred limit
      role: activeTab,
    };
    if (currentStatusFilter) {
      queryParams.status = currentStatusFilter;
    }
    dispatch(fetchMyProductOrdersThunk(queryParams));

    return () => {
      // dispatch(clearProductOrderListState()); // Optional: clear on unmount
    };
  }, [dispatch, currentPage, activeTab, currentStatusFilter]);

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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchParams(
      (prev) => {
        // Reset page and status filter on tab change
        const newParams = new URLSearchParams();
        newParams.set("page", "1");
        newParams.set("role", newValue); // Role is implicitly set by activeTab for fetch
        return newParams;
      },
      { replace: true }
    );
  };

  // TODO: Add filter controls for status

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Product Orders
      </Typography>
      {currentUser?.isSeller && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="order role tabs"
          sx={{ mb: 2 }}
        >
          <Tab label="Orders I'm Selling" value="seller" />
          <Tab label="Orders I've Bought" value="buyer" />
        </Tabs>
      )}

      {status === "loading" && (
        <Box textAlign="center" my={5}>
          <CircularProgress />
          <Typography>Loading orders...</Typography>
        </Box>
      )}
      {status === "failed" && (
        <Alert severity="error" sx={{ my: 3 }}>
          Failed to load orders: {typeof error === "object" ? error.message || JSON.stringify(error) : error}
        </Alert>
      )}

      {status === "succeeded" && (
        <>
          {orders.length > 0 ? (
            <Grid container spacing={3}>
              {orders.map((order) => (
                <Grid item xs={12} sm={6} md={4} key={order._id}>
                  <ProductOrderCard order={order} currentUserRole={activeTab} />
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
              No product orders found{" "}
              {currentStatusFilter
                ? `with status "${currentStatusFilter}"`
                : ""}{" "}
              for your {activeTab === "seller" ? "sales" : "purchases"}.
            </Typography>
          )}
          {pagination && pagination.totalPages > 1 && orders.length > 0 && (
            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductOrdersListPage;

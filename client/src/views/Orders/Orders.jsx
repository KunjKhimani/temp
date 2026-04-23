/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  CardActionArea,
  Skeleton,
  Alert,
  Container, // Added Container for better layout
  Divider,
} from "@mui/material";
import { green, amber, red, blue } from "@mui/material/colors";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import RatingModal from "./RatingModal"; // Corrected import name if it's RatingModal
import { fetchOrders } from "../../store/thunks/orderThunks";
import { fetchMyProductOrdersThunk } from "../../store/thunks/productOrderThunks";
import {
  selectOrders,
  selectOrdersListError,
  selectOrdersListStatus,
  clearOrderErrors, // For clearing errors
} from "../../store/slice/orderSlice";
import {
  selectProductOrderListStatus,
  selectProductOrderListError,
  selectProductOrderList,
} from "../../store/slice/productOrderSlice";
import { selectUser } from "../../store/slice/userSlice";

// --- Comprehensive getStatusChipProps ---
// (Consider moving this to a shared utils/statusUtils.js file)
const getStatusChipProps = (status) => {
  const s = status?.toLowerCase();
  switch (s) {
    case "completed":
      return {
        label: "Completed",
        style: { backgroundColor: green[600], color: "#fff" },
      };
    case "in-progress":
      return {
        label: "In Progress",
        style: { backgroundColor: blue[700], color: "#fff" },
      };
    case "accepted":
      return {
        label: "Accepted",
        style: { backgroundColor: green[500], color: "#fff" },
      };
    case "awaiting-seller-confirmation":
      return {
        label: "Pending Seller Action",
        style: { backgroundColor: amber[700], color: "#000" },
      };
    // case "awaiting-buyer-scheduling":
    //   return {
    //     label: "Pending Your Scheduling",
    //     style: { backgroundColor: amber[600], color: "#000" },
    //   }; // For Buyer
    // case "scheduled":
    //   return {
    //     label: "Scheduled",
    //     style: { backgroundColor: blue[500], color: "#fff" },
    //   };
    case "pending-payment":
      return {
        label: "Pending Payment",
        style: { backgroundColor: amber[400], color: "#000" },
      };
    case "declined":
      return {
        label: "Declined",
        style: { backgroundColor: red[500], color: "#fff" },
      };
    case "cancelled":
      return {
        label: "Cancelled",
        style: { backgroundColor: red[700], color: "#fff" },
      };
    case "failed":
      return {
        label: "Payment Failed",
        style: { backgroundColor: red[800], color: "#fff" },
      };
    default:
      return {
        label: status || "Unknown",
        style: { backgroundColor: "#e0e0e0", color: "#000" },
      };
  }
};

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orders = useSelector(selectOrders);
  const listStatus = useSelector(selectOrdersListStatus);
  const listError = useSelector(selectOrdersListError);

  // Product orders selectors
  const productOrdersState = useSelector(selectProductOrderList) || [];
  const productListStatus = useSelector(selectProductOrderListStatus);
  const productListError = useSelector(selectProductOrderListError);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceOrderForRating, setSelectedServiceOrderForRating] =
    useState(null);
  const user = useSelector(selectUser);

  useEffect(() => {
    dispatch(clearOrderErrors()); // Clear previous errors on mount
    // Fetch service orders
    if (listStatus === "idle" || listStatus === "failed") {
      dispatch(fetchOrders());
    }
    // Fetch product orders
    if (productListStatus === "idle" || productListStatus === "failed") {
      dispatch(fetchMyProductOrdersThunk());
    }
  }, [dispatch, listStatus, productListStatus]);

  const handleOpenRatingModal = (order) => {
    setSelectedServiceOrderForRating(order);
    setModalOpen(true);
  };

  const handleCloseRatingModal = () => {
    setModalOpen(false);
    setSelectedServiceOrderForRating(null);
  };

  const isUserSeller =
    user?.accountType?.startsWith("seller") || user?.isSeller; // More robust check

  const pageTitle = isUserSeller ? "Received Orders" : "My Orders";

  if ((listStatus === "loading" || productListStatus === "loading") && !orders.length && !productOrdersState.length) {
    // Show skeleton only if no orders are present yet
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          {pageTitle}
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardHeader
                  avatar={
                    <Skeleton variant="circular" width={40} height={40} />
                  }
                  title={<Skeleton variant="text" width="60%" />}
                  subheader={<Skeleton variant="text" width="40%" />}
                />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box
        mb={3}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          {pageTitle}
        </Typography>
        {/* Optional: Add filters or sorting here */}
      </Box>

      {/* Error handling for service orders */}
      {listStatus === "failed" && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => dispatch(fetchOrders())}
            >
              RETRY
            </Button>
          }
          sx={{ mb: 2 }}
        >
          Failed to load service orders. {listError || "Please try again."}
        </Alert>
      )}

      {/* Error handling for product orders */}
      {productListStatus === "failed" && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => dispatch(fetchMyProductOrdersThunk())}
            >
              RETRY
            </Button>
          }
          sx={{ mb: 2 }}
        >
          Failed to load product orders. {productListError || "Please try again."}
        </Alert>
      )}

      {/* SERVICE ORDERS SECTION */}
      {orders.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: "1.5em" }}>🔧</span> Services
          </Typography>
          <Grid container spacing={3}>
            {orders.map((order) => {
              if (!order || !order._id || !order.service) {
                // Basic guard for malformed order data
                console.warn("Skipping malformed order object:", order);
                return null;
              }
              const chipProps = getStatusChipProps(order.status);
              // Determine display name for buyer and seller
              const seller = order.seller;
              const buyer = order.buyer;

              const sellerName =
                seller?.accountType === "agency"
                  ? seller?.companyName ||
                  seller?.representativeName ||
                  "Seller Agency"
                  : seller?.name || "Seller";
              const buyerName =
                buyer?.accountType === "agency"
                  ? buyer?.companyName ||
                  buyer?.representativeName ||
                  "Buyer Agency"
                  : buyer?.name || "Buyer";

              const displayedParty = isUserSeller ? buyerName : sellerName;
              const displayedPartyLabel = isUserSeller ? "Buyer" : "Seller";

              return (
                <Grid item xs={12} sm={6} md={4} key={order._id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardActionArea
                      component={RouterLink}
                      to={`/user/orders/${order._id}`}
                      sx={{ flexGrow: 1 }}
                    >
                      <CardHeader
                        titleTypographyProps={{
                          variant: "subtitle1",
                          noWrap: true,
                          fontWeight: 500,
                        }}
                        title={order.service?.title || "Service Title Missing"}
                        action={
                          <Chip
                            label={chipProps.label}
                            style={chipProps.style}
                            size="small"
                            sx={{ textTransform: "capitalize" }}
                          />
                        }
                        sx={{ pb: 0 }}
                      />
                      <CardContent sx={{ pt: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Order ID: ...{order._id.slice(-6)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="primary"
                          display="block"
                          fontWeight="medium"
                          gutterBottom
                        >
                          Category: {order.service?.category || "N/A"}
                        </Typography>

                        <Typography
                          variant="body2"
                          gutterBottom
                          sx={{ mt: 1, fontWeight: 500 }}
                        >
                          {displayedPartyLabel}:{" "}
                          <Typography component="span" color="text.primary">
                            {displayedParty}
                          </Typography>
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          Total: ${order.totalPrice?.toFixed(2) || "N/A"}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                    <Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
                      <Button
                        component={RouterLink}
                        to={`/user/orders/${order._id}`}
                        variant="outlined"
                        size="small"
                        sx={{ flexGrow: 1 }}
                      >
                        View Details
                      </Button>
                      {!isUserSeller &&
                        order.status === "completed" &&
                        order.service?._id && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenRatingModal(order)}
                            sx={{ flexGrow: 1 }}
                          >
                            Rate Service
                          </Button>
                        )}
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* PRODUCT ORDERS SECTION */}
      {productOrdersState.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: "1.5em" }}>📦</span> Products
          </Typography>
          <Grid container spacing={3}>
            {productOrdersState.map((order) => {
              if (!order || !order._id) {
                console.warn("Skipping malformed product order:", order);
                return null;
              }

              const chipProps = getStatusChipProps(order.status);
              const seller = order.seller;
              const buyer = order.buyer;

              const sellerName =
                seller?.accountType === "agency"
                  ? seller?.companyName ||
                  seller?.representativeName ||
                  "Seller Agency"
                  : seller?.name || "Seller";
              const buyerName =
                buyer?.accountType === "agency"
                  ? buyer?.companyName ||
                  buyer?.representativeName ||
                  "Buyer Agency"
                  : buyer?.name || "Buyer";

              const displayedParty = isUserSeller ? buyerName : sellerName;
              const displayedPartyLabel = isUserSeller ? "Buyer" : "Seller";

              const productTitle = order.items?.[0]?.nameAtOrder || "Product Order";
              const itemCount = order.items?.length || 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={order._id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardActionArea
                      component={RouterLink}
                      to={`/user/product-orders/${order._id}`}
                      sx={{ flexGrow: 1 }}
                    >
                      <CardHeader
                        titleTypographyProps={{
                          variant: "subtitle1",
                          noWrap: true,
                          fontWeight: 500,
                        }}
                        title={productTitle + (itemCount > 1 ? ` + ${itemCount - 1} more` : "")}
                        action={
                          <Chip
                            label={chipProps.label}
                            style={chipProps.style}
                            size="small"
                            sx={{ textTransform: "capitalize" }}
                          />
                        }
                        sx={{ pb: 0 }}
                      />
                      <CardContent sx={{ pt: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Order ID: ...{order._id.slice(-6)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="success.main"
                          display="block"
                          fontWeight="medium"
                          gutterBottom
                        >
                          Items: {itemCount}
                        </Typography>

                        <Typography
                          variant="body2"
                          gutterBottom
                          sx={{ mt: 1, fontWeight: 500 }}
                        >
                          {displayedPartyLabel}:{" "}
                          <Typography component="span" color="text.primary">
                            {displayedParty}
                          </Typography>
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          Total: ${order.totalPrice?.toFixed(2) || "N/A"}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                    <Box sx={{ p: 2, pt: 0 }}>
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
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Empty state */}
      {orders.length === 0 &&
        productOrdersState.length === 0 &&
        listStatus === "succeeded" &&
        productListStatus === "succeeded" && (
          <Typography
            variant="h6"
            color="text.secondary"
            textAlign={"center"}
            mt={5}
          >
            You haven&apos;t {isUserSeller ? "received any" : "placed any"}{" "}
            orders yet.
          </Typography>
        )}

      {selectedServiceOrderForRating && (
        <RatingModal
          open={modalOpen}
          onClose={handleCloseRatingModal}
          order={selectedServiceOrderForRating}
        />
      )}
    </Container>
  );
};

export default Orders;

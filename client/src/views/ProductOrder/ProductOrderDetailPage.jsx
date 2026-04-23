/* eslint-disable no-unused-vars */
// src/views/ProductOrder/ProductOrderDetailPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Container,
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Link as MuiLink,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

import {
  fetchProductOrderByIdThunk,
  sellerConfirmProductOrderThunk,
  sellerDeclineProductOrderThunk,
  sellerShipProductOrderThunk,
  buyerMarkProductOrderDeliveredThunk,
} from "../../store/thunks/productOrderThunks";
import {
  selectCurrentProductOrder,
  selectProductOrderDetailStatus,
  selectProductOrderDetailError,
  selectProductOrderActionStatus,
  selectProductOrderActionError,
  clearProductOrderActionState,
  clearProductOrderDetailState,
} from "../../store/slice/productOrderSlice";
import { selectUser } from "../../store/slice/userSlice";
import { getTransactionByOrderId } from "../../services/transaction.service";
import TransactionDetails from "../../components/TransactionDetails";
import ReviewModal from "../../components/ReviewModal";
import { reviewApi } from "../../services/reviewApi";
import { showSnackbar } from "../../store/slice/snackbarSlice";

const API_DOMAIN_FOR_IMAGES =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
    /\/api$/,
    ""
  ); // Strip trailing /api for uploads root

const ProductOrderDetailPage = () => {
  const { productOrderId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const order = useSelector(selectCurrentProductOrder);
  const detailStatus = useSelector(selectProductOrderDetailStatus);
  const detailError = useSelector(selectProductOrderDetailError);
  const actionStatus = useSelector(selectProductOrderActionStatus);
  const actionError = useSelector(selectProductOrderActionError);

  const [openDeclineDialog, setOpenDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [openShipDialog, setOpenShipDialog] = useState(false);
  const [shipmentData, setShipmentData] = useState({
    trackingNumber: "",
    shippingCarrier: "",
  });
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  const [transaction, setTransaction] = useState(null);

  const isSellerOfThisOrder =
    order && currentUser && order.seller?._id === currentUser._id;
  const isBuyerOfThisOrder =
    order && currentUser && order.buyer?._id === currentUser._id;

  useEffect(() => {
    if (productOrderId && isSellerOfThisOrder) {
      getTransactionByOrderId(productOrderId)
        .then((data) => setTransaction(data))
        .catch((err) => console.error("Failed to fetch transaction:", err));
    }
  }, [productOrderId, isSellerOfThisOrder]);

  useEffect(() => {
    console.log(`[ProductOrderDetailPage] useEffect triggered for ID: ${productOrderId}`);
    if (productOrderId) {
      dispatch(clearProductOrderDetailState()); // Clear previous order
      dispatch(clearProductOrderActionState()); // Clear previous action status
      dispatch(fetchProductOrderByIdThunk(productOrderId));
    }
    return () => {
      dispatch(clearProductOrderDetailState());
      dispatch(clearProductOrderActionState());
    };
  }, [dispatch, productOrderId]);

  // Log state transitions for easier debugging
  useEffect(() => {
    console.log(`[ProductOrderDetailPage] detailStatus: ${detailStatus}, order:`, order);
    if (detailError) {
      console.error(`[ProductOrderDetailPage] detailError:`, detailError);
    }
  }, [detailStatus, order, detailError]);

  useEffect(() => {
    let ignore = false;

    const checkExistingReview = async () => {
      const listingId = order?.items?.[0]?.product?._id;
      const reviewerId = currentUser?._id;

      if (!listingId || !reviewerId) {
        if (!ignore) setHasSubmittedReview(false);
        return;
      }

      try {
        const hasReviewed = await reviewApi.hasUserReviewedListing(
          listingId,
          reviewerId
        );
        if (!ignore) setHasSubmittedReview(hasReviewed);
      } catch (error) {
        if (!ignore) setHasSubmittedReview(false);
      }
    };

    checkExistingReview();

    return () => {
      ignore = true;
    };
  }, [order?.items, currentUser?._id]);

  const handleSellerConfirm = () => {
    if (!order) return;
    dispatch(sellerConfirmProductOrderThunk(order._id));
  };
  const handleSellerDecline = async () => {
    if (!order || !declineReason.trim()) return;
    await dispatch(
      sellerDeclineProductOrderThunk({
        orderId: order._id,
        declineData: { declineReason },
      })
    );
    setOpenDeclineDialog(false);
    setDeclineReason("");
  };
  const handleSellerShip = async () => {
    if (
      !order ||
      !shipmentData.trackingNumber.trim() ||
      !shipmentData.shippingCarrier.trim()
    )
      return;
    await dispatch(
      sellerShipProductOrderThunk({ orderId: order._id, shipmentData })
    );
    setOpenShipDialog(false);
    setShipmentData({ trackingNumber: "", shippingCarrier: "" });
  };
  const handleBuyerMarkDelivered = async () => {
    if (!order) return;
    try {
      const response = await dispatch(
        buyerMarkProductOrderDeliveredThunk(order._id)
      ).unwrap();

      if (
        String(response?.order?.status || "").toLowerCase() === "delivered"
      ) {
        setOpenReviewModal(true);
      }
    } catch (error) {
      // actionError from slice is already displayed in UI.
    }
  };

  // --- Dialog Handlers ---
  const handleOpenDeclineDialog = () => setOpenDeclineDialog(true);
  const handleCloseDeclineDialog = () => {
    setOpenDeclineDialog(false);
    setDeclineReason("");
  };
  const handleOpenShipDialog = () => setOpenShipDialog(true);
  const handleCloseShipDialog = () => {
    setOpenShipDialog(false);
    setShipmentData({ trackingNumber: "", shippingCarrier: "" });
  };

  if (detailStatus === "loading" && !order)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
        <CircularProgress />
        <Typography ml={2}>Loading order details...</Typography>
      </Box>
    );
  if (detailStatus === "failed")
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load order: {typeof detailError === "object" ? detailError.message || JSON.stringify(detailError) : detailError}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => dispatch(fetchProductOrderByIdThunk(productOrderId))}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Container>
    );
  if (!order)
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 3 }}>
          Order not found.
        </Alert>
      </Container>
    );

  const items = order?.items || [];
  const buyer = order?.buyer || {};
  const seller = order?.seller || {};
  const shippingAddress = order?.shippingAddress || {};
  const subTotal = order?.subTotal || 0;
  const shippingFee = order?.shippingFee || 0;
  const totalPrice = order?.totalPrice || 0;
  const status = order?.status || "unknown";
  const createdAt = order?.createdAt || new Date().toISOString();
  const additionalInfo = order?.additionalInfo;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Product Order Details{" "}
        <Typography variant="caption" color="text.secondary">
          (#{order._id.slice(-8).toUpperCase()})
        </Typography>
      </Typography>
      {actionStatus === "loading" && (
        <CircularProgress size={20} sx={{ mr: 1 }} />
      )}
      {actionError && (
        <Alert
          severity="error"
          onClose={() => dispatch(clearProductOrderActionState())}
          sx={{ mb: 2 }}
        >
          {actionError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Order Items & Summary */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Items ({items?.length || 0})
            </Typography>
            <List disablePadding>
              {items && items.map((item, index) => (
                <React.Fragment key={item.product?._id || index}>
                  <ListItem disableGutters alignItems="flex-start">
                    <Avatar
                      variant="rounded"
                      src={
                        item.product?.images?.[0]
                          ? `${API_DOMAIN_FOR_IMAGES}/api/uploads/${item.product.images[0].replace(
                            /^uploads\//,
                            ""
                          )}`
                          : undefined
                      }
                      alt={item.nameAtOrder}
                      sx={{
                        width: 60,
                        height: 60,
                        mr: 2,
                        mt: 0.5,
                        bgcolor: "grey.200",
                      }}
                    >
                      {!item.product?.images?.[0] && <StorefrontIcon />}
                    </Avatar>
                    <ListItemText
                      primary={
                        <MuiLink
                          component={RouterLink}
                          to={`/product/${item.product?._id}`}
                          underline="hover"
                        >
                          {item.nameAtOrder}
                        </MuiLink>
                      }
                      secondary={`Qty: ${item.quantity
                        }  | Price: $${(item.priceAtOrder || 0).toFixed(2)} each`}
                    />
                    <Typography variant="subtitle1" fontWeight="medium">
                      ${((item.quantity || 0) * (item.priceAtOrder || 0)).toFixed(2)}
                    </Typography>
                  </ListItem>
                  {index < items.length - 1 && (
                    <Divider component="li" sx={{ my: 1 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={0.5} alignItems="flex-end">
              <Typography variant="body1">
                Subtotal:{" "}
                <Typography component="span" fontWeight="medium">
                  ${(subTotal || 0).toFixed(2)}
                </Typography>
              </Typography>
              <Typography variant="body1">
                Shipping:{" "}
                <Typography component="span" fontWeight="medium">
                  ${(shippingFee || 0).toFixed(2)}
                </Typography>
              </Typography>
              <Typography variant="h6" color="primary.main">
                Total:{" "}
                <Typography component="span" fontWeight="bold">
                  ${(totalPrice || 0).toFixed(2)}
                </Typography>
              </Typography>
            </Stack>
          </Paper>

          {additionalInfo && (
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: "info.lighter" }}>
              <Typography variant="subtitle2" gutterBottom>
                Buyer&apos;s Notes:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {additionalInfo}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column: Status, Actions, Addresses */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Status
            </Typography>
            <Chip
              label={(status || "unknown")
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
              color="primary"
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Ordered on: {new Date(createdAt).toLocaleString()}
            </Typography>
            {order.shippedTimestamp && (
              <Typography variant="body2" color="text.secondary">
                Shipped on: {new Date(order.shippedTimestamp).toLocaleString()}
              </Typography>
            )}
            {order.deliveredTimestamp && (
              <Typography variant="body2" color="text.secondary">
                Delivered on:{" "}
                {new Date(order.deliveredTimestamp).toLocaleString()}
              </Typography>
            )}

            {/* Action Buttons */}
            <Box mt={3}>
              {isBuyerOfThisOrder &&
                (() => {
                  const canReview = ["delivered", "completed"].includes(
                    String(status || "").toLowerCase()
                  );

                  return (
                    <Box sx={{ mb: 1 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          if (hasSubmittedReview) {
                            dispatch(
                              showSnackbar({
                                message:
                                  "You have already reviewed this product.",
                                severity: "info",
                              })
                            );
                            return;
                          }

                          if (!canReview) {
                            dispatch(
                              showSnackbar({
                                message:
                                  "Review will be available after order is delivered.",
                                severity: "info",
                              })
                            );
                            return;
                          }
                          setOpenReviewModal(true);
                        }}
                        disabled={hasSubmittedReview}
                      >
                        {hasSubmittedReview ? "Reviewed" : "Add Review"}
                      </Button>
                      {!canReview && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.75 }}
                        >
                          Review will be available after order is delivered.
                        </Typography>
                      )}
                    </Box>
                  );
                })()}

              {isSellerOfThisOrder &&
                status === "awaiting-seller-confirmation" && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={handleSellerConfirm}
                      disabled={actionStatus === "loading"}
                    >
                      Confirm Order
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={handleOpenDeclineDialog}
                      disabled={actionStatus === "loading"}
                    >
                      Decline Order
                    </Button>
                  </Stack>
                )}
              {isSellerOfThisOrder &&
                (status === "seller-confirmed" || status === "processing") && (
                  <Button
                    variant="contained"
                    startIcon={<LocalShippingIcon />}
                    onClick={handleOpenShipDialog}
                    disabled={actionStatus === "loading"}
                  >
                    Enter Shipping Details
                  </Button>
                )}
              {isBuyerOfThisOrder &&
                (status === "shipped" || status === "out-for-delivery") && (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={handleBuyerMarkDelivered}
                    disabled={actionStatus === "loading"}
                  >
                    Mark as Received
                  </Button>
                )}
            </Box>
          </Paper>

          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Shipping Address
            </Typography>
            <Typography variant="body2">{shippingAddress.name}</Typography>
            <Typography variant="body2">{shippingAddress.street}</Typography>
            <Typography variant="body2">
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.postalCode}
            </Typography>
            <Typography variant="body2">{shippingAddress.country}</Typography>
            {shippingAddress.phone && (
              <Typography variant="body2">
                Phone: {shippingAddress.phone}
              </Typography>
            )}
          </Paper>

          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              {isBuyerOfThisOrder ? "Seller Information" : "Buyer Information"}
            </Typography>
            <MuiLink
              component={RouterLink}
              to={`/provider/profile/${isBuyerOfThisOrder ? seller?._id : buyer?._id
                }`}
              underline="hover"
              sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
            >
              <Avatar
                src={
                  (
                    isBuyerOfThisOrder
                      ? seller?.profilePicture
                      : buyer?.profilePicture
                  )
                    ? `${API_DOMAIN_FOR_IMAGES}/api/uploads/${(isBuyerOfThisOrder
                      ? seller?.profilePicture
                      : buyer?.profilePicture
                    ).replace(/^uploads\//, "")}`
                    : undefined
                }
                alt={
                  isBuyerOfThisOrder
                    ? seller?.companyName || seller?.name || "Seller"
                    : buyer?.name || "Buyer"
                }
              >
                {!(isBuyerOfThisOrder
                  ? seller?.profilePicture
                  : buyer?.profilePicture) && <StorefrontIcon />}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {isBuyerOfThisOrder
                    ? seller?.companyName || seller?.name || "Unknown Seller"
                    : buyer?.name || "Unknown Buyer"}
                  {(isBuyerOfThisOrder
                    ? seller?.isVerified
                    : buyer?.isVerified) && (
                      <VerifiedUserIcon
                        color="success"
                        sx={{ fontSize: 16, ml: 0.5, verticalAlign: "middle" }}
                      />
                    )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isBuyerOfThisOrder ? seller?.email : buyer?.email}
                </Typography>
              </Box>
            </MuiLink>
          </Paper>

          {isSellerOfThisOrder && <TransactionDetails transaction={transaction} />}
        </Grid>
      </Grid>

      {/* Decline Dialog */}
      <Dialog open={openDeclineDialog} onClose={handleCloseDeclineDialog}>
        <DialogTitle>Decline Product Order</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for declining this order. This will be
            shared with the buyer.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="declineReason"
            label="Reason for Decline"
            type="text"
            fullWidth
            variant="outlined"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDeclineDialog}
            disabled={actionStatus === "loading"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSellerDecline}
            color="error"
            variant="contained"
            disabled={!declineReason.trim() || actionStatus === "loading"}
          >
            {actionStatus === "loading" ? (
              <CircularProgress size={24} />
            ) : (
              "Decline Order"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ship Dialog */}
      <Dialog open={openShipDialog} onClose={handleCloseShipDialog}>
        <DialogTitle>Enter Shipping Details</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="shippingCarrier"
            label="Shipping Carrier (e.g., UPS, FedEx)"
            type="text"
            fullWidth
            variant="standard"
            value={shipmentData.shippingCarrier}
            onChange={(e) =>
              setShipmentData((s) => ({
                ...s,
                shippingCarrier: e.target.value,
              }))
            }
          />
          <TextField
            margin="dense"
            id="trackingNumber"
            label="Tracking Number"
            type="text"
            fullWidth
            variant="standard"
            value={shipmentData.trackingNumber}
            onChange={(e) =>
              setShipmentData((s) => ({ ...s, trackingNumber: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseShipDialog}
            disabled={actionStatus === "loading"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSellerShip}
            color="primary"
            variant="contained"
            disabled={
              !shipmentData.shippingCarrier.trim() ||
              !shipmentData.trackingNumber.trim() ||
              actionStatus === "loading"
            }
          >
            {actionStatus === "loading" ? (
              <CircularProgress size={24} />
            ) : (
              "Mark as Shipped"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ReviewModal
        open={openReviewModal}
        onClose={() => setOpenReviewModal(false)}
        orderId={order?._id}
        orderModel="ProductOrder"
        listingId={order?.items?.[0]?.product?._id}
        listingModel="Product"
        title="Review This Product"
        onSuccess={() => {
          setHasSubmittedReview(true);
        }}
      />
    </Container>
  );
};

export default ProductOrderDetailPage;

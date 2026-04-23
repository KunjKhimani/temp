/* eslint-disable no-unused-vars */
// src/views/RequestedProduct/RequestedProductDetailPage.jsx
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
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Stack,
  Chip,
  Divider,
  Avatar,
  Tooltip,
  List,
  ListItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person"; // For requester
import CategoryIcon from "@mui/icons-material/Category";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; // For fulfill action
import StorefrontIcon from "@mui/icons-material/Storefront"; // Import StorefrontIcon
import ReviewSection from "../../components/ReviewSection";
import PeopleIcon from "@mui/icons-material/People"; // For community badge

// Requested Product Slice
import {
  selectCurrentRequestedProductDetail,
  selectRequestedProductDetailStatus,
  selectRequestedProductDetailError,
  clearRequestedProductDetailState,
  selectRequestedProductActionStatus,
  selectRequestedProductActionError,
  clearRequestedProductActionState,
} from "../../store/slice/requestedProductSlice";
import {
  fetchRequestedProductByIdThunk,
  deleteRequestedProductThunk,
  editRequestedProductThunk, // Import edit thunk
} from "../../store/thunks/requestedProductThunks";
import { showSnackbar } from "../../store/slice/snackbarSlice";

// User Slice
import { selectUser } from "../../store/slice/userSlice";

import DeleteConfirmationDialog from "../../components/DeleteConfirmationDialog"; // Re-using generic dialog
import ServiceSpecificDealModal from "../ServiceRequest/DetailPage/ServiceSpecificDealModal";
import SpecialDealPaymentModal from "../../components/SpecialDealPaymentModal";
import { fetchPromotionSettings } from "../../store/thunks/adminPromotionThunk";
import { getSpecialDealActivationFee } from "../../constants/promotions";
import { specialOfferApi } from "../../services/specialOfferApi";

// Helper for image URLs
const getApiDomainForImages = () => {
  let domain = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  if (domain.endsWith("/api"))
    domain = domain.substring(0, domain.lastIndexOf("/api"));
  else if (domain.endsWith("/api/"))
    domain = domain.substring(0, domain.lastIndexOf("/api/"));
  return domain;
};
const API_DOMAIN_FOR_IMAGES = getApiDomainForImages();

const RequestedProductDetailPage = () => {
  const { requestedProductId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Requested Product Detail State
  const requestedProduct = useSelector(selectCurrentRequestedProductDetail);

  const requestedProductDetailStatus = useSelector(
    selectRequestedProductDetailStatus
  );
  const requestedProductDetailError = useSelector(
    selectRequestedProductDetailError
  );

  // Current User
  const currentUser = useSelector(selectUser);

  // Requested Product CRUD (Edit/Delete) State
  const requestedProductActionStatus = useSelector(
    selectRequestedProductActionStatus
  );
  // const requestedProductActionError = useSelector(selectRequestedProductActionError);
  const promotionSettings = useSelector((state) => state.adminPromotion.settings);

  // Local State
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isSpecificDealModalOpen, setIsSpecificDealModalOpen] = useState(false);
  const [isSpecificDealPaymentModalOpen, setIsSpecificDealPaymentModalOpen] =
    useState(false);
  const [pendingSpecificDealPayload, setPendingSpecificDealPayload] =
    useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleToggleSpecialStatus = async (event) => {
    if (!requestedProduct?.specialOffer?._id) return;
    const newStatus = event.target.checked ? "active" : "inactive";
    setIsTogglingStatus(true);
    try {
      await specialOfferApi.toggleSpecialOfferStatus(
        requestedProduct.specialOffer._id,
        newStatus
      );
      await dispatch(fetchRequestedProductByIdThunk(requestedProductId));
      dispatch(
        showSnackbar({
          message: `Special deal set to ${newStatus} successfully.`,
          severity: "success",
        })
      );
    } catch (error) {
      console.error("Failed to toggle special offer status:", error);
      dispatch(
        showSnackbar({
          message: error?.response?.data?.message || "Failed to toggle status.",
          severity: "error",
        })
      );
    } finally {
      setIsTogglingStatus(false);
    }
  };

  useEffect(() => {
    if (!promotionSettings) {
      dispatch(fetchPromotionSettings());
    }
  }, [dispatch, promotionSettings]);

  const specialDealActivationFee = getSpecialDealActivationFee(promotionSettings);

  useEffect(() => {
    if (requestedProductId) {
      dispatch(clearRequestedProductDetailState());
      dispatch(clearRequestedProductActionState());
      dispatch(fetchRequestedProductByIdThunk(requestedProductId));
    }
    return () => {
      dispatch(clearRequestedProductDetailState());
      dispatch(clearRequestedProductActionState());
    };
  }, [dispatch, requestedProductId]);

  const handleGoBack = useCallback(() => navigate(-1), [navigate]);

  const isRequester =
    currentUser &&
    requestedProduct &&
    requestedProduct.requestedBy?._id === currentUser._id;
  const isFulfiller =
    currentUser &&
    requestedProduct &&
    requestedProduct.fulfilledBy?._id === currentUser._id;
  const isAdmin = currentUser?.isAdmin;

  const isCreatorVerified = requestedProduct?.requestedBy?.isVerified;

  // --- Requester/Admin Actions (Edit/Delete Request) ---
  const handleEditRequestedProduct = () =>
    navigate(`/requested-products/edit/${requestedProductId}`);
  const handleOpenDeleteDialog = () => setOpenDeleteDialog(true);
  const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);
  const handleOpenSpecificDealModal = () => setIsSpecificDealModalOpen(true);
  const handleCloseSpecificDealModal = () => setIsSpecificDealModalOpen(false);
  const handleCloseSpecificDealPaymentModal = useCallback(() => {
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);
  }, []);

  const handleListRequestedProductSpecificDealPay = useCallback(
    async (dealPayload) => {
      setPendingSpecificDealPayload(dealPayload);
      // Open payment modal after the details modal closes to avoid UI flicker.
      setTimeout(() => {
        setIsSpecificDealPaymentModalOpen(true);
      }, 0);
    },
    []
  );

  const handleSpecificDealPaymentConfirm = useCallback(
    async ({ paymentData, dealPayload }) => {
      const normalizedActualPrice = Number(dealPayload?.actualPrice);
      const normalizedSellingPrice = Number(dealPayload?.sellingPrice);
      const normalizedSpecialDescription = String(
        dealPayload?.specialDescription ?? dealPayload?.description ?? ""
      ).trim();
      const normalizedSpecialOfferSourceId =
        dealPayload?.specialOfferSourceId ?? paymentData?.sourceId;

      if (!requestedProductId) {
        throw new Error("Requested product ID is missing.");
      }

      if (
        !Number.isFinite(normalizedActualPrice) ||
        normalizedActualPrice <= 0
      ) {
        throw new Error(
          "Actual price is invalid. Please review special deal details."
        );
      }

      if (
        !Number.isFinite(normalizedSellingPrice) ||
        normalizedSellingPrice <= 0
      ) {
        throw new Error(
          "Selling price is invalid. Please review special deal details."
        );
      }

      if (normalizedSellingPrice > normalizedActualPrice) {
        throw new Error(
          "Selling price should be less than or equal to actual price."
        );
      }

      if (!normalizedSpecialDescription) {
        throw new Error("Special description is required.");
      }

      if (!normalizedSpecialOfferSourceId) {
        throw new Error(
          "Payment token is missing. Please re-enter your card details."
        );
      }

      try {
        const updatePayload = new FormData();
        updatePayload.set("isSpecial", "true");
        updatePayload.set("actualPrice", String(normalizedActualPrice));
        updatePayload.set("sellingPrice", String(normalizedSellingPrice));
        updatePayload.set("specialDescription", normalizedSpecialDescription);
        updatePayload.set(
          "specialOfferSourceId",
          normalizedSpecialOfferSourceId
        );

        await dispatch(
          editRequestedProductThunk({
            requestedProductId,
            requestedProductFormData: updatePayload,
          })
        ).unwrap();

        await dispatch(fetchRequestedProductByIdThunk(requestedProductId));

        dispatch(
          showSnackbar({
            message: "Special deal updated successfully.",
            severity: "success",
          })
        );
      } catch (error) {
        const errorMessage =
          error?.message ||
          "Failed to update special deal. Please try again.";

        dispatch(
          showSnackbar({
            message: errorMessage,
            severity: "error",
          })
        );

        throw error;
      }
    },
    [dispatch, requestedProductId]
  );

  const handleDeleteRequestedProductConfirm = async () => {
    if (!requestedProductId || requestedProductActionStatus === "loading")
      return;
    try {
      await dispatch(deleteRequestedProductThunk(requestedProductId)).unwrap();
      setOpenDeleteDialog(false);
      navigate(
        isRequester ? "/user/my-requested-products" : "/requested-products"
      ); // Go to my requests if requester, else public list
    } catch (err) {
      console.error("Failed to delete requested product:", err);
      setOpenDeleteDialog(false);
    }
  };

  // --- Fulfiller/Admin Action (Mark as Fulfilled) ---
  const handleFulfillRequest = async () => {
    if (
      !requestedProduct ||
      requestedProductActionStatus === "loading" ||
      requestedProduct.status === "fulfilled"
    )
      return;

    // Only allow fulfiller or admin to mark as fulfilled
    if (!isFulfiller && !isAdmin) {
      alert("You are not authorized to fulfill this request.");
      return;
    }

    try {
      const updatedData = {
        status: "fulfilled",
        fulfilledBy: currentUser._id, // Set current user as fulfiller
        fulfillmentDate: new Date().toISOString(),
      };
      await dispatch(
        editRequestedProductThunk({
          requestedProductId,
          requestedProductFormData: updatedData,
        })
      ).unwrap();
      // No need to navigate, state will update
    } catch (error) {
      console.error("Failed to fulfill request:", error);
      alert(error.message || "Failed to mark request as fulfilled.");
    }
  };

  if (requestedProductDetailStatus === "loading" && !requestedProduct) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />{" "}
        <Typography ml={2}>Loading requested product...</Typography>
      </Box>
    );
  }
  if (requestedProductDetailStatus === "failed" && !requestedProduct) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load requested product:{" "}
          {requestedProductDetailError?.message || requestedProductDetailError}.
          <Button onClick={handleGoBack} sx={{ ml: 1 }}>
            Back
          </Button>
        </Alert>
      </Container>
    );
  }
  if (!requestedProduct) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          Requested product not found.{" "}
          <Button onClick={handleGoBack} sx={{ ml: 1 }}>
            Back
          </Button>
        </Alert>
      </Container>
    );
  }

  const mainImage =
    requestedProduct.images && requestedProduct.images.length > 0
      ? `${API_DOMAIN_FOR_IMAGES}/api/uploads/${requestedProduct.images[0].startsWith("uploads/") ||
        requestedProduct.images[0].startsWith("products/")
        ? requestedProduct.images[0]
          .split("/")
          .slice(requestedProduct.images[0].includes("uploads/") ? 1 : 0)
          .join("/")
        : requestedProduct.images[0]
      }`
      : "https://placehold.co/800x600/E0E0E0/757575?text=Requested+Product+Image";
  const resolvedSpecialDealActualPrice =
    Number(requestedProduct?.targetPrice) > 0
      ? Number(requestedProduct.targetPrice).toString()
      : "";
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
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to="/requested-products"
          color="inherit"
        >
          Requested Products
        </MuiLink>
        {requestedProduct.category && (
          <MuiLink
            component={RouterLink}
            to={`/requested-products?category=${encodeURIComponent(
              requestedProduct.category
            )}`}
            color="inherit"
          >
            {requestedProduct.category}
          </MuiLink>
        )}
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          {requestedProduct.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Left: Image Gallery */}
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, overflow: "hidden" }}
          >
            <Box sx={{ position: "relative", paddingTop: "100%" }}>
              <img
                src={mainImage}
                alt={requestedProduct.name}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  backgroundColor: "#f5f5f5",
                }}
                onError={(e) =>
                (e.target.src =
                  "https://placehold.co/600x600/FFCDD2/B71C1C?text=Image+Error")
                }
              />
            </Box>
          </Paper>
        </Grid>

        {/* Right: Requested Product Info, Actions */}
        <Grid item xs={12} md={6}>
          <Stack
            spacing={2}
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
              >
                {requestedProduct.name}
                {requestedProduct.isCommunity && (
                  <Chip
                    label="Community Offer"
                    size="small"
                    icon={<PeopleIcon sx={{ fontSize: "1rem !important", color: "white !important" }} />}
                    sx={{
                      backgroundColor: "#009688", // Teal
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                      height: "26px",
                      "& .MuiChip-label": { px: 1.25 },
                    }}
                  />
                )}
                {requestedProduct.isSpecial && (
                  <Chip
                    label="Special Deal Request"
                    size="small"
                    icon={<LocalOfferIcon sx={{ fontSize: "1rem !important", color: "white !important" }} />}
                    sx={{
                      backgroundColor: "#ff5722", // Deep Orange
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                      height: "26px",
                      "& .MuiChip-label": { px: 1.25 },
                    }}
                  />
                )}
              </Typography>

              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  icon={<CategoryIcon fontSize="small" />}
                  label={requestedProduct.category}
                  size="small"
                  variant="outlined"
                />
                {requestedProduct.subcategory && (
                  <Chip
                    label={requestedProduct.subcategory}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              {requestedProduct.isSpecial && requestedProduct.specialOffer ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: "rgba(255, 87, 34, 0.04)",
                    borderColor: "rgba(255, 87, 34, 0.2)",
                    borderRadius: 2,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <LocalOfferIcon color="secondary" sx={{ color: "#ff5722" }} />
                    <Typography variant="h6" sx={{ color: "#ff5722", fontWeight: "bold" }}>
                      Special Offer Information
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Discounted Price</Typography>
                      <Typography variant="h5" color="error.main" fontWeight="bold">
                        ${Number(requestedProduct.specialOffer.sellingPrice).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Original Target</Typography>
                      <Typography variant="body1" sx={{ textDecoration: "line-through", color: "text.disabled" }}>
                        ${Number(requestedProduct.specialOffer.actualPrice || requestedProduct.targetPrice).toFixed(2)}
                      </Typography>
                      <Chip
                        label={`${requestedProduct.specialOffer.discountPercentage}% OFF`}
                        size="small"
                        color="error"
                        sx={{ height: 20, fontSize: "0.7rem", fontWeight: "bold", mt: 0.5 }}
                      />
                    </Grid>
                  </Grid>
                  {requestedProduct.specialOffer.description && (
                    <Box mt={2}>
                      <Divider sx={{ mb: 1, opacity: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">Promotion Details</Typography>
                      <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                        "{requestedProduct.specialOffer.description}"
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ) : (
                requestedProduct.targetPrice && (
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    Target Price: ${Number(requestedProduct.targetPrice).toFixed(2)}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                    >
                      {" "}
                      per {requestedProduct.priceUnit || "item"}
                    </Typography>
                  </Typography>
                )
              )}
              <Typography variant="h6" color="text.primary">
                Quantity Requested: {requestedProduct.quantityRequested}
              </Typography>
              <Typography variant="h6" color="text.primary">
                Delivery Location: {requestedProduct.deliveryLocation}
              </Typography>
              {requestedProduct.fulfillmentDeadline && (
                <Typography variant="h6" color="text.primary">
                  Deadline:{" "}
                  {new Date(
                    requestedProduct.fulfillmentDeadline
                  ).toLocaleDateString()}
                </Typography>
              )}

              <Chip
                label={`Status: ${requestedProduct.status}`}
                color={
                  requestedProduct.status === "pending"
                    ? "warning"
                    : requestedProduct.status === "fulfilled"
                      ? "success"
                      : "info"
                }
                variant="filled"
                sx={{ textTransform: "capitalize", alignSelf: "flex-start" }}
              />

              <Divider />
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  color: "text.secondary",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {requestedProduct.description}
              </Typography>

              <Divider />
              {requestedProduct.requestedBy && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    borderRadius: 1,
                  }}
                >
                  <Avatar
                    src={
                      requestedProduct.requestedBy.profilePicture
                        ? `${API_DOMAIN_FOR_IMAGES}/api/uploads/${requestedProduct.requestedBy.profilePicture.replace(
                          /^uploads\//,
                          ""
                        )}`
                        : undefined
                    }
                    alt={
                      requestedProduct.requestedBy.name ||
                      requestedProduct.requestedBy.companyName
                    }
                  >
                    {!requestedProduct.requestedBy.profilePicture && (
                      <PersonIcon />
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Requested by
                    </Typography>
                    <MuiLink
                      component={RouterLink}
                      to={`/user/profile/${requestedProduct.requestedBy._id}`}
                      underline="hover"
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {requestedProduct.requestedBy.companyName ||
                          requestedProduct.requestedBy.name}
                        {requestedProduct.requestedBy.isVerified && (
                          <VerifiedUserIcon
                            color="success"
                            sx={{
                              fontSize: 16,
                              ml: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </Typography>
                    </MuiLink>
                  </Box>
                </Paper>
              )}

              {requestedProduct.fulfilledBy && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    borderRadius: 1,
                  }}
                >
                  <Avatar
                    src={
                      requestedProduct.fulfilledBy.profilePicture
                        ? `${API_DOMAIN_FOR_IMAGES}/api/uploads/${requestedProduct.fulfilledBy.profilePicture.replace(
                          /^uploads\//,
                          ""
                        )}`
                        : undefined
                    }
                    alt={
                      requestedProduct.fulfilledBy.name ||
                      requestedProduct.fulfilledBy.companyName
                    }
                  >
                    {!requestedProduct.fulfilledBy.profilePicture && (
                      <StorefrontIcon />
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Fulfilled by
                    </Typography>
                    <MuiLink
                      component={RouterLink}
                      to={`/provider/profile/${requestedProduct.fulfilledBy._id}`}
                      underline="hover"
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {requestedProduct.fulfilledBy.companyName ||
                          requestedProduct.fulfilledBy.name}
                        {requestedProduct.fulfilledBy.isVerified && (
                          <VerifiedUserIcon
                            color="success"
                            sx={{
                              fontSize: 16,
                              ml: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </Typography>
                    </MuiLink>
                    {requestedProduct.fulfillmentDate && (
                      <Typography variant="caption" color="text.secondary">
                        on{" "}
                        {new Date(
                          requestedProduct.fulfillmentDate
                        ).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )}

              {/* Action Buttons for Fulfiller/Admin */}
              {(isFulfiller || isAdmin) &&
                requestedProduct.status !== "fulfilled" && (
                  <Box
                    sx={{
                      mt: "auto",
                      pt: 2,
                      borderTop: (theme) =>
                        `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={handleFulfillRequest}
                      disabled={
                        requestedProductActionStatus === "loading" ||
                        !isCreatorVerified // Disable if creator is not verified
                      }
                      fullWidth
                    >
                      {requestedProductActionStatus === "loading" ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Mark as Fulfilled"
                      )}
                    </Button>
                  </Box>
                )}
              {!isCreatorVerified && !isRequester && currentUser?.isSeller && (
                <Alert severity="warning" sx={{ mt: "auto", pt: 2 }}>
                  Requester verification pending. Interaction with this request
                  is currently disabled.
                </Alert>
              )}
            </Box>{" "}
            {/* End of growing content Box */}
            {/* Requester/Admin Action Buttons - at the bottom of the main Stack */}
            {(isRequester || isAdmin) && (
              <Stack
                spacing={1}
                sx={{
                  pt: 2,
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                {requestedProduct?.specialOffer && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Special Deal Status:
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={requestedProduct.specialOffer.status === "active"}
                          onChange={handleToggleSpecialStatus}
                          disabled={isTogglingStatus}
                          size="small"
                          color="secondary"
                        />
                      }
                      label={requestedProduct.specialOffer.status === "active" ? "ON" : "OFF"}
                      labelPlacement="start"
                      sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 700, mr: 1, color: requestedProduct.specialOffer.status === "active" ? "secondary.main" : "text.secondary" } }}
                    />
                  </Box>
                )}

                {!requestedProduct?.isSpecial && !requestedProduct?.specialOffer && (
                  <Button
                    variant="highlighted"
                    size="small"
                    fullWidth
                    startIcon={<LocalOfferIcon />}
                    onClick={handleOpenSpecificDealModal}
                    disabled={requestedProductActionStatus === "loading"}
                  >
                    Special Deals
                  </Button>
                )}

                <Stack direction="row" spacing={1} justifyContent="flex-start">
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={handleEditRequestedProduct}
                    sx={{ flexGrow: 1 }}
                    disabled={requestedProductActionStatus === "loading"}
                  >
                    Edit Request
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleOpenDeleteDialog}
                    disabled={requestedProductActionStatus === "loading"}
                    sx={{ flexGrow: 1 }}
                  >
                    Delete Request
                  </Button>
                </Stack>
              </Stack>
            )}
          </Stack>{" "}
          {/* End of Main Stack for right column */}
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog for Requested Product */}
      {(isRequester || isAdmin) && (
        <DeleteConfirmationDialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleDeleteRequestedProductConfirm}
          title="Delete Product Request"
          contentTypeText={`Are you sure you want to delete the product request "${requestedProduct?.name || "this request"
            }"? This action cannot be undone.`}
          isLoading={requestedProductActionStatus === "loading"}
        />
      )}

      <ServiceSpecificDealModal
        open={isSpecificDealModalOpen}
        onClose={handleCloseSpecificDealModal}
        actionStatus={requestedProductActionStatus}
        onPay={handleListRequestedProductSpecificDealPay}
        initialActualPrice={resolvedSpecialDealActualPrice}
        title="List Requested Product to Special Deal"
        subtitle="Fill in special deal details before continuing to payment."
        payButtonLabel="Continue"
      />

      <SpecialDealPaymentModal
        open={isSpecificDealPaymentModalOpen}
        onClose={handleCloseSpecificDealPaymentModal}
        entityId={requestedProductId}
        idempotencyPrefix="requested-product-special-deal"
        dealPayload={pendingSpecificDealPayload}
        amount={specialDealActivationFee}
        onConfirmPayment={handleSpecificDealPaymentConfirm}
      />
      <ReviewSection listingId={requestedProductId} listingModel="RequestedProduct" />
    </Container>
  );
};

export default RequestedProductDetailPage;

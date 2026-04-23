/* eslint-disable no-unused-vars */
// src/views/Product/ProductDetailPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  Link as RouterLink,
} from "react-router-dom";
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
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // Not used if handleGoBack is simple navigate(-1)
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CategoryIcon from "@mui/icons-material/Category";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
// import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"; // Not used
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

// Product Slice (for viewing product)
import {
  selectCurrentProductDetail,
  selectProductDetailStatus,
  selectProductDetailError,
  clearProductDetailState,
  selectProductActionStatus as selectProductCrudStatus, // Renamed for clarity vs order actions
  selectProductActionError as selectProductCrudError, // Renamed
  clearProductActionState as clearProductCrudState, // Renamed
} from "../../store/slice/productSlice";
import {
  fetchProductByIdThunk,
  editProductThunk,
  deleteProductThunk,
} from "../../store/thunks/productThunks";

// User Slice
import { selectUser } from "../../store/slice/userSlice";
import { showSnackbar } from "../../store/slice/snackbarSlice";

// Product Order Slice (for creating order)
import {
  clearCreatedProductOrderData,
  selectCreatedProductOrderData, // Used for potential direct access after creation if needed
  selectProductOrderActionStatus, // Status for order creation
  selectProductOrderActionError, // Error for order creation
} from "../../store/slice/productOrderSlice";
import { createProductOrderThunk } from "../../store/thunks/productOrderThunks";
import { productOrderApi } from "../../services/productOrderApi";
import { reviewApi } from "../../services/reviewApi";
import { fetchPromotionSettings } from "../../store/thunks/adminPromotionThunk";
import { specialOfferApi } from "../../services/specialOfferApi";

import DeleteConfirmationDialog from "./DeleteConfirmationDialog"; // Ensure path is correct
import TransactionDetails from "../../components/TransactionDetails";
import ServiceSpecificDealModal from "../ServiceRequest/DetailPage/ServiceSpecificDealModal";
import SpecialDealPaymentModal from "../../components/SpecialDealPaymentModal";
import ReviewModal from "../../components/ReviewModal";
import ReviewSection from "../../components/ReviewSection";
import { getSpecialDealActivationFee } from "../../constants/promotions";

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

const ProductDetailPage = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Product Detail State
  const product = useSelector(selectCurrentProductDetail);
  const productDetailStatus = useSelector(selectProductDetailStatus);
  const productDetailError = useSelector(selectProductDetailError);

  // Current User
  const currentUser = useSelector(selectUser);

  // Product CRUD (Edit/Delete) State
  const productCrudActionStatus = useSelector(selectProductCrudStatus);
  // const productCrudActionError = useSelector(selectProductCrudError); // If needed for display

  // Product Order Creation State
  const orderCreateActionStatus = useSelector(selectProductOrderActionStatus);
  // const orderCreateActionError = useSelector(selectProductOrderActionError); // If needed for display

  // Local State
  const [quantity, setQuantity] = useState(1);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false); // Local state for "Buy Now" button
  const [isSpecificDealModalOpen, setIsSpecificDealModalOpen] = useState(false);
  const [isSpecificDealPaymentModalOpen, setIsSpecificDealPaymentModalOpen] =
    useState(false);
  const [pendingSpecificDealPayload, setPendingSpecificDealPayload] =
    useState(null);
  const [eligibleReviewOrder, setEligibleReviewOrder] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasSubmittedProductReview, setHasSubmittedProductReview] =
    useState(false);
  const promotionSettings = useSelector((state) => state.adminPromotion.settings);

  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const currentUserId = currentUser?._id || currentUser?.id;
  const productCreatorId =
    product?.createdBy?._id || product?.createdBy?.id || product?.createdBy;
  const isCurrentUserProductCreator =
    Boolean(currentUserId) &&
    Boolean(productCreatorId) &&
    String(currentUserId) === String(productCreatorId);
  const isOwner = isCurrentUserProductCreator;

  useEffect(() => {
    if (productId) {
      dispatch(clearProductDetailState());
      dispatch(clearProductCrudState());
      dispatch(fetchProductByIdThunk(productId));
    }
    return () => {
      dispatch(clearProductDetailState());
      dispatch(clearProductCrudState());
      dispatch(clearCreatedProductOrderData()); // Clear any pending order creation data
    };
  }, [dispatch, productId]);

  useEffect(() => {
    if (!promotionSettings) {
      dispatch(fetchPromotionSettings());
    }
  }, [dispatch, promotionSettings]);

  const specialDealActivationFee = getSpecialDealActivationFee(promotionSettings);

  useEffect(() => {
    let ignore = false;

    const loadEligibleProductOrderForReview = async () => {
      if (!currentUserId || !productId || isOwner) {
        if (!ignore) setEligibleReviewOrder(null);
        return;
      }

      try {
        const response = await productOrderApi.getMyProductOrders({
          role: "buyer",
          limit: 100,
          page: 1,
        });

        const orders = response?.data?.orders || [];
        const reviewEligibleOrder = orders
          .filter((order) => {
            const eligibleStatus = ["delivered", "completed"].includes(
              String(order?.status || "").toLowerCase()
            );
            const hasCurrentProduct = (order?.items || []).some(
              (item) => String(item?.product?._id) === String(productId)
            );
            return eligibleStatus && hasCurrentProduct;
          })
          .sort(
            (a, b) =>
              new Date(b?.createdAt || 0).getTime() -
              new Date(a?.createdAt || 0).getTime()
          )[0];

        if (!ignore) setEligibleReviewOrder(reviewEligibleOrder || null);
      } catch (error) {
        if (!ignore) setEligibleReviewOrder(null);
      }
    };

    loadEligibleProductOrderForReview();

    return () => {
      ignore = true;
    };
  }, [currentUserId, isOwner, productId]);

  useEffect(() => {
    let ignore = false;

    const checkProductReview = async () => {
      if (!productId || !currentUserId) {
        if (!ignore) setHasSubmittedProductReview(false);
        return;
      }

      try {
        const hasReviewed = await reviewApi.hasUserReviewedListing(
          productId,
          currentUserId
        );
        if (!ignore) setHasSubmittedProductReview(hasReviewed);
      } catch (error) {
        if (!ignore) setHasSubmittedProductReview(false);
      }
    };

    checkProductReview();

    return () => {
      ignore = true;
    };
  }, [productId, currentUserId]);

  const handleGoBack = useCallback(() => navigate(-1), [navigate]);

  const isCreatorVerified = product?.createdBy?.isVerified;

  // --- Owner Actions (Edit/Delete Product) ---
  const handleEditProduct = () => navigate(`/products/edit/${productId}`); // Corrected route from previous
  const handleOpenDeleteDialog = () => setOpenDeleteDialog(true);
  const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);
  const handleOpenSpecificDealModal = () => setIsSpecificDealModalOpen(true);
  const handleCloseSpecificDealModal = () => setIsSpecificDealModalOpen(false);
  const handleCloseSpecificDealPaymentModal = useCallback(() => {
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);
  }, []);

  const handleListServiceSpecificDealPay = useCallback(
    async (dealPayload) => {
      setPendingSpecificDealPayload(dealPayload);
      // Open payment modal on next tick after parent modal closes to avoid modal stack flicker.
      setTimeout(() => {
        setIsSpecificDealPaymentModalOpen(true);
      }, 0);
    },
    []
  );

  const handleToggleSpecialStatus = async (event) => {
    if (!product?.specialOffer?._id) return;
    const newStatus = event.target.checked ? "active" : "inactive";
    setIsTogglingStatus(true);
    try {
      await specialOfferApi.toggleSpecialOfferStatus(
        product.specialOffer._id,
        newStatus
      );
      await dispatch(fetchProductByIdThunk(productId));
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

  const handleSpecificDealPaymentConfirm = useCallback(
    async ({ paymentData, dealPayload }) => {
      const normalizedActualPrice = Number(dealPayload?.actualPrice);
      const normalizedSellingPrice = Number(dealPayload?.sellingPrice);
      const normalizedSpecialDescription = String(
        dealPayload?.specialDescription ?? dealPayload?.description ?? ""
      ).trim();
      const normalizedSpecialOfferSourceId =
        dealPayload?.specialOfferSourceId ?? paymentData?.sourceId;

      if (!productId) {
        throw new Error("Product ID is missing.");
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

      if (normalizedSellingPrice >= normalizedActualPrice) {
        throw new Error(
          "Selling price should be lower than actual price for special deals."
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
        updatePayload.set("specialOfferSourceId", normalizedSpecialOfferSourceId);

        await dispatch(
          editProductThunk({
            productId,
            productFormData: updatePayload,
          })
        ).unwrap();

        await dispatch(fetchProductByIdThunk(productId));

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
    [dispatch, productId]
  );

  const handleDeleteProductConfirm = async () => {
    if (!productId || productCrudActionStatus === "loading") return;
    try {
      await dispatch(deleteProductThunk(productId)).unwrap();
      setOpenDeleteDialog(false);
      navigate(isOwner ? "/user/my-products" : "/products"); // Go to my products if owner, else public list
    } catch (err) {
      console.error("Failed to delete product:", err);
      // Potentially show an error message via snackbar or alert
      setOpenDeleteDialog(false);
    }
  };

  // --- Buyer Action (Place Order / Buy Now) ---
  const handleInitiateOrder = async () => {
    if (!product || !currentUser) {
      // Redirect to login if not logged in, or show error if product is somehow null
      if (!currentUser)
        navigate("/auth/signin", { state: { from: location.pathname } });
      else console.error("Product data missing for order.");
      return;
    }
    if (isOwner) {
      alert("You cannot buy your own product.");
      return;
    }
    if (product.stock < quantity) {
      alert("Not enough stock available for the selected quantity.");
      return;
    }

    setIsSubmittingOrder(true);
    dispatch(clearCreatedProductOrderData());

    // --- IMPORTANT: Shipping Address ---
    // In a real app, you'd get this from user's profile, a form, or a shipping address selector.
    // For this example, we'll use placeholder data.
    // You MUST replace this with actual shipping address collection.
    const placeholderShippingAddress = {
      name: currentUser.name || "Test Buyer",
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      postalCode: "12345",
      country: "USA",
      phone: currentUser.phone || "555-1234",
    };

    if (
      !placeholderShippingAddress.name ||
      !placeholderShippingAddress.street ||
      !placeholderShippingAddress.city ||
      !placeholderShippingAddress.state ||
      !placeholderShippingAddress.country ||
      !placeholderShippingAddress.postalCode
    ) {
      alert(
        "Shipping address is incomplete. Please update your profile or provide a complete address."
      );
      setIsSubmittingOrder(false);
      return;
    }

    const orderPayload = {
      items: [{ productId: product._id, quantity: quantity }],
      shippingAddress: placeholderShippingAddress,
      // additionalInfo: "Optional notes from buyer if you have a field for it"
    };

    try {
      const actionResult = await dispatch(
        createProductOrderThunk(orderPayload)
      ).unwrap();
      if (actionResult.order?._id) {
        navigate(`/product-checkout/payment?productOrderId=${actionResult.order._id}`);
      } else {
        console.error(
          "Order creation response missing critical data:",
          actionResult
        );
        alert(
          actionResult.message ||
          "Failed to initialize payment. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to create product order:", error);
      alert(
        error.message ||
        "An error occurred while placing your order. Please try again."
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (productDetailStatus === "loading" && !product) {
    /* ... loading UI ... */
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress /> <Typography ml={2}>Loading product...</Typography>
      </Box>
    );
  }
  if (productDetailStatus === "failed" && !product) {
    /* ... error UI ... */
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load product:{" "}
          {productDetailError?.message || productDetailError}.
          <Button onClick={handleGoBack} sx={{ ml: 1 }}>
            Back
          </Button>
        </Alert>
      </Container>
    );
  }
  if (!product) {
    /* ... not found UI ... */
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          Product not found.{" "}
          <Button onClick={handleGoBack} sx={{ ml: 1 }}>
            Back
          </Button>
        </Alert>
      </Container>
    );
  }

  const mainImage =
    product.images && product.images.length > 0
      ? `${API_DOMAIN_FOR_IMAGES}/api/uploads/${product.images[0].startsWith("uploads/") ||
        product.images[0].startsWith("products/")
        ? product.images[0]
          .split("/")
          .slice(product.images[0].includes("uploads/") ? 1 : 0)
          .join("/")
        : product.images[0]
      }`
      : "https://placehold.co/800x600/E0E0E0/757575?text=Product+Image";
  const resolvedSpecialDealActualPrice =
    Number(product?.price) > 0 ? Number(product.price).toString() : "";

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
        <MuiLink component={RouterLink} to="/products" color="inherit">
          Products
        </MuiLink>
        {product.category && (
          <MuiLink
            component={RouterLink}
            to={`/products?category=${encodeURIComponent(product.category)}`}
            color="inherit"
          >
            {product.category}
          </MuiLink>
        )}
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          {product.name}
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
                alt={product.name}
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

        {/* Right: Product Info, Actions */}
        <Grid item xs={12} md={6}>
          <Stack
            spacing={2}
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Box
              sx={{
                // flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  {product.name}
                </Typography>
                {product.isSpecial && (
                  <Chip
                    label="Special Deal Offer"
                    size="small"
                    icon={<LocalOfferIcon sx={{ fontSize: "1rem !important", color: "white !important" }} />}
                    sx={{
                      backgroundColor: "#9c27b0", // Purple
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
              </Box>
              {product.isCommunity && (
                <Box>
                  <Chip
                    label="Community Offer"
                    size="small"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "#009688",
                      color: "white",
                    }}
                  />
                </Box>
              )}
              {/* ... other product details: brand, category, price, stock, description, specs, seller info ... */}
              {product.brand && (
                <Typography variant="subtitle1" color="text.secondary">
                  Brand: {product.brand}
                </Typography>
              )}
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  icon={<CategoryIcon fontSize="small" />}
                  label={product.category}
                  size="small"
                  variant="outlined"
                />
                {product.subcategory && (
                  <Chip
                    label={product.subcategory}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              {product.isSpecial && product.specialOffer ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.disabled",
                      textDecoration: "line-through",
                      lineHeight: 1,
                    }}
                  >
                    ${Number(product.specialOffer.actualPrice || product.price).toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      ${Number(product.specialOffer.sellingPrice).toFixed(2)}
                    </Typography>
                    {(product.specialOffer.discountPercentage !== undefined && product.specialOffer.discountPercentage !== null) && (
                      <Chip
                        label={`${product.specialOffer.discountPercentage}% OFF`}
                        size="small"
                        sx={{
                          backgroundColor: "error.main",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          borderRadius: "4px",
                          height: "24px",
                        }}
                      />
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      per {product.priceUnit || "item"}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  ${Number(product.price).toFixed(2)}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    {" "}
                    per {product.priceUnit || "item"}
                  </Typography>
                </Typography>
              )}
              {product.stock > 0 && product.stock <= 10 && !isOwner && (
                <Typography variant="body2" color="error.main">
                  Only {product.stock} left in stock!
                </Typography>
              )}
              {product.stock <= 0 && !isOwner && (
                <Chip label="Out of Stock" color="error" variant="filled" />
              )}
              {isOwner && (
                <Typography variant="body2" color="info.main">
                  Stock: {product.stock}
                </Typography>
              )}

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
                {product.description}
              </Typography>
              {/* ... (specifications, seller info - kept existing structure) ... */}
              {product.specifications && product.specifications.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Specifications
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    <List dense>
                      {product.specifications.map((spec) => (
                        <ListItem
                          key={spec.key}
                          disableGutters
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {spec.key}:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {spec.value}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}
              <Divider />
              {product.createdBy && (
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
                      product.createdBy.profilePicture
                        ? `${API_DOMAIN_FOR_IMAGES}/api/uploads/${product.createdBy.profilePicture.replace(
                          /^uploads\//,
                          ""
                        )}`
                        : undefined
                    }
                    alt={
                      product.createdBy.name || product.createdBy.companyName
                    }
                  >
                    {!product.createdBy.profilePicture && <StorefrontIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Sold by
                    </Typography>
                    <MuiLink
                      component={RouterLink}
                      to={`/provider/profile/${product.createdBy._id}`}
                      underline="hover"
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {product.createdBy.companyName ||
                          product.createdBy.name}
                        {product.createdBy.isVerified && (
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

              {/* "Add to Cart / Buy Now" or "Order Now" section for non-owners */}
              {product.status === "active" && product.stock > 0 && !isOwner && (
                <>
                  {currentUser ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      sx={{
                        mt: "auto",
                        pt: 2,
                        borderTop: (theme) =>
                          `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {" "}
                      {/* Pushed to bottom of this inner Box */}
                      <TextField
                        type="number"
                        label="Qty"
                        value={quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= 1 && val <= product.stock) setQuantity(val);
                          else if (val < 1) setQuantity(1);
                          else if (val > product.stock)
                            setQuantity(product.stock);
                        }}
                        inputProps={{ min: 1, max: product.stock }}
                        sx={{ width: "80px" }}
                        size="small"
                        disabled={
                          isSubmittingOrder ||
                          orderCreateActionStatus === "loading"
                        }
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<ShoppingCartCheckoutIcon />}
                        onClick={handleInitiateOrder} // <<< MODIFIED
                        disabled={
                          isSubmittingOrder ||
                          orderCreateActionStatus === "loading" ||
                          product.stock < quantity ||
                          quantity < 1 ||
                          !isCreatorVerified // Disable if creator is not verified
                        }
                        sx={{ flexGrow: 1 }}
                      >
                        {isSubmittingOrder ||
                          orderCreateActionStatus === "loading" ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Buy Now"
                        )}
                      </Button>
                    </Box>
                  ) : (
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
                        color="primary"
                        size="large"
                        fullWidth
                        onClick={() =>
                          navigate("/auth/signin", {
                            state: { from: location.pathname },
                          })
                        }
                      >
                        Sign in to interact
                      </Button>
                    </Box>
                  )}
                </>
              )}

              {eligibleReviewOrder && !isOwner ? (
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => setIsReviewModalOpen(true)}
                  disabled={hasSubmittedProductReview}
                >
                  {hasSubmittedProductReview ? "Reviewed" : "Add Review"}
                </Button>
              ) : null}

              {!isCreatorVerified && !isOwner && (
                <Alert severity="warning" sx={{ mt: "auto", pt: 2 }}>
                  Seller verification pending. Interaction with this product is
                  currently disabled.
                </Alert>
              )}
              {product.status === "active" &&
                product.stock <= 0 &&
                !isOwner && (
                  <Alert severity="warning" sx={{ mt: "auto", pt: 2 }}>
                    This product is currently out of stock.
                  </Alert>
                )}
            </Box>{" "}
            {/* End of growing content Box */}
            {/* Owner Action Buttons - at the bottom of the main Stack */}
            {isCurrentUserProductCreator && (
              <Stack
                spacing={1}
                sx={{
                  pt: 2,
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                {product?.specialOffer && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Special Deal Status:
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={product.specialOffer.status === "active"}
                          onChange={handleToggleSpecialStatus}
                          disabled={isTogglingStatus}
                          size="small"
                          color="secondary"
                        />
                      }
                      label={product.specialOffer.status === "active" ? "ON" : "OFF"}
                      labelPlacement="start"
                      sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 700, mr: 1, color: product.specialOffer.status === "active" ? "secondary.main" : "text.secondary" } }}
                    />
                  </Box>
                )}

                {!product?.isSpecial && !product?.specialOffer && (
                  <Button
                    variant="highlighted"
                    size="small"
                    fullWidth
                    startIcon={<LocalOfferIcon />}
                    onClick={handleOpenSpecificDealModal}
                    disabled={productCrudActionStatus === "loading"}
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
                    onClick={handleEditProduct}
                    sx={{ flexGrow: 1 }}
                    disabled={productCrudActionStatus === "loading"}
                  >
                    Edit Product
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleOpenDeleteDialog}
                    disabled={productCrudActionStatus === "loading"}
                    sx={{ flexGrow: 1 }}
                  >
                    Delete Product
                  </Button>
                </Stack>
              </Stack>
            )}

            {/* UNIQUE FOR OWNER: Transaction details if product was sold */}
            {isOwner && product.transactionDetails && (
              <TransactionDetails transaction={product.transactionDetails} />
            )}
          </Stack>{" "}
          {/* End of Main Stack for right column */}
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog for Product */}
      {isOwner && (
        <DeleteConfirmationDialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleDeleteProductConfirm}
          title="Delete Product"
          contentTypeText={`Are you sure you want to delete the product "${product?.name || "this product"
            }"? This action cannot be undone.`}
          isLoading={productCrudActionStatus === "loading"}
        />
      )}

      <ServiceSpecificDealModal
        open={isSpecificDealModalOpen}
        onClose={handleCloseSpecificDealModal}
        actionStatus={productCrudActionStatus}
        onPay={handleListServiceSpecificDealPay}
        initialActualPrice={resolvedSpecialDealActualPrice}
        isRequest={false}
      />

      <SpecialDealPaymentModal
        open={isSpecificDealPaymentModalOpen}
        onClose={handleCloseSpecificDealPaymentModal}
        entityId={productId}
        idempotencyPrefix="product-special-deal"
        dealPayload={pendingSpecificDealPayload}
        amount={specialDealActivationFee}
        onConfirmPayment={handleSpecificDealPaymentConfirm}
      />

      <ReviewModal
        open={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        orderId={eligibleReviewOrder?._id}
        orderModel="ProductOrder"
        listingId={product?._id}
        listingModel="Product"
        title="Review This Product"
        onSuccess={() => {
          setHasSubmittedProductReview(true);
        }}
      />

      <ReviewSection listingId={productId} listingModel="Product" />
    </Container>
  );
};

export default ProductDetailPage;

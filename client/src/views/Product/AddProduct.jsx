/* eslint-disable no-unused-vars */
// src/views/Product/AddProduct.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Alert,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useDispatch, useSelector } from "react-redux";
import {
  clearProductActionState,
  selectProductActionError,
  selectProductActionStatus,
} from "../../store/slice/productSlice";
import { addProductThunk } from "../../store/thunks/productThunks";
import ProductForm from "./ProductForm";
import { selectIsLoggedIn, selectUser } from "../../store/slice/userSlice";
import {
  completeInitialSubmission,
  selectFormSubmissionRequired, // Import the selector
} from "../../store/slice/navigationSlice"; // Import the action
import { showSnackbar } from "../../store/slice/snackbarSlice"; // Import showSnackbar
import ServiceSpecificDealModal from "../ServiceRequest/DetailPage/ServiceSpecificDealModal";
import SpecialDealPaymentModal from "../../components/SpecialDealPaymentModal";
import RequestTypeChoiceModal from "../ServiceRequest/RequestTypeChoiceModal";
import {
  buildCommunityOfferRequestTypeOptions,
  buildFeaturedRequestTypeOptions,
  getSpecialDealActivationFee,
  mapSelectionToSubmissionPayload,
  PROMOTION_PRICING_PROFILES,
} from "../../constants/promotions";
import { fetchPromotionSettings } from "../../store/thunks/adminPromotionThunk";

const getPositiveAmountFromFormData = (formDataInstance, key) => {
  const parsedValue = Number(formDataInstance?.get(key));
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue.toString()
    : "";
};

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isCommunityOffersFlow = Boolean(
    location.state?.fromCommunityOffers || location.state?.isCommunity
  );

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);

  const actionStatus = useSelector(selectProductActionStatus);
  const actionError = useSelector(selectProductActionError);
  const promotionSettings = useSelector((state) => state.adminPromotion.settings);
  const formSubmissionRequired = useSelector(selectFormSubmissionRequired); // Select from navigation slice
  const featuredRequestTypeOptions = React.useMemo(
    () => buildFeaturedRequestTypeOptions(promotionSettings),
    [promotionSettings],
  );
  const specialDealActivationFee = React.useMemo(
    () => getSpecialDealActivationFee(promotionSettings),
    [promotionSettings],
  );
  const communityRequestTypeOptions = React.useMemo(
    () => buildCommunityOfferRequestTypeOptions(promotionSettings),
    [promotionSettings],
  );
  const requestTypeOptions = isCommunityOffersFlow
    ? communityRequestTypeOptions
    : featuredRequestTypeOptions;

  const isLoading = actionStatus === "loading";
  const isSpecialDealFlow = Boolean(location.state?.isSpecialDeal);
  const [listAsSpecialDeal, setListAsSpecialDeal] = useState(isSpecialDealFlow);
  const [shouldNavigateAfterSuccess, setShouldNavigateAfterSuccess] =
    useState(false);
  const [communityFee, setCommunityFee] = useState(0);
  const [createdProductId, setCreatedProductId] = useState(null);
  const [isSpecificDealModalOpen, setIsSpecificDealModalOpen] =
    useState(false);
  const [isSpecificDealPaymentModalOpen, setIsSpecificDealPaymentModalOpen] =
    useState(false);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(0);
  const [pendingSpecificDealPayload, setPendingSpecificDealPayload] =
    useState(null);
  const [specialDealActualPrice, setSpecialDealActualPrice] = useState("");
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const isTransitioningToPaymentRef = useRef(false);
  const didSubmitSpecialDealPaymentRef = useRef(false);
  const isProceedingToDealRef = useRef(false);
  const pendingProductFormDataRef = useRef(null);

  useEffect(() => {
    // Clear any previous action state when component mounts
    dispatch(clearProductActionState());

    // if (!isLoggedIn || !user?.isVerified) {
    //   navigate("/"); // Redirect if not logged in or not verified
    //   // Optionally, show a message: enqueueSnackbar("Please log in and verify your email to add products.", { variant: "warning" });
    // }

    return () => {
      dispatch(clearProductActionState()); // Clear on unmount too
    };
  }, [dispatch, isLoggedIn, user, navigate]);

  useEffect(() => {
    if (!promotionSettings) {
      dispatch(fetchPromotionSettings());
    }
  }, [dispatch, promotionSettings]);

  // Effect to handle navigation after successful submission and state update
  useEffect(() => {
    if (
      actionStatus === "succeeded" &&
      shouldNavigateAfterSuccess &&
      !formSubmissionRequired
    ) {
      const timer = setTimeout(() => {
        navigate(isCommunityOffersFlow ? "/community-offers/categories" : "/user/my-products"); // Navigate to a safe page after submission
        dispatch(clearProductActionState()); // Clear state after navigation
      }, 500); // Small delay to ensure state propagation
      return () => clearTimeout(timer);
    }
  }, [
    actionStatus,
    shouldNavigateAfterSuccess,
    formSubmissionRequired,
    navigate,
    dispatch,
  ]);

  const handleCloseSpecificDealModal = useCallback(() => {
    setIsSpecificDealModalOpen(false);

    // If first modal was closed as part of moving to payment modal, skip cancel flow.
    if (isTransitioningToPaymentRef.current) {
      isTransitioningToPaymentRef.current = false;
      return;
    }

    if (!pendingSpecificDealPayload) {
      pendingProductFormDataRef.current = null;
      dispatch(
        showSnackbar({
          message:
            "Product was not created because payment flow was cancelled.",
          severity: "info",
        })
      );
    }
  }, [dispatch, pendingSpecificDealPayload]);

  const handleCloseSpecificDealPaymentModal = useCallback(() => {
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);
    setSpecialDealActualPrice("");

    if (!didSubmitSpecialDealPaymentRef.current) {
      pendingProductFormDataRef.current = null;
      dispatch(
        showSnackbar({
          message:
            "Product was not created because payment was not completed.",
          severity: "info",
        })
      );
    }

    didSubmitSpecialDealPaymentRef.current = false;
  }, [dispatch]);

  const handleTypeModalClose = useCallback(() => {
    setIsTypeModalOpen(false);

    // If we are moving to the special deal details modal, keep the ref.
    if (isProceedingToDealRef.current) {
      isProceedingToDealRef.current = false;
      return;
    }

    pendingProductFormDataRef.current = null;
  }, []);

  const handleListServiceSpecificDealPay = useCallback(async (dealPayload) => {
    isTransitioningToPaymentRef.current = true;
    setPendingSpecificDealPayload(dealPayload);
    didSubmitSpecialDealPaymentRef.current = false;
    // Open payment modal after deal form closes to avoid overlap race.
    setTimeout(() => {
      setIsSpecificDealPaymentModalOpen(true);
    }, 0);
  }, []);

  const totalPaymentAmount = selectedPlanPrice + (listAsSpecialDeal ? specialDealActivationFee : 0);

  const handleSpecificDealPaymentConfirm = useCallback(
    async ({ paymentData, dealPayload }) => {
      const pendingProductFormData = pendingProductFormDataRef.current;

      if (!pendingProductFormData) {
        throw new Error(
          "Product form data is missing. Please fill the form again."
        );
      }

      if (listAsSpecialDeal) {
        const normalizedActualPrice = Number(dealPayload?.actualPrice);
        const normalizedSellingPrice = Number(dealPayload?.sellingPrice);
        const normalizedSpecialDescription = String(
          dealPayload?.specialDescription ?? dealPayload?.description ?? ""
        ).trim();
        const normalizedSpecialDuration = Number(dealPayload?.specialDealDuration);

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

        if (!Number.isFinite(normalizedSpecialDuration) || normalizedSpecialDuration <= 0) {
          throw new Error("Special deal duration is invalid.");
        }

        pendingProductFormData.set("isSpecial", "true");
        pendingProductFormData.set(
          "actualPrice",
          String(normalizedActualPrice)
        );
        pendingProductFormData.set(
          "sellingPrice",
          String(normalizedSellingPrice)
        );
        pendingProductFormData.set(
          "specialDescription",
          normalizedSpecialDescription
        );
        pendingProductFormData.set(
          "specialDealDuration",
          String(normalizedSpecialDuration)
        );
      }

      if (!paymentData?.sourceId) {
        throw new Error(
          "Payment token is missing. Please re-enter your card details."
        );
      }

      pendingProductFormData.set("specialOfferSourceId", paymentData.sourceId);

      // Ensure durationMonths is handled if present
      if (pendingProductFormData.get("promotionDurationMonths")) {
        pendingProductFormData.set("durationMonths", pendingProductFormData.get("promotionDurationMonths"));
      }

      // Dispatch addProductThunk with the complete combined payload.
      const response = await dispatch(
        addProductThunk(pendingProductFormData)
      ).unwrap();
      const createdId = response?.product?._id || response?._id;
      setCreatedProductId(createdId || null);
      dispatch(completeInitialSubmission());

      const finalPayload = {
        isSpecial: listAsSpecialDeal,
        specialOfferSourceId: paymentData.sourceId,
        paymentData,
        productId: createdId || null,
        ...(listAsSpecialDeal && {
          actualPrice: Number(dealPayload?.actualPrice),
          sellingPrice: Number(dealPayload?.sellingPrice),
          specialDescription: String(
            dealPayload?.specialDescription ?? dealPayload?.description ?? ""
          ).trim(),
          specialDealDuration: Number(dealPayload?.specialDealDuration),
        }),
      };

      // Hook for future backend/API integration.
      console.log("Create product special deal combined payload:", finalPayload);

      didSubmitSpecialDealPaymentRef.current = true;

      pendingProductFormDataRef.current = null;
      dispatch(
        showSnackbar({
          message:
            "Special deal and promotion submitted successfully! Redirecting...",
          severity: "success",
        })
      );
      setShouldNavigateAfterSuccess(true);
    },
    [dispatch, isCommunityOffersFlow, listAsSpecialDeal]
  );

  const handleRequestTypeChosen = async (chosenRequestType) => {
    isProceedingToDealRef.current = false;
    setIsTypeModalOpen(false);
    const productFormData = pendingProductFormDataRef.current;
    if (!productFormData) {
      dispatch(
        showSnackbar({
          message: "No staged product data found.",
          severity: "error",
        })
      );
      return;
    }

    const submissionPayload =
      mapSelectionToSubmissionPayload(chosenRequestType);

    const selectedOption = requestTypeOptions.find(
      (opt) => opt.value === chosenRequestType,
    );
    const feeUsd = selectedOption?.price ?? selectedOption?.feeUsd ?? 0;
    setCommunityFee(feeUsd);

    productFormData.set("requestType", submissionPayload.requestType);
    if (submissionPayload.promotionDurationMonths) {
      productFormData.set(
        "durationMonths",
        String(submissionPayload.promotionDurationMonths)
      );
      // Fallback for legacy
      productFormData.set(
        "promotionDurationMonths",
        String(submissionPayload.promotionDurationMonths)
      );
    } else {
      productFormData.delete("durationMonths");
      productFormData.delete("promotionDurationMonths");
    }

    if (isCommunityOffersFlow) {
      productFormData.set(
        "promotionPricingProfile",
        PROMOTION_PRICING_PROFILES.COMMUNITY_OFFERS
      );
      productFormData.set("fromCommunityOffers", "true");
      productFormData.set("isCommunity", "true");
    }

    const chosenPlan = requestTypeOptions.find(
      (opt) => opt.value === chosenRequestType,
    );
    const planPrice = chosenPlan?.price || 0;
    setSelectedPlanPrice(planPrice);

    // Transition to Special Deal flow if enabled
    if (listAsSpecialDeal) {
      isProceedingToDealRef.current = true;
      dispatch(
        showSnackbar({
          message: "Plan selected. Now fill special deal details.",
          severity: "info",
        })
      );
      setTimeout(() => {
        setIsSpecificDealModalOpen(true);
      }, 300);
      return;
    }

    // If no special deal, but a paid plan is selected, transition to payment directly.
    if (planPrice > 0) {
      dispatch(
        showSnackbar({
          message: "Plan selected. Please complete payment to activate.",
          severity: "info",
        })
      );
      setTimeout(() => {
        setIsSpecificDealPaymentModalOpen(true);
      }, 300);
      return;
    }

    try {
      const result = await dispatch(addProductThunk(productFormData)).unwrap();
      const createdId = result?.product?._id || result?._id;
      setCreatedProductId(createdId || null);
      dispatch(completeInitialSubmission());

      if (
        result.paymentRequired &&
        result.clientSecret &&
        result.promotionOrder?._id
      ) {
        dispatch(
          showSnackbar({
            message: "Please complete payment to promote your product.",
            severity: "info",
          })
        );

        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          navigate(isCommunityOffersFlow ? "/community-offers/categories" : "/user/my-products");
        }
      } else {
        dispatch(
          showSnackbar({
            message: result?.message || "Product added successfully!",
            severity: "success",
          })
        );
        setShouldNavigateAfterSuccess(true);
      }
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error?.message || "Failed to add product.",
          severity: "error",
        })
      );
    } finally {
      pendingProductFormDataRef.current = null;
    }
  };

  const initialProductData = React.useMemo(() => ({
    isCommunity: isCommunityOffersFlow
  }), [isCommunityOffersFlow]);

  const handleAddProductSubmit = async (productFormData) => {
    // productFormData is already a FormData object from ProductForm
    setShouldNavigateAfterSuccess(false);
    setCreatedProductId(null);
    setIsSpecificDealModalOpen(false);
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);
    setSpecialDealActualPrice("");
    setCommunityFee(0);
    isTransitioningToPaymentRef.current = false;
    didSubmitSpecialDealPaymentRef.current = false;
    isProceedingToDealRef.current = false;
    pendingProductFormDataRef.current = null;

    const resolvedActualPrice = getPositiveAmountFromFormData(
      productFormData,
      "price"
    );

    // Community Offers flow prioritizes the Plan Selection modal first.
    if (isCommunityOffersFlow) {
      pendingProductFormDataRef.current = productFormData;
      setSpecialDealActualPrice(resolvedActualPrice); // Ensure price is set for special deal modal later
      setIsTypeModalOpen(true);
      return;
    }

    if (listAsSpecialDeal) {
      pendingProductFormDataRef.current = productFormData;
      setSpecialDealActualPrice(resolvedActualPrice);
      dispatch(
        showSnackbar({
          message:
            "Complete payment to create this product as a special deal.",
          severity: "info",
        })
      );
      setIsSpecificDealModalOpen(true);
      return;
    }

    try {
      const response = await dispatch(addProductThunk(productFormData)).unwrap();
      const createdId = response?.product?._id || response?._id;

      setCreatedProductId(createdId || null);
      dispatch(completeInitialSubmission()); // Complete the initial submission

      dispatch(
        showSnackbar({
          message: response?.message || "Product added successfully!",
          severity: "success",
        })
      );
      setShouldNavigateAfterSuccess(true);
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error?.message || "Failed to add product.",
          severity: "error",
        })
      );
      // Error is already in Redux state (actionError), form can display it or a general message.
    }
  };

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
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          Add New Product
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Add New Product
      </Typography>
      {actionError && actionStatus === "failed" && !isLoading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      <ProductForm
        onSubmit={handleAddProductSubmit}
        isLoading={isLoading}
        submitButtonText="Create Product"
        initialData={initialProductData}
        showSpecialDealOption
        listAsSpecialDeal={listAsSpecialDeal}
        onListAsSpecialDealChange={setListAsSpecialDeal}
        disableSpecialDealOption={isSpecialDealFlow}
      />

      <ServiceSpecificDealModal
        open={isSpecificDealModalOpen}
        onClose={handleCloseSpecificDealModal}
        actionStatus={actionStatus}
        onPay={handleListServiceSpecificDealPay}
        initialActualPrice={specialDealActualPrice}
        isRequest={false}
      />

      <SpecialDealPaymentModal
        open={isSpecificDealPaymentModalOpen}
        onClose={handleCloseSpecificDealPaymentModal}
        entityId={createdProductId}
        idempotencyPrefix="product-create-special-deal"
        title={
          listAsSpecialDeal
            ? "Special Deal Activation"
            : "Community Promotion Payment"
        }
        subheader={
          listAsSpecialDeal
            ? "Enter your card details below to activate this special deal."
            : "Enter your card details below to activate your promotional plan."
        }
        amount={totalPaymentAmount}
        amountLabel={
          listAsSpecialDeal ? "Activation + Promotion Fee" : "Promotion Fee"
        }
        dealPayload={pendingSpecificDealPayload}
        onConfirmPayment={handleSpecificDealPaymentConfirm}
      />

      <RequestTypeChoiceModal
        open={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onConfirm={handleRequestTypeChosen}
        options={requestTypeOptions}
      />
    </Container>
  );
};

export default AddProduct;

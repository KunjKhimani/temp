/* eslint-disable no-unused-vars */
// src/views/RequestedProduct/CreateRequestedProduct.jsx
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
  clearRequestedProductActionState,
  selectRequestedProductActionError,
  selectRequestedProductActionStatus,
} from "../../store/slice/requestedProductSlice";
import { addRequestedProductThunk } from "../../store/thunks/requestedProductThunks";
import RequestedProductForm from "./RequestedProductForm"; // Import the new form component
import { selectIsLoggedIn, selectUser } from "../../store/slice/userSlice";
import {
  completeInitialSubmission,
  selectFormSubmissionRequired, // Import the selector
} from "../../store/slice/navigationSlice"; // Import the action
import { showSnackbar } from "../../store/slice/snackbarSlice";
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

const CreateRequestedProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isCommunity = Boolean(
    location.state?.isCommunity || location.state?.fromCommunityOffers
  );

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);

  const actionStatus = useSelector(selectRequestedProductActionStatus);
  const actionError = useSelector(selectRequestedProductActionError);
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
  const requestTypeOptions = isCommunity
    ? communityRequestTypeOptions
    : featuredRequestTypeOptions;

  const isLoading = actionStatus === "loading";
  const isSpecialDealFlow = Boolean(location.state?.isSpecialDeal) && !isCommunity;
  const [listAsSpecialDeal, setListAsSpecialDeal] = useState(isSpecialDealFlow);
  const isSpecialDealSelected = listAsSpecialDeal || isSpecialDealFlow;
  const [isSpecificDealModalOpen, setIsSpecificDealModalOpen] = useState(false);
  const [isSpecificDealPaymentModalOpen, setIsSpecificDealPaymentModalOpen] =
    useState(false);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(0);
  const [pendingSpecificDealPayload, setPendingSpecificDealPayload] =
    useState(null);
  const [specialDealActualPrice, setSpecialDealActualPrice] = useState("");
  const [communityFee, setCommunityFee] = useState(0);
  const [createdRequestedProductId, setCreatedRequestedProductId] =
    useState(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const pendingRequestedProductFormDataRef = useRef(null);
  const isTransitioningToPaymentRef = useRef(false);
  const didSubmitSpecialDealPaymentRef = useRef(false);

  useEffect(() => {
    dispatch(clearRequestedProductActionState());

    // Optional: Redirect if not logged in
    // if (!isLoggedIn) {
    //   navigate("/login");
    //   dispatch(showSnackbar({ message: "Please log in to create a product request.", severity: "warning" }));
    // }

    return () => {
      dispatch(clearRequestedProductActionState());
    };
  }, [dispatch, isLoggedIn, navigate]);

  useEffect(() => {
    if (!promotionSettings) {
      dispatch(fetchPromotionSettings());
    }
  }, [dispatch, promotionSettings]);

  useEffect(() => {
    if (isSpecialDealFlow) {
      setListAsSpecialDeal(true);
    }
  }, [isSpecialDealFlow]);

  // Effect to handle navigation after successful submission and state update
  useEffect(() => {
    if (actionStatus === "succeeded" && !formSubmissionRequired) {
      // Assuming response.requestedProduct._id is available from a previous state or context
      // For simplicity, we'll navigate to a generic success page or home if the ID isn't easily accessible here.
      // In a real app, you might store the ID in a local state or another Redux slice.
      // For now, let's navigate to a placeholder or home.
      // If the ID is needed, it would have to be passed from handleAddRequestedProductSubmit
      // to a local state, and then used here.
      // For demonstration, let's assume we navigate to a general requested products list.
      navigate(isCommunity ? "/community-offers/categories" : "/requested-products"); // Navigate to a safe page after submission
    }
  }, [actionStatus, formSubmissionRequired, navigate]);

  const handleCloseSpecificDealModal = useCallback(() => {
    setIsSpecificDealModalOpen(false);

    if (isTransitioningToPaymentRef.current) {
      isTransitioningToPaymentRef.current = false;
      return;
    }

    if (!pendingSpecificDealPayload) {
      pendingRequestedProductFormDataRef.current = null;
      dispatch(
        showSnackbar({
          message:
            "Product request was not created because payment flow was cancelled.",
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
      pendingRequestedProductFormDataRef.current = null;
      dispatch(
        showSnackbar({
          message:
            "Product request was not created because payment was not completed.",
          severity: "info",
        })
      );
    }

    didSubmitSpecialDealPaymentRef.current = false;
  }, [dispatch]);

  const handleListRequestedProductSpecificDealPay = useCallback(
    async (dealPayload) => {
      isTransitioningToPaymentRef.current = true;
      setPendingSpecificDealPayload(dealPayload);
      didSubmitSpecialDealPaymentRef.current = false;
      setTimeout(() => {
        setIsSpecificDealPaymentModalOpen(true);
      }, 0);
    },
    []
  );

  const handleSpecificDealPaymentConfirm = useCallback(
    async ({ paymentData, dealPayload }) => {
      const pendingRequestedProductFormData =
        pendingRequestedProductFormDataRef.current;

      if (!pendingRequestedProductFormData) {
        throw new Error(
          "Requested product form data is missing. Please fill the form again."
        );
      }

      if (isSpecialDealSelected) {
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

        if (normalizedSellingPrice <= normalizedActualPrice) {
          throw new Error(
            "Selling price should be higher than actual price for requested products."
          );
        }

        if (!normalizedSpecialDescription) {
          throw new Error("Special description is required.");
        }

        if (!Number.isFinite(normalizedSpecialDuration) || normalizedSpecialDuration <= 0) {
          throw new Error("Special deal duration is invalid.");
        }

        pendingRequestedProductFormData.set("isSpecial", "true");
        pendingRequestedProductFormData.set(
          "actualPrice",
          String(normalizedActualPrice)
        );
        pendingRequestedProductFormData.set(
          "sellingPrice",
          String(normalizedSellingPrice)
        );
        pendingRequestedProductFormData.set(
          "specialDescription",
          normalizedSpecialDescription
        );
        pendingRequestedProductFormData.set(
          "specialDealDuration",
          String(normalizedSpecialDuration)
        );
      }

      if (!paymentData?.sourceId) {
        throw new Error(
          "Payment token is missing. Please re-enter your card details."
        );
      }

      pendingRequestedProductFormData.set(
        "specialOfferSourceId",
        paymentData.sourceId
      );

      if (isCommunity) {
        pendingRequestedProductFormData.set("isCommunity", "true");
      }

      // Dispatch addRequestedProductThunk with the complete combined payload.
      const response = await dispatch(
        addRequestedProductThunk(pendingRequestedProductFormData)
      ).unwrap();

      const createdId = response?.requestedProduct?._id || response?._id;
      setCreatedRequestedProductId(createdId || null);
      dispatch(completeInitialSubmission());

      const finalPayload = {
        isSpecial: isSpecialDealSelected,
        specialOfferSourceId: paymentData.sourceId,
        paymentData,
        requestedProductId: createdId || null,
        isCommunity: isCommunity,
        ...(isSpecialDealSelected && {
          actualPrice: Number(dealPayload?.actualPrice),
          sellingPrice: Number(dealPayload?.sellingPrice),
          specialDescription: String(
            dealPayload?.specialDescription ?? dealPayload?.description ?? ""
          ).trim(),
          specialDealDuration: Number(dealPayload?.specialDealDuration),
        }),
      };
      console.log(
        "Create requested product special deal combined payload:",
        finalPayload
      );

      didSubmitSpecialDealPaymentRef.current = true;
      pendingRequestedProductFormDataRef.current = null;

      dispatch(
        showSnackbar({
          message:
            response?.message || "Product request created successfully!",
          severity: "success",
        })
      );
    },
    [dispatch, isCommunity, isSpecialDealSelected]
  );

  const totalPaymentAmount = selectedPlanPrice + (isSpecialDealSelected ? specialDealActivationFee : 0);

  const handleRequestTypeChosen = async (chosenRequestType) => {
    setIsTypeModalOpen(false);
    const requestedProductFormData = pendingRequestedProductFormDataRef.current;
    if (!requestedProductFormData) {
      dispatch(
        showSnackbar({
          message: "No staged product request data found.",
          severity: "error",
        })
      );
      return;
    }

    const selectedOption = requestTypeOptions.find(
      (opt) => opt.value === chosenRequestType,
    );
    const feeUsd = selectedOption?.price ?? selectedOption?.feeUsd ?? 0;
    setCommunityFee(feeUsd);

    const submissionPayload =
      mapSelectionToSubmissionPayload(chosenRequestType);

    requestedProductFormData.set("requestType", submissionPayload.requestType);
    if (submissionPayload.promotionDurationMonths) {
      requestedProductFormData.set(
        "durationMonths",
        String(submissionPayload.promotionDurationMonths)
      );
      // Fallback for legacy
      requestedProductFormData.set(
        "promotionDurationMonths",
        String(submissionPayload.promotionDurationMonths)
      );
    } else {
      requestedProductFormData.delete("durationMonths");
      requestedProductFormData.delete("promotionDurationMonths");
    }

    if (isCommunity) {
      requestedProductFormData.set(
        "promotionPricingProfile",
        PROMOTION_PRICING_PROFILES.COMMUNITY_OFFERS
      );
      requestedProductFormData.set("fromCommunityOffers", "true");
      requestedProductFormData.set("isCommunity", "true");
    }

    const chosenPlan = requestTypeOptions.find(
      (opt) => opt.value === chosenRequestType,
    );
    const planPrice = chosenPlan?.price || 0;
    setSelectedPlanPrice(planPrice);

    // Transition to Special Deal flow if enabled
    if (isSpecialDealSelected) {
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
      const result = await dispatch(
        addRequestedProductThunk(requestedProductFormData)
      ).unwrap();
      const createdId = result?.requestedProduct?._id || result?._id;
      setCreatedRequestedProductId(createdId || null);
      dispatch(completeInitialSubmission());

      if (
        result.paymentRequired &&
        result.clientSecret &&
        result.promotionOrder?._id
      ) {
        dispatch(
          showSnackbar({
            message: "Please complete payment to promote your product request.",
            severity: "info",
          })
        );

        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          navigate(isCommunity ? "/community-offers/categories" : "/requested-products");
        }
      } else {
        dispatch(
          showSnackbar({
            message: result?.message || "Product request created successfully!",
            severity: "success",
          })
        );
      }
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error?.message || "Failed to create product request.",
          severity: "error",
        })
      );
    } finally {
      pendingRequestedProductFormDataRef.current = null;
    }
  };

  const handleAddRequestedProductSubmit = async (
    requestedProductFormData,
    options = {}
  ) => {
    setCreatedRequestedProductId(null);
    setIsSpecificDealModalOpen(false);
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);
    setSpecialDealActualPrice("");
    setCommunityFee(0);
    isTransitioningToPaymentRef.current = false;
    didSubmitSpecialDealPaymentRef.current = false;
    pendingRequestedProductFormDataRef.current = null;

    const resolvedActualPrice = getPositiveAmountFromFormData(
      requestedProductFormData,
      "targetPrice"
    );

    const shouldListAsSpecialDeal = Boolean(options.listAsSpecialDeal);
    const resolvedSpecialDealSelection =
      isSpecialDealFlow || shouldListAsSpecialDeal;
    setListAsSpecialDeal(resolvedSpecialDealSelection);
    requestedProductFormData.set(
      "listAsSpecialDeal",
      String(resolvedSpecialDealSelection)
    );

    // Community flow priorities Plan Selection modal first.
    if (isCommunity) {
      pendingRequestedProductFormDataRef.current = requestedProductFormData;
      setSpecialDealActualPrice(resolvedActualPrice); // Ensure price is set for special deal modal later
      setIsTypeModalOpen(true);
      return;
    }

    if (resolvedSpecialDealSelection) {
      pendingRequestedProductFormDataRef.current = requestedProductFormData;
      setSpecialDealActualPrice(resolvedActualPrice);
      dispatch(
        showSnackbar({
          message:
            "Fill special deal details and proceed to payment to create this request.",
          severity: "info",
        })
      );
      setIsSpecificDealModalOpen(true);
      return;
    }

    dispatch(addRequestedProductThunk(requestedProductFormData))
      .unwrap()
      .then((response) => {
        dispatch(
          showSnackbar({
            message:
              response.message || "Product request created successfully!",
            severity: "success",
          })
        );
        dispatch(completeInitialSubmission()); // Complete the initial submission
      })
      .catch((error) => {
        dispatch(
          showSnackbar({
            message: error?.message || "Failed to create product request.",
            severity: "error",
          })
        );
      });
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
          Create New Product Request
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Create New Product Request
      </Typography>
      {actionError && actionStatus === "failed" && !isLoading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      <RequestedProductForm
        onSubmit={handleAddRequestedProductSubmit}
        isLoading={isLoading}
        submitButtonText="Submit Product Request"
        showSpecialDealOption
        listAsSpecialDeal={isSpecialDealSelected}
        onListAsSpecialDealChange={setListAsSpecialDeal}
        disableSpecialDealOption={isSpecialDealFlow}
      />

      <ServiceSpecificDealModal
        open={isSpecificDealModalOpen}
        onClose={handleCloseSpecificDealModal}
        actionStatus={actionStatus}
        onPay={handleListRequestedProductSpecificDealPay}
        initialActualPrice={specialDealActualPrice}
        title="List Requested Product to Special Deal"
        subtitle="Fill in special deal details before continuing to payment."
        payButtonLabel="Continue"
        isRequest={true}
      />

      <SpecialDealPaymentModal
        open={isSpecificDealPaymentModalOpen}
        onClose={handleCloseSpecificDealPaymentModal}
        entityId={createdRequestedProductId}
        idempotencyPrefix="requested-product-create-special-deal"
        title={
          isSpecialDealSelected
            ? "Special Deal Activation"
            : "Community Promotion Payment"
        }
        subheader={
          isSpecialDealSelected
            ? "Enter your card details below to activate this special deal."
            : "Enter your card details below to activate your promotional plan."
        }
        amount={totalPaymentAmount}
        amountLabel={
          isSpecialDealSelected ? "Activation + Promotion Fee" : "Promotion Fee"
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

export default CreateRequestedProduct;

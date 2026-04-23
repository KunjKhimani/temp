/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/CreateServiceRequestPage.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Box,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { createServiceRequestThunk } from "../../store/thunks/serviceRequestThunks";
import {
  selectServiceRequestActionStatus,
  selectServiceRequestActionError,
  clearServiceRequestActionState,
} from "../../store/slice/serviceRequestSlice";
import { showSnackbar } from "../../store/slice/snackbarSlice";
import { completeInitialSubmission } from "../../store/slice/navigationSlice"; // Import the action
import ServiceRequestForm from "./ServiceRequestForm";
import RequestTypeChoiceModal from "./RequestTypeChoiceModal";
import ServiceSpecificDealModal from "./DetailPage/ServiceSpecificDealModal";
import {
  PROMOTION_TYPES_FRONTEND,
  PROMOTION_PRICING_PROFILES,
  buildCommunityOfferRequestTypeOptions,
  buildFeaturedRequestTypeOptions,
  getSpecialDealActivationFee,
  mapSelectionToSubmissionPayload,
} from "../../constants/promotions";
import { fetchPromotionSettings } from "../../store/thunks/adminPromotionThunk";

const getPositiveAmount = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue.toString()
    : "";
};

const resolveSpecialDealActualPriceFromBudget = (
  budgetType,
  budgetMin,
  budgetMax
) => {
  const normalizedBudgetMin = getPositiveAmount(budgetMin);
  const normalizedBudgetMax = getPositiveAmount(budgetMax);

  if (budgetType === "fixed") {
    return normalizedBudgetMin || normalizedBudgetMax;
  }

  return normalizedBudgetMax || normalizedBudgetMin;
};

const resolveSpecialDealActualPriceFromFormData = (formDataInstance) => {
  if (!formDataInstance) {
    return "";
  }

  return resolveSpecialDealActualPriceFromBudget(
    formDataInstance.get("budgetType"),
    formDataInstance.get("budgetMin"),
    formDataInstance.get("budgetMax")
  );
};

const resolveSpecialDealActualPriceFromObject = (sourceObject = {}) => {
  return resolveSpecialDealActualPriceFromBudget(
    sourceObject.budgetType || sourceObject.budget?.type,
    sourceObject.budgetMin ?? sourceObject.budget?.min,
    sourceObject.budgetMax ?? sourceObject.budget?.max
  );
};

const COMMUNITY_OFFERS_SOURCE_QUERY_VALUE = "community-offers";

const CreateServiceRequestPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isCommunityOffersSourceFromQuery =
    new URLSearchParams(location.search).get("source") ===
    COMMUNITY_OFFERS_SOURCE_QUERY_VALUE;

  const actionStatus = useSelector(selectServiceRequestActionStatus);
  const actionError = useSelector(selectServiceRequestActionError);
  const promotionSettings = useSelector((state) => state.adminPromotion.settings);
  const specialDealActivationFee = React.useMemo(
    () => getSpecialDealActivationFee(promotionSettings),
    [promotionSettings],
  );

  const [availableProviders, setAvailableProviders] = useState([]);
  const [stagedFormDataObject, setStagedFormDataObject] = useState(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isSpecialDealModalOpen, setIsSpecialDealModalOpen] = useState(false);
  const [initialFormDataForForm, setInitialFormDataForForm] = useState({});
  const [currentRequestTypeContext, setCurrentRequestTypeContext] = useState(
    PROMOTION_TYPES_FRONTEND.STANDARD
  );
  const [listAsSpecialDeal, setListAsSpecialDeal] = useState(false);
  const [pendingSpecialDealPayload, setPendingSpecialDealPayload] = useState(null);
  const isProceedingFromSpecialDealRef = useRef(false);
  const [isCommunityOffersFlow, setIsCommunityOffersFlow] = useState(
    Boolean(location.state?.fromCommunityOffers || isCommunityOffersSourceFromQuery)
  );
  const featuredRequestTypeOptions = React.useMemo(
    () => buildFeaturedRequestTypeOptions(promotionSettings),
    [promotionSettings],
  );
  const communityRequestTypeOptions = React.useMemo(
    () => buildCommunityOfferRequestTypeOptions(promotionSettings),
    [promotionSettings],
  );
  const requestTypeOptions = isCommunityOffersFlow
    ? communityRequestTypeOptions
    : featuredRequestTypeOptions;
  const resolvedSpecialDealActualPrice =
    resolveSpecialDealActualPriceFromFormData(stagedFormDataObject) ||
    resolveSpecialDealActualPriceFromObject(initialFormDataForForm) ||
    getPositiveAmount(pendingSpecialDealPayload?.actualPrice);

  useEffect(() => {
    const fromCommunityOffersState = Boolean(
      location.state?.fromCommunityOffers ||
      location.state?.isCommunity ||
      location.state?.repopulateFormData?.fromCommunityOffers ||
      location.state?.repopulateFormData?.isCommunity ||
      isCommunityOffersSourceFromQuery
    );
    setIsCommunityOffersFlow(fromCommunityOffersState);

    setAvailableProviders([
      {
        _id: "providerId1",
        name: "Test Provider Alpha",
        companyName: "Alpha Solutions",
      },
      { _id: "providerId2", name: "Beta Services Inc." },
      {
        _id: "providerId3",
        name: "Charlie Graphics",
        companyName: "CG Design",
      },
    ]);

    // Handle return from payment page with form data to repopulate
    if (location.state?.fromPaymentPage && location.state?.repopulateFormData) {
      const prevFormDataObj = location.state.repopulateFormData;
      console.log(
        "[CreatePage] Repopulating form with data from payment page:",
        prevFormDataObj
      );
      setInitialFormDataForForm(prevFormDataObj);
      setStagedFormDataObject(null); // Clear staged FormData if we are repopulating the form
      setCurrentRequestTypeContext(
        prevFormDataObj.requestType || PROMOTION_TYPES_FRONTEND.STANDARD
      );
      setIsCommunityOffersFlow(
        Boolean(prevFormDataObj.fromCommunityOffers) || fromCommunityOffersState
      );
      setListAsSpecialDeal(Boolean(prevFormDataObj.listAsSpecialDeal));
      setPendingSpecialDealPayload(
        prevFormDataObj.listAsSpecialDeal
          ? {
            description:
              prevFormDataObj.specialDealDescription ||
              prevFormDataObj.specialDescription ||
              "",
            actualPrice:
              Number(
                prevFormDataObj.specialDealActualPrice ??
                prevFormDataObj.actualPrice
              ) || "",
            sellingPrice:
              Number(
                prevFormDataObj.specialDealSellingPrice ??
                prevFormDataObj.sellingPrice
              ) || "",
            specialDealDuration:
              Number(
                prevFormDataObj.specialDealDuration
              ) || "",
          }
          : null
      );
      // Replace the history state to clean up and prevent unexpected re-renders
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      setInitialFormDataForForm({});
      setListAsSpecialDeal(false);
      setPendingSpecialDealPayload(null);
    }
  }, [isCommunityOffersSourceFromQuery, location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!promotionSettings) {
      dispatch(fetchPromotionSettings());
    }
  }, [dispatch, promotionSettings]);

  const handleFormSubmitIntent = (formDataInstanceFromForm, options = {}) => {
    setStagedFormDataObject(formDataInstanceFromForm);

    const shouldListAsSpecialDeal = Boolean(options.listAsSpecialDeal);
    setListAsSpecialDeal(shouldListAsSpecialDeal);

    // Community Offers flow prioritizes the Plan Selection modal first.
    if (isCommunityOffersFlow) {
      setIsTypeModalOpen(true);
      return;
    }

    if (shouldListAsSpecialDeal) {
      setPendingSpecialDealPayload(null);
      setIsSpecialDealModalOpen(true);
      return;
    }

    setIsTypeModalOpen(true);
  };

  const handleCloseSpecialDealModal = () => {
    setIsSpecialDealModalOpen(false);

    if (isProceedingFromSpecialDealRef.current) {
      isProceedingFromSpecialDealRef.current = false;
      return;
    }

    setStagedFormDataObject(null);
    setPendingSpecialDealPayload(null);
  };

  const handleSpecialDealFormSubmit = async (dealPayload) => {
    isProceedingFromSpecialDealRef.current = true;
    setPendingSpecialDealPayload(dealPayload);

    // If it's NOT a community flow, we can proceed to submission here.
    // If it's a community flow, handleRequestTypeChosen already happened or will happen.
    // Actually, in the new flow, for community: Type chosen -> Deal Modal -> Final Submit.
    if (isCommunityOffersFlow) {
      // For community, handleSpecialDealFormSubmit is the final step.
      // We must call the submission here.
      submitServiceRequest(dealPayload);
    } else {
      // For non-community special deals, we just show the type modal (Standard) 
      // or we can just submit if Standard is the only choice.
      // Currently, the existing flow was Modal -> Type -> Submit.
      // Let's stick to the new sequence: Type -> Modal -> Submit.
      submitServiceRequest(dealPayload);
    }
  };

  /**
   * Converts FormData to a plain object for repopulation purposes
   * Handles array fields and excludes File objects
   */
  const stagedFormDataToObject = (formDataInstance) => {
    const object = {};
    formDataInstance.forEach((value, key) => {
      if (key.endsWith("[]")) {
        // Handle array fields (e.g., "tags[]")
        const actualKey = key.slice(0, -2);
        if (!object[actualKey]) {
          object[actualKey] = [];
        }
        object[actualKey].push(value);
      } else if (!(value instanceof File)) {
        // Exclude files for simple repopulation state
        // Handle JSON strings for nested objects
        if (
          value &&
          typeof value === "string" &&
          (value.startsWith("[") || value.startsWith("{"))
        ) {
          try {
            object[key] = JSON.parse(value);
          } catch {
            object[key] = value;
          }
        } else {
          object[key] = value;
        }
      }
    });
    return object;
  };

  const handleRequestTypeChosen = async (chosenRequestType) => {
    setIsTypeModalOpen(false);
    if (!stagedFormDataObject) {
      console.error("No staged FormData to submit.");
      return;
    }

    const submissionPayload = mapSelectionToSubmissionPayload(chosenRequestType);
    setCurrentRequestTypeContext(submissionPayload.requestType);

    const finalFormData = stagedFormDataObject;
    finalFormData.set("requestType", submissionPayload.requestType);
    if (submissionPayload.promotionDurationMonths) {
      finalFormData.set(
        "promotionDurationMonths",
        String(submissionPayload.promotionDurationMonths)
      );
    } else {
      finalFormData.delete("promotionDurationMonths");
    }

    if (isCommunityOffersFlow) {
      finalFormData.set(
        "promotionPricingProfile",
        PROMOTION_PRICING_PROFILES.COMMUNITY_OFFERS
      );
      finalFormData.set("fromCommunityOffers", "true");
      finalFormData.set("isCommunity", "true");
    } else {
      finalFormData.delete("promotionPricingProfile");
      finalFormData.delete("fromCommunityOffers");
      finalFormData.delete("isCommunity");
    }

    // Transition to Special Deal flow if enabled
    if (listAsSpecialDeal) {
      dispatch(
        showSnackbar({
          message: "Plan selected. Now please fill special deal details.",
          severity: "info",
        })
      );
      setTimeout(() => {
        setIsSpecialDealModalOpen(true);
      }, 300);
      return;
    }

    submitServiceRequest();
  };

  const submitServiceRequest = async (dealPayloadOverride = null) => {
    if (!stagedFormDataObject) {
      console.error("No staged FormData to submit.");
      return;
    }

    const finalFormData = stagedFormDataObject;

    const currentDealPayload = dealPayloadOverride || pendingSpecialDealPayload;
    const shouldIncludeSpecialDealDetails =
      listAsSpecialDeal && Boolean(currentDealPayload);
    finalFormData.set("listAsSpecialDeal", String(shouldIncludeSpecialDealDetails));

    if (shouldIncludeSpecialDealDetails) {
      const normalizedSpecialDescription = String(
        currentDealPayload.description || ""
      ).trim();
      const normalizedSpecialActualPrice = Number(
        currentDealPayload.actualPrice
      );
      const normalizedSpecialSellingPrice = Number(
        currentDealPayload.sellingPrice
      );
      const normalizedSpecialDuration = Number(
        currentDealPayload.specialDealDuration
      );

      finalFormData.set(
        "specialDealDescription",
        normalizedSpecialDescription
      );
      finalFormData.set(
        "specialDealActualPrice",
        String(normalizedSpecialActualPrice)
      );
      finalFormData.set(
        "specialDealSellingPrice",
        String(normalizedSpecialSellingPrice)
      );
      finalFormData.set(
        "specialDealDuration",
        String(normalizedSpecialDuration)
      );
      finalFormData.set("isSpecial", "true");
      finalFormData.set("specialDescription", normalizedSpecialDescription);
      finalFormData.set("actualPrice", String(normalizedSpecialActualPrice));
      finalFormData.set("sellingPrice", String(normalizedSpecialSellingPrice));
    } else {
      finalFormData.delete("specialDealDescription");
      finalFormData.delete("specialDealActualPrice");
      finalFormData.delete("specialDealSellingPrice");
      finalFormData.delete("specialDealDuration");
      finalFormData.delete("isSpecial");
      finalFormData.delete("specialDescription");
      finalFormData.delete("actualPrice");
      finalFormData.delete("sellingPrice");
    }

    dispatch(clearServiceRequestActionState());
    try {
      const resultAction = await dispatch(
        createServiceRequestThunk(finalFormData)
      ).unwrap();
      console.log("[CreatePage] Thunk fulfilled:", resultAction);

      if (
        resultAction.paymentRequired &&
        resultAction.clientSecret &&
        resultAction.promotionOrder?._id &&
        resultAction.serviceRequest?._id
      ) {
        dispatch(
          showSnackbar({
            message:
              resultAction.message ||
              "Please complete payment to promote your request.",
            severity: "info",
          })
        );

        const plainFormDataForRepopulation =
          stagedFormDataToObject(finalFormData);

        // We already have requestType context set in handleRequestTypeChosen
        plainFormDataForRepopulation.requestType = finalFormData.get("requestType");
        plainFormDataForRepopulation.promotionDurationMonths = finalFormData.get("promotionDurationMonths");

        plainFormDataForRepopulation.fromCommunityOffers =
          isCommunityOffersFlow;
        plainFormDataForRepopulation.listAsSpecialDeal =
          shouldIncludeSpecialDealDetails;

        if (shouldIncludeSpecialDealDetails) {
          plainFormDataForRepopulation.specialDealDescription =
            currentDealPayload.description;
          plainFormDataForRepopulation.specialDealActualPrice =
            currentDealPayload.actualPrice;
          plainFormDataForRepopulation.specialDealSellingPrice =
            currentDealPayload.sellingPrice;
          plainFormDataForRepopulation.isSpecial = true;
          plainFormDataForRepopulation.specialDescription =
            currentDealPayload.description;
          plainFormDataForRepopulation.actualPrice =
            currentDealPayload.actualPrice;
          plainFormDataForRepopulation.sellingPrice =
            currentDealPayload.sellingPrice;
          plainFormDataForRepopulation.specialDealDuration =
            currentDealPayload.specialDealDuration;
        }

        const paymentBreakdown = resultAction.paymentBreakdown || {
          promotionFee:
            Number(resultAction?.serviceRequest?.promotionDetails?.feeAmount) ||
            0,
          specialDealFee: shouldIncludeSpecialDealDetails
            ? specialDealActivationFee
            : 0,
          totalFee: Number(resultAction?.promotionOrder?.totalPrice) || 0,
          currency: resultAction?.promotionOrder?.currency || "USD",
        };

        dispatch(completeInitialSubmission()); // Complete the initial submission
        navigate(`/service-request/promote/payment`, {
          state: {
            clientSecret: resultAction.clientSecret,
            promotionOrderId: resultAction.promotionOrder._id,
            paymentIntentId: resultAction.promotionOrder.paymentIntentId,
            serviceRequestId: resultAction.serviceRequest._id,
            serviceRequestTitle: resultAction.serviceRequest.title,
            amount: resultAction.promotionOrder.totalPrice,
            paymentBreakdown,
            repopulateFormData: plainFormDataForRepopulation,
          },
        });
      } else {
        dispatch(
          showSnackbar({
            message:
              resultAction.message || "Service request posted successfully!",
            severity: "success",
          })
        );
        dispatch(completeInitialSubmission());
        navigate("/user/my-service-requests");
      }
    } catch (error) {
      console.error("[CreatePage] Error after submission:", error);
      const errorMessage =
        error?.message ||
        (typeof error === "string" && error) ||
        "Failed to post service request.";
      dispatch(showSnackbar({ message: errorMessage, severity: "error" }));
    }

  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to="/service-requests/browse"
          color="inherit"
          sx={{ textDecoration: "none" }}
        >
          Browse Requests
        </MuiLink>
        <Typography color="text.primary">Post a Service Request</Typography>
      </Breadcrumbs>

      <ServiceRequestForm
        onFormSubmitIntent={handleFormSubmitIntent}
        isLoading={actionStatus === "loading"}
        availableProviders={availableProviders}
        initialData={initialFormDataForForm}
        isEdit={false}
        currentRequestTypeForInvites={currentRequestTypeContext}
        showSpecialDealOption
        listAsSpecialDeal={listAsSpecialDeal}
        onListAsSpecialDealChange={setListAsSpecialDeal}
        isCommunityOffersFlow={isCommunityOffersFlow}
      />

      <ServiceSpecificDealModal
        open={isSpecialDealModalOpen}
        onClose={handleCloseSpecialDealModal}
        actionStatus={actionStatus}
        onPay={handleSpecialDealFormSubmit}
        initialActualPrice={resolvedSpecialDealActualPrice}
        title="List Special Deal"
        subtitle="Fill special deal details before choosing your post type."
        payButtonLabel="Continue"
        isRequest={true}
      />

      <RequestTypeChoiceModal
        open={isTypeModalOpen}
        onClose={() => {
          setIsTypeModalOpen(false);
          setStagedFormDataObject(null);
          setPendingSpecialDealPayload(null);
        }}
        onConfirm={handleRequestTypeChosen}
        options={requestTypeOptions}
      />

      {actionStatus === "failed" && actionError && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          onClose={() => dispatch(clearServiceRequestActionState())}
        >
          Error:{" "}
          {typeof actionError === "string"
            ? actionError
            : actionError.message ||
            "Failed to post request. Please check form."}
        </Alert>
      )}
    </Container>
  );
};

export default CreateServiceRequestPage;
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Stack,
  Paper,
  List,
  Chip,
  Link as MuiLink,
  Avatar,
  IconButton,
  Divider, // Import Divider
} from "@mui/material";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete"; // Keep for now, might be used elsewhere or for actual delete
import ReviewSection from "../../components/ReviewSection";
import CloseIcon from "@mui/icons-material/Close"; // New icon for close
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonAddIcon from "@mui/icons-material/PersonAdd"; // Import PersonAddIcon
import SendIcon from "@mui/icons-material/Send"; // Import SendIcon
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"; // Import AttachMoneyIcon

import {
  fetchServiceRequestByIdThunk,
  deleteServiceRequestThunk, // Keep for now, if actual delete is still an option
  closeServiceRequestThunk, // NEW: Import the new thunk
  buyerAcceptOfferThunk,
  buyerRejectOfferThunk,
  buyerSubmitCounterOfferThunk,
  sellerRespondToCounterOfferThunk,
  markServiceRequestInProgressThunk,
  markServiceRequestAsCompletedByPartyThunk,
  setScheduleForServiceRequestThunk,
  inviteProvidersToRequestThunk,
  initiateServiceRequestPaymentThunk, // Import new thunk
  requestServiceRefundThunk, // Import new thunk
  submitOfferThunk,
  disputeServiceRequestThunk,
  updateServiceRequestThunk,
} from "../../store/thunks/serviceRequestThunks";
import {
  clearServiceRequestDetailState,
  clearServiceRequestActionState,
  selectCurrentServiceRequest,
  selectServiceRequestDetailStatus,
  selectServiceRequestDetailError,
  selectServiceRequestActionStatus,
  selectServiceRequestActionError,
} from "../../store/slice/serviceRequestSlice";
import { selectUser } from "../../store/slice/userSlice";
import { showSnackbar } from "../../store/slice/snackbarSlice";

import ServiceRequestPageHeader from "./DetailPage/ServiceRequestPageHeader";
import ServiceRequestImageDisplay from "./DetailPage/ServiceRequestImageDisplay";
import ServiceRequestDescription from "./DetailPage/ServiceRequestDescription";
import ServiceRequestSidebar from "./DetailPage/ServiceRequestSidebar";
import InviteProvidersModal from "./DetailPage/InviteProvidersModal";
import SubmitOfferModal from "./DetailPage/SubmitOfferModal";
import DeleteConfirmationDialog from "../Product/DeleteConfirmationDialog";
import RejectOfferModal from "./DetailPage/RejectOfferModal";
import CounterOfferModal from "./DetailPage/CounterOfferModal";
import OfferCard from "./DetailPage/OfferCard";
import SchedulingModal from "../../components/SchedulingModal"; // Import the correct modal
import RefundRequestModal from "../../components/RefundRequestModal"; // New import

import {
  SR_STATUS,
  PAYMENT_STATUS,
  REFUND_STATUS,
  SCHEDULE_PROPOSAL_STATUS,
} from "../../constants/serviceRequestStatus"; // Adjust path

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ServiceRequestDetailPage = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const request = useSelector(selectCurrentServiceRequest);
  const detailStatus = useSelector(selectServiceRequestDetailStatus);
  const detailError = useSelector(selectServiceRequestDetailError);
  const currentUser = useSelector(selectUser);
  const actionStatus = useSelector(selectServiceRequestActionStatus);
  const actionError = useSelector(selectServiceRequestActionError);

  const offers = useMemo(
    () =>
      (request?.offersReceived || [])
        .filter((offer) => offer && offer._id) // Ensure only valid offers with _id are included
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [request]
  );

  const awardedOffer = useMemo(() => {
    if (!request?.awardedOfferId || !request?.offersReceived) return null;
    return request.offersReceived.find(
      (offer) => offer._id === request.awardedOfferId
    );
  }, [request]);

  const minSchedulingDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let minDateToUse = today;

    if (request?.confirmedSchedule?.date) {
      const confirmed = new Date(request.confirmedSchedule.date);
      if (confirmed > minDateToUse) minDateToUse = confirmed;
    } else if (request?.currentScheduleProposal?.proposedDate) {
      const proposed = new Date(request.currentScheduleProposal.proposedDate);
      if (proposed > minDateToUse) minDateToUse = proposed;
    }

    if (awardedOffer?.availabilityDate) {
      const offerAvailable = new Date(awardedOffer.availabilityDate);
      if (offerAvailable > minDateToUse) minDateToUse = offerAvailable;
    }
    return minDateToUse;
  }, [request, awardedOffer]);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [openSubmitOfferModal, setOpenSubmitOfferModal] = useState(false);
  const [sellerServicesForOffer, setSellerServicesForOffer] = useState([]); // This state might need to be populated from somewhere, e.g., a thunk to fetch seller's services

  const [rejectOfferModalOpen, setRejectOfferModalOpen] = useState(false);
  const [counterOfferModalOpen, setCounterOfferModalOpen] = useState(false);
  const [selectedOfferForAction, setSelectedOfferForAction] = useState(null);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [openRefundModal, setOpenRefundModal] = useState(false); // New state for refund modal

  const [
    autoOpenScheduleModalAfterAccept,
    setAutoOpenScheduleModalAfterAccept,
  ] = useState(false);

  const isOwnerOfSR = useMemo(
    () => request && currentUser && request.createdBy?._id === currentUser?._id,
    [request, currentUser]
  );
  const isCurrentUserSeller = useMemo(
    () => currentUser?.isSeller,
    [currentUser]
  );
  const isAwardedSeller = useMemo(
    () =>
      request && currentUser && request.awardedSellerId === currentUser?._id,
    [request, currentUser]
  );

  const isCreatorVerified = useMemo(
    () => request?.createdBy?.isVerified,
    [request?.createdBy?.isVerified]
  );

  const isOpenForOthers = useMemo(() => {
    if (!request || !currentUser) return false; // Not logged in or no request
    const isInteractingUser = isOwnerOfSR || isAwardedSeller;
    const isClosedState = [
      SR_STATUS.payment_succeeded,
      SR_STATUS.IN_PROGRESS,
      SR_STATUS.COMPLETED,
    ].includes(request.status);

    // It's "open for others" if an offer has been awarded, but it's not in a final closed state,
    // AND the current user is NOT one of the interacting parties.
    return (
      request.awardedOfferId && // An offer has been awarded
      !isClosedState && // But it's not in a final "closed" state
      !isInteractingUser // And the current user is not the buyer or awarded seller
    );
  }, [request, currentUser, isOwnerOfSR, isAwardedSeller]);

  const hasAlreadyBid = useMemo(() => {
    if (!request || !isCurrentUserSeller || !currentUser?._id || !offers)
      return false;
    return offers.some(
      (offer) =>
        (offer.seller?._id || offer.seller) === currentUser._id &&
        ![
          "rejected_by_buyer",
          "withdrawn_by_seller",
          "counter_rejected_by_seller",
        ].includes(offer.status)
    );
  }, [request, offers, isCurrentUserSeller, currentUser]);

  const canSellerSubmitNewOffer = useMemo(() => {
    return (
      isCurrentUserSeller &&
      !isOwnerOfSR &&
      request?.status === SR_STATUS.OPEN &&
      !hasAlreadyBid &&
      isCreatorVerified // Add this condition
    );
  }, [
    isCurrentUserSeller,
    isOwnerOfSR,
    request?.status,
    hasAlreadyBid,
    isCreatorVerified,
  ]);

  const handleOpenScheduleModal = useCallback(() => {
    if (!currentUser || (!isOwnerOfSR && !isAwardedSeller)) {
      dispatch(
        showSnackbar({
          message: "Offer accepted Successfully",
          severity: "success",
        })
      );
      return;
    }
    if (
      [
        SR_STATUS.AWAITING_SCHEDULE,
        SR_STATUS.SCHEDULE_NEGOTIATION,
        SR_STATUS.SCHEDULE_CONFIRMED,
      ].includes(request?.status)
    ) {
      dispatch(clearServiceRequestActionState());
      setOpenScheduleModal(true);
    } else {
      dispatch(
        showSnackbar({
          message: "Service is not in a state that allows scheduling.",
          severity: "warning",
        })
      );
    }
  }, [currentUser, isOwnerOfSR, isAwardedSeller, request?.status, dispatch]);

  const handleSubmitOffer = useCallback(
    async (offerData) => {
      if (!request || actionStatus === "loading") return;
      dispatch(clearServiceRequestActionState()); // Clear previous action state before new submission
      try {
        await dispatch(
          submitOfferThunk({
            requestId: request._id,
            offerData: offerData,
          })
        ).unwrap();
        dispatch(
          showSnackbar({
            message: "Offer submitted successfully!",
            severity: "success",
          })
        );
        setOpenSubmitOfferModal(false); // Close modal on success
      } catch (error) {
        // Error handled by actionError in Redux, displayed by modal's Alert
        dispatch(
          showSnackbar({
            message: error.message || "Failed to submit offer.",
            severity: "error",
          })
        );
      }
    },
    [request, actionStatus, dispatch]
  );

  useEffect(() => {
    if (requestId) {
      dispatch(clearServiceRequestDetailState());
      dispatch(clearServiceRequestActionState());
      dispatch(fetchServiceRequestByIdThunk(requestId));
    }
  }, [dispatch, requestId]);

  // Open schedule modal automatically after offer acceptance
  useEffect(() => {
    if (
      autoOpenScheduleModalAfterAccept &&
      request?.status === SR_STATUS.AWAITING_SCHEDULE
    ) {
      handleOpenScheduleModal(); // Use the handler to check conditions
      setAutoOpenScheduleModalAfterAccept(false);
    }
  }, [
    request?.status,
    autoOpenScheduleModalAfterAccept,
    handleOpenScheduleModal,
  ]);

  const handleGoBack = useCallback(() => navigate(-1), [navigate]);
  const handleEditClick = useCallback(() => {
    if (request) navigate(`/service-request/${request._id}/edit`);
  }, [navigate, request]);
  const handleCloseRequestClick = useCallback(
    () => setOpenDeleteDialog(true),
    []
  ); // Reusing dialog state

  const handleConfirmCloseRequest = async () => {
    if (!request || actionStatus === "loading") return;
    dispatch(clearServiceRequestActionState());
    try {
      await dispatch(closeServiceRequestThunk(request._id)).unwrap();
      dispatch(
        showSnackbar({
          message: "Service request closed successfully",
          severity: "success",
        })
      );
      // Navigate to my requests or detail page, depending on desired flow after closing
      navigate(`/service-request/${request._id}`); // Stay on page, but it will re-fetch and show updated status
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to close request",
          severity: "error",
        })
      );
    }
    setOpenDeleteDialog(false);
  };

  const handleAcceptOffer = async (offerId) => {
    if (!request || actionStatus === "loading") return;
    dispatch(clearServiceRequestActionState());
    try {
      await dispatch(
        buyerAcceptOfferThunk({ requestId: request._id, offerId })
      ).unwrap();
      dispatch(
        showSnackbar({
          message: "Offer accepted! Please proceed to schedule.",
          severity: "success",
        })
      );
      setAutoOpenScheduleModalAfterAccept(true); // This will trigger the useEffect above
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to accept offer.",
          severity: "error",
        })
      );
    }
  };

  const handleOpenRejectModal = useCallback(
    (offer) => {
      setSelectedOfferForAction(offer);
      dispatch(clearServiceRequestActionState());
      setRejectOfferModalOpen(true);
    },
    [dispatch]
  );

  const handleCloseRejectModal = useCallback(() => {
    setRejectOfferModalOpen(false);
    setSelectedOfferForAction(null);
  }, []);

  const handleActualRejectOfferSubmit = async (offerId, rejectionReason) => {
    if (!request || !offerId || actionStatus === "loading") return;
    try {
      await dispatch(
        buyerRejectOfferThunk({
          requestId: request._id,
          offerId,
          rejectionReason,
        })
      ).unwrap();
      dispatch(showSnackbar({ message: "Offer rejected.", severity: "info" }));
      handleCloseRejectModal();
    } catch (error) {
      // Error handled by modal
    }
  };

  const handleOpenCounterModal = useCallback(
    (offer) => {
      setSelectedOfferForAction(offer);
      dispatch(clearServiceRequestActionState());
      setCounterOfferModalOpen(true);
    },
    [dispatch]
  );

  const handleCloseCounterModal = useCallback(() => {
    setCounterOfferModalOpen(false);
    setSelectedOfferForAction(null);
  }, []);

  const handleActualSubmitCounterOffer = async (offerId, counterData) => {
    if (!request || !offerId || !counterData || actionStatus === "loading")
      return;
    try {
      await dispatch(
        buyerSubmitCounterOfferThunk({
          requestId: request._id,
          offerId,
          counterOfferData: counterData,
        })
      ).unwrap();
      dispatch(
        showSnackbar({
          message: "Counter-offer submitted successfully.",
          severity: "success",
        })
      );
      handleCloseCounterModal();
    } catch (error) {
      // Error handled by modal
    }
  };

  const handleSellerAcceptCounter = async (offerId, sellerMessage = "") => {
    if (
      !request ||
      !offerId ||
      actionStatus === "loading" ||
      !currentUser?.isSeller
    )
      return;
    dispatch(clearServiceRequestActionState());
    try {
      await dispatch(
        sellerRespondToCounterOfferThunk({
          requestId: request._id,
          offerId,
          responseData: {
            accepted: true,
            sellerResponseMessage: sellerMessage,
          },
        })
      ).unwrap();
      dispatch(
        showSnackbar({
          message:
            "You've accepted the buyer's counter. Buyer will be notified to finalize.",
          severity: "success",
        })
      );
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to accept counter-offer.",
          severity: "error",
        })
      );
    }
  };

  const handleSellerRejectCounter = async (offerId, sellerMessage = "") => {
    if (
      !request ||
      !offerId ||
      actionStatus === "loading" ||
      !currentUser?.isSeller
    )
      return;
    dispatch(clearServiceRequestActionState());
    try {
      await dispatch(
        sellerRespondToCounterOfferThunk({
          requestId: request._id,
          offerId,
          responseData: {
            accepted: false,
            sellerResponseMessage: sellerMessage,
          },
        })
      ).unwrap();
      dispatch(
        showSnackbar({
          message: "You've rejected the buyer's counter-offer.",
          severity: "info",
        })
      );
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to reject counter-offer.",
          severity: "error",
        })
      );
    }
  };

  const handleMarkInProgress = async () => {
    if (!request || actionStatus === "loading") return;
    dispatch(clearServiceRequestActionState());
    try {
      await dispatch(markServiceRequestInProgressThunk(request._id)).unwrap();
      dispatch(
        showSnackbar({
          message: "Service request marked as In Progress.",
          severity: "success",
        })
      );
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to mark request as In Progress.",
          severity: "error",
        })
      );
    }
  };

  const canMarkInProgress = useMemo(() => {
    if (!request || !currentUser) return false;
    const isBuyerOrSpecificallyAwardedSeller = isOwnerOfSR || isAwardedSeller;
    return (
      isBuyerOrSpecificallyAwardedSeller &&
      request.status === SR_STATUS.payment_succeeded // Only allow marking in progress after payment succeeds
    );
  }, [request, currentUser, isOwnerOfSR, isAwardedSeller]);

  const handleInitiatePayment = async () => {
    if (!request || actionStatus === "loading") return;
    dispatch(clearServiceRequestActionState());
    try {
      const response = await dispatch(
        initiateServiceRequestPaymentThunk(request._id)
      ).unwrap();
      if (response.paymentProvider === "square" && response.square) {
        const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
        const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;
        if (!appId || !locationId) {
          dispatch(
            showSnackbar({
              message:
                "Square is not configured. Set VITE_SQUARE_APPLICATION_ID and VITE_SQUARE_LOCATION_ID.",
              severity: "error",
            })
          );
          return;
        }
        navigate(`/payment/service-request/${request._id}`, {
          state: {
            square: response.square,
            amount:
              (response.square?.amount || Math.round((request.amountToBePaid || 0) * 100)) /
              100,
            serviceRequest: request, // Pass the full service request object
          },
        });
        dispatch(
          showSnackbar({
            message: "Redirecting to payment...",
            severity: "info",
          })
        );
      } else if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        dispatch(
          showSnackbar({
            message: "Payment initiated, awaiting next steps.",
            severity: "info",
          })
        );
      }
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to initiate payment.",
          severity: "error",
        })
      );
    }
  };

  const handleOpenRefundModal = () => {
    dispatch(clearServiceRequestActionState());
    setOpenRefundModal(true);
  };

  const handleCloseRefundModal = () => {
    setOpenRefundModal(false);
  };

  const handleRequestRefundSubmit = async (refundData) => {
    // { cancellationReason, refundNotes }
    if (!request || actionStatus === "loading") return;
    dispatch(clearServiceRequestActionState());
    try {
      await dispatch(
        requestServiceRefundThunk({ requestId: request._id, refundData })
      ).unwrap();
      dispatch(
        showSnackbar({
          message: "Refund request submitted successfully!",
          severity: "success",
        })
      );
      handleCloseRefundModal();
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to submit refund request.",
          severity: "error",
        })
      );
    }
  };

  const handleMarkAsComplete = async () => {
    if (!request || actionStatus === "loading") return;
    dispatch(clearServiceRequestActionState());
    try {
      await dispatch(
        markServiceRequestAsCompletedByPartyThunk({ requestId: request._id })
      ).unwrap();
      dispatch(
        showSnackbar({
          message: "Service completion status updated.",
          severity: "success",
        })
      );
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to update completion status.",
          severity: "error",
        })
      );
    }
  };

  const handleDispute = async () => {
    if (!request || actionStatus === "loading") return;
    dispatch(clearServiceRequestActionState());
    try {
      await dispatch(disputeServiceRequestThunk(request._id)).unwrap();
      dispatch(
        showSnackbar({
          message: "Service request disputed. Our team will review.",
          severity: "info",
        })
      );
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to dispute service request.",
          severity: "error",
        })
      );
    }
  };

  const handleListServiceSpecificDealPay = useCallback(
    async (specialDealPayload) => {
      if (!requestId || actionStatus === "loading") return;

      const normalizedActualPrice = Number(specialDealPayload?.actualPrice);
      const normalizedSellingPrice = Number(specialDealPayload?.sellingPrice);
      const normalizedSpecialDescription = String(
        specialDealPayload?.specialDescription ??
        specialDealPayload?.description ??
        ""
      ).trim();
      const normalizedSpecialOfferSourceId =
        specialDealPayload?.specialOfferSourceId ??
        specialDealPayload?.paymentData?.sourceId;

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
        updatePayload.set("specialOfferSourceId", normalizedSpecialOfferSourceId);

        await dispatch(
          updateServiceRequestThunk({
            requestId,
            formData: updatePayload,
          })
        ).unwrap();

        await dispatch(fetchServiceRequestByIdThunk(requestId));

        dispatch(
          showSnackbar({
            message: "Service request special deal updated successfully.",
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
    [dispatch, requestId, actionStatus]
  );

  const canMarkOrApproveCompletion = useMemo(() => {
    if (!request || !currentUser) return false;
    if (request.status === SR_STATUS.IN_PROGRESS) {
      return isOwnerOfSR || isAwardedSeller; // Seller usually marks delivered, buyer can also mark received.
    }
    if (request.status === SR_STATUS.PENDING_COMPLETION) {
      // If seller marked, buyer needs to approve
      // Assuming a field like `completionInitiatedBy: 'seller' | 'buyer'` if needed for complex approval.
      // For now, if PENDING_COMPLETION, buyer can approve. Seller has already acted.
      return isOwnerOfSR;
    }
    return false;
  }, [request, currentUser, isOwnerOfSR, isAwardedSeller]);

  const getMarkCompleteButtonText = useCallback(() => {
    if (!request || !currentUser) return "Mark as Complete";
    if (request.status === SR_STATUS.IN_PROGRESS) {
      return isAwardedSeller
        ? "Mark Service Delivered"
        : isOwnerOfSR
        ? "Mark Service Received"
        : "Mark Complete";
    }
    if (request.status === SR_STATUS.PENDING_COMPLETION && isOwnerOfSR) {
      return "Approve Completion & Release Payment";
    }
    return "Mark as Complete";
  }, [request, currentUser, isOwnerOfSR, isAwardedSeller]);

  const handleScheduleSubmit = async (scheduleActionPayload) => {
    // scheduleActionPayload includes 'action'
    if (!request || actionStatus === "loading") return;
    dispatch(clearServiceRequestActionState());
    try {
      const updatedRequest = await dispatch(
        setScheduleForServiceRequestThunk({
          requestId: request._id,
          scheduleActionPayload,
        })
      ).unwrap();

      dispatch(
        showSnackbar({
          message:
            updatedRequest.status === SR_STATUS.SCHEDULE_CONFIRMED
              ? "Schedule confirmed! Proceed to payment."
              : "Schedule proposal submitted.",
          severity: "success",
        })
      );
      // Modal might close or update based on the new `request` prop received from Redux.
      // If fully confirmed, and modal is still open, maybe close it.
      if (updatedRequest.status === SR_STATUS.SCHEDULE_CONFIRMED) {
        setOpenScheduleModal(false);
        // Automatically initiate payment after schedule is confirmed
        handleInitiatePayment();
      }
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to update schedule.",
          severity: "error",
        })
      );
    }
  };

  // --- DERIVED STATES FOR UI LOGIC ---
  const canInteractWithSchedule = useMemo(() => {
    if (!request || !currentUser) return false;
    const isRelevantUser = isOwnerOfSR || isAwardedSeller;
    return (
      isRelevantUser &&
      [
        SR_STATUS.AWAITING_SCHEDULE,
        SR_STATUS.SCHEDULE_NEGOTIATION,
        SR_STATUS.SCHEDULE_CONFIRMED,
      ].includes(request.status)
    );
  }, [request, currentUser, isOwnerOfSR, isAwardedSeller]);

  const canBuyerInitiatePayment = useMemo(() => {
    return (
      isOwnerOfSR &&
      request?.status === SR_STATUS.SCHEDULE_CONFIRMED &&
      request?.paymentStatus === PAYMENT_STATUS.PENDING
    );
  }, [request, isOwnerOfSR]);

  const canRequestRefund = useMemo(() => {
    return (
      isOwnerOfSR &&
      request?.paymentStatus === PAYMENT_STATUS.SUCCEEDED &&
      request?.refundStatus === REFUND_STATUS.NONE &&
      [
        SR_STATUS.IN_PROGRESS,
        SR_STATUS.PENDING_COMPLETION,
        SR_STATUS.COMPLETED,
      ].includes(request.status)
    );
  }, [request, isOwnerOfSR]);

  if (detailStatus === "loading" && !request) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }
  if (detailStatus === "failed") {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {detailError?.message || "Error loading details."}
        </Alert>
        <Button onClick={handleGoBack} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }
  if (!request) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <ServiceRequestPageHeader
          requestTitle="Request Not Found"
          onGoBack={handleGoBack}
        />
        <Typography variant="h5" mt={3}>
          Request not found.
        </Typography>
        <Button onClick={handleGoBack} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  const stickyTopOffset = theme.spacing(10);
  const canInvite =
    isOwnerOfSR &&
    (request.status === SR_STATUS.OPEN ||
      request.status === SR_STATUS.IN_DISCUSSION) &&
    (request.requestType === "promoted" ||
      (request.invitedProviders?.length || 0) < 20);

  // --- Determine what to display in the main content area ---
  const displayOffersSection = [
    SR_STATUS.OPEN,
    SR_STATUS.IN_DISCUSSION,
  ].includes(request?.status);
  const displaySchedulingSection =
    [
      SR_STATUS.AWAITING_SCHEDULE,
      SR_STATUS.SCHEDULE_NEGOTIATION,
      SR_STATUS.SCHEDULE_CONFIRMED,
    ].includes(request?.status) &&
    (isOwnerOfSR || isAwardedSeller);
  const displayPaymentSection =
    (request?.status === SR_STATUS.SCHEDULE_CONFIRMED ||
      request?.status === SR_STATUS.AWAITING_PAYMENT ||
      request?.status === SR_STATUS.PAYMENT_PENDING) &&
    isOwnerOfSR &&
    request?.status !== SR_STATUS.payment_succeeded; // Exclude payment_succeeded from this section
  const displayInProgressSection =
    (request?.status === SR_STATUS.payment_succeeded || // Add payment_succeeded here
      request?.status === SR_STATUS.IN_PROGRESS ||
      request?.status === SR_STATUS.PENDING_COMPLETION) &&
    (isOwnerOfSR || isAwardedSeller);
  const displayCompletedSection = request?.status === SR_STATUS.COMPLETED;
  const displayRefundSection =
    [
      SR_STATUS.REFUND_REQUESTED,
      SR_STATUS.REFUND_REVIEW_PENDING,
      SR_STATUS.REFUND_APPROVED,
      SR_STATUS.REFUND_PROCESSED,
      SR_STATUS.REFUND_REJECTED,
    ].includes(request?.status) && isOwnerOfSR;

  console.log(request.status);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <ServiceRequestPageHeader
        requestTitle={request.title}
        onGoBack={handleGoBack}
        isCommunity={request.isCommunity}
        isSpecial={request.isSpecial}
      />
      <Grid container spacing={{ xs: 2, md: 4 }} sx={{ mt: { xs: 1, md: 2 } }}>
        <Grid item xs={12} md={7} lg={8}>
          <Stack spacing={3}>
            {/* Conditional Content Based on SR Status */}
            {displayOffersSection &&
              (isOwnerOfSR ||
                (isCurrentUserSeller &&
                  offers.some((o) => o.seller?._id === currentUser?._id))) && (
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2.5 },
                    mt: 3,
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {isOwnerOfSR
                      ? "Received Proposals"
                      : isCurrentUserSeller
                      ? "Your Offer(s) on this Request"
                      : "Proposals"}{" "}
                    (
                    {isOwnerOfSR
                      ? offers.length
                      : offers.filter((o) => o.seller?._id === currentUser?._id)
                          .length}
                    )
                  </Typography>

                  {detailStatus === "loading" && offers.length === 0 && (
                    <CircularProgress
                      size={24}
                      sx={{ display: "block", mx: "auto", my: 2 }}
                    />
                  )}
                  {detailStatus === "succeeded" &&
                    offers.length === 0 &&
                    isOwnerOfSR && (
                      <Typography sx={{ my: 1, color: "text.secondary" }}>
                        No offers received yet.
                      </Typography>
                    )}
                  {detailStatus === "succeeded" &&
                    offers.filter((o) => o.seller?._id === currentUser?._id)
                      .length === 0 &&
                    isCurrentUserSeller &&
                    !isOwnerOfSR && (
                      <Typography sx={{ my: 1, color: "text.secondary" }}>
                        You have not submitted an offer for this request yet.
                      </Typography>
                    )}

                  {detailStatus === "succeeded" && offers.length > 0 && (
                    <List
                      disablePadding
                      sx={{
                        maxHeight: { xs: 400, md: 600 },
                        overflow: "auto",
                        mt: 1,
                        pr: 0.5,
                      }}
                    >
                      {offers.map(
                        (
                          offer,
                          index // Ensure index is passed
                        ) => {
                          // Explicitly check offer and its _id before rendering
                          if (!offer || !offer._id) {
                            console.warn(
                              "Skipping invalid offer in map:",
                              offer
                            );
                            return null;
                          }

                          return isOwnerOfSR ||
                            (isCurrentUserSeller &&
                              offer.seller?._id === currentUser?._id) ? (
                            <OfferCard
                              key={offer._id || `offer-${index}`} // Use offer._id if available, otherwise fallback to index
                              offer={offer}
                              serviceRequestStatus={request.status}
                              serviceRequestAwardedOfferId={
                                request.awardedOfferId
                              }
                              isOwnerOfSR={isOwnerOfSR}
                              currentUser={currentUser}
                              onAccept={handleAcceptOffer}
                              onOpenRejectModal={handleOpenRejectModal}
                              onOpenCounterModal={handleOpenCounterModal}
                              onSellerAcceptCounter={handleSellerAcceptCounter}
                              onSellerRejectCounter={handleSellerRejectCounter}
                              isLoading={
                                actionStatus === "loading" &&
                                selectedOfferForAction?._id === offer._id
                              }
                            />
                          ) : null; // Return null if conditions are not met
                        }
                      )}
                    </List>
                  )}
                  {actionStatus === "failed" && actionError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {typeof actionError === "string"
                        ? actionError
                        : actionError.message || "An action failed."}
                    </Alert>
                  )}
                </Paper>
              )}
            {(displaySchedulingSection ||
              displayPaymentSection ||
              displayInProgressSection ||
              displayCompletedSection ||
              displayRefundSection) && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mt: 3,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Service Progress
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Status:{" "}
                  <Chip
                    label={request.status.replace(/_/g, " ").toUpperCase()}
                    color="primary"
                    size="small"
                  />
                  {isOpenForOthers && (
                    <Chip
                      label="open" //for other people
                      color="info"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>

                {/* Scheduling Information & Actions */}
                {displaySchedulingSection && (
                  <Box sx={{ my: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Scheduling Details
                    </Typography>
                    {request.confirmedSchedule ? (
                      <>
                        <Typography variant="body1">
                          <strong>Status:</strong> Schedule Confirmed
                        </Typography>
                        <Typography variant="body1">
                          <strong>Date:</strong>{" "}
                          {new Date(
                            request.confirmedSchedule.date
                          ).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Time:</strong>{" "}
                          {request.confirmedSchedule.timeSlot}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          The service schedule has been successfully confirmed.
                        </Typography>
                      </>
                    ) : request.currentScheduleProposal ? (
                      <>
                        <Typography variant="body1">
                          <strong>Status:</strong> Schedule Negotiation in
                          Progress
                        </Typography>
                        <Typography variant="body1">
                          <strong>Proposed By:</strong>{" "}
                          {request.currentScheduleProposal.proposedBy?._id &&
                          request.currentScheduleProposal.proposedBy._id ===
                            request.createdBy?._id
                            ? "Buyer"
                            : "Seller"}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Proposed Date:</strong>{" "}
                          {new Date(
                            request.currentScheduleProposal.proposedDate
                          ).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Proposed Time:</strong>{" "}
                          {request.currentScheduleProposal.proposedTimeSlot}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Awaiting Confirmation From:</strong>{" "}
                          {request.currentScheduleProposal.proposalStatus ===
                          SCHEDULE_PROPOSAL_STATUS.PENDING_BUYER_CONFIRMATION
                            ? "Buyer"
                            : "Seller"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          A schedule proposal has been made and is awaiting
                          confirmation.
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body1">
                          <strong>Status:</strong> Awaiting Initial Schedule
                          Proposal
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          No schedule has been proposed or confirmed yet for
                          this service request.
                        </Typography>
                      </>
                    )}
                    <Button
                      variant="outlined"
                      onClick={handleOpenScheduleModal}
                      sx={{ mt: 2 }}
                    >
                      {request.confirmedSchedule
                        ? "View/Adjust Schedule"
                        : request.currentScheduleProposal
                        ? "Review/Negotiate Schedule"
                        : "Propose First Schedule"}
                    </Button>
                  </Box>
                )}

                {/* Payment Info & Action */}
                {(request.status === SR_STATUS.SCHEDULE_CONFIRMED ||
                  request.status === SR_STATUS.AWAITING_PAYMENT ||
                  request.status === SR_STATUS.PAYMENT_PENDING) &&
                  isOwnerOfSR && (
                    <Box sx={{ my: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Payment Information
                      </Typography>
                      <Typography variant="body1">
                        <strong>Amount Due:</strong> $
                        {request.amountToBePaid?.toFixed(2)}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Payment Status:</strong>{" "}
                        <Chip
                          label={request.paymentStatus
                            ?.replace(/_/g, " ")
                            .toUpperCase()}
                          color={
                            request.paymentStatus === PAYMENT_STATUS.SUCCEEDED
                              ? "success"
                              : request.paymentStatus === PAYMENT_STATUS.FAILED
                              ? "error"
                              : "info"
                          }
                          size="small"
                        />
                      </Typography>

                      {/* Show "Proceed to Payment" button if schedule is confirmed and payment is pending */}
                      {request.status === SR_STATUS.SCHEDULE_CONFIRMED &&
                        request.paymentStatus === PAYMENT_STATUS.PENDING && (
                          <Button
                            variant="contained"
                            color="success"
                            onClick={handleInitiatePayment}
                            sx={{ mt: 1 }}
                            disabled={actionStatus === "loading"}
                          >
                            Proceed to Payment
                          </Button>
                        )}

                      {/* Show "Payment processing initiated" message and "Complete Payment" button if payment is pending */}
                      {request.status === SR_STATUS.PAYMENT_PENDING && (
                        <Box sx={{ mt: 1 }}>
                          <Alert severity="info">
                            Payment processing initiated. Please complete the
                            payment on the next page.
                          </Alert>
                          {request.paymentIntentId &&
                            request.amountToBePaid && (
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() =>
                                  navigate(
                                    `/payment/service-request/${request._id}`,
                                    {
                                      state: {
                                        square: {
                                          applicationId:
                                            import.meta.env
                                              .VITE_SQUARE_APPLICATION_ID,
                                          locationId:
                                            import.meta.env
                                              .VITE_SQUARE_LOCATION_ID,
                                        },
                                        amount: request.amountToBePaid,
                                        serviceRequest: request,
                                      },
                                    }
                                  )
                                }
                                sx={{ mt: 1 }}
                              >
                                Complete Payment
                              </Button>
                            )}
                        </Box>
                      )}

                      {/* Show message if payment is awaiting (e.g., after initiating but before payment_pending status update) */}
                      {request.status === SR_STATUS.AWAITING_PAYMENT &&
                        request.paymentStatus === PAYMENT_STATUS.PENDING && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            Awaiting payment initiation.
                          </Alert>
                        )}
                    </Box>
                  )}

                {/* In Progress Info & Action */}
                {/* "Mark In Progress" Button - Visible after payment succeeds */}
                {canMarkInProgress && (
                  <Box sx={{ my: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleMarkInProgress}
                      sx={{ mt: 1 }}
                      disabled={actionStatus === "loading"}
                    >
                      Mark as In Progress
                    </Button>
                  </Box>
                )}

                {/* In Progress Info & Action */}
                {request.status === SR_STATUS.IN_PROGRESS && (
                  <Box sx={{ my: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Project In Progress
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {canMarkOrApproveCompletion && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleMarkAsComplete}
                          disabled={actionStatus === "loading"}
                        >
                          {getMarkCompleteButtonText()}
                        </Button>
                      )}
                      {isOwnerOfSR && ( // Only buyer can dispute or request refund
                        <>
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={handleDispute} // New handler for dispute
                            disabled={actionStatus === "loading"}
                          >
                            Dispute
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={handleOpenRefundModal}
                            disabled={actionStatus === "loading"}
                          >
                            Request Refund
                          </Button>
                        </>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Completed Info */}
                {displayCompletedSection && (
                  <Box sx={{ my: 2 }}>
                    <Typography variant="h6" color="success.main">
                      Service Completed!
                    </Typography>
                    {/* TODO: Link to review, order details */}
                  </Box>
                )}

                {/* Refund Info & Action */}
                {displayRefundSection && (
                  <Box sx={{ my: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Refund Status:{" "}
                      {request.refundStatus?.replace(/_/g, " ").toUpperCase()}
                    </Typography>
                    {request.refundRequestDetails?.reason && (
                      <Typography>
                        Reason: {request.refundRequestDetails.reason}
                      </Typography>
                    )}
                    {canRequestRefund && ( // This button might be in sidebar or here
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleOpenRefundModal}
                        sx={{ mt: 1 }}
                        disabled={actionStatus === "loading"}
                      >
                        Request Refund
                      </Button>
                    )}
                  </Box>
                )}
              </Paper>
            )}
            <ServiceRequestImageDisplay
              attachments={request.attachments || []}
              title={request.title}
            />
            <ServiceRequestDescription
              description={request.description}
              tags={request.tags || []}
              attachments={request.attachments || []}
            />
          </Stack>
        </Grid>
        <Grid item xs={12} md={5} lg={4}>
          <ServiceRequestSidebar
            request={request}
            isOwner={isOwnerOfSR}
            currentUser={currentUser}
            stickyTopOffset={stickyTopOffset}
            onEditClick={
              request?.status === SR_STATUS.OPEN ? handleEditClick : undefined
            }
            onCloseRequestClick={
              request?.status === SR_STATUS.OPEN
                ? handleCloseRequestClick
                : undefined
            }
            actionStatus={actionStatus}
            onInviteProvidersClick={
              request?.status === SR_STATUS.OPEN
                ? () => setOpenInviteModal(true)
                : undefined
            }
            canInvite={
              request?.status === SR_STATUS.OPEN &&
              isOwnerOfSR /* && other conditions */
            }
            onSubmitOfferClick={
              canSellerSubmitNewOffer
                ? () => setOpenSubmitOfferModal(true)
                : undefined
            }
            canSubmitOffer={canSellerSubmitNewOffer}
            onScheduleClick={
              canInteractWithSchedule ? handleOpenScheduleModal : undefined
            }
            canInteractWithSchedule={canInteractWithSchedule} // Prop to sidebar for its own logic
            onInitiatePaymentClick={
              canBuyerInitiatePayment ? handleInitiatePayment : undefined
            }
            // onMarkInProgressClick -> backend auto-transitions after payment confirmation
            onMarkAsCompleteClick={
              canMarkOrApproveCompletion ? handleMarkAsComplete : undefined
            }
            getMarkCompleteButtonText={getMarkCompleteButtonText} // Pass function
            onRequestRefundClick={
              canRequestRefund ? handleOpenRefundModal : undefined
            }
            isCreatorVerified={isCreatorVerified} // Pass to sidebar
            onListServiceSpecificDealPay={handleListServiceSpecificDealPay}
          />
        </Grid>
      </Grid>

      {/* Modals */}
      {openSubmitOfferModal && (
        <SubmitOfferModal
          open={openSubmitOfferModal}
          onClose={() => setOpenSubmitOfferModal(false)}
          serviceRequest={request}
          onSubmitOffer={handleSubmitOffer} // Pass the new handler
          isLoading={actionStatus === "loading"}
          actionError={actionError} // Pass actionError for display
        />
      )}
      {selectedOfferForAction && request && (
        <>
          <RejectOfferModal
            open={rejectOfferModalOpen}
            onClose={handleCloseRejectModal}
            offer={selectedOfferForAction}
            serviceRequest={request}
            onSubmitReject={handleActualRejectOfferSubmit}
            isLoading={actionStatus === "loading"}
          />
          <CounterOfferModal
            open={counterOfferModalOpen}
            onClose={handleCloseCounterModal}
            originalOffer={selectedOfferForAction}
            serviceRequest={request}
            onSubmitCounter={handleActualSubmitCounterOffer}
            isLoading={actionStatus === "loading"}
          />
        </>
      )}
      {request &&
        openScheduleModal &&
        currentUser &&
        (isOwnerOfSR || isAwardedSeller) && (
          <SchedulingModal
            open={openScheduleModal}
            onClose={() => setOpenScheduleModal(false)}
            serviceRequest={request}
            currentUser={currentUser}
            onSaveSchedule={handleScheduleSubmit}
            actionStatus={actionStatus}
            actionError={actionError}
            minDate={minSchedulingDate}
          />
        )}

      {/* Refund Request Modal */}
      {isOwnerOfSR && request && openRefundModal && (
        <RefundRequestModal // This component needs to be created
          open={openRefundModal}
          onClose={handleCloseRefundModal}
          serviceRequest={request}
          onSubmitRefund={handleRequestRefundSubmit}
          actionStatus={actionStatus}
          actionError={actionError}
        />
      )}
      <ReviewSection listingId={requestId} listingModel="ServiceRequest" />
    </Container>
  );
};

export default ServiceRequestDetailPage;

/* eslint-disable react/prop-types */
import { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  Chip,
  Avatar,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SendIcon from "@mui/icons-material/Send";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close"; // For Close Request
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ServiceSpecificDealModal from "./ServiceSpecificDealModal";
import SpecialDealPaymentModal from "../../../components/SpecialDealPaymentModal";
import { showSnackbar } from "../../../store/slice/snackbarSlice";
import { fetchPromotionSettings } from "../../../store/thunks/adminPromotionThunk";
import { getSpecialDealActivationFee } from "../../../constants/promotions";
import { specialOfferApi } from "../../../services/specialOfferApi";
import { fetchServiceRequestByIdThunk } from "../../../store/thunks/serviceRequestThunks";

import {
  SR_STATUS,
  PAYMENT_STATUS,
  REFUND_STATUS,
  SCHEDULE_PROPOSAL_STATUS,
} from "../../../constants/serviceRequestStatus"; // Adjust path

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getBudgetText = (budget) => {
  if (!budget) return "N/A";

  if (budget.type === "open_to_offers") {
    return "Open to Offers";
  }
  if (budget.type === "fixed") {
    // For "fixed", the backend model only has min/max.
    // If it's truly fixed, min and max should be the same, or only one set.
    // Let's assume if 'fixed', `budget.min` holds the value.
    if (typeof budget.min === "number") return `$${budget.min.toFixed(2)}`;
    if (typeof budget.max === "number") return `$${budget.max.toFixed(2)}`; // Fallback if min isn't set but max is
    return "Fixed Price (Not Specified)";
  }
  if (budget.type === "hourly_range") {
    let parts = [];
    if (typeof budget.min === "number") parts.push(`$${budget.min.toFixed(2)}`);
    if (typeof budget.max === "number") parts.push(`$${budget.max.toFixed(2)}`);

    if (parts.length === 2) return `${parts.join(" - ")} /hr`;
    if (parts.length === 1 && typeof budget.min === "number")
      return `From ${parts[0]} /hr`;
    if (parts.length === 1 && typeof budget.max === "number")
      return `Up to ${parts[0]} /hr`;
    return "Hourly (Not Specified)";
  }

  // Fallback display of the type if no specific value found
  if (budget.type) {
    return budget.type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
  return "Budget Not Specified";
};

const getPositiveAmount = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue.toString()
    : "";
};

const resolveSpecialDealActualPriceForRequest = (
  amountToBePaid,
  originalRequestBudget
) => {
  const resolvedAmountToBePaid = getPositiveAmount(amountToBePaid);
  if (resolvedAmountToBePaid) {
    return resolvedAmountToBePaid;
  }

  const budgetMin = getPositiveAmount(originalRequestBudget?.min);
  const budgetMax = getPositiveAmount(originalRequestBudget?.max);
  if (originalRequestBudget?.type === "fixed") {
    return budgetMin || budgetMax;
  }

  return budgetMax || budgetMin;
};

const InfoItem = ({ icon, label, value }) => (
  <Box display="flex" alignItems="center">
    {icon && (
      <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>{icon}</Box>
    )}
    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
      {label}:
    </Typography>
    <Typography variant="body2" fontWeight="medium">
      {value}
    </Typography>
  </Box>
);

const RequesterInfoSnippet = ({ requester, createdAt }) => (
  <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
    <Avatar
      src={
        requester?.avatar
          ? `${API_DOMAIN_FOR_IMAGES}${requester.avatar}`
          : "/default-avatar.png"
      }
      alt={requester?.name || "User"}
      sx={{ width: 40, height: 40, mr: 1.5 }}
    />
    <Box>
      <Typography variant="subtitle2" fontWeight="bold">
        {requester && requester?.accountType == "agency"
          ? requester?.companyName
          : requester?.name || "N/A"}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Posted on {new Date(createdAt).toLocaleDateString()}
      </Typography>
    </Box>
  </Box>
);

const ServiceRequestSidebar = ({
  request,
  isOwner,
  currentUser,
  stickyTopOffset,
  onEditClick,
  onCloseRequestClick,
  actionStatus,
  onInviteProvidersClick,
  canInvite,
  onSubmitOfferClick,
  canSubmitOffer,
  onScheduleClick,
  canInteractWithSchedule, // This prop helps the parent control if scheduling UI should even be considered
  onInitiatePaymentClick,
  onMarkAsCompleteClick,
  getMarkCompleteButtonText,
  onRequestRefundClick,
  isCreatorVerified, // New prop
  onListServiceSpecificDealPay,
}) => {
  const dispatch = useDispatch();
  const promotionSettings = useSelector((state) => state.adminPromotion.settings);
  const [isSpecificDealModalOpen, setIsSpecificDealModalOpen] = useState(false);
  const [isSpecificDealPaymentModalOpen, setIsSpecificDealPaymentModalOpen] =
    useState(false);
  const [pendingSpecificDealPayload, setPendingSpecificDealPayload] =
    useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleToggleSpecialStatus = async (event) => {
    if (!request?.specialOffer?._id) return;
    const newStatus = event.target.checked ? "active" : "inactive";
    setIsTogglingStatus(true);
    try {
      await specialOfferApi.toggleSpecialOfferStatus(
        request.specialOffer._id,
        newStatus
      );
      await dispatch(fetchServiceRequestByIdThunk(request._id));
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

  if (!request) return null;

  const {
    status,
    paymentStatus,
    refundStatus,
    currentScheduleProposal,
    confirmedSchedule,
    amountToBePaid, // This is crucial, set by backend from accepted offer
    budget: originalRequestBudget, // The buyer's initial budget for the request
    createdBy,
    createdAt,
    awardedSellerId,
  } = request;

  const isCurrentUserAwardedSeller =
    currentUser && awardedSellerId === currentUser?._id;

  const currentUserId = currentUser?._id || currentUser?.id;
  const requestCreatorId = createdBy?._id || createdBy?.id || createdBy;
  const isCurrentUserRequestCreator =
    Boolean(currentUserId) &&
    Boolean(requestCreatorId) &&
    String(currentUserId) === String(requestCreatorId);

  // --- Button Visibility Logic ---
  const showEditButton = !!onEditClick && status === SR_STATUS.OPEN && isOwner;
  const showCloseButton =
    !!onCloseRequestClick &&
    isOwner &&
    [
      SR_STATUS.OPEN,
      SR_STATUS.AWAITING_SCHEDULE,
      SR_STATUS.SCHEDULE_NEGOTIATION,
    ].includes(status);
  const showInviteButton =
    !!onInviteProvidersClick &&
    canInvite &&
    status === SR_STATUS.OPEN &&
    isOwner;
  const showSubmitOfferButton =
    !!onSubmitOfferClick &&
    canSubmitOffer &&
    status === SR_STATUS.OPEN &&
    !isOwner &&
    isCreatorVerified; // Only show if creator is verified

  const showListServiceSpecificDealButton =
    status === SR_STATUS.OPEN && isCurrentUserRequestCreator && !request.isSpecial;

  const showVerificationPendingMessage =
    !isCreatorVerified && !isOwner && currentUser?.isSeller; // Show to sellers if creator not verified

  const showScheduleButton =
    !!onScheduleClick &&
    canInteractWithSchedule &&
    (isOwner || isCurrentUserAwardedSeller) && // Only relevant parties
    [
      SR_STATUS.AWAITING_SCHEDULE,
      SR_STATUS.SCHEDULE_NEGOTIATION,
      SR_STATUS.SCHEDULE_CONFIRMED,
    ].includes(status);

  let scheduleButtonText = "Schedule Service";
  if (status === SR_STATUS.SCHEDULE_CONFIRMED || confirmedSchedule) {
    scheduleButtonText = "View/Edit Confirmed Schedule";
  } else if (
    status === SR_STATUS.SCHEDULE_NEGOTIATION &&
    currentScheduleProposal
  ) {
    const isCurrentUserProposer =
      currentScheduleProposal.proposedBy?._id === currentUser?._id;
    if (
      (isOwner &&
        currentScheduleProposal.proposalStatus ===
        SCHEDULE_PROPOSAL_STATUS.PENDING_BUYER_CONFIRMATION) ||
      (isCurrentUserAwardedSeller &&
        currentScheduleProposal.proposalStatus ===
        SCHEDULE_PROPOSAL_STATUS.PENDING_SELLER_CONFIRMATION)
    ) {
      scheduleButtonText = "Confirm or Reschedule";
    } else if (isCurrentUserProposer) {
      scheduleButtonText = "Waiting for Other Party / Reschedule";
    } else {
      scheduleButtonText = "Review Schedule Proposal";
    }
  } else if (status === SR_STATUS.AWAITING_SCHEDULE) {
    scheduleButtonText = "Propose Schedule";
  }

  const showPayNowButton =
    !!onInitiatePaymentClick &&
    isOwner &&
    status === SR_STATUS.SCHEDULE_CONFIRMED &&
    paymentStatus === PAYMENT_STATUS.PENDING;

  const showMarkCompleteButton =
    !!onMarkAsCompleteClick &&
    (status === SR_STATUS.IN_PROGRESS ||
      status === SR_STATUS.PENDING_COMPLETION) &&
    (isOwner || isCurrentUserAwardedSeller);

  const showRequestRefundButton =
    !!onRequestRefundClick &&
    isOwner &&
    paymentStatus === PAYMENT_STATUS.SUCCEEDED &&
    (!refundStatus || refundStatus === REFUND_STATUS.NONE) && // Ensure refundStatus exists before checking NONE
    [
      SR_STATUS.IN_PROGRESS,
      SR_STATUS.PENDING_COMPLETION,
      SR_STATUS.COMPLETED,
    ].includes(status);
  const resolvedSpecialDealActualPrice = resolveSpecialDealActualPriceForRequest(
    amountToBePaid,
    originalRequestBudget
  );

  const handleOpenSpecificDealModal = () => {
    setIsSpecificDealModalOpen(true);
  };

  const handleCloseSpecificDealModal = () => {
    setIsSpecificDealModalOpen(false);
  };

  const handleCloseSpecificDealPaymentModal = useCallback(() => {
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);
  }, []);

  const handleListServiceSpecificDealPay = useCallback(async (dealPayload) => {
    setPendingSpecificDealPayload(dealPayload);
    // Open payment modal after the deal form closes to prevent modal overlap race.
    setTimeout(() => {
      setIsSpecificDealPaymentModalOpen(true);
    }, 0);
  }, []);

  const handleSpecificDealPaymentConfirm = useCallback(
    async ({ paymentData, dealPayload }) => {
      const finalPayload = {
        ...dealPayload,
        paymentData,
        requestId: request?._id,
      };

      if (onListServiceSpecificDealPay) {
        await Promise.resolve(onListServiceSpecificDealPay(finalPayload));
        return;
      }

      console.log("Service request special deal payment payload:", finalPayload);
      dispatch(
        showSnackbar({
          message: "Special deal payment submitted successfully.",
          severity: "success",
        })
      );
    },
    [dispatch, onListServiceSpecificDealPay, request?._id]
  );

  const getStatusChipColor = (currentStatus) => {
    switch (currentStatus) {
      case SR_STATUS.OPEN:
        return "success";
      case SR_STATUS.AWAITING_SCHEDULE:
        return "warning";
      case SR_STATUS.SCHEDULE_NEGOTIATION:
        return "info";
      case SR_STATUS.SCHEDULE_CONFIRMED:
        return "primary";
      case SR_STATUS.AWAITING_PAYMENT:
        return "secondary";
      case SR_STATUS.IN_PROGRESS:
        return "info";
      case SR_STATUS.PENDING_COMPLETION:
        return "warning";
      case SR_STATUS.COMPLETED:
        return "success";
      case SR_STATUS.REFUND_REQUESTED:
      case SR_STATUS.REFUND_REVIEW_PENDING:
        return "error";
      case SR_STATUS.REFUND_PROCESSED:
      case SR_STATUS.REFUND_APPROVED:
        return "success";
      case SR_STATUS.REFUND_REJECTED:
        return "default";
      case SR_STATUS.CLOSED:
      case SR_STATUS.CANCELLED_BY_BUYER:
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ position: { md: "sticky" }, top: { md: stickyTopOffset } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
              Request Summary
            </Typography>
            <Chip
              label={(status || "Unknown")
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
              color={getStatusChipColor(status)}
              size="small"
              variant="outlined"
            />
          </Box>
          <Divider />
          <InfoItem
            icon={<CategoryIcon />}
            label="Category"
            value={`${request.category || "N/A"}${request.subcategory ? ` > ${request.subcategory}` : ""
              }`}
          />
          <InfoItem
            icon={<AttachMoneyIcon />}
            label={status === SR_STATUS.OPEN ? "Budget" : "Price"} // Label changes
            value={
              request.isSpecial && request.specialOffer ? (
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{ color: "error.main", display: "flex", alignItems: "center" }}
                  >
                    Now: ${Number(request.specialOffer.sellingPrice || 0).toFixed(2)}
                    {request.specialOffer.discountPercentage !== undefined && (
                      <Chip
                        label={`${request.specialOffer.discountPercentage}% ${request.specialOffer.discountPercentage >= 0 ? "OFF" : "INC"}`}
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: "error.main",
                          color: "white",
                          height: "18px",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          borderRadius: "4px",
                          "& .MuiChip-label": { px: 0.5 },
                        }}
                      />
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ textDecoration: "line-through", color: "text.disabled" }}
                  >
                    Original: ${Number(request.specialOffer.actualPrice || 0).toFixed(2)}
                  </Typography>
                </Box>
              ) : status === SR_STATUS.OPEN ? (
                getBudgetText(originalRequestBudget) // Use original buyer's budget
              ) : typeof amountToBePaid === "number" ? ( // After offer accepted, use the agreed price
                `$${amountToBePaid.toFixed(2)}`
              ) : (
                "N/A (Price not set)"
              )
            }
          />
          <InfoItem
            icon={<EventAvailableIcon />}
            label="Delivery"
            value={request.desiredDeliveryTime || "N/A"}
          />
          <InfoItem
            icon={<LocationOnIcon />}
            label="Location"
            value={request.locationPreference || "N/A"}
          />

          <Divider />
          <RequesterInfoSnippet requester={createdBy} createdAt={createdAt} />

          <Divider sx={{ pt: 1 }} />
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            {/* Pre-Offer Acceptance Actions */}
            {showEditButton && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEditClick}
                disabled={actionStatus === "loading"}
              >
                Edit Request
              </Button>
            )}
            {showCloseButton && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={onCloseRequestClick}
                disabled={actionStatus === "loading"}
              >
                Close Request
              </Button>
            )}
            {showInviteButton && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={onInviteProvidersClick}
                disabled={actionStatus === "loading"}
              >
                Invite Providers
              </Button>
            )}

            {request?.specialOffer && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  Special Deal Status:
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={request.specialOffer.status === "active"}
                      onChange={handleToggleSpecialStatus}
                      disabled={isTogglingStatus}
                      size="small"
                      color="secondary"
                    />
                  }
                  label={request.specialOffer.status === "active" ? "ON" : "OFF"}
                  labelPlacement="start"
                  sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 700, mr: 1, color: request.specialOffer.status === "active" ? "secondary.main" : "text.secondary" } }}
                />
              </Box>
            )}

            {showListServiceSpecificDealButton && !request?.specialOffer && (
              <Button
                fullWidth
                variant="highlighted"
                color="secondary"
                startIcon={<LocalOfferIcon />}
                onClick={handleOpenSpecificDealModal}
                disabled={actionStatus === "loading"}
              >
                Special Deals
              </Button>
            )}

            {showSubmitOfferButton && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SendIcon />}
                onClick={onSubmitOfferClick}
                disabled={actionStatus === "loading" || !isCreatorVerified}
              >
                Submit an Offer
              </Button>
            )}

            {showVerificationPendingMessage && (
              <Button
                fullWidth
                variant="contained"
                color="warning"
                size="large"
                disabled
                sx={{ mt: 2 }}
              >
                User Verification Pending
              </Button>
            )}

            {/* Workflow Actions */}
            {showScheduleButton && (
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<EventAvailableIcon />}
                onClick={onScheduleClick}
                disabled={actionStatus === "loading"}
              >
                {actionStatus === "loading" && onScheduleClick ? (
                  <CircularProgress size={24} />
                ) : (
                  scheduleButtonText
                )}
              </Button>
            )}
            {showPayNowButton && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<AttachMoneyIcon />}
                onClick={onInitiatePaymentClick}
                disabled={actionStatus === "loading"}
              >
                {actionStatus === "loading" && onInitiatePaymentClick ? (
                  <CircularProgress size={24} />
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            )}
            {showMarkCompleteButton && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={onMarkAsCompleteClick}
                disabled={actionStatus === "loading"}
              >
                {actionStatus === "loading" && onMarkAsCompleteClick ? (
                  <CircularProgress size={24} />
                ) : getMarkCompleteButtonText ? (
                  getMarkCompleteButtonText()
                ) : (
                  "Mark Complete"
                )}
              </Button>
            )}
            {showRequestRefundButton && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<AttachMoneyIcon />}
                onClick={onRequestRefundClick}
                disabled={actionStatus === "loading"}
              >
                {actionStatus === "loading" && onRequestRefundClick ? (
                  <CircularProgress size={24} />
                ) : (
                  "Request Refund"
                )}
              </Button>
            )}
            {!currentUser && (
              <Button
                component={RouterLink}
                to="/auth/signin"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 2 }}
              >
                Sign In to Interact
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <ServiceSpecificDealModal
        open={isSpecificDealModalOpen}
        onClose={handleCloseSpecificDealModal}
        actionStatus={actionStatus}
        onPay={handleListServiceSpecificDealPay}
        initialActualPrice={resolvedSpecialDealActualPrice}
        isRequest={true}
      />

      <SpecialDealPaymentModal
        open={isSpecificDealPaymentModalOpen}
        onClose={handleCloseSpecificDealPaymentModal}
        entityId={request?._id}
        idempotencyPrefix="service-request-special-deal"
        dealPayload={pendingSpecificDealPayload}
        amount={specialDealActivationFee}
        onConfirmPayment={handleSpecificDealPaymentConfirm}
      />
    </Box>
  );
};

export default ServiceRequestSidebar;

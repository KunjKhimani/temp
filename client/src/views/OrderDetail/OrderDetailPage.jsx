// src/views/Orders/OrderDetailPage.jsx
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useCallback, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Container,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router-dom"; // Import Link for navigation

import {
  fetchOrderById,
  acceptOrderThunk,
  declineOrderThunk,
  scheduleOrderSlotThunk,
  markOrderInProgressThunk,
  markOrderCompletedThunk,
  requestOrderRefundThunk,
  deleteOrderThunk,
  proposeTimeChangeThunk,
  confirmTimeProposalThunk,
  processRefundPostDeclineThunk,
  findAnotherSellerThunk,
  reaffirmOriginalPreferenceThunk,
} from "../../store/thunks/orderThunks";
import {
  clearOrderDetailState,
  selectCurrentOrderDetail,
  selectOrderError,
  selectOrderStatus as selectFetchOrderStatus,
  selectOrderUpdateStatus,
  selectOrderUpdateError,
  clearOrderErrors,
} from "../../store/slice/orderSlice";
import { selectUser } from "../../store/slice/userSlice";
import { getOrCreateConversation } from "../../store/slice/chatSlice";
import { getTransactionByOrderId } from "../../services/transaction.service";
import TransactionDetails from "../../components/TransactionDetails";

import OrderHeader from "../Orders/OrderHeader";
import OrderInformationSection from "./OrderInformationSection";
import OrderActionsPanel from "./OrderActionsPanel";
import OrderDetailSummary from "./OrderDetailSummary";
import OrderDialogs from "./OrderDialogs";
import StripeOnboardingModal from "../../components/StripeOnboardingModal"; // Import the new modal
import ReviewModal from "../../components/ReviewModal";
import { reviewApi } from "../../services/reviewApi";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const orderDetail = useSelector(selectCurrentOrderDetail);
  const fetchStatus = useSelector(selectFetchOrderStatus);
  const fetchError = useSelector(selectOrderError);
  const currentUser = useSelector(selectUser);
  const updateActionStatus = useSelector(selectOrderUpdateStatus);
  const updateActionError = useSelector(selectOrderUpdateError);

  const [declineReason, setDeclineReason] = useState("");
  const [openDeclineDialog, setOpenDeclineDialog] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [isReschedulingModalOpen, setIsReschedulingModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [openDisputeDialog, setOpenDisputeDialog] = useState(false);
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [openProposeTimeModal, setOpenProposeTimeModal] = useState(false);
  const [openConfirmProposalModal, setOpenConfirmProposalModal] =
    useState(false);
  const [openRefundReasonModal, setOpenRefundReasonModal] = useState(false);
  const [buyerRefundReason, setBuyerRefundReason] = useState("");
  const [openFinalConfirmRefundDialog, setOpenFinalConfirmRefundDialog] =
    useState(false);
  const [onboardingStatusMessage, setOnboardingStatusMessage] = useState(null); // New state for onboarding messages
  const [openStripeOnboardingModal, setOpenStripeOnboardingModal] =
    useState(false); // State for new modal
  const [onboardingLinkForModal, setOnboardingLinkForModal] = useState(null); // State to pass link to modal
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [hasSubmittedServiceReview, setHasSubmittedServiceReview] = useState(false);

  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    if (orderId) {
      dispatch(clearOrderErrors());
      dispatch(clearOrderDetailState());
      dispatch(fetchOrderById(orderId));
    }

    // Check for Stripe onboarding query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const stripeOnboardingStatus = queryParams.get("stripe_onboarding");

    if (stripeOnboardingStatus) {
      if (stripeOnboardingStatus === "success") {
        setOnboardingStatusMessage({
          severity: "success",
          message:
            "Stripe account setup completed successfully! Your payouts should now be processed.",
        });
      } else if (stripeOnboardingStatus === "refresh") {
        setOnboardingStatusMessage({
          severity: "info",
          message:
            "Please complete your Stripe account setup to receive payouts. You may need to click the 'Complete Stripe Setup' button again if you were interrupted.",
        });
      }
      // Clear the query parameters from the URL to prevent re-showing the message on refresh
      navigate(window.location.pathname, { replace: true });
    }

    if (orderId) {
      getTransactionByOrderId(orderId)
        .then((data) => setTransaction(data))
        .catch((err) => console.error("Failed to fetch transaction:", err));
    }

    return () => {
      dispatch(clearOrderDetailState());
    };
  }, [dispatch, orderId, navigate]); // Added navigate to dependencies

  useEffect(() => {
    let ignore = false;

    const checkServiceReview = async () => {
      const listingId = orderDetail?.service?._id;
      const reviewerId = currentUser?._id;
      if (!listingId || !reviewerId) {
        if (!ignore) setHasSubmittedServiceReview(false);
        return;
      }

      try {
        const hasReviewed = await reviewApi.hasUserReviewedListing(
          listingId,
          reviewerId
        );
        if (!ignore) setHasSubmittedServiceReview(hasReviewed);
      } catch (error) {
        if (!ignore) setHasSubmittedServiceReview(false);
      }
    };

    checkServiceReview();

    return () => {
      ignore = true;
    };
  }, [orderDetail?.service?._id, currentUser?._id]);

  const handleGoBack = useCallback(() => navigate("/user/orders"), [navigate]);

  const handleChatAboutOrder = useCallback(() => {
    const debugInfo = {
      orderDetailExists: !!orderDetail,
      currentUserExists: !!currentUser,
      currentUserIdExists: !!currentUser?._id,
      orderDetailBuyerIdExists: !!orderDetail?.buyer?._id,
      orderDetailSellerIdExists: !!orderDetail?.seller?._id,
    };
    if (
      !debugInfo.orderDetailExists ||
      !debugInfo.currentUserExists ||
      !debugInfo.currentUserIdExists ||
      !debugInfo.orderDetailBuyerIdExists ||
      !debugInfo.orderDetailSellerIdExists
    ) {
      alert(
        "Cannot initiate chat. Required information is missing. Check console."
      );
      console.log("handleChatAboutOrder DEBUG:", debugInfo, {
        orderDetail,
        currentUser,
      });
      return;
    }
    const targetUserId =
      currentUser._id === orderDetail.buyer._id
        ? orderDetail.seller._id
        : orderDetail.buyer._id;
    dispatch(
      getOrCreateConversation({
        targetUserId,
        currentUserId: currentUser._id,
        orderId: orderDetail._id,
      })
    )
      .unwrap()
      .then((payload) => {
        if (payload?.conversation?._id)
          navigate(`/messages?conversationId=${payload.conversation._id}`);
        else {
          alert("Could not retrieve valid conversation details.");
        }
      })
      .catch((err) => {
        alert(err.message || "Could not start chat.");
      });
  }, [dispatch, navigate, orderDetail, currentUser]);

  const handleAcceptOrder = useCallback(() => {
    if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
      return;
    dispatch(acceptOrderThunk(orderDetail._id))
      .unwrap()
      .then(() => {
        dispatch(fetchOrderById(orderId));
      })
      .catch((err) => alert(err?.message || "Failed to accept order."));
  }, [dispatch, orderDetail, orderId, updateActionStatus]);

  const handleOpenDeclineDialog = useCallback(
    () => setOpenDeclineDialog(true),
    []
  );
  const handleCloseDeclineDialog = useCallback(() => {
    setOpenDeclineDialog(false);
    setDeclineReason("");
  }, []);
  const handleDeclineReasonChange = useCallback(
    (e) => setDeclineReason(e.target.value),
    []
  );
  const handleConfirmDeclineOrder = useCallback(() => {
    if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
      return;
    dispatch(
      declineOrderThunk({ orderId: orderDetail._id, reason: declineReason })
    )
      .unwrap()
      .then((response) => {
        alert(
          response.message ||
          "Order declined. Buyer will be notified of their options."
        );
        handleCloseDeclineDialog();
        dispatch(fetchOrderById(orderId));
      })
      .catch((err) => alert(err?.message || "Failed to decline order."));
  }, [
    dispatch,
    orderDetail,
    orderId,
    declineReason,
    updateActionStatus,
    handleCloseDeclineDialog,
  ]);

  const handleOpenScheduleModal = useCallback(() => {
    if (orderDetail?.service) {
      setIsReschedulingModalOpen(false);
      setOpenScheduleModal(true);
    } else alert("Service details are not loaded.");
  }, [orderDetail]);
  const handleOpenRescheduleModal = useCallback(() => {
    if (orderDetail?.service) {
      setIsReschedulingModalOpen(true);
      setOpenScheduleModal(true);
    } else {
      alert("Service details are not loaded.");
    }
  }, [orderDetail]);
  const handleCloseScheduleModal = useCallback(() => {
    setOpenScheduleModal(false);
  }, []);
  const handleConfirmSchedule = useCallback(
    (scheduleDataFromModal) => {
      if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
        return;
      const payload = {
        orderId: orderDetail._id,
        scheduleData: scheduleDataFromModal,
        isReschedule: isReschedulingModalOpen,
      };
      dispatch(scheduleOrderSlotThunk(payload))
        .unwrap()
        .then(() => {
          alert(
            isReschedulingModalOpen
              ? "Order rescheduled successfully!"
              : "Order scheduled successfully!"
          );
          handleCloseScheduleModal();
          dispatch(fetchOrderById(orderId));
        })
        .catch((err) => {
          alert(err?.message || "Failed to schedule/reschedule order.");
        });
    },
    [
      dispatch,
      orderDetail,
      orderId,
      isReschedulingModalOpen,
      updateActionStatus,
      handleCloseScheduleModal,
    ]
  );

  const handleMarkInProgress = useCallback(() => {
    if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
      return;
    dispatch(markOrderInProgressThunk(orderDetail._id))
      .unwrap()
      .then(() => dispatch(fetchOrderById(orderId)))
      .catch((err) => alert(err?.message || "Failed to mark in progress."));
  }, [dispatch, orderDetail, orderId, updateActionStatus]);
  const handleMarkCompleted = useCallback(() => {
    if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
      return;
    dispatch(markOrderCompletedThunk(orderDetail._id))
      .unwrap()
      .then((response) => {
        // Check if an onboarding link was returned AND if the current user is the seller
        if (
          response.onboardingLink &&
          currentUser._id === orderDetail.seller?._id
        ) {
          // Open the modal for the seller
          setOnboardingLinkForModal(response.onboardingLink);
          setOpenStripeOnboardingModal(true);
        } else {
          // For buyer, or if no onboarding link is needed, just show success and re-fetch
          alert("Order marked completed and funds transferred successfully!");
          if (
            currentUser._id === orderDetail.buyer?._id &&
            orderDetail.service?._id &&
            String(response?.order?.status || "").toLowerCase() === "completed" &&
            !hasSubmittedServiceReview
          ) {
            setOpenReviewModal(true);
          }
          dispatch(fetchOrderById(orderId)); // Re-fetch to update status
        }
      })
      .catch((err) => {
        alert(err?.message || "Failed to mark completed.");
        dispatch(fetchOrderById(orderId)); // Re-fetch to show latest status/error
      });
  }, [dispatch, orderDetail, orderId, updateActionStatus, currentUser, hasSubmittedServiceReview]); // Added currentUser to dependencies
  const handleOpenDisputeDialog = useCallback(() => {
    setDisputeReason("");
    setOpenDisputeDialog(true);
  }, []);
  const handleCloseDisputeDialog = useCallback(
    () => setOpenDisputeDialog(false),
    []
  );
  const handleDisputeReasonChange = useCallback(
    (e) => setDisputeReason(e.target.value),
    []
  );
  const handleConfirmDispute = useCallback(() => {
    if (!disputeReason.trim()) {
      alert("Please provide a reason for your dispute.");
      return;
    }
    if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
      return;
    dispatch(
      requestOrderRefundThunk({
        orderId: orderDetail._id,
        reason: disputeReason,
      })
    )
      .unwrap()
      .then(() => {
        handleCloseDisputeDialog();
        dispatch(fetchOrderById(orderId));
      })
      .catch((err) => alert(err?.message || "Failed to submit dispute."));
  }, [
    dispatch,
    orderDetail,
    orderId,
    disputeReason,
    updateActionStatus,
    handleCloseDisputeDialog,
  ]);
  const handleOpenDeleteDialog = useCallback(
    () => setOpenDeleteConfirmDialog(true),
    []
  );
  const handleCloseDeleteDialog = useCallback(
    () => setOpenDeleteConfirmDialog(false),
    []
  );
  const handleConfirmDeleteOrder = useCallback(() => {
    if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
      return;
    dispatch(deleteOrderThunk(orderDetail._id))
      .unwrap()
      .then(() => {
        handleCloseDeleteDialog();
        navigate("/user/orders");
      })
      .catch((err) => alert(err?.message || "Failed to delete order."));
  }, [
    dispatch,
    navigate,
    orderDetail,
    orderId,
    updateActionStatus,
    handleCloseDeleteDialog,
  ]);

  const handleOpenSellerProposeTimeModal = useCallback(
    () => setOpenProposeTimeModal(true),
    []
  );
  const handleCloseSellerProposeTimeModal = useCallback(
    () => setOpenProposeTimeModal(false),
    []
  );
  const handleConfirmSellerProposeTime = useCallback(
    (proposalData) => {
      if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
        return;
      dispatch(
        proposeTimeChangeThunk({ orderId: orderDetail._id, ...proposalData })
      )
        .unwrap()
        .then((response) => {
          alert(response.message || "Time change proposal submitted.");
          handleCloseSellerProposeTimeModal();
          dispatch(fetchOrderById(orderId));
        })
        .catch((err) =>
          alert(err?.message || "Failed to submit time proposal.")
        );
    },
    [
      dispatch,
      orderDetail,
      orderId,
      updateActionStatus,
      handleCloseSellerProposeTimeModal,
    ]
  );

  const handleOpenBuyerConfirmProposalModal = useCallback(
    () => setOpenConfirmProposalModal(true),
    []
  );
  const handleCloseBuyerConfirmProposalModal = useCallback(
    () => setOpenConfirmProposalModal(false),
    []
  );
  const handleConfirmBuyerTimeSelection = useCallback(
    (acceptedPreferenceFromModal) => {
      if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
        return;
      dispatch(
        confirmTimeProposalThunk({
          orderId: orderDetail._id,
          acceptedTimePreference: acceptedPreferenceFromModal,
        })
      )
        .unwrap()
        .then((response) => {
          alert(response.message || "Time preference updated.");
          handleCloseBuyerConfirmProposalModal();
          dispatch(fetchOrderById(orderId));
        })
        .catch((err) =>
          alert(err?.message || "Failed to confirm time preference.")
        );
    },
    [
      dispatch,
      orderDetail,
      orderId,
      updateActionStatus,
      handleCloseBuyerConfirmProposalModal,
    ]
  );

  const handleKeepOriginalPreference = useCallback(() => {
    if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
      return;
    if (
      !window.confirm(
        "Are you sure you want to stick with your original time preference? This will notify the seller."
      )
    ) {
      return;
    }
    dispatch(reaffirmOriginalPreferenceThunk(orderDetail._id))
      .unwrap()
      .then((response) => {
        alert(response.message || "Preference reaffirmed. Seller notified.");
        dispatch(fetchOrderById(orderId));
      })
      .catch((err) => {
        alert(err?.message || "Failed to reaffirm your preference.");
      });
  }, [dispatch, orderDetail, orderId, updateActionStatus]);

  const handleOpenRefundReasonModal = useCallback(() => {
    setBuyerRefundReason("");
    setOpenRefundReasonModal(true);
  }, []);
  const handleCloseRefundReasonModal = useCallback(
    () => setOpenRefundReasonModal(false),
    []
  );
  const handleSubmitRefundReason = useCallback(
    (reason) => {
      setBuyerRefundReason(reason);
      handleCloseRefundReasonModal();
      setOpenFinalConfirmRefundDialog(true);
    },
    [handleCloseRefundReasonModal]
  );

  const handleCloseFinalConfirmRefundDialog = useCallback(
    () => setOpenFinalConfirmRefundDialog(false),
    []
  );
  const handleProcessRefundPostDecline = useCallback(() => {
    if (!orderDetail?._id || updateActionStatus === "loading") return;
    dispatch(
      processRefundPostDeclineThunk({
        orderId: orderDetail._id,
        buyerReason: buyerRefundReason,
      })
    )
      .unwrap()
      .then((response) => {
        alert(
          response.message || "Refund request submitted and being processed."
        );
        handleCloseFinalConfirmRefundDialog();
        dispatch(fetchOrderById(orderId));
      })
      .catch((err) => {
        alert(err?.message || "Failed to process refund request.");
        handleCloseFinalConfirmRefundDialog();
      });
  }, [
    dispatch,
    orderDetail,
    orderId,
    updateActionStatus,
    buyerRefundReason,
    handleCloseFinalConfirmRefundDialog,
  ]);

  const handleFindAnotherSeller = useCallback(() => {
    if (
      !orderDetail ||
      !orderDetail._id ||
      !orderDetail.service ||
      updateActionStatus === "loading"
    ) {
      alert("Order or service details are missing for this action.");
      return;
    }
    console.log(
      "[OrderDetailPage] User chose 'Find Another Seller'. Navigating. Order ID:",
      orderDetail._id
    );
    // dispatch(findAnotherSellerThunk(orderDetail._id)).unwrap().then(...); // If backend changes state
    alert(
      "You will be redirected to search for services. If you book a new service, consider requesting a refund for this declined order separately."
    );
    const service = orderDetail.service;
    navigate(
      `/services?category=${encodeURIComponent(
        service.category || ""
      )}&search_query=${encodeURIComponent(service.title || "")}`
    );
  }, [navigate, orderDetail, updateActionStatus]); // Removed dispatch for now

  const handleRetryPayout = useCallback(() => {
    if (!orderDetail || !orderDetail._id || updateActionStatus === "loading")
      return;
    if (
      !window.confirm(
        "Are you sure you want to retry completing this order and processing the payout? Ensure your Stripe account is connected."
      )
    ) {
      return;
    }
    dispatch(markOrderCompletedThunk(orderDetail._id)) // Re-using markOrderCompletedThunk
      .unwrap()
      .then(() => {
        alert("Payout retry initiated. Please check your Stripe account.");
        dispatch(fetchOrderById(orderId)); // Re-fetch to update status
      })
      .catch((err) => {
        alert(err?.message || "Failed to retry payout.");
      });
  }, [dispatch, orderDetail, orderId, updateActionStatus]);

  const onNavigateToPayment = useCallback(() => {
    if (orderDetail?.paymentIntentClientSecret && orderDetail?._id) {
      navigate(
        `/payments/?clientSecret=${encodeURIComponent(
          orderDetail.paymentIntentClientSecret
        )}&orderId=${orderDetail._id}`
      );
    } else {
      alert("Payment information is incomplete for this order.");
    }
  }, [navigate, orderDetail]);

  const getTimePreferenceDisplay = useCallback((preference) => {
    switch (preference) {
      case "morning":
        return "Morning (e.g., 9 AM - 12 PM)";
      case "afternoon":
        return "Afternoon (e.g., 1 PM - 5 PM)";
      case "evening":
        return "Evening (e.g., 6 PM - 9 PM)";
      case "any":
      default:
        return "Any Time";
    }
  }, []);

  const currentScheduledDetailsForModal = useMemo(
    () => ({
      selectedTimeSlot: orderDetail?.selectedTimeSlot,
      scheduledDateTime: orderDetail?.scheduledDateTime,
      buyerSchedulingComment: orderDetail?.buyerSchedulingComment,
    }),
    [
      orderDetail?.selectedTimeSlot,
      orderDetail?.scheduledDateTime,
      orderDetail?.buyerSchedulingComment,
    ]
  );

  if (fetchStatus === "loading" && !orderDetail) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 200px)",
        }}
      >
        {" "}
        <CircularProgress />{" "}
        <Typography sx={{ ml: 2 }}>Loading order details...</Typography>{" "}
      </Box>
    );
  }
  if (fetchStatus === "failed" && !orderDetail) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        {" "}
        <Alert severity="error" sx={{ mt: 3 }}>
          {" "}
          Failed to load order details.{" "}
          {fetchError?.message || fetchError || "Please try again later."}{" "}
        </Alert>{" "}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          {" "}
          Back to Orders{" "}
        </Button>{" "}
      </Container>
    );
  }
  if (!orderDetail || !currentUser || !currentUser._id) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 200px)",
        }}
      >
        {" "}
        <CircularProgress />{" "}
        <Typography sx={{ ml: 2 }}>Preparing details...</Typography>{" "}
      </Box>
    );
  }

  const isCurrentUserBuyer = currentUser._id === orderDetail.buyer?._id;
  const isLoadingAction = updateActionStatus === "loading";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <OrderHeader
        orderId={orderDetail._id}
        status={orderDetail.status}
        date={orderDetail.createdAt}
        onGoBack={handleGoBack}
      />

      {/* Stripe Onboarding Status Message */}
      {onboardingStatusMessage && (
        <Alert
          severity={onboardingStatusMessage.severity}
          sx={{ mt: 2, mb: 3 }}
        >
          {onboardingStatusMessage.message}
        </Alert>
      )}

      {/* Payout Pending Alert for Seller */}
      {orderDetail.status === "payout-pending" &&
        currentUser._id === orderDetail.seller?._id &&
        (!onboardingStatusMessage ||
          onboardingStatusMessage.severity !== "success") && (
          <Alert
            severity="warning"
            sx={{ mt: 2, mb: 3, display: "flex", alignItems: "center" }}
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setOnboardingLinkForModal(orderDetail.onboardingLink);
                    setOpenStripeOnboardingModal(true);
                  }}
                  sx={{ fontWeight: "bold" }}
                >
                  {orderDetail.onboardingLink
                    ? "Complete Stripe Setup"
                    : "Connect Stripe Account"}
                </Button>
                {/* <Button
                  color="inherit"
                  size="small"
                  onClick={handleMarkCompleted} // Re-use markOrderCompleted to retry payout
                  disabled={isLoadingAction}
                  sx={{ fontWeight: "bold" }}
                >
                  {isLoadingAction ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Retry Payout"
                  )}
                </Button> */}
              </Stack>
            }
          >
            <Typography variant="body1" sx={{ fontWeight: "medium" }}>
              Payout Pending:
            </Typography>{" "}
            This order has been marked completed by the buyer, but your payout
            is pending because your Stripe account is not fully set up. Please
            complete your Stripe account setup to receive your funds.
          </Alert>
        )}

      {/* Payout Failed Alert for Buyer */}
      {orderDetail.status === "payout-failed" && isCurrentUserBuyer && (
        <Alert
          severity="error"
          sx={{ mt: 2, mb: 3, display: "flex", alignItems: "center" }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetryPayout}
              disabled={isLoadingAction}
              sx={{ fontWeight: "bold" }}
            >
              {isLoadingAction ? (
                <CircularProgress size={20} />
              ) : (
                "Retry Payout"
              )}
            </Button>
          }
        >
          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
            Payout Failed:
          </Typography>{" "}
          The payout for this completed order has failed. Please ensure your
          Stripe account is correctly connected and try again.
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, md: 4 }} sx={{ mt: { xs: 1, md: 2 } }}>
        <Grid item xs={12} md={7} lg={8}>
          <OrderInformationSection
            orderDetail={orderDetail}
            isCurrentUserBuyer={isCurrentUserBuyer}
            getTimePreferenceDisplay={getTimePreferenceDisplay}
            onOpenBuyerConfirmProposalModal={
              handleOpenBuyerConfirmProposalModal
            }
            onKeepOriginalPreference={handleKeepOriginalPreference}
            onChatAboutOrder={handleChatAboutOrder}
            onFindAnotherSeller={handleFindAnotherSeller}
            onOpenConfirmRefundPostDeclineDialog={handleOpenRefundReasonModal} // This starts the multi-step refund
            isLoadingAction={isLoadingAction}
          />
        </Grid>
        <Grid item xs={12} md={5} lg={4}>
          <Stack spacing={3}>
            <OrderActionsPanel
              orderDetail={orderDetail}
              currentUser={currentUser}
              isLoadingAction={isLoadingAction}
              updateActionError={updateActionError}
              onClearErrors={() => dispatch(clearOrderErrors())}
              onAcceptOrder={handleAcceptOrder}
              onOpenSellerProposeTimeModal={handleOpenSellerProposeTimeModal}
              onOpenDeclineDialog={handleOpenDeclineDialog}
              onMarkInProgress={handleMarkInProgress}
              onOpenScheduleModal={handleOpenScheduleModal}
              onOpenRescheduleModal={handleOpenRescheduleModal}
              onNavigateToPayment={onNavigateToPayment}
              onMarkCompleted={handleMarkCompleted}
              sellerStripeAccountId={orderDetail?.seller?.stripeAccountId}
              onOpenDisputeDialog={handleOpenDisputeDialog}
              onOpenDeleteDialog={handleOpenDeleteDialog}
              onChatAboutOrder={handleChatAboutOrder}
            />
            <OrderDetailSummary order={orderDetail} />
            {!isCurrentUserBuyer && <TransactionDetails transaction={transaction} />}
          </Stack>
        </Grid>
      </Grid>

      {console.log(orderDetail)}

      <OrderDialogs
        orderDetail={orderDetail}
        isLoadingAction={isLoadingAction}
        openDeclineDialog={openDeclineDialog}
        onCloseDeclineDialog={handleCloseDeclineDialog}
        onConfirmDeclineOrder={handleConfirmDeclineOrder}
        declineReason={declineReason}
        onDeclineReasonChange={handleDeclineReasonChange}
        openProposeTimeModal={openProposeTimeModal}
        onCloseProposeTimeModal={handleCloseSellerProposeTimeModal}
        onConfirmProposeTimeChange={handleConfirmSellerProposeTime}
        openConfirmProposalModal={openConfirmProposalModal}
        onCloseConfirmProposalModal={handleCloseBuyerConfirmProposalModal}
        onConfirmBuyerTimeSelection={handleConfirmBuyerTimeSelection}
        openScheduleModal={openScheduleModal}
        onCloseScheduleModal={handleCloseScheduleModal}
        onConfirmSchedule={handleConfirmSchedule}
        isReschedulingModalOpen={isReschedulingModalOpen}
        currentScheduledDetailsForModal={currentScheduledDetailsForModal}
        openDisputeDialog={openDisputeDialog}
        onCloseDisputeDialog={handleCloseDisputeDialog}
        onConfirmDispute={handleConfirmDispute}
        disputeReason={disputeReason}
        onDisputeReasonChange={handleDisputeReasonChange}
        openDeleteConfirmDialog={openDeleteConfirmDialog}
        onCloseDeleteConfirmDialog={handleCloseDeleteDialog}
        onConfirmDeleteOrder={handleConfirmDeleteOrder}
        // Props for the new multi-step refund dialogs
        openRefundReasonModal={openRefundReasonModal}
        onCloseRefundReasonModal={handleCloseRefundReasonModal}
        onSubmitRefundReason={handleSubmitRefundReason}
        openFinalConfirmRefundDialog={openFinalConfirmRefundDialog}
        onCloseFinalConfirmRefundDialog={handleCloseFinalConfirmRefundDialog}
        onProcessFinalRefund={handleProcessRefundPostDecline}
      // buyerRefundReasonForFinalDialog is not needed as prop, parent's state buyerRefundReason is used
      />

      {/* Stripe Onboarding Modal */}
      <StripeOnboardingModal
        open={openStripeOnboardingModal}
        onClose={() => setOpenStripeOnboardingModal(false)}
        onboardingLink={onboardingLinkForModal}
      />

      <ReviewModal
        open={openReviewModal}
        onClose={() => setOpenReviewModal(false)}
        orderId={orderDetail?._id}
        orderModel="Order"
        listingId={orderDetail?.service?._id}
        listingModel="Service"
        title="Review This Service"
        onSuccess={() => {
          setHasSubmittedServiceReview(true);
        }}
      />
    </Container>
  );
};

export default OrderDetailPage;

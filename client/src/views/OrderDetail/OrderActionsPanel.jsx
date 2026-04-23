/* eslint-disable no-unused-vars */
// src/components/Orders/OrderActionsPanel.jsx
/* eslint-disable react/prop-types */
import React from "react";
import {
  Paper,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PaymentsIcon from "@mui/icons-material/Payments";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

const OrderActionsPanel = ({
  orderDetail,
  currentUser,
  isLoadingAction,
  updateActionError,
  onClearErrors,
  // Seller actions
  onAcceptOrder,
  onOpenSellerProposeTimeModal,
  onOpenDeclineDialog,
  onMarkInProgress,
  // Buyer actions
  onOpenScheduleModal,
  onOpenRescheduleModal,
  onNavigateToPayment,
  onMarkCompleted,
  onOpenDisputeDialog,
  onOpenDeleteDialog,
  // General
  onChatAboutOrder,
  sellerStripeAccountId, // New prop
}) => {
  if (!orderDetail || !currentUser) return null;

  const isCurrentUserBuyer = currentUser._id === orderDetail.buyer?._id;
  const isCurrentUserSeller = currentUser._id === orderDetail.seller?._id;
  const orderStatusLower = orderDetail.status?.toLowerCase();

  const isPayoutPendingForSeller =
    orderStatusLower === "payout-pending" && isCurrentUserSeller;

  const canChat = [
    "accepted",
    "awaiting-seller-confirmation",
    "awaiting-buyer-time-adjustment",
    "awaiting-buyer-scheduling",
    "scheduled",
    "in-progress",
    "completed",
    "disputed",
    "refund-requested",
    "seller-declined-awaiting-buyer",
    "payout-pending", // Add payout-pending to allow chat
  ].includes(orderStatusLower);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "12px" }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: "bold" }}>
        Order Actions
      </Typography>
      {updateActionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onClearErrors}>
          {updateActionError?.message || updateActionError}
        </Alert>
      )}

      {isPayoutPendingForSeller ? (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Payout is pending. Please update your profile to input your Stripe
            account ID to receive payments.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => (window.location.href = "/user/profile/edit")}
          >
            Update Profile
          </Button>
        </Stack>
      ) : (
        <>
          {/* Seller Actions: Awaiting Seller Confirmation */}
          {isCurrentUserSeller &&
            orderStatusLower === "awaiting-seller-confirmation" && (
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={onAcceptOrder}
                  disabled={isLoadingAction}
                  startIcon={
                    isLoadingAction ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CheckCircleOutlineIcon />
                    )
                  }
                >
                  Accept Order
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  onClick={onOpenSellerProposeTimeModal}
                  disabled={isLoadingAction}
                  startIcon={
                    isLoadingAction ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SwapHorizIcon />
                    )
                  }
                >
                  Propose Different Time
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={onOpenDeclineDialog}
                  disabled={isLoadingAction}
                  startIcon={
                    isLoadingAction ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CancelOutlinedIcon />
                    )
                  }
                >
                  Decline Order
                </Button>
              </Stack>
            )}

          {/* Buyer Actions: Awaiting Buyer Scheduling */}
          {isCurrentUserBuyer &&
            orderStatusLower === "awaiting-buyer-scheduling" &&
            orderDetail.service && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={onOpenScheduleModal}
                disabled={isLoadingAction}
                startIcon={
                  isLoadingAction ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <EventAvailableIcon />
                  )
                }
                sx={{ py: 1.5 }}
              >
                Schedule Service Time
              </Button>
            )}

          {/* Buyer Actions: Scheduled */}
          {isCurrentUserBuyer &&
            orderStatusLower === "scheduled" &&
            orderDetail.service && (
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={onOpenRescheduleModal}
                disabled={isLoadingAction}
                startIcon={
                  isLoadingAction ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <EditCalendarIcon />
                  )
                }
                sx={{ py: 1.5 }}
              >
                Reschedule Service
              </Button>
            )}

          {/* Buyer Actions: Pending Payment */}
          {isCurrentUserBuyer && orderStatusLower === "pending-payment" && (
            <Alert
              severity="info"
              action={
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<PaymentsIcon />}
                  onClick={onNavigateToPayment}
                  disabled={
                    !orderDetail ||
                    !orderDetail.paymentIntentClientSecret ||
                    isLoadingAction
                  }
                >
                  Pay Now
                </Button>
              }
            >
              This order is awaiting payment.
            </Alert>
          )}

          {/* Seller Actions: Scheduled, Accepted, Awaiting Buyer Scheduling */}
          {isCurrentUserSeller &&
            (orderStatusLower === "scheduled" ||
              orderStatusLower === "accepted" ||
              orderStatusLower === "awaiting-buyer-scheduling") && (
              <Button
                fullWidth
                variant="contained"
                color="info"
                onClick={onMarkInProgress}
                disabled={isLoadingAction}
                startIcon={
                  isLoadingAction ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PlayCircleOutlineIcon />
                  )
                }
              >
                Mark In Progress
              </Button>
            )}

          {/* Buyer Actions: In Progress */}
          {isCurrentUserBuyer && orderStatusLower === "in-progress" && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mt: 1 }}
            >
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={onMarkCompleted}
                disabled={isLoadingAction}
                startIcon={
                  isLoadingAction ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              >
                Mark Completed
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={onOpenDisputeDialog}
                disabled={isLoadingAction}
                startIcon={
                  isLoadingAction ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <ReportProblemOutlinedIcon />
                  )
                }
              >
                Not Completed / Dispute
              </Button>
            </Stack>
          )}
          {isCurrentUserBuyer &&
            orderStatusLower === "payout-pending" &&
            sellerStripeAccountId && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={onMarkCompleted}
                disabled={isLoadingAction}
                startIcon={
                  isLoadingAction ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              >
                Mark Completed
              </Button>
            )}

          {/* Buyer Actions: Pending Payment (Delete) */}
          {isCurrentUserBuyer && orderStatusLower === "pending-payment" && (
            <Button
              fullWidth
              variant="text"
              color="error"
              onClick={onOpenDeleteDialog}
              disabled={isLoadingAction}
              startIcon={
                isLoadingAction ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <DeleteForeverIcon />
                )
              }
              sx={{ mt: 1.5 }}
            >
              Delete Order
            </Button>
          )}

          {/* NO ACTIONS for 'seller-declined-awaiting-buyer' in this specific panel,
              those are handled in OrderInformationSection */}
        </>
      )}

      {canChat && (
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={onChatAboutOrder}
          fullWidth
          sx={{ mt: 2 }}
        >
          Chat Regarding Order
        </Button>
      )}
    </Paper>
  );
};

export default OrderActionsPanel;

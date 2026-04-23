/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
// src/components/Orders/OrderInformationSection.jsx
/* eslint-disable react/prop-types */
import React from "react";
import { Box, Typography, Paper, Stack, Button } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventIcon from "@mui/icons-material/Event";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SearchIcon from "@mui/icons-material/Search";
import CreditCardOffIcon from "@mui/icons-material/CreditCardOff";
import { format, parseISO } from "date-fns";

import ServiceInfoCard from "./ServiceInfoCard";
import UserInfoCard from "./UserInfoCard";

const OrderInformationSection = ({
  orderDetail,
  isCurrentUserBuyer,
  getTimePreferenceDisplay,
  onOpenBuyerConfirmProposalModal,
  onKeepOriginalPreference,
  onChatAboutOrder,
  onFindAnotherSeller,
  onOpenConfirmRefundPostDeclineDialog,
  isLoadingAction,
}) => {
  if (!orderDetail) return null;
  const orderStatusLower = orderDetail.status?.toLowerCase();

  // --- MODIFIED LOGIC ---
  // Check if specific scheduling details (chosen by buyer upfront or set later) exist
  const hasSpecificScheduleDetails =
    orderDetail.selectedTimeSlot?.slotDate || orderDetail.scheduledDateTime;

  // Determine if the service is considered "officially scheduled" based on status
  // This can be used for UI cues or if certain actions depend on the order being in a formally scheduled state.
  const isOfficiallyScheduledOrLater =
    orderStatusLower === "scheduled" ||
    orderStatusLower === "in-progress" ||
    orderStatusLower === "completed";

  return (
    <Stack spacing={3}>
      {/* --- Display Chosen/Confirmed Schedule block if details exist --- */}
      {hasSpecificScheduleDetails && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            // Optionally, change bgcolor based on isOfficiallyScheduledOrLater
            bgcolor: isOfficiallyScheduledOrLater
              ? "success.lighter"
              : "grey.100", // Example: different bg if not yet "officially" scheduled by status
            borderColor: isOfficiallyScheduledOrLater
              ? "success.light"
              : "grey.300",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ mb: 1 }}
          >
            <EventIcon
              color={isOfficiallyScheduledOrLater ? "success" : "action"}
            />
            <Typography
              variant="subtitle1"
              sx={{
                color: isOfficiallyScheduledOrLater
                  ? "success.dark"
                  : "text.primary",
                fontWeight: "bold",
              }}
            >
              {/* Adjust title based on whether it's just chosen or fully confirmed by status */}
              {isOfficiallyScheduledOrLater
                ? "Service Scheduled"
                : "Chosen Service Time"}
            </Typography>
          </Stack>
          {orderDetail.selectedTimeSlot?.slotDate &&
            orderDetail.selectedTimeSlot?.startTime && ( // This is your case
              <Typography variant="body1" pl={4.5}>
                On:{" "}
                <strong>
                  {format(
                    parseISO(orderDetail.selectedTimeSlot.slotDate),
                    "EEEE, MMM d, yyyy"
                  )}
                </strong>
                <br /> Time:{" "}
                <strong>
                  {orderDetail.selectedTimeSlot.startTime} -{" "}
                  {orderDetail.selectedTimeSlot.endTime}
                </strong>
              </Typography>
            )}
          {orderDetail.scheduledDateTime && !orderDetail.selectedTimeSlot && (
            <Typography variant="body1" pl={4.5}>
              On:{" "}
              <strong>
                {format(
                  parseISO(orderDetail.scheduledDateTime),
                  "EEEE, MMM d, yyyy, h:mm a"
                )}
              </strong>
            </Typography>
          )}
          {orderDetail.schedulingComment && ( // Display scheduling comment if it exists
            <Typography
              variant="body2"
              sx={{ mt: 1, pl: 4.5, fontStyle: "italic" }}
            >
              Buyer's Note: {orderDetail.schedulingComment}
            </Typography>
          )}
        </Paper>
      )}

      {/* --- Conditionally Display Buyer's Fallback Preferred Time --- */}
      {/* Show only if NO specific schedule details were chosen/set AND there's a timePreference */}
      {!hasSpecificScheduleDetails && orderDetail.timePreference && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: "info.light", bgcolor: "info.lighter" }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AccessTimeIcon color="info" />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Buyer's Initial Preferred Time
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {getTimePreferenceDisplay(orderDetail.timePreference)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* --- Seller's Time Proposal Display (if applicable) --- */}
      {isCurrentUserBuyer &&
        orderStatusLower === "awaiting-buyer-time-adjustment" &&
        orderDetail.sellerProposedTimePreferences?.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderColor: "warning.main",
              bgcolor: "warning.lighter",
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "warning.dark", fontWeight: "bold" }}
            >
              Seller Proposed New Times
            </Typography>
            <Typography variant="body1" gutterBottom>
              The seller cannot meet your original preference and has proposed
              the following time(s):
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, mb: 1.5 }}>
              {orderDetail.sellerProposedTimePreferences.map((pref) => (
                <li key={pref}>
                  <Typography
                    variant="body1"
                    component="span"
                    fontWeight="medium"
                  >
                    {getTimePreferenceDisplay(pref)}
                  </Typography>
                </li>
              ))}
            </Box>
            {orderDetail.sellerTimeProposalMessage && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  mb: 2,
                  fontStyle: "italic",
                  p: 1.5,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                }}
              >
                <strong>Seller's Note:</strong>{" "}
                {orderDetail.sellerTimeProposalMessage}
              </Typography>
            )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mt: 2 }}
            >
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={onOpenBuyerConfirmProposalModal}
                disabled={isLoadingAction}
              >
                Accept & Choose New Time
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={onKeepOriginalPreference}
                disabled={isLoadingAction}
              >
                Keep Original (Notify Seller)
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="info"
                startIcon={<ChatBubbleOutlineIcon />}
                onClick={onChatAboutOrder}
              >
                Discuss Further
              </Button>
            </Stack>
          </Paper>
        )}

      {/* --- Service, Buyer, Seller Info Cards --- */}
      {orderDetail.service && <ServiceInfoCard service={orderDetail.service} />}
      {orderDetail.buyer && (
        <UserInfoCard user={orderDetail.buyer} title="Buyer Information" />
      )}
      {orderDetail.seller && (
        <UserInfoCard user={orderDetail.seller} title="Seller Information" />
      )}

      {/* --- Seller Declined & Buyer's Options Display --- */}
      {orderStatusLower === "seller-declined-awaiting-buyer" && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderColor: "error.main",
            bgcolor: "error.lighter",
            borderRadius: "12px",
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: "error.dark", fontWeight: "bold" }}
          >
            Order Declined by Seller
          </Typography>
          <Typography variant="body1" gutterBottom>
            Reason:{" "}
            <strong>
              {orderDetail.declineReason || "No specific reason provided."}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You have the following options:
          </Typography>
          {isCurrentUserBuyer && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mt: 2 }}
            >
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={onFindAnotherSeller}
                disabled={isLoadingAction}
              >
                Find Another Seller
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<CreditCardOffIcon />}
                onClick={onOpenConfirmRefundPostDeclineDialog}
                disabled={isLoadingAction}
              >
                Request Full Refund
              </Button>
            </Stack>
          )}
        </Paper>
      )}

      {/* --- Dispute/Refund Info Display --- */}
      {(orderStatusLower === "disputed" ||
        orderStatusLower === "refund-requested" ||
        orderStatusLower === "refunded" ||
        orderStatusLower === "buyer-cancelled-post-decline") && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderColor:
              orderStatusLower === "refunded" ||
              orderStatusLower === "buyer-cancelled-post-decline"
                ? "success.light"
                : "error.light",
            bgcolor:
              orderStatusLower === "refunded" ||
              orderStatusLower === "buyer-cancelled-post-decline"
                ? "success.lighter"
                : "error.lighter",
          }}
        >
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{
              color:
                orderStatusLower === "refunded" ||
                orderStatusLower === "buyer-cancelled-post-decline"
                  ? "success.dark"
                  : "error.dark",
              fontWeight: "bold",
            }}
          >
            {orderStatusLower === "refunded" ||
            orderStatusLower === "buyer-cancelled-post-decline"
              ? "Order Refunded/Cancelled"
              : "Dispute / Refund Request"}
          </Typography>
          {orderDetail.disputeReason && (
            <Typography variant="body2">
              <strong>Reason:</strong> {orderDetail.disputeReason}
            </Typography>
          )}
          {orderDetail.declineReason &&
            orderStatusLower === "buyer-cancelled-post-decline" && (
              <Typography variant="body2">
                <strong>Seller's Decline Reason:</strong>{" "}
                {orderDetail.declineReason}
              </Typography>
            )}
          {orderDetail.refundDetails?.refundId && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Stripe Refund ID: {orderDetail.refundDetails.refundId} <br />
              Amount: $
              {((orderDetail.refundDetails.amount || 0) / 100).toFixed(2)}{" "}
              <br />
              Status: {orderDetail.refundDetails.status || "Processing"}
            </Typography>
          )}
          {orderStatusLower === "disputed" &&
            !orderDetail.refundDetails?.refundId && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Admin review may be required.
              </Typography>
            )}
        </Paper>
      )}
    </Stack>
  );
};

export default OrderInformationSection;

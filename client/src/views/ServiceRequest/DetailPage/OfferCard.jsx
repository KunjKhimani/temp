/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Stack,
  Avatar,
  Link as MuiLink,
  Alert,
  TextField,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ReplyIcon from "@mui/icons-material/Reply";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const OfferCard = ({
  offer,
  serviceRequestStatus,
  serviceRequestAwardedOfferId,
  isOwnerOfSR,
  currentUser,
  onAccept,
  onOpenRejectModal,
  onOpenCounterModal,
  onSellerAcceptCounter,
  onSellerRejectCounter,
  isLoading,
}) => {
  if (!offer || !offer.seller) {
    return null;
  }

  const isCurrentSellerAuthorOfOffer =
    currentUser && offer.seller?._id === currentUser?._id;
  const [sellerResponseMessage, setSellerResponseMessage] = useState("");

  const getOfferStatusChipProperties = (currentOffer) => {
    const status = currentOffer.status;
    let label = status
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
    let color = "default";
    let variant = "outlined";
    let icon = null;

    const sellerJustAgreedToCounter =
      currentOffer.message &&
      currentOffer.message.includes("--- Seller's Response to Counter ---") &&
      currentOffer.message.toLowerCase().includes("agreed");

    switch (status) {
      case "accepted":
        label = "Offer Accepted";
        color = "success";
        variant = "filled";
        icon = <CheckCircleIcon fontSize="small" />;
        break;
      case "pending":
        if (isOwnerOfSR && sellerJustAgreedToCounter) {
          label = "Terms Agreed - Accept to Finalize";
          color = "secondary";
          variant = "filled";
          icon = <ThumbUpOffAltIcon fontSize="small" />;
        } else {
          label = isOwnerOfSR
            ? "Pending Your Review"
            : isCurrentSellerAuthorOfOffer
            ? "Pending Buyer Action"
            : "Pending Review";
          color = "info";
          icon = <HourglassEmptyIcon fontSize="small" />;
        }
        break;
      case "countered_by_buyer":
        label = isOwnerOfSR
          ? "Your Counter-Offer Sent"
          : isCurrentSellerAuthorOfOffer
          ? "Counter Received from Buyer"
          : "Buyer Countered";
        color = "warning";
        icon = <ReplyIcon fontSize="small" />;
        break;
      case "counter_rejected_by_seller":
        label = isOwnerOfSR
          ? "Seller Rejected Your Counter"
          : isCurrentSellerAuthorOfOffer
          ? "You Rejected Buyer's Counter"
          : "Seller Rejected Counter";
        color = "error";
        icon = <ThumbDownOffAltIcon fontSize="small" />;
        break;
      case "rejected_by_buyer":
        label = isOwnerOfSR
          ? "You Rejected This Offer"
          : isCurrentSellerAuthorOfOffer
          ? "Rejected by Buyer"
          : "Rejected by Buyer";
        color = "error";
        icon = <CancelIcon fontSize="small" />;
        break;
      case "withdrawn_by_seller":
        label = "Withdrawn by Seller";
        color = "default";
        break;
    }
    return { label, color, variant, icon };
  };
  const statusChipProps = getOfferStatusChipProperties(offer);

  const renderBuyerActions = () => {
    if (
      !isOwnerOfSR ||
      [
        "offer_accepted",
        "in_progress",
        "completed",
        "closed",
        "scheduled",
        "pending_completion_approval",
        "disputed",
      ].includes(serviceRequestStatus)
    ) {
      return null;
    }
    const sellerJustAgreedToCounter =
      offer.message &&
      offer.message.includes("--- Seller's Response to Counter ---") &&
      offer.message.toLowerCase().includes("agreed");

    if (
      offer.status === "pending" &&
      (serviceRequestStatus === "open" ||
        serviceRequestStatus === "in-discussion")
    ) {
      return (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="flex-end"
          mt={1.5}
        >
          {!sellerJustAgreedToCounter && (
            <>
              <Button
                fullWidth={{ xs: true, sm: false }}
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => onOpenRejectModal(offer)}
                disabled={isLoading}
              >
                Reject
              </Button>
              <Button
                fullWidth={{ xs: true, sm: false }}
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<ReplyIcon />}
                onClick={() => onOpenCounterModal(offer)}
                disabled={isLoading}
              >
                Counter Offer
              </Button>
            </>
          )}
          <Button
            fullWidth={{ xs: true, sm: false }}
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => onAccept(offer._id)}
            disabled={isLoading}
          >
            {sellerJustAgreedToCounter
              ? "Confirm & Finalize Offer"
              : "Accept Offer"}
          </Button>
        </Stack>
      );
    }
    return null;
  };

  const renderSellerActionsForCounter = () => {
    if (
      !isCurrentSellerAuthorOfOffer ||
      isOwnerOfSR ||
      offer.status !== "countered_by_buyer" ||
      !["open", "in-discussion"].includes(serviceRequestStatus)
    ) {
      return null;
    }
    return (
      <Box mt={2} p={2} border={1} borderColor="divider" borderRadius={1}>
        <Typography variant="subtitle2" gutterBottom>
          Respond to Buyer's Counter-Offer:
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Optional message with your response"
          value={sellerResponseMessage}
          onChange={(e) => setSellerResponseMessage(e.target.value)}
          sx={{ mb: 1.5 }}
          inputProps={{ maxLength: 1000 }}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="flex-end"
        >
          <Button
            fullWidth={{ xs: true, sm: false }}
            size="small"
            variant="outlined"
            color="error"
            startIcon={<ThumbDownOffAltIcon />}
            onClick={() => {
              onSellerRejectCounter(offer._id, sellerResponseMessage);
              setSellerResponseMessage("");
            }}
            disabled={isLoading}
          >
            Reject Buyer's Counter
          </Button>
          <Button
            fullWidth={{ xs: true, sm: false }}
            size="small"
            variant="contained"
            color="success"
            startIcon={<ThumbUpOffAltIcon />}
            onClick={() => {
              onSellerAcceptCounter(offer._id, sellerResponseMessage);
              setSellerResponseMessage("");
            }}
            disabled={isLoading}
          >
            Accept Buyer's Counter
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        opacity:
          offer.status.includes("rejected") ||
          offer.status === "withdrawn_by_seller"
            ? 0.65
            : 1,
        borderLeft:
          offer.status === "accepted"
            ? `5px solid`
            : statusChipProps.color === "secondary" &&
              statusChipProps.variant === "filled"
            ? `5px solid`
            : "none",
        borderLeftColor:
          offer.status === "accepted"
            ? "success.main"
            : statusChipProps.color === "secondary"
            ? "secondary.main"
            : "transparent",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar
          src={
            offer.seller.profilePicture
              ? `${API_DOMAIN_FOR_IMAGES}/uploads/${offer.seller.profilePicture.replace(
                  /^uploads\//i,
                  ""
                )}`
              : undefined
          }
          alt={offer.seller.name || offer.seller.companyName || "Seller"}
          sx={{ width: 48, height: 48 }}
        >
          {!offer.seller.profilePicture && <PersonIcon sx={{ fontSize: 28 }} />}
        </Avatar>
        <Box flexGrow={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={0.5}
            flexWrap="wrap"
          >
            <MuiLink
              component={RouterLink}
              to={`/provider/profile/${offer.seller?._id}`}
              fontWeight="bold"
              underline="hover"
              color="text.primary"
              variant="subtitle1"
            >
              {offer.seller.name ||
                offer.seller.companyName ||
                "Anonymous Seller"}
            </MuiLink>
            <Chip
              label={statusChipProps.label}
              color={statusChipProps.color}
              size="small"
              variant={statusChipProps.variant}
              icon={statusChipProps.icon}
              sx={{ ml: { xs: 0, sm: 1 }, mt: { xs: 0.5, sm: 0 } }}
            />
          </Stack>

          {offer.status === "countered_by_buyer" &&
            offer.counterOfferDetails && (
              <Box
                sx={{
                  border: 1,
                  borderColor: "warning.light",
                  p: 1.5,
                  borderRadius: 1,
                  my: 1.5,
                  bgcolor: "rgba(255,167,38,0.08)",
                }}
              >
                <Typography
                  variant="overline"
                  fontWeight="medium"
                  color="warning.dark"
                >
                  {isOwnerOfSR
                    ? "Your Counter-Offer (Awaiting Seller Response):"
                    : isCurrentSellerAuthorOfOffer
                    ? "Buyer's Counter-Offer to You:"
                    : "Buyer's Counter-Offer:"}
                </Typography>
                {offer.counterOfferDetails.message && (
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      mt: 0.5,
                      fontStyle: "italic",
                    }}
                  >
                    "{offer.counterOfferDetails.message}"
                  </Typography>
                )}
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Proposed Price: ${offer.counterOfferDetails.price?.toFixed(2)}{" "}
                  ({offer.counterOfferDetails.priceType?.replace("_", " ")})
                </Typography>
                {offer.counterOfferDetails.deliveryTime && (
                  <Typography variant="caption" display="block">
                    Proposed Delivery: {offer.counterOfferDetails.deliveryTime}
                  </Typography>
                )}
              </Box>
            )}

          <Typography
            variant="h6"
            color={
              offer.status === "countered_by_buyer" &&
              !isCurrentSellerAuthorOfOffer &&
              !isOwnerOfSR
                ? "text.secondary"
                : "primary.main"
            }
            sx={{
              my: 0.5,
              textDecoration:
                offer.status === "countered_by_buyer" &&
                !isCurrentSellerAuthorOfOffer &&
                !isOwnerOfSR
                  ? "line-through"
                  : "none",
            }}
          >
            ${offer.proposedPrice?.toFixed(2)} (
            {offer.priceType?.replace("_", " ")})
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              mb: 1,
              color:
                offer.status === "countered_by_buyer" &&
                !isCurrentSellerAuthorOfOffer &&
                !isOwnerOfSR
                  ? "text.disabled"
                  : "text.secondary",
              textDecoration:
                offer.status === "countered_by_buyer" &&
                !isCurrentSellerAuthorOfOffer &&
                !isOwnerOfSR
                  ? "line-through"
                  : "none",
            }}
          >
            {offer.message}
          </Typography>

          {offer.status === "rejected_by_buyer" &&
            offer.buyerRejectionReason && (
              <Box
                sx={{
                  border: 1,
                  borderColor: "error.lighter",
                  p: 1.5,
                  borderRadius: 1,
                  my: 1.5,
                  bgcolor: "rgba(211, 47, 47, 0.05)",
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight="medium"
                  color="error.dark"
                  display="block"
                  gutterBottom
                >
                  Reason for Rejection:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {offer.buyerRejectionReason}
                </Typography>
              </Box>
            )}
          {offer.status === "counter_rejected_by_seller" && (
            <Box
              sx={{
                border: 1,
                borderColor: "error.lighter",
                p: 1.5,
                borderRadius: 1,
                my: 1.5,
                bgcolor: "rgba(211, 47, 47, 0.05)",
              }}
            >
              <Typography
                variant="caption"
                fontWeight="medium"
                color="error.dark"
                display="block"
                gutterBottom
              >
                {isOwnerOfSR
                  ? "Seller's Response to Your Counter:"
                  : "Seller Rejected Counter:"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {offer.buyerResponseMessage ||
                  "Seller declined the counter-offer."}
              </Typography>
            </Box>
          )}
          {offer.proposedDeliveryTime && (
            <Typography
              variant="caption"
              display="block"
              color={
                offer.status === "countered_by_buyer" &&
                !isCurrentSellerAuthorOfOffer &&
                !isOwnerOfSR
                  ? "text.disabled"
                  : "text.secondary"
              }
              sx={{
                textDecoration:
                  offer.status === "countered_by_buyer" &&
                  !isCurrentSellerAuthorOfOffer &&
                  !isOwnerOfSR
                    ? "line-through"
                    : "none",
              }}
            >
              Original Delivery Estimate: {offer.proposedDeliveryTime}
            </Typography>
          )}
          {offer.availabilityDate && (
            <Typography
              variant="caption"
              display="block"
              color={
                offer.status === "countered_by_buyer" &&
                !isCurrentSellerAuthorOfOffer &&
                !isOwnerOfSR
                  ? "text.disabled"
                  : "text.secondary"
              }
              sx={{
                textDecoration:
                  offer.status === "countered_by_buyer" &&
                  !isCurrentSellerAuthorOfOffer &&
                  !isOwnerOfSR
                    ? "line-through"
                    : "none",
              }}
            >
              Available From:{" "}
              {new Date(offer.availabilityDate).toLocaleDateString()}
              {offer.availabilityTimeSlot &&
              offer.availabilityTimeSlot !== "flexible"
                ? ` (${offer.availabilityTimeSlot
                    .replace("_", " ")
                    .replace(/^\w/, (c) => c.toUpperCase())}${
                    offer.availabilityTimeSlot === "specific_time" &&
                    offer.specificTime
                      ? `: ${offer.specificTime}`
                      : ""
                  })`
                : offer.availabilityTimeSlot === "flexible"
                ? " (Flexible Timing)"
                : ""}
            </Typography>
          )}
          {offer.linkedServiceId &&
            typeof offer.linkedServiceId === "object" &&
            offer.linkedServiceId._id && (
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                References Service:{" "}
                <MuiLink
                  component={RouterLink}
                  to={`/service/${offer.linkedServiceId._id}`}
                >
                  {offer.linkedServiceId.title || "View Linked Service"}
                </MuiLink>
              </Typography>
            )}
        </Box>
      </Stack>

      {isOwnerOfSR && renderBuyerActions()}
      {renderSellerActionsForCounter()}

      {isOwnerOfSR && offer.status === "accepted" && (
        <Alert
          severity="success"
          variant="filled"
          icon={<CheckCircleIcon fontSize="inherit" />}
          sx={{ mt: 1.5 }}
        >
          You have accepted this offer! Proceed to schedule or mark as in
          progress.
        </Alert>
      )}
      {isOwnerOfSR && offer.status === "counter_rejected_by_seller" && (
        <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
          The seller has declined your counter-offer.
        </Alert>
      )}
      {isCurrentSellerAuthorOfOffer &&
        !isOwnerOfSR &&
        offer.status === "pending" &&
        serviceRequestStatus === "offer_accepted" &&
        offer._id !== serviceRequestAwardedOfferId && (
          <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
            The buyer has accepted another offer for this request. Your offer
            was not selected.
          </Alert>
        )}
    </Paper>
  );
};

export default OfferCard;

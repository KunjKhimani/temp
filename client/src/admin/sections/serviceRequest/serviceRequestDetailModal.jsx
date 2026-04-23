import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Chip,
  Stack,
  Avatar,
  Link,
  IconButton, // Added IconButton
} from "@mui/material";
import { format } from "date-fns";
import { Iconify } from "../../components/iconify";
import Label from "../../components/label/label"; // Assuming Label component exists

// Helper function to get user display name
const getUserDisplayName = (user) => {
  if (!user) return "N/A";
  if (user.accountType === "agency") {
    return user.companyName || user.representativeName || user.email;
  }
  return user.name || user.email;
};

// Helper to format budget
const formatBudget = (budget) => {
  if (!budget) return "N/A";
  let budgetString = "";
  if (budget.type === "fixed") {
    budgetString = `$${budget.min?.toFixed(2)}`;
  } else if (budget.type === "range") {
    budgetString = `$${budget.min?.toFixed(2)} - $${budget.max?.toFixed(2)}`;
  } else {
    budgetString = "Open to Offers";
  }
  return `${budgetString} (${budget.currency})`;
};

// Helper to format date/time
const formatDate = (dateString) => {
  return dateString
    ? format(new Date(dateString), "dd MMM yyyy hh:mm a")
    : "N/A";
};

export function ServiceRequestDetailModal({ open, onClose, serviceRequest }) {
  if (!serviceRequest) return null;

  const {
    title,
    description,
    category,
    subcategory,
    budget,
    desiredDeliveryTime,
    locationPreference,
    onSiteAddresses,
    attachments,
    tags,
    createdBy,
    status,
    requestType,
    promotionDetails,
    offersReceived,
    awardedOfferId,
    awardedSellerId,
    // eslint-disable-next-line no-unused-vars
    amountToBePaid, // Marked as unused
    confirmedSchedule,
    paymentStatus,
    refundStatus,
    cancellationReason,
    refundNotes,
  } = serviceRequest;

  const awardedOffer = offersReceived?.find(
    (offer) => offer._id === awardedOfferId
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Service Request Details</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Category:</Typography>
            <Typography variant="body2">
              {category} {subcategory && `(${subcategory})`}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Request Type:</Typography>
            <Typography variant="body2">{requestType}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Budget:</Typography>
            <Typography variant="body2">{formatBudget(budget)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Desired Delivery Time:</Typography>
            <Typography variant="body2">
              {desiredDeliveryTime || "N/A"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Location Preference:</Typography>
            <Typography variant="body2">{locationPreference}</Typography>
            {locationPreference === "on-site" &&
              onSiteAddresses &&
              onSiteAddresses.length > 0 && (
                <Box mt={1}>
                  {onSiteAddresses.map((addr, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.secondary"
                    >
                      {addr.street ? `${addr.street}, ` : ""}
                      {addr.city}, {addr.state ? `${addr.state}, ` : ""}
                      {addr.country} {addr.zipCode && `(${addr.zipCode})`}
                    </Typography>
                  ))}
                </Box>
              )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Status:</Typography>
            <Label color={(status === "closed" && "error") || "success"}>
              {status}
            </Label>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Tags:</Typography>
            <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
              {tags && tags.length > 0 ? (
                tags.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  N/A
                </Typography>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Created By:</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                alt={getUserDisplayName(createdBy)}
                src={
                  createdBy?.profilePicture ||
                  "/assets/images/avatars/avatar_default.jpg"
                }
                sx={{ width: 32, height: 32 }}
              />
              <Typography variant="body2">
                {getUserDisplayName(createdBy)} ({createdBy?.email})
              </Typography>
            </Stack>
          </Grid>

          {attachments && attachments.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2">Attachments:</Typography>
              <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
                {attachments.map((attachment, index) => (
                  <Link
                    key={index}
                    href={`${
                      import.meta.env.VITE_REACT_APP_API_URL
                    }/uploads/${attachment}`} // Adjusted for Vite
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                  >
                    <Chip
                      label={`Attachment ${index + 1}`}
                      icon={<Iconify icon="eva:attach-2-fill" />}
                      clickable
                      size="small"
                    />
                  </Link>
                ))}
              </Stack>
            </Grid>
          )}

          {promotionDetails?.isPromoted && (
            <Grid item xs={12}>
              <Typography variant="subtitle2">Promotion Details:</Typography>
              <Typography variant="body2">
                Promoted: {promotionDetails.isPromoted ? "Yes" : "No"}
              </Typography>
              <Typography variant="body2">
                Fee: ${promotionDetails.feeAmount?.toFixed(2)}{" "}
                {promotionDetails.feeCurrency}
              </Typography>
              <Typography variant="body2">
                Promoted Until: {formatDate(promotionDetails.promotedUntil)}
              </Typography>
            </Grid>
          )}

          {awardedOffer && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Awarded Offer Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Awarded Seller:</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      alt={getUserDisplayName(awardedSellerId)}
                      src={
                        awardedSellerId?.profilePicture ||
                        "/assets/images/avatars/avatar_default.jpg"
                      }
                      sx={{ width: 32, height: 32 }}
                    />
                    <Typography variant="body2">
                      {getUserDisplayName(awardedSellerId)} (
                      {awardedSellerId?.email})
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Proposed Price:</Typography>
                  <Typography variant="body2">
                    ${awardedOffer.proposedPrice?.toFixed(2)} (
                    {awardedOffer.priceType})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">
                    Proposed Delivery Time:
                  </Typography>
                  <Typography variant="body2">
                    {awardedOffer.proposedDeliveryTime || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Offer Message:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {awardedOffer.message}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          )}

          {confirmedSchedule && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Confirmed Schedule
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Date:</Typography>
                  <Typography variant="body2">
                    {formatDate(confirmedSchedule.date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Time Slot:</Typography>
                  <Typography variant="body2">
                    {confirmedSchedule.timeSlot}{" "}
                    {confirmedSchedule.specificTime &&
                      `(${confirmedSchedule.specificTime})`}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {confirmedSchedule.notes || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          )}

          {(paymentStatus || refundStatus) && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Payment & Refund Status
              </Typography>
              <Grid container spacing={2}>
                {paymentStatus && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Payment Status:</Typography>
                    <Label
                      color={
                        (paymentStatus === "succeeded" && "success") ||
                        (paymentStatus === "failed" && "error") ||
                        "warning"
                      }
                    >
                      {paymentStatus}
                    </Label>
                  </Grid>
                )}
                {refundStatus && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Refund Status:</Typography>
                    <Label
                      color={
                        (refundStatus === "processed" && "success") ||
                        (refundStatus === "rejected" && "error") ||
                        "info"
                      }
                    >
                      {refundStatus}
                    </Label>
                  </Grid>
                )}
                {cancellationReason && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">
                      Cancellation Reason:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cancellationReason}
                    </Typography>
                  </Grid>
                )}
                {refundNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">
                      Refund Notes (Admin):
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {refundNotes}
                    </Typography>
                  </Grid>
                )}
                {serviceRequest.refundAmount && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Refund Amount:</Typography>
                    <Typography variant="body2">
                      ${serviceRequest.refundAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ServiceRequestDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  serviceRequest: PropTypes.object,
};

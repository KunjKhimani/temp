import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  TextField,
  CircularProgress,
  Box,
  MenuItem,
} from "@mui/material";

import {
  fetchAdminOrderById,
  updateAdminOrderThunk,
} from "../../../store/thunks/adminOrderThunk";
import { showSnackbar } from "../../../store/slice/snackbarSlice";
import { clearCurrentAdminOrder } from "../../../store/slice/adminOrderSlice";

// ----------------------------------------------------------------------

export function OrderDetailsModal({ open, onClose, orderId }) {
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector(
    (state) => state.adminOrders
  );
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (open && orderId) {
      dispatch(fetchAdminOrderById(orderId));
    }
  }, [dispatch, open, orderId]);

  useEffect(() => {
    if (currentOrder) {
      setFormData({
        status: currentOrder.status || "",
        totalPrice: currentOrder.totalPrice || 0,
        // Add other fields you want to be editable in the modal
        // For nested objects, you might need to flatten them or handle them separately
        // e.g., buyerName: currentOrder.buyer?.name || '',
      });
    }
  }, [currentOrder]);

  useEffect(() => {
    if (error) {
      dispatch(showSnackbar({ message: error, severity: "error" }));
      // Optionally clear the error after showing snackbar
      // dispatch(clearAdminOrdersError());
    }
  }, [error, dispatch]);

  const handleClose = () => {
    setIsEditing(false);
    setFormData({});
    dispatch(clearCurrentAdminOrder()); // Clear current order from Redux state
    onClose();
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const resultAction = await dispatch(
      updateAdminOrderThunk({ orderId, data: formData })
    );
    if (updateAdminOrderThunk.fulfilled.match(resultAction)) {
      dispatch(
        showSnackbar({
          message: "Order updated successfully!",
          severity: "success",
        })
      );
      setIsEditing(false);
      // No need to re-fetch here, the thunk's fulfilled case updates the currentOrder in state
    } else {
      dispatch(
        showSnackbar({
          message: resultAction.payload || "Failed to update order.",
          severity: "error",
        })
      );
    }
  };

  if (loading && !currentOrder) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <CircularProgress />
          <Typography variant="subtitle1" sx={{ ml: 2 }}>
            Loading order details...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error && !currentOrder) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography color="error">{error}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!currentOrder) {
    return null; // Or a message indicating no order found
  }

  const renderField = (label, value, name, type = "text", options = []) => {
    if (isEditing) {
      if (options.length > 0) {
        return (
          <TextField
            select
            fullWidth
            label={label}
            name={name}
            value={formData[name] || ""}
            onChange={handleChange}
            margin="dense"
            variant="outlined"
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );
      }
      return (
        <TextField
          fullWidth
          label={label}
          name={name}
          type={type}
          value={formData[name] || ""}
          onChange={handleChange}
          margin="dense"
          variant="outlined"
        />
      );
    }
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">{label}:</Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
    );
  };

  const orderStatusOptions = [
    { value: "pending-payment", label: "Pending Payment" },
    {
      value: "awaiting-seller-confirmation",
      label: "Awaiting Seller Confirmation",
    },
    {
      value: "awaiting-buyer-time-adjustment",
      label: "Awaiting Buyer Time Adjustment",
    },
    { value: "accepted", label: "Accepted" },
    { value: "awaiting-buyer-scheduling", label: "Awaiting Buyer Scheduling" },
    { value: "scheduled", label: "Scheduled" },
    { value: "declined", label: "Declined" },
    {
      value: "seller-declined-awaiting-buyer",
      label: "Seller Declined (Awaiting Buyer)",
    },
    {
      value: "buyer-cancelled-post-decline",
      label: "Buyer Cancelled (Post Decline)",
    },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "failed", label: "Failed" },
    { value: "refund-requested", label: "Refund Requested" },
    { value: "refunded", label: "Refunded" },
    { value: "payout-pending", label: "Payout Pending" },
    { value: "payout-failed", label: "Payout Failed" },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Order Details: {currentOrder._id.slice(-6)}
        <Button onClick={handleEditToggle} sx={{ ml: 2 }}>
          {isEditing ? "Cancel Edit" : "Edit"}
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            {renderField(
              "Buyer Name",
              currentOrder.buyer?.name || "N/A",
              "buyerName"
            )}
            {renderField(
              "Buyer Email",
              currentOrder.buyer?.email || "N/A",
              "buyerEmail"
            )}
            {renderField(
              "Seller Name",
              currentOrder.seller?.name || "N/A",
              "sellerName"
            )}
            {renderField(
              "Seller Email",
              currentOrder.seller?.email || "N/A",
              "sellerEmail"
            )}
            {renderField(
              "Service Title",
              currentOrder.service?.title || "N/A",
              "serviceTitle"
            )}
            {renderField(
              "Quantity",
              currentOrder.quantity,
              "quantity",
              "number"
            )}
            {renderField(
              "Number of Hours",
              currentOrder.numberOfHours,
              "numberOfHours",
              "number"
            )}
            {renderField(
              "Number of People",
              currentOrder.numberOfPeople,
              "numberOfPeople",
              "number"
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            {renderField(
              "Location",
              currentOrder.location || "N/A",
              "location"
            )}
            {renderField(
              "Time Preference",
              currentOrder.timePreference || "N/A",
              "timePreference"
            )}
            {renderField(
              "Total Price",
              currentOrder.totalPrice?.toFixed(2) || "0.00",
              "totalPrice",
              "number"
            )}
            {renderField(
              "Status",
              currentOrder.status,
              "status",
              "text",
              orderStatusOptions
            )}
            {renderField(
              "Created At",
              currentOrder.createdAt
                ? format(new Date(currentOrder.createdAt), "dd MMM yyyy HH:mm")
                : "N/A",
              "createdAt"
            )}
            {renderField(
              "Scheduled Date/Time",
              currentOrder.scheduledDateTime
                ? format(
                    new Date(currentOrder.scheduledDateTime),
                    "dd MMM yyyy HH:mm"
                  )
                : "N/A",
              "scheduledDateTime"
            )}
            {currentOrder.selectedTimeSlot && (
              <>
                {renderField(
                  "Selected Slot Date",
                  currentOrder.selectedTimeSlot.slotDate
                    ? format(
                        new Date(currentOrder.selectedTimeSlot.slotDate),
                        "dd MMM yyyy"
                      )
                    : "N/A",
                  "selectedSlotDate"
                )}
                {renderField(
                  "Selected Slot Time",
                  `${currentOrder.selectedTimeSlot.startTime} - ${currentOrder.selectedTimeSlot.endTime}`,
                  "selectedSlotTime"
                )}
              </>
            )}
            {renderField(
              "Payment Intent ID",
              currentOrder.paymentIntentId || "N/A",
              "paymentIntentId"
            )}
            {renderField(
              "Travel Fee Applied",
              currentOrder.travelFeeApplied?.toFixed(2) || "0.00",
              "travelFeeApplied",
              "number"
            )}
            {renderField("Notes", currentOrder.notes || "N/A", "notes")}
            {renderField(
              "Decline Reason",
              currentOrder.declineReason || "N/A",
              "declineReason"
            )}
            {renderField(
              "Dispute Reason",
              currentOrder.disputeReason || "N/A",
              "disputeReason"
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {isEditing && (
          <Button onClick={handleSave} color="primary" variant="contained">
            Save Changes
          </Button>
        )}
        <Button onClick={handleClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

OrderDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  orderId: PropTypes.string,
};

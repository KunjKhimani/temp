/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
// src/components/Orders/OrderDialogs.jsx
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react"; // Added useEffect for ConfirmRefundReasonModal
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography, // For FinalConfirmRefundDialog
} from "@mui/material";

// Import your custom modals if they are in separate files
// If they are defined below, no import needed for them from here.
import ProposeTimeChangeModal from "./ProposeTimeChangeModal";
import ConfirmTimeProposalModal from "./ConfirmTimeProposalModal";
import ScheduleOrderModal from "./ScheduleOrderModal";

// --- Define Modal Components directly here OR import if in separate files ---

const ConfirmRefundReasonModal = ({ open, onClose, onSubmit, isLoading }) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason(""); // Clear reason each time modal opens
    }
  }, [open]);

  const internalSubmit = () => {
    onSubmit(reason.trim());
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle fontWeight="bold">Request Refund - Step 1 of 2</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1 }}>
          The seller declined this order. We understand this can be frustrating.
        </DialogContentText>
        <DialogContentText sx={{ mb: 2 }}>
          Before proceeding with a full refund, please (optionally) let us know
          why you prefer a refund at this stage, rather than looking for an
          alternative seller. This helps us improve our services.
        </DialogContentText>
        <TextField
          label="Your reason for refund (optional)"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          margin="dense"
          variant="outlined"
          disabled={isLoading}
          autoFocus
        />
      </DialogContent>
      <DialogActions
        sx={{ px: 3, pb: 2, pt: 1, borderTop: 1, borderColor: "divider" }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isLoading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={internalSubmit}
          color="primary"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Proceed to Final Confirmation"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FinalConfirmRefundDialog = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  orderId,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle fontWeight="bold">
        Confirm Full Refund - Step 2 of 2
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          This is your final confirmation. Clicking 'Yes, Confirm Refund' will
          attempt to process a full refund for order{" "}
          {orderId && (
            <Typography component="span" fontWeight="bold">
              #{orderId.slice(-6)}
            </Typography>
          )}
          .
          <br />
          <br />
          This action cannot be undone once processed. Are you sure you wish to
          proceed?
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{ px: 3, pb: 2, pt: 1, borderTop: 1, borderColor: "divider" }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isLoading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          color="error"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Yes, Confirm Refund"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
// --- End Modal Components ---

const OrderDialogs = ({
  orderDetail,
  isLoadingAction,
  // Decline Dialog Props
  openDeclineDialog,
  onCloseDeclineDialog,
  onConfirmDeclineOrder,
  declineReason,
  onDeclineReasonChange,
  // Propose Time Change Dialog Props
  openProposeTimeModal,
  onCloseProposeTimeModal,
  onConfirmProposeTimeChange,
  // Confirm Time Proposal Dialog Props
  openConfirmProposalModal,
  onCloseConfirmProposalModal,
  onConfirmBuyerTimeSelection,
  // Schedule/Reschedule Modal Props
  openScheduleModal,
  onCloseScheduleModal,
  onConfirmSchedule,
  isReschedulingModalOpen,
  currentScheduledDetailsForModal,
  // Dispute Dialog Props
  openDisputeDialog,
  onCloseDisputeDialog,
  onConfirmDispute,
  disputeReason,
  onDisputeReasonChange,
  // Delete Confirm Dialog Props
  openDeleteConfirmDialog,
  onCloseDeleteConfirmDialog,
  onConfirmDeleteOrder,

  // Props for New Multi-Step Refund Modals
  openRefundReasonModal,
  onCloseRefundReasonModal,
  onSubmitRefundReason,
  openFinalConfirmRefundDialog,
  onCloseFinalConfirmRefundDialog,
  onProcessFinalRefund,
}) => {
  if (!orderDetail) {
    // Guard against rendering if orderDetail is not yet available
    return null;
  }

  return (
    <>
      {/* Decline Dialog */}
      <Dialog
        open={openDeclineDialog}
        onClose={onCloseDeclineDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle fontWeight="bold">Decline Order Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Please provide a reason for declining (optional).
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Decline"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={declineReason}
            onChange={onDeclineReasonChange}
            disabled={isLoadingAction}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button
            onClick={onCloseDeclineDialog}
            color="inherit"
            disabled={isLoadingAction}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirmDeclineOrder}
            color="error"
            variant="contained"
            disabled={isLoadingAction}
          >
            {isLoadingAction ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Confirm Decline"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Seller Propose Time Change Modal */}
      {openProposeTimeModal && (
        <ProposeTimeChangeModal
          open={openProposeTimeModal}
          onClose={onCloseProposeTimeModal}
          onSubmit={onConfirmProposeTimeChange}
          isLoading={isLoadingAction}
          initialBuyerPreference={orderDetail.timePreference} // Pass the initial preference
        />
      )}

      {/* Buyer Confirm Time Proposal Modal */}
      {openConfirmProposalModal && (
        <ConfirmTimeProposalModal
          open={openConfirmProposalModal}
          onClose={onCloseConfirmProposalModal}
          onSubmit={onConfirmBuyerTimeSelection}
          isLoading={isLoadingAction}
          sellerProposedTimePreferences={
            orderDetail.sellerProposedTimePreferences || []
          }
          sellerMessage={orderDetail.sellerTimeProposalMessage || ""}
        />
      )}

      {/* Schedule/Reschedule Modal */}
      {orderDetail.service && openScheduleModal && (
        <ScheduleOrderModal
          open={openScheduleModal}
          onClose={onCloseScheduleModal}
          serviceAvailabilityType={orderDetail.service.availabilityType}
          availableTimeSlots={orderDetail.service.availableTimeSlots || []}
          availabilityInfo={orderDetail.service.availabilityInfo}
          onConfirmSchedule={onConfirmSchedule}
          isLoading={isLoadingAction}
          isRescheduling={isReschedulingModalOpen}
          currentScheduledDetails={
            isReschedulingModalOpen ? currentScheduledDetailsForModal : null
          }
          buyerInitialTimePreference={orderDetail.timePreference || "any"}
          serviceDurationHours={orderDetail.numberOfHours || 1} // Ensure numberOfHours is on orderDetail or service
        />
      )}

      {/* Dispute Dialog */}
      <Dialog
        open={openDisputeDialog}
        onClose={onCloseDisputeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle fontWeight="bold">
          Report Issue / Request Refund
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Please describe the issue or why you are marking it as not
            completed. This will be sent to the seller.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Dispute"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={disputeReason}
            onChange={onDisputeReasonChange}
            required
            error={!disputeReason.trim() && disputeReason !== ""}
            helperText={
              !disputeReason.trim() && disputeReason !== ""
                ? "Reason is required."
                : ""
            }
            disabled={isLoadingAction}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button
            onClick={onCloseDisputeDialog}
            color="inherit"
            disabled={isLoadingAction}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirmDispute}
            color="error"
            variant="contained"
            disabled={isLoadingAction || !disputeReason.trim()}
          >
            {isLoadingAction ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={openDeleteConfirmDialog}
        onClose={onCloseDeleteConfirmDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle fontWeight="bold">Confirm Delete Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this order? This action cannot be
            undone. (Only possible for 'pending-payment' orders).
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button
            onClick={onCloseDeleteConfirmDialog}
            color="inherit"
            disabled={isLoadingAction}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirmDeleteOrder}
            color="error"
            variant="contained"
            disabled={isLoadingAction}
          >
            {isLoadingAction ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Render the new multi-step refund dialogs */}
      <ConfirmRefundReasonModal
        open={openRefundReasonModal}
        onClose={onCloseRefundReasonModal}
        onSubmit={onSubmitRefundReason}
        isLoading={isLoadingAction}
      />
      <FinalConfirmRefundDialog
        open={openFinalConfirmRefundDialog}
        onClose={onCloseFinalConfirmRefundDialog}
        onSubmit={onProcessFinalRefund}
        isLoading={isLoadingAction}
        orderId={orderDetail?._id}
      />
    </>
  );
};

export default OrderDialogs;

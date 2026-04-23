/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import PropTypes from "prop-types";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const RefundRequestModal = ({
  open,
  onClose,
  serviceRequest,
  onSubmitRefund,
  actionStatus,
  actionError,
}) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setCancellationReason(serviceRequest?.cancellationReason || "");
      setRefundNotes(serviceRequest?.refundNotes || "");
      setFormError("");
    }
  }, [open, serviceRequest]);

  const handleSubmit = () => {
    if (!cancellationReason.trim()) {
      setFormError("Cancellation reason is required.");
      return;
    }
    setFormError("");
    onSubmitRefund({ cancellationReason, refundNotes });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="refund-request-modal-title"
      aria-describedby="refund-request-modal-description"
    >
      <Box sx={style}>
        <Typography
          id="refund-request-modal-title"
          variant="h6"
          component="h2"
          gutterBottom
        >
          Request Refund
        </Typography>
        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {actionError}
          </Alert>
        )}
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Stack spacing={2}>
          <TextField
            label="Cancellation Reason (Required)"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
            disabled={actionStatus === "loading"}
            error={!!formError}
            helperText={formError}
          />
          <TextField
            label="Additional Refund Notes (Optional)"
            value={refundNotes}
            onChange={(e) => setRefundNotes(e.target.value)}
            multiline
            rows={2}
            fullWidth
            disabled={actionStatus === "loading"}
          />
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleSubmit}
            disabled={actionStatus === "loading" || !cancellationReason.trim()}
            sx={{ mt: 2 }}
          >
            {actionStatus === "loading" ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Submit Refund Request"
            )}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            disabled={actionStatus === "loading"}
            sx={{ mt: 1 }}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

RefundRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  serviceRequest: PropTypes.shape({
    cancellationReason: PropTypes.string,
    refundNotes: PropTypes.string,
  }),
  onSubmitRefund: PropTypes.func.isRequired,
  actionStatus: PropTypes.string,
  actionError: PropTypes.string,
};

export default RefundRequestModal;

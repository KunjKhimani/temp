/* eslint-disable no-unused-vars */
// src/components/Orders/ConfirmTimeProposalModal.jsx
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from "@mui/material";

const getTimePreferenceDisplay = (preference) => {
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
};

const ConfirmTimeProposalModal = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  sellerProposedTimePreferences = [], // Array of strings: ['morning', 'afternoon']
  sellerMessage = "",
}) => {
  const [selectedPreference, setSelectedPreference] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      // Default to the first proposed preference if available, otherwise empty
      setSelectedPreference(
        sellerProposedTimePreferences.length > 0
          ? sellerProposedTimePreferences[0]
          : ""
      );
      setError("");
    }
  }, [open, sellerProposedTimePreferences]);

  const handleSubmit = () => {
    if (!selectedPreference) {
      setError("Please select one of the seller's proposed time preferences.");
      return;
    }
    onSubmit(selectedPreference);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle
        fontWeight="bold"
        sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5 }}
      >
        Confirm New Time Preference
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" gutterBottom>
          The seller has proposed the following alternative time(s) for your
          service.
        </Typography>
        {sellerMessage && (
          <Typography
            variant="body2"
            sx={{
              fontStyle: "italic",
              mb: 2,
              p: 1,
              bgcolor: "grey.100",
              borderRadius: 1,
            }}
          >
            <strong>Seller&apos;s Note:</strong> {sellerMessage}
          </Typography>
        )}

        {sellerProposedTimePreferences.length > 0 ? (
          <FormControl component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend" sx={{ fontWeight: "medium" }}>
              Please select one option:
            </FormLabel>
            <RadioGroup
              aria-label="seller-proposed-time"
              name="seller-proposed-time-group"
              value={selectedPreference}
              onChange={(e) => {
                setSelectedPreference(e.target.value);
                setError("");
              }}
            >
              {sellerProposedTimePreferences.map((pref) => (
                <FormControlLabel
                  key={pref}
                  value={pref}
                  control={<Radio disabled={isLoading} />}
                  label={getTimePreferenceDisplay(pref)}
                  disabled={isLoading}
                />
              ))}
            </RadioGroup>
          </FormControl>
        ) : (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No specific time proposals available from the seller.
          </Typography>
        )}
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
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={
            isLoading ||
            !selectedPreference ||
            sellerProposedTimePreferences.length === 0
          }
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Confirm My Choice"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmTimeProposalModal;

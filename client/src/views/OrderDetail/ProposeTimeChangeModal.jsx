/* eslint-disable no-unused-vars */
// src/components/Orders/ProposeTimeChangeModal.jsx
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
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";

const timePreferenceOptions = [
  { value: "morning", label: "Morning (e.g., 9 AM - 12 PM)" },
  { value: "afternoon", label: "Afternoon (e.g., 1 PM - 5 PM)" },
  { value: "evening", label: "Evening (e.g., 6 PM - 9 PM)" },
  // 'any' is usually not something a seller proposes as an alternative unless they are completely open
];

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

const ProposeTimeChangeModal = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  initialBuyerPreference, // string: 'morning', 'afternoon', etc.
  currentOrder, // To display buyer's current preference
}) => {
  const [proposedPreferences, setProposedPreferences] = useState({
    morning: false,
    afternoon: false,
    evening: false,
  });
  const [sellerMessage, setSellerMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setProposedPreferences({
        morning: false,
        afternoon: false,
        evening: false,
      });
      setSellerMessage("");
      setError("");
    }
  }, [open]);

  const handlePreferenceChange = (event) => {
    setProposedPreferences({
      ...proposedPreferences,
      [event.target.name]: event.target.checked,
    });
    setError(""); // Clear error when user makes a selection
  };

  const handleSubmit = () => {
    const selected = Object.entries(proposedPreferences)
      .filter(([, checked]) => checked)
      .map(([key]) => key);

    if (selected.length === 0) {
      setError(
        "Please select at least one alternative time preference to propose."
      );
      return;
    }
    onSubmit({
      proposedTimePreferences: selected,
      sellerMessage: sellerMessage.trim(),
    });
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
        Propose Alternative Times
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" gutterBottom>
          The buyer&apos;s initial preferred time is:{" "}
          <strong>{getTimePreferenceDisplay(initialBuyerPreference)}</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          If you cannot accommodate this, please select the alternative time(s)
          of day you can offer for this service.
        </Typography>
        <FormGroup>
          {timePreferenceOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={proposedPreferences[option.value]}
                  onChange={handlePreferenceChange}
                  name={option.value}
                  disabled={isLoading}
                />
              }
              label={option.label}
            />
          ))}
        </FormGroup>
        <TextField
          label="Optional Message to Buyer"
          multiline
          rows={3}
          fullWidth
          value={sellerMessage}
          onChange={(e) => setSellerMessage(e.target.value)}
          margin="normal"
          variant="outlined"
          disabled={isLoading}
          sx={{ mt: 2.5 }}
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
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={
            isLoading || Object.values(proposedPreferences).every((v) => !v)
          } // Disable if no preference selected
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Submit Proposal"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProposeTimeChangeModal;

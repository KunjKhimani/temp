// src/components/Services/BookingDrawer.jsx
/* eslint-disable react/prop-types */
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton as MuiIconButton,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect, useMemo } from "react";

// No longer need getTodayDateString if dates are predefined

const BookingDrawer = ({
  open,
  onClose,
  serviceType,
  servicePriceType,
  serviceLocations = [],
  serviceTravelFee = 0,
  serviceAvailability = [], // <-- NEW PROP: Array of available date/time slots
  formData,
  // includeTravelFee, // Assuming this is now part of formData
  onInputChange,
  onSubmit,
  isSubmittingOrder,
  submissionError,
  onClearError,
}) => {
  const [showValidation, setShowValidation] = useState(false);

  // Derived state for available time slots based on selected date
  const availableTimeSlotsForSelectedDate = useMemo(() => {
    if (
      !formData.selectedDate ||
      !serviceAvailability ||
      serviceAvailability.length === 0
    ) {
      return [];
    }
    const availabilityForDate = serviceAvailability.find(
      (avail) => avail.date === formData.selectedDate
    );
    return availabilityForDate ? availabilityForDate.timeSlots : [];
  }, [formData.selectedDate, serviceAvailability]);

  useEffect(() => {
    if (open) {
      setShowValidation(false);
      if (onClearError) onClearError();

      // Initialize fields if not already in formData or reset if invalid
      const initialSelectedDate = formData.selectedDate || "";
      const initialSelectedTimeSlot = formData.selectedTimeSlot || "";
      const initialSchedulingComment = formData.schedulingComment || "";

      // If the previously selected date is no longer valid (e.g., availability changed), reset it
      const isDateValid = serviceAvailability.some(
        (avail) => avail.date === initialSelectedDate
      );
      const dateToSet = isDateValid ? initialSelectedDate : "";

      // If the previously selected time slot is no longer valid for the (newly) set date, reset it
      const currentSlotsForDate = dateToSet
        ? serviceAvailability.find((avail) => avail.date === dateToSet)
            ?.timeSlots || []
        : [];
      const isTimeSlotValid = currentSlotsForDate.includes(
        initialSelectedTimeSlot
      );
      const timeSlotToSet = isTimeSlotValid ? initialSelectedTimeSlot : "";

      if (
        formData.selectedDate !== dateToSet ||
        formData.selectedTimeSlot !== timeSlotToSet ||
        formData.schedulingComment !== initialSchedulingComment
      ) {
        // Batch updates if possible, or call onInputChange for each
        // This depends on how your onInputChange handles multiple fields
        onInputChange({ target: { name: "selectedDate", value: dateToSet } });
        onInputChange({
          target: { name: "selectedTimeSlot", value: timeSlotToSet },
        });
        onInputChange({
          target: {
            name: "schedulingComment",
            value: initialSchedulingComment,
          },
        });
      }
    }
  }, [
    open,
    onClearError,
    formData.selectedDate,
    formData.selectedTimeSlot,
    formData.schedulingComment,
    serviceAvailability,
    onInputChange,
  ]);

  // Validation checks
  const isLocationError =
    showValidation &&
    serviceType === "on-site" &&
    serviceLocations.length > 0 &&
    !formData.location;

  // --- MODIFICATION: Validation for selectedDate and selectedTimeSlot ---
  // These fields are typically required if serviceAvailability is provided
  const isSelectedDateError =
    showValidation &&
    serviceAvailability &&
    serviceAvailability.length > 0 &&
    !formData.selectedDate;

  const isSelectedTimeSlotError =
    showValidation &&
    serviceAvailability &&
    serviceAvailability.length > 0 &&
    formData.selectedDate && // Only error if a date is selected but no time slot
    !formData.selectedTimeSlot;

  let isSubmitDisabled = false;
  // Existing validations...
  if (serviceType === "on-site") {
    if (
      (serviceLocations.length > 0 && !formData.location) ||
      !formData.numberOfPeople ||
      Number(formData.numberOfPeople) < 1
    ) {
      isSubmitDisabled = true;
    }
  } else {
    if (!formData.quantity || Number(formData.quantity) < 1) {
      isSubmitDisabled = true;
    }
  }
  if (
    servicePriceType === "per hour" &&
    (!formData.numberOfHours || Number(formData.numberOfHours) < 0.1)
  ) {
    isSubmitDisabled = true;
  }

  // --- MODIFICATION: Add date/time slot selection to submit disable logic ---
  // If the service has specific availability, a date and time slot must be chosen.
  if (serviceAvailability && serviceAvailability.length > 0) {
    if (!formData.selectedDate || !formData.selectedTimeSlot) {
      isSubmitDisabled = true;
    }
  }

  const handleFormSubmit = () => {
    setShowValidation(true);
    if (onClearError) onClearError();
    if (!isSubmitDisabled) {
      onSubmit();
    }
  };

  const handleDateChange = (event) => {
    // When date changes, reset the time slot as the available slots will change
    onInputChange(event); // Update selectedDate
    onInputChange({ target: { name: "selectedTimeSlot", value: "" } }); // Reset selectedTimeSlot
  };

  let drawerTitle = "Order Details";
  // ... (drawerTitle logic remains the same)
  if (servicePriceType === "per hour") {
    drawerTitle =
      serviceType === "on-site" ? "Book On-Site Hourly" : "Book Remote Hourly";
  } else {
    drawerTitle =
      serviceType === "on-site"
        ? "Book On-Site Project"
        : "Order Remote Project";
  }

  const showTravelFeeCheckbox =
    serviceType === "on-site" && serviceTravelFee > 0;

  const hasPredefinedAvailability =
    serviceAvailability && serviceAvailability.length > 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "90%", sm: 350, md: 400 } } }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" component="div">
          {drawerTitle}
        </Typography>
        <MuiIconButton onClick={onClose} size="small">
          <CloseIcon />
        </MuiIconButton>
      </Box>

      <Box sx={{ p: 3, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
        {" "}
        {/* Added scroll for long forms */}
        {submissionError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>
            {submissionError}
          </Alert>
        )}
        {/* ... (existing fields for numberOfPeople, location, numberOfHours, quantity) ... */}
        {serviceType === "on-site" && (
          <>
            <TextField
              fullWidth
              required
              label="Number of People"
              name="numberOfPeople"
              type="number"
              value={formData.numberOfPeople || ""}
              onChange={onInputChange}
              margin="normal"
              InputProps={{ inputProps: { min: 1 } }}
              error={
                showValidation &&
                (!formData.numberOfPeople ||
                  Number(formData.numberOfPeople) < 1)
              }
              helperText={
                showValidation &&
                (!formData.numberOfPeople ||
                  Number(formData.numberOfPeople) < 1)
                  ? "Minimum 1 person required"
                  : " "
              }
            />
            {serviceLocations && serviceLocations.length > 0 && (
              <TextField
                fullWidth
                required
                select
                label="Select Location"
                name="location"
                value={formData.location || ""}
                onChange={onInputChange}
                margin="normal"
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                error={isLocationError}
                helperText={isLocationError ? "Please select a location" : " "}
              >
                <option value="" disabled>
                  -- Select a Location --
                </option>
                {serviceLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </TextField>
            )}
          </>
        )}
        {servicePriceType === "per hour" && (
          <TextField
            fullWidth
            required
            label="Number of Hours"
            name="numberOfHours"
            type="number"
            value={formData.numberOfHours || ""}
            onChange={onInputChange}
            margin="normal"
            InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
            error={
              showValidation &&
              (!formData.numberOfHours || Number(formData.numberOfHours) < 0.1)
            }
            helperText={
              showValidation &&
              (!formData.numberOfHours || Number(formData.numberOfHours) < 0.1)
                ? "Minimum 0.1 hours required"
                : " "
            }
          />
        )}
        {serviceType !== "on-site" && (
          <TextField
            fullWidth
            required
            label="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity || ""}
            onChange={onInputChange}
            margin="normal"
            InputProps={{ inputProps: { min: 1 } }}
            error={
              showValidation &&
              (!formData.quantity || Number(formData.quantity) < 1)
            }
            helperText={
              showValidation &&
              (!formData.quantity || Number(formData.quantity) < 1)
                ? `Minimum 1 required`
                : " "
            }
          />
        )}
        {/* --- MODIFIED: Conditional Date/Time Selection based on serviceAvailability --- */}
        {hasPredefinedAvailability ? (
          <>
            <TextField
              fullWidth
              required
              select
              label="Select Available Date"
              name="selectedDate"
              value={formData.selectedDate || ""}
              onChange={handleDateChange} // Custom handler to reset time slot
              margin="normal"
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              error={isSelectedDateError}
              helperText={isSelectedDateError ? "Please select a date" : " "}
            >
              <option value="" disabled>
                -- Choose a Date --
              </option>
              {serviceAvailability.map((avail) => (
                <option key={avail.date} value={avail.date}>
                  {/* You might want to format the date for display here */}
                  {new Date(avail.date + "T00:00:00").toLocaleDateString(
                    undefined,
                    {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </option>
              ))}
            </TextField>

            <TextField
              fullWidth
              required
              select
              label="Select Available Time Slot"
              name="selectedTimeSlot"
              value={formData.selectedTimeSlot || ""}
              onChange={onInputChange}
              margin="normal"
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              disabled={
                !formData.selectedDate ||
                availableTimeSlotsForSelectedDate.length === 0
              } // Disable if no date selected or no slots for date
              error={isSelectedTimeSlotError}
              helperText={
                isSelectedTimeSlotError ? "Please select a time slot" : " "
              }
            >
              <option value="" disabled>
                -- Choose a Time Slot --
              </option>
              {availableTimeSlotsForSelectedDate.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
              {formData.selectedDate &&
                availableTimeSlotsForSelectedDate.length === 0 && (
                  <option value="" disabled>
                    No slots available for this date
                  </option>
                )}
            </TextField>
          </>
        ) : (
          // Fallback to original generic preference fields if no specific availability
          // Or you might choose to hide these if service requires specific slots
          <>
            <TextField
              fullWidth
              label="Preferred Date (Optional)"
              name="preferredDate" // Keep original names if used as fallback
              type="date"
              value={formData.preferredDate || ""}
              onChange={onInputChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              // inputProps={{ min: getTodayDateString() }} // Re-enable if this path is active
              helperText=" "
            />
            <TextField
              fullWidth
              select
              label="Preferred Time of Day"
              name="timePreference" // Keep original names if used as fallback
              value={formData.timePreference || "any"}
              onChange={onInputChange}
              margin="normal"
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              helperText=" "
            >
              <option value="any">Any Time</option>
              <option value="morning">Morning (e.g., 9 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (e.g., 1 PM - 5 PM)</option>
              <option value="evening">Evening (e.g., 6 PM - 9 PM)</option>
            </TextField>
          </>
        )}
        <TextField
          fullWidth
          label="Scheduling Comment (Optional)"
          name="schedulingComment"
          value={formData.schedulingComment || ""}
          onChange={onInputChange}
          margin="normal"
          multiline
          rows={2}
          helperText="Any specific notes for scheduling"
        />
        {/* --- END Date/Time --- */}
        {showTravelFeeCheckbox && (
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.includeTravelFee || false}
                onChange={onInputChange}
                name="includeTravelFee"
                color="primary"
              />
            }
            label={`Include Travel Fee ($${serviceTravelFee.toFixed(2)})`}
            sx={{ mt: 1, display: "block" }}
          />
        )}
        <TextField
          fullWidth
          label="Additional Information (Optional)"
          name="additionalInfo"
          value={formData.additionalInfo || ""}
          onChange={onInputChange}
          margin="normal"
          multiline
          rows={3}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{ mt: 3, textTransform: "none" }}
          onClick={handleFormSubmit}
          disabled={isSubmittingOrder || (showValidation && isSubmitDisabled)}
        >
          {isSubmittingOrder ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </Box>
    </Drawer>
  );
};

export default BookingDrawer;

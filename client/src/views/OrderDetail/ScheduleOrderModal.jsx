/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
// src/components/Orders/ScheduleOrderModal.jsx
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
  Box,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Stack,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// DateTimePicker might not be needed if flexible/date_range also uses DatePicker + custom hour select
// import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import {
  format,
  parse,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  parseISO,
  addHours as addHoursDateFns, // Renamed to avoid conflict
  getHours,
  getMinutes,
  isToday,
  isBefore, // For flexible time picker minTime logic
} from "date-fns";

const dayIndexToString = (index) => {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][index];
};

// For flexible/date_range time preference filtering
const timePreferenceRanges = {
  morning: { start: 9, end: 12 },
  afternoon: { start: 13, end: 17 },
  evening: { start: 18, end: 21 },
  any: { start: 8, end: 22 }, // Default "any" to a broad range
};

// Helper to parse "HH:mm" string to total minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(":")) return 0; // Basic validation
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const ScheduleOrderModal = ({
  open,
  onClose,
  serviceAvailabilityType,
  availableTimeSlots = [], // For "scheduled_slots"
  availabilityInfo, // For "flexible", "date_range"
  onConfirmSchedule,
  isLoading,
  isRescheduling = false,
  currentScheduledDetails = null,
  buyerInitialTimePreference = "any",
  serviceDurationHours = 1,
}) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [buyerComment, setBuyerComment] = useState("");

  // State for serviceAvailabilityType === "scheduled_slots"
  const [selectedRecurringSlotIndex, setSelectedRecurringSlotIndex] =
    useState("");
  const [selectedDateForRecurringSlot, setSelectedDateForRecurringSlot] =
    useState(null);
  const [availableStartTimesForDay, setAvailableStartTimesForDay] = useState(
    []
  );
  const [finalSelectedStartTime, setFinalSelectedStartTime] = useState(""); // "HH:mm"

  // State for serviceAvailabilityType === "flexible" || "date_range"
  const [selectedFlexibleDate, setSelectedFlexibleDate] = useState(null);
  const [selectedFlexibleHour, setSelectedFlexibleHour] = useState(""); // "HH:mm"
  const [dynamicallyGeneratedHours, setDynamicallyGeneratedHours] = useState(
    []
  );

  useEffect(() => {
    if (open) {
      setError("");
      setStep(1);
      setBuyerComment(
        isRescheduling && currentScheduledDetails
          ? currentScheduledDetails.buyerSchedulingComment || ""
          : ""
      );

      if (isRescheduling && currentScheduledDetails) {
        if (
          serviceAvailabilityType === "scheduled_slots" &&
          currentScheduledDetails.selectedTimeSlot
        ) {
          const {
            dayOfWeek,
            startTime,
            slotDate: currentSlotDateStr,
          } = currentScheduledDetails.selectedTimeSlot;
          const matchingSlotIndex = availableTimeSlots.findIndex(
            (s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime // Match based on original recurring slot
          );
          setSelectedRecurringSlotIndex(
            matchingSlotIndex !== -1 ? matchingSlotIndex.toString() : ""
          );
          try {
            setSelectedDateForRecurringSlot(
              currentSlotDateStr ? parseISO(currentSlotDateStr) : null
            );
          } catch (e) {
            setSelectedDateForRecurringSlot(null);
          }
          // Pre-fill the specific start time that was previously booked
          setFinalSelectedStartTime(startTime || ""); // This assumes 'startTime' in selectedTimeSlot was the specific chosen one
        } else if (
          (serviceAvailabilityType === "flexible" ||
            serviceAvailabilityType === "date_range") &&
          currentScheduledDetails.scheduledDateTime
        ) {
          try {
            const dt = parseISO(currentScheduledDetails.scheduledDateTime);
            if (!isNaN(dt)) {
              setSelectedFlexibleDate(dt);
              setSelectedFlexibleHour(format(dt, "HH:mm"));
            } else {
              resetFlexibleFields();
            }
          } catch (e) {
            resetFlexibleFields();
          }
        } else {
          resetScheduledSlotFields();
          resetFlexibleFields();
        }
      } else {
        resetScheduledSlotFields();
        resetFlexibleFields();
      }
    }
  }, [
    open,
    isRescheduling,
    currentScheduledDetails,
    serviceAvailabilityType,
    availableTimeSlots,
  ]);

  const resetScheduledSlotFields = () => {
    setSelectedRecurringSlotIndex("");
    setSelectedDateForRecurringSlot(null);
    setAvailableStartTimesForDay([]);
    setFinalSelectedStartTime("");
  };
  const resetFlexibleFields = () => {
    setSelectedFlexibleDate(null);
    setSelectedFlexibleHour("");
    setDynamicallyGeneratedHours([]);
  };

  // Generate specific start times for a chosen RECURRING slot and date (for serviceAvailabilityType === "scheduled_slots")
  useEffect(() => {
    if (
      serviceAvailabilityType === "scheduled_slots" &&
      selectedRecurringSlotIndex !== "" &&
      selectedDateForRecurringSlot &&
      availableTimeSlots[Number(selectedRecurringSlotIndex)]
    ) {
      const chosenRecurringSlot =
        availableTimeSlots[Number(selectedRecurringSlotIndex)];
      const dayOfWeekOfSelectedDate = getDay(selectedDateForRecurringSlot);

      if (dayOfWeekOfSelectedDate !== chosenRecurringSlot.dayOfWeek) {
        setAvailableStartTimesForDay([]);
        // Error will be caught before proceeding from step 1
        return;
      }

      const generatedTimes = [];
      const slotStartTotalMinutes = timeToMinutes(
        chosenRecurringSlot.startTime
      );
      const slotEndTotalMinutes = timeToMinutes(chosenRecurringSlot.endTime);
      const durationInMinutes = serviceDurationHours * 60;
      const intervalMinutes = 30; // Or 15, or 60 for hourly

      for (
        let currentStartTimeMinutes = slotStartTotalMinutes;
        currentStartTimeMinutes + durationInMinutes <= slotEndTotalMinutes;
        currentStartTimeMinutes += intervalMinutes
      ) {
        const startHour = Math.floor(currentStartTimeMinutes / 60);
        const startMinute = currentStartTimeMinutes % 60;

        const tempStartDate = setSeconds(
          setMinutes(
            setHours(new Date(selectedDateForRecurringSlot), startHour),
            startMinute
          ),
          0
        );
        const tempEndDate = addHoursDateFns(
          tempStartDate,
          serviceDurationHours
        );

        generatedTimes.push({
          value: format(tempStartDate, "HH:mm"),
          label: `${format(tempStartDate, "h:mm a")} - ${format(
            tempEndDate,
            "h:mm a"
          )}`,
        });
      }
      setAvailableStartTimesForDay(generatedTimes);
      // If a previous finalSelectedStartTime exists (e.g. from rescheduling) and is no longer valid, reset it
      if (
        finalSelectedStartTime &&
        !generatedTimes.find((s) => s.value === finalSelectedStartTime)
      ) {
        setFinalSelectedStartTime("");
      }
    } else {
      setAvailableStartTimesForDay([]); // Clear if prerequisites not met
    }
  }, [
    selectedRecurringSlotIndex,
    selectedDateForRecurringSlot,
    availableTimeSlots,
    serviceDurationHours,
    serviceAvailabilityType,
    finalSelectedStartTime,
  ]); // Added finalSelectedStartTime to deps for reset logic

  // Generate dynamic hours for FLEXIBLE/DATE_RANGE based on buyer's preference and service duration
  useEffect(() => {
    if (
      (serviceAvailabilityType === "flexible" ||
        serviceAvailabilityType === "date_range") &&
      selectedFlexibleDate
    ) {
      const preferenceRange =
        timePreferenceRanges[buyerInitialTimePreference] ||
        timePreferenceRanges.any;
      let dayStartHour = preferenceRange.start;
      let dayEndHour = preferenceRange.end; // This is the hour before which the service *must end*

      // Example platform operating hours (can be made dynamic)
      const platformMinHour = 8; // e.g., 8 AM
      const platformMaxHourServiceCanEndBy = 22; // e.g., service must end by 10 PM

      dayStartHour = Math.max(dayStartHour, platformMinHour);
      dayEndHour = Math.min(dayEndHour, platformMaxHourServiceCanEndBy);

      const possibleStartTimes = [];
      const intervalMinutes = 30; // e.g., 30-minute intervals

      for (let h = dayStartHour; h < dayEndHour; h++) {
        for (let m = 0; m < 60; m += intervalMinutes) {
          const potentialStartDateTime = setSeconds(
            setMinutes(setHours(new Date(selectedFlexibleDate), h), m),
            0
          );
          const potentialEndDateTime = addHoursDateFns(
            potentialStartDateTime,
            serviceDurationHours
          );

          // Check if the service ENDS within the preference window and platform limits
          const endHourOfService = getHours(potentialEndDateTime);
          const endMinuteOfService = getMinutes(potentialEndDateTime);

          if (
            (endHourOfService < dayEndHour ||
              (endHourOfService === dayEndHour && endMinuteOfService === 0)) &&
            (endHourOfService < platformMaxHourServiceCanEndBy ||
              (endHourOfService === platformMaxHourServiceCanEndBy &&
                endMinuteOfService === 0))
          ) {
            // Additional check: ensure start time is not in the past if date is today
            if (
              isToday(selectedFlexibleDate) &&
              isBefore(potentialStartDateTime, new Date())
            ) {
              continue;
            }
            possibleStartTimes.push({
              value: format(potentialStartDateTime, "HH:mm"),
              label: format(potentialStartDateTime, "h:mm a"),
            });
          }
        }
      }
      setDynamicallyGeneratedHours(possibleStartTimes);
      if (
        selectedFlexibleHour &&
        !possibleStartTimes.find((s) => s.value === selectedFlexibleHour)
      ) {
        setSelectedFlexibleHour(""); // Reset if previous selection is no longer valid
      }
    } else {
      setDynamicallyGeneratedHours([]);
    }
  }, [
    selectedFlexibleDate,
    buyerInitialTimePreference,
    serviceDurationHours,
    serviceAvailabilityType,
    selectedFlexibleHour,
  ]); // Added selectedFlexibleHour for reset

  const resetFieldsAndClose = () => {
    resetScheduledSlotFields();
    resetFlexibleFields();
    setBuyerComment("");
    setError("");
    setStep(1);
    onClose();
  };

  const handleProceedToStep2 = () => {
    // For scheduled_slots: From General Slot/Date to Specific Time
    setError("");
    if (
      selectedRecurringSlotIndex === "" ||
      !availableTimeSlots[Number(selectedRecurringSlotIndex)]
    ) {
      setError("Please select a general availability slot.");
      return;
    }
    if (!selectedDateForRecurringSlot) {
      setError("Please pick a date for the selected slot.");
      return;
    }
    const chosenRecurringSlot =
      availableTimeSlots[Number(selectedRecurringSlotIndex)];
    if (
      getDay(selectedDateForRecurringSlot) !== chosenRecurringSlot.dayOfWeek
    ) {
      setError(
        `The selected date (${format(
          selectedDateForRecurringSlot,
          "EEEE, MMM d"
        )}) is not a ${dayIndexToString(chosenRecurringSlot.dayOfWeek)}.`
      );
      return;
    }
    if (availableStartTimesForDay.length === 0) {
      setError(
        `No specific ${serviceDurationHours}-hour start times available within this general slot for the selected date. Please try another date or general slot.`
      );
      return;
    }
    setStep(2);
  };

  const handleProceedToStep3 = () => {
    // For scheduled_slots: From Specific Time to Confirmation
    setError("");
    if (!finalSelectedStartTime) {
      setError("Please select a specific start time.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = () => {
    setError("");
    let dataForParent = { buyerSchedulingComment: buyerComment.trim() };

    if (serviceAvailabilityType === "scheduled_slots") {
      if (
        !selectedDateForRecurringSlot ||
        !finalSelectedStartTime ||
        selectedRecurringSlotIndex === ""
      ) {
        setError(
          "Incomplete selection. Please ensure a general slot, date, and specific start time are chosen."
        );
        // Determine which step to go back to based on what's missing
        if (!selectedDateForRecurringSlot || selectedRecurringSlotIndex === "")
          setStep(1);
        else if (!finalSelectedStartTime) setStep(2);
        return;
      }
      const [hour, minute] = finalSelectedStartTime.split(":").map(Number);
      const finalDateTime = setSeconds(
        setMinutes(
          setHours(new Date(selectedDateForRecurringSlot), hour),
          minute
        ),
        0
      );
      const finalEndTime = addHoursDateFns(finalDateTime, serviceDurationHours);

      dataForParent.selectedSlotForDb = {
        dayOfWeek: getDay(finalDateTime),
        startTime: finalSelectedStartTime,
        endTime: format(finalEndTime, "HH:mm"),
      };
      dataForParent.specificDateForSlot = finalDateTime.toISOString(); // This is the actual start date & time
    } else if (
      serviceAvailabilityType === "flexible" ||
      serviceAvailabilityType === "date_range"
    ) {
      if (!selectedFlexibleDate || !selectedFlexibleHour) {
        setError("Please select both a date and a preferred start time.");
        return;
      }
      const [hour, minute] = selectedFlexibleHour.split(":").map(Number);
      let combinedDateTime = setSeconds(
        setMinutes(setHours(new Date(selectedFlexibleDate), hour), minute),
        0
      );
      dataForParent.specificDateTime = combinedDateTime.toISOString();
    } else {
      setError("Invalid service availability type.");
      return;
    }

    onConfirmSchedule(dataForParent);
  };

  const confirmedBookingDetails = useMemo(() => {
    if (
      serviceAvailabilityType === "scheduled_slots" &&
      step === 3 &&
      selectedDateForRecurringSlot &&
      finalSelectedStartTime
    ) {
      const [hour, minute] = finalSelectedStartTime.split(":").map(Number);
      const finalDateTime = setMinutes(
        setHours(new Date(selectedDateForRecurringSlot), hour),
        minute
      );
      const finalEndTime = addHoursDateFns(finalDateTime, serviceDurationHours);
      return {
        date: format(finalDateTime, "EEEE, MMMM d, yyyy"),
        time: `${format(finalDateTime, "h:mm a")} - ${format(
          finalEndTime,
          "h:mm a"
        )}`,
      };
    }
    return null;
  }, [
    step,
    serviceAvailabilityType,
    selectedDateForRecurringSlot,
    finalSelectedStartTime,
    serviceDurationHours,
  ]);

  return (
    <Dialog
      open={open}
      onClose={resetFieldsAndClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 1.5,
        }}
      >
        {isRescheduling ? "Reschedule Your Service" : "Schedule Your Service"}
        {serviceAvailabilityType === "scheduled_slots" &&
          step === 2 &&
          " - Select Specific Time"}
        {serviceAvailabilityType === "scheduled_slots" &&
          step === 3 &&
          " - Confirm Booking"}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {" "}
            {error}{" "}
          </Alert>
        )}

        {/* Step 1: General Slot & Date (scheduled_slots) OR Date (flexible/date_range) */}
        {step === 1 && (
          <>
            {serviceAvailabilityType === "scheduled_slots" && (
              <Box>
                <FormControl component="fieldset" margin="normal" fullWidth>
                  <FormLabel
                    component="legend"
                    sx={{ fontWeight: "medium", mb: 1 }}
                  >
                    {" "}
                    Select a General Availability Slot{" "}
                  </FormLabel>
                  {availableTimeSlots.length > 0 ? (
                    <RadioGroup
                      value={selectedRecurringSlotIndex}
                      onChange={(e) => {
                        setSelectedRecurringSlotIndex(e.target.value);
                        setSelectedDateForRecurringSlot(null);
                        setFinalSelectedStartTime("");
                        setError("");
                      }}
                    >
                      {availableTimeSlots.map((slot, index) => (
                        <FormControlLabel
                          key={`${slot.dayOfWeek}-${slot.startTime}-${index}`}
                          value={index.toString()}
                          control={<Radio />}
                          label={`${dayIndexToString(slot.dayOfWeek)}: ${
                            slot.startTime
                          } - ${slot.endTime}`}
                        />
                      ))}
                    </RadioGroup>
                  ) : (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {" "}
                      No general recurring slots provided by the seller.{" "}
                    </Typography>
                  )}
                </FormControl>

                {selectedRecurringSlotIndex !== "" &&
                  availableTimeSlots[Number(selectedRecurringSlotIndex)] && (
                    <FormControl
                      component="fieldset"
                      margin="normal"
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      <FormLabel
                        component="legend"
                        sx={{ fontWeight: "medium", mb: 1.5 }}
                      >
                        {" "}
                        Pick a Date for{" "}
                        {dayIndexToString(
                          availableTimeSlots[Number(selectedRecurringSlotIndex)]
                            .dayOfWeek
                        )}{" "}
                      </FormLabel>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Select Date"
                          value={selectedDateForRecurringSlot}
                          onChange={(newValue) => {
                            setSelectedDateForRecurringSlot(newValue);
                            setFinalSelectedStartTime("");
                            setError("");
                          }}
                          shouldDisableDate={(dateParam) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (dateParam < today) return true;
                            return (
                              getDay(dateParam) !==
                              availableTimeSlots[
                                Number(selectedRecurringSlotIndex)
                              ].dayOfWeek
                            );
                          }}
                          minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                          enableAccessibleFieldDOMStructure={false}
                          slots={{
                            textField: (params) => (
                              <TextField
                                {...params}
                                fullWidth
                                helperText={`Select a ${dayIndexToString(
                                  availableTimeSlots[
                                    Number(selectedRecurringSlotIndex)
                                  ].dayOfWeek
                                )}.`}
                              />
                            ),
                          }}
                        />
                      </LocalizationProvider>
                    </FormControl>
                  )}
              </Box>
            )}

            {(serviceAvailabilityType === "flexible" ||
              serviceAvailabilityType === "date_range") && (
              <Box>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{ fontWeight: "medium" }}
                >
                  {" "}
                  Seller's General Availability Notes:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    p: 1,
                    bgcolor: "grey.100",
                    borderRadius: 1,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {availabilityInfo ||
                    "The seller offers flexible scheduling. Please propose your preferred date and time below."}
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                  Your initial preference:{" "}
                  <strong>
                    {buyerInitialTimePreference.charAt(0).toUpperCase() +
                      buyerInitialTimePreference.slice(1)}
                  </strong>
                  , for <strong>{serviceDurationHours} hour(s)</strong>.
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Select Preferred Date"
                    value={selectedFlexibleDate}
                    onChange={(newValue) => {
                      setSelectedFlexibleDate(newValue);
                      setSelectedFlexibleHour("");
                      setError("");
                    }}
                    minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                    enableAccessibleFieldDOMStructure={false}
                    slots={{
                      textField: (params) => (
                        <TextField {...params} fullWidth margin="normal" />
                      ),
                    }}
                  />
                </LocalizationProvider>
                {selectedFlexibleDate && (
                  <FormControl
                    component="fieldset"
                    margin="normal"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    <FormLabel
                      component="legend"
                      sx={{ fontWeight: "medium", mb: 1 }}
                    >
                      {" "}
                      Available Start Times for{" "}
                      {format(selectedFlexibleDate, "MMM d, yyyy")}{" "}
                    </FormLabel>
                    {dynamicallyGeneratedHours.length > 0 ? (
                      <TextField
                        select
                        fullWidth
                        label="Select Start Time"
                        value={selectedFlexibleHour}
                        onChange={(e) => {
                          setSelectedFlexibleHour(e.target.value);
                          setError("");
                        }}
                        SelectProps={{ native: true }}
                        helperText={`Based on your '${buyerInitialTimePreference}' preference and ${serviceDurationHours}-hour service duration.`}
                        disabled={isLoading || !selectedFlexibleDate}
                      >
                        <option value="" disabled>
                          -- Select a Start Time --
                        </option>
                        {dynamicallyGeneratedHours.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </TextField>
                    ) : (
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {" "}
                        No start times available on this date for your
                        preferences and service duration. Try another date.{" "}
                      </Typography>
                    )}
                  </FormControl>
                )}
              </Box>
            )}
            <TextField
              label="Message to Seller (Optional)"
              multiline
              rows={3}
              fullWidth
              value={buyerComment}
              onChange={(e) => setBuyerComment(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ mt: 3 }}
            />
          </>
        )}

        {/* Step 2: Select Specific Start Time (for scheduled_slots) */}
        {step === 2 && serviceAvailabilityType === "scheduled_slots" && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Specific Start Time
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              For:{" "}
              <strong>
                {selectedDateForRecurringSlot
                  ? format(selectedDateForRecurringSlot, "EEEE, MMMM d, yyyy")
                  : ""}
              </strong>{" "}
              <br />
              Within seller's general slot:{" "}
              {
                availableTimeSlots[Number(selectedRecurringSlotIndex)]
                  ?.startTime
              }{" "}
              -{" "}
              {availableTimeSlots[Number(selectedRecurringSlotIndex)]?.endTime}{" "}
              <br />
              Service duration: {serviceDurationHours} hour(s)
            </Typography>
            {availableStartTimesForDay.length > 0 ? (
              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "medium", mb: 1 }}
                >
                  Available {serviceDurationHours}-Hour Slots
                </FormLabel>
                <RadioGroup
                  value={finalSelectedStartTime}
                  onChange={(e) => {
                    setFinalSelectedStartTime(e.target.value);
                    setError("");
                  }}
                >
                  {availableStartTimesForDay.map((timeOpt) => (
                    <FormControlLabel
                      key={timeOpt.value}
                      value={timeOpt.value}
                      control={<Radio />}
                      label={timeOpt.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            ) : (
              <Alert severity="warning">
                No suitable {serviceDurationHours}-hour slots available within
                the chosen general timeframe for this date. Please go "Back" and
                select a different date or general slot.
              </Alert>
            )}
            <TextField
              label="Message to Seller (Optional)"
              multiline
              rows={3}
              fullWidth
              value={buyerComment}
              onChange={(e) => setBuyerComment(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ mt: 2 }}
            />
          </Box>
        )}

        {/* Step 3: Confirmation View (for scheduled_slots) */}
        {step === 3 &&
          serviceAvailabilityType === "scheduled_slots" &&
          confirmedBookingDetails && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mt: 2,
                border: "1px solid",
                borderColor: "primary.main",
                borderRadius: 2,
                backgroundColor: "primary.lighter",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "primary.dark", fontWeight: "bold", mb: 2 }}
              >
                {" "}
                Confirm Your Booking{" "}
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {" "}
                  <EventIcon color="primary" sx={{ mr: 1.5 }} />{" "}
                  <Typography variant="body1">
                    {" "}
                    <strong>Date:</strong> {confirmedBookingDetails.date}{" "}
                  </Typography>{" "}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {" "}
                  <AccessTimeIcon color="primary" sx={{ mr: 1.5 }} />{" "}
                  <Typography variant="body1">
                    {" "}
                    <strong>Time:</strong> {confirmedBookingDetails.time}{" "}
                  </Typography>{" "}
                </Box>
                {buyerComment && (
                  <Box sx={{ pt: 1 }}>
                    {" "}
                    <Typography variant="subtitle2" color="text.secondary">
                      Your Note:
                    </Typography>{" "}
                    <Typography
                      variant="body2"
                      sx={{ fontStyle: "italic", whiteSpace: "pre-wrap" }}
                    >
                      {" "}
                      {buyerComment}{" "}
                    </Typography>{" "}
                  </Box>
                )}
              </Stack>
            </Paper>
          )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          pt: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button
          onClick={resetFieldsAndClose}
          color="inherit"
          variant="outlined"
        >
          {" "}
          Cancel{" "}
        </Button>

        {step === 1 && serviceAvailabilityType === "scheduled_slots" && (
          <Button
            onClick={handleProceedToStep2}
            variant="contained"
            color="primary"
            disabled={
              isLoading ||
              !selectedRecurringSlotIndex ||
              !selectedDateForRecurringSlot
            }
          >
            {" "}
            Next: Select Specific Time{" "}
          </Button>
        )}
        {step === 1 &&
          (serviceAvailabilityType === "flexible" ||
            serviceAvailabilityType === "date_range") && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={
                isLoading || !selectedFlexibleDate || !selectedFlexibleHour
              }
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isRescheduling ? (
                "Confirm Reschedule"
              ) : (
                "Confirm Schedule"
              )}
            </Button>
          )}
        {step === 2 && serviceAvailabilityType === "scheduled_slots" && (
          <>
            <Button
              onClick={() => {
                setStep(1);
                setError("");
                setFinalSelectedStartTime(""); /* Keep date & general slot */
              }}
              color="secondary"
              variant="text"
            >
              {" "}
              Back{" "}
            </Button>
            <Button
              onClick={handleProceedToStep3}
              variant="contained"
              color="primary"
              disabled={
                isLoading ||
                !finalSelectedStartTime ||
                availableStartTimesForDay.length === 0
              }
            >
              {" "}
              Next: Confirm Booking{" "}
            </Button>
          </>
        )}
        {step === 3 && serviceAvailabilityType === "scheduled_slots" && (
          <>
            <Button
              onClick={() => {
                setStep(2);
                setError("");
              }}
              color="secondary"
              variant="text"
            >
              {" "}
              Back{" "}
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={isLoading || !confirmedBookingDetails}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isRescheduling ? (
                "Confirm Reschedule"
              ) : (
                "Confirm Schedule"
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleOrderModal;

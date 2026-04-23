/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import PropTypes from "prop-types";
import {
  SCHEDULE_PROPOSAL_STATUS,
  SR_STATUS,
} from "../constants/serviceRequestStatus";
// import {
//   SR_STATUS,
//   SCHEDULE_PROPOSAL_STATUS,
// } from "../../constants/serviceRequestStatus"; // Adjust path

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
const timeSlots = [
  { value: "morning", label: "Morning (8 AM - 12 PM)" },
  { value: "afternoon", label: "Afternoon (12 PM - 5 PM)" },
  { value: "evening", label: "Evening (5 PM - 9 PM)" },
  { value: "specific_time", label: "Specific Time" },
  { value: "flexible", label: "Flexible" },
];

const SchedulingModal = ({
  open,
  onClose,
  serviceRequest,
  currentUser,
  onSaveSchedule, // Function to call when proposing or confirming
  actionStatus,
  actionError,
  minDate,
}) => {
  const [proposedDate, setProposedDate] = useState(null);
  const [proposedTimeSlot, setProposedTimeSlot] = useState("");
  const [specificTimeDetails, setSpecificTimeDetails] = useState("");
  const [notes, setNotes] = useState("");

  const isOwner = useMemo(
    () => serviceRequest?.createdBy?._id === currentUser?._id,
    [serviceRequest, currentUser]
  );
  const isAwardedSeller = useMemo(
    () => serviceRequest?.awardedSellerId === currentUser?._id,
    [serviceRequest, currentUser]
  );

  const {
    currentScheduleProposal,
    confirmedSchedule,
    status: srStatus,
  } = serviceRequest || {};

  useEffect(() => {
    if (open && serviceRequest) {
      if (confirmedSchedule?.date) {
        setProposedDate(new Date(confirmedSchedule.date));
        setProposedTimeSlot(confirmedSchedule.timeSlot || "");
        setSpecificTimeDetails(confirmedSchedule.specificTime || "");
        setNotes(confirmedSchedule.notes || "");
      } else if (currentScheduleProposal?.proposedDate) {
        setProposedDate(new Date(currentScheduleProposal.proposedDate));
        setProposedTimeSlot(currentScheduleProposal.proposedTimeSlot || "");
        setSpecificTimeDetails(
          currentScheduleProposal.specificTimeDetails || ""
        );
        setNotes(currentScheduleProposal.notes || "");
      } else {
        // New proposal
        const initialDate = minDate && minDate > new Date() ? minDate : null;
        setProposedDate(initialDate);
        setProposedTimeSlot("");
        setSpecificTimeDetails("");
        setNotes("");
      }
    }
  }, [
    open,
    serviceRequest,
    confirmedSchedule,
    currentScheduleProposal,
    minDate,
  ]);

  const handleAction = (actionType) => {
    if (actionType === "propose" && (!proposedDate || !proposedTimeSlot)) {
      // Basic validation for proposing
      return;
    }
    onSaveSchedule({
      // This is `scheduleActionPayload` for the thunk
      action: actionType,
      ...(actionType === "propose" && {
        // Only send these for 'propose'
        proposedDate,
        proposedTimeSlot,
        specificTimeDetails:
          proposedTimeSlot === "specific_time"
            ? specificTimeDetails
            : undefined,
        notes,
      }),
    });
  };

  // Determine UI state
  let modalTitle = "Schedule Service";
  let canPropose = false;
  let canConfirm = false;
  let fieldsDisabled = !!confirmedSchedule || actionStatus === "loading";
  let infoMessage = "";

  if (confirmedSchedule) {
    modalTitle = "Confirmed Schedule";
    infoMessage = `Service is scheduled. Awaiting payment.`;
  } else if (srStatus === SR_STATUS.AWAITING_SCHEDULE) {
    modalTitle = "Propose Initial Schedule";
    canPropose = isOwner || isAwardedSeller; // Either can initiate
    fieldsDisabled = actionStatus === "loading";
    infoMessage = isOwner
      ? "You can propose the initial schedule."
      : isAwardedSeller
      ? "You can propose the initial schedule, or wait for the buyer."
      : "";
  } else if (
    srStatus === SR_STATUS.SCHEDULE_NEGOTIATION &&
    currentScheduleProposal
  ) {
    modalTitle = "Schedule Negotiation";
    fieldsDisabled = actionStatus === "loading";
    canPropose = true; // Always allow proposing a reschedule during negotiation

    if (
      isOwner &&
      currentScheduleProposal.proposalStatus ===
        SCHEDULE_PROPOSAL_STATUS.PENDING_BUYER_CONFIRMATION
    ) {
      canConfirm = true;
      infoMessage =
        "Seller proposed a schedule. You can confirm or propose a reschedule.";
    } else if (
      isAwardedSeller &&
      currentScheduleProposal.proposalStatus ===
        SCHEDULE_PROPOSAL_STATUS.PENDING_SELLER_CONFIRMATION
    ) {
      canConfirm = true;
      infoMessage =
        "Buyer proposed a schedule. You can confirm or propose a reschedule.";
    } else if (currentScheduleProposal.proposedBy?._id === currentUser?._id) {
      infoMessage = `Your proposal is awaiting confirmation from the ${
        isOwner ? "Seller" : "Buyer"
      }. You can still propose a reschedule.`;
      // Fields should be editable if user wants to change their own unconfirmed proposal
      fieldsDisabled = actionStatus === "loading";
    } else {
      // Should not happen if proposalStatus is set correctly
      infoMessage = "Reviewing schedule proposal.";
    }
  }

  return (
    <Modal open={open} onClose={onClose} /* ... */>
      <Box sx={style}>
        <Typography variant="h6" component="h2" gutterBottom>
          {modalTitle}
        </Typography>
        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof actionError === "string"
              ? actionError
              : actionError.message}
          </Alert>
        )}
        {infoMessage && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {infoMessage}
          </Typography>
        )}

        <Stack spacing={2}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Schedule Date & Time"
              value={proposedDate}
              onChange={(newValue) => setProposedDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              disabled={fieldsDisabled}
              minDate={minDate}
            />
          </LocalizationProvider>
          <TextField
            select
            label="Time Slot"
            value={proposedTimeSlot}
            onChange={(e) => setProposedTimeSlot(e.target.value)}
            fullWidth
            disabled={fieldsDisabled}
          >
            {timeSlots.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {proposedTimeSlot === "specific_time" && (
            <TextField
              label="Specific Time Details"
              value={specificTimeDetails}
              onChange={(e) => setSpecificTimeDetails(e.target.value)}
              fullWidth
              disabled={fieldsDisabled}
            />
          )}
          <TextField
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
            disabled={fieldsDisabled}
          />

          {serviceRequest?.rescheduleCount > 0 && !confirmedSchedule && (
            <Typography variant="caption" color="text.secondary">
              Reschedule Count: {serviceRequest.rescheduleCount}
            </Typography>
          )}
          {currentScheduleProposal && !confirmedSchedule && (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              sx={{ my: 1 }}
            >
              <Chip
                label={`Buyer: ${
                  currentScheduleProposal.proposalStatus ===
                    SCHEDULE_PROPOSAL_STATUS.PENDING_SELLER_CONFIRMATION ||
                  serviceRequest.schedulingConfirmedByBuyer
                    ? "Proposed/Confirmed"
                    : "Awaiting Action"
                }`}
                color={
                  serviceRequest.schedulingConfirmedByBuyer
                    ? "success"
                    : "default"
                }
              />
              <Chip
                label={`Seller: ${
                  currentScheduleProposal.proposalStatus ===
                    SCHEDULE_PROPOSAL_STATUS.PENDING_BUYER_CONFIRMATION ||
                  serviceRequest.schedulingConfirmedBySeller
                    ? "Proposed/Confirmed"
                    : "Awaiting Action"
                }`}
                color={
                  serviceRequest.schedulingConfirmedBySeller
                    ? "success"
                    : "default"
                }
              />
            </Stack>
          )}

          {canPropose && !confirmedSchedule && (
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleAction("propose")}
              disabled={
                actionStatus === "loading" || !proposedDate || !proposedTimeSlot
              }
              sx={{ mt: 2 }}
            >
              {actionStatus === "loading" ? (
                <CircularProgress size={24} />
              ) : currentScheduleProposal ||
                srStatus === SR_STATUS.SCHEDULE_NEGOTIATION ? (
                "Propose Reschedule"
              ) : (
                "Propose Schedule"
              )}
            </Button>
          )}

          {canConfirm && !confirmedSchedule && (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => handleAction("confirm")}
              disabled={actionStatus === "loading"}
              sx={{ mt: 1 }}
            >
              {actionStatus === "loading" ? (
                <CircularProgress size={24} />
              ) : (
                "Confirm This Schedule"
              )}
            </Button>
          )}

          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            disabled={actionStatus === "loading"}
            sx={{ mt: 1 }}
          >
            {confirmedSchedule ? "Close" : "Cancel"}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

SchedulingModal.propTypes = {
  // ... existing props
  serviceRequest: PropTypes.shape({
    _id: PropTypes.string,
    status: PropTypes.string,
    createdBy: PropTypes.object,
    awardedSellerId: PropTypes.string,
    rescheduleCount: PropTypes.number,
    schedulingConfirmedByBuyer: PropTypes.bool,
    schedulingConfirmedBySeller: PropTypes.bool,
    currentScheduleProposal: PropTypes.shape({
      proposedBy: PropTypes.object,
      proposedDate: PropTypes.string,
      proposedTimeSlot: PropTypes.string,
      specificTimeDetails: PropTypes.string,
      notes: PropTypes.string,
      proposalStatus: PropTypes.string,
    }),
    confirmedSchedule: PropTypes.shape({
      date: PropTypes.string,
      timeSlot: PropTypes.string,
      // ... other confirmed schedule fields
    }),
  }),
  currentUser: PropTypes.object.isRequired, // Added
  minDate: PropTypes.instanceOf(Date),
};

export default SchedulingModal;

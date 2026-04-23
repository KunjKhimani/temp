/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React from "react";
import PropTypes from "prop-types"; // Import PropTypes
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Link as MuiLink,
  Alert, // Import Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 450 },
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  outline: "none",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const StripeOnboardingModal = ({ open, onClose, onboardingLink }) => {
  const handleRedirectToPayoutSetup = () => {
    if (onboardingLink) {
      window.open(onboardingLink, "_blank");
    }
    onClose(); // Close the modal after redirecting
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="payout-onboarding-modal-title"
      aria-describedby="payout-onboarding-modal-description"
    >
      <Box sx={style}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography
          id="payout-onboarding-modal-title"
          variant="h6"
          component="h2"
        >
          Complete Your Payout Account Setup
        </Typography>
        <Typography id="payout-onboarding-modal-description" sx={{ mt: 2 }}>
          To receive payouts for your completed orders, you need to finish
          setting up your payout account. This is a secure process handled by
          our payment partner.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You will be redirected to complete the required
          business and banking information.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRedirectToPayoutSetup}
          disabled={!onboardingLink}
          sx={{ mt: 3 }}
        >
          Continue Payout Setup
        </Button>
        {!onboardingLink && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Payout onboarding link is not available. Please contact support.
          </Alert>
        )}
        <MuiLink
          component="button"
          variant="body2"
          onClick={onClose}
          sx={{ mt: 1, alignSelf: "center" }}
        >
          Maybe later
        </MuiLink>
      </Box>
    </Modal>
  );
};

StripeOnboardingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onboardingLink: PropTypes.string,
};

export default StripeOnboardingModal;

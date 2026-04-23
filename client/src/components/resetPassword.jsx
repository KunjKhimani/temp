import { useState } from "react";
import PropTypes from "prop-types"; // Import PropTypes
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  OutlinedInput,
  DialogContentText,
  Snackbar,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { resetPassword as resetPasswordService } from "../services/userService"; // Import resetPassword from userService

export default function ResetPassword({ open, handleClose, email }) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setShowSnackbar(true);
      return;
    }

    try {
      await resetPasswordService({
        email,
        code: otp,
        newPassword,
      });
      setMessage("Password reset successful!");
      setShowSnackbar(true);
      handleClose();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "An error occurred. Please try again later."
      );
      setShowSnackbar(true);
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
    setMessage("");
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: "form",
          onSubmit: handleSubmit,
          sx: { backgroundImage: "none" },
        }}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
          }}
        >
          <DialogContentText>
            Enter the verification code sent to your email and your new
            password.
          </DialogContentText>
          <OutlinedInput
            autoFocus
            required
            margin="dense"
            id="otp"
            name="otp"
            label="Verification Code"
            placeholder="Enter verification code"
            fullWidth
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <OutlinedInput
            required
            margin="dense"
            id="newPassword"
            name="newPassword"
            label="New Password"
            placeholder="Enter new password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <OutlinedInput
            required
            margin="dense"
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm new password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            type="submit"
            sx={{ color: "white", minWidth: 120 }}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={message}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
}

ResetPassword.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
};

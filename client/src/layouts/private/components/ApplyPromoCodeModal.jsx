import { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
} from "@mui/material";
import { applyPromoCode } from "../../../services/apis";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../../../store/slice/snackbarSlice";

export default function ApplyPromoCodeModal({ open, onClose }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleApply = async () => {
    if (!code.trim()) {
      dispatch(
        showSnackbar({ message: "Please enter a promo code", severity: "warning", duration: 3000 })
      );
      return;
    }

    setLoading(true);
    try {
      const response = await applyPromoCode(code.trim().toUpperCase());
      dispatch(
        showSnackbar({
          message: response.data.message || "Promo code applied successfully!",
          severity: "success",
          duration: 3000,
        })
      );
      setCode("");
      onClose();
    } catch (err) {
      dispatch(
        showSnackbar({
          message: err.response?.data?.message || "Failed to apply promo code",
          severity: "error",
          duration: 3000,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Apply Promo Code</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Enter a promotional code to apply a zero-fee commission or discount to your account.
          </Typography>
          <TextField
            fullWidth
            label="Promo Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. ZEROFEE"
            autoFocus
            size="small"
            onKeyPress={(e) => {
              if (e.key === "Enter") handleApply();
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? "Applying..." : "Apply"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ApplyPromoCodeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

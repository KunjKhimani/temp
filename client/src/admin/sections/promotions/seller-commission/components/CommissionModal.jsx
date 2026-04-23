import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../../../../../store/slice/snackbarSlice";
import { setSellerCommission } from "../../../../../services/apis";
import { useEffect } from "react";

export default function CommissionModal({ open, onClose, sellerName, sellerId, override, onRefresh }) {
  const dispatch = useDispatch();
  const [commission, setCommission] = useState(override?.percentage || "");
  const [days, setDays] = useState(override?.durationDays || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!commission || !days) {
      dispatch(
        showSnackbar({
          message: "Please fill in all fields",
          severity: "error",
        })
      );
      return;
    }

    try {
      setLoading(true);
      await setSellerCommission(sellerId, {
        type: "percentage",
        percentage: Number(commission),
        durationDays: Number(days),
      });

      dispatch(
        showSnackbar({
          message: `Commission set successfully for ${sellerName}`,
          severity: "success",
        })
      );
      
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error("Error setting commission:", err);
      dispatch(
        showSnackbar({
          message: err.response?.data?.message || "Failed to set commission",
          severity: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Set Platform Fees: {sellerName}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Percentage of Fees"
            type="number"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            InputProps={{ endAdornment: "%" }}
          />
          <TextField
            fullWidth
            label="Number of Day"
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          disabled={loading}
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CommissionModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  sellerName: PropTypes.string,
  sellerId: PropTypes.string,
  override: PropTypes.object,
  onRefresh: PropTypes.func,
};

import { useState } from "react";
import { addDays } from "date-fns";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function PromoCodeModal({ open, onClose, onSave, saving }) {
  const [formData, setFormData] = useState({
    code: "",
    percentage: 0,
    startDate: null,
    endDate: null,
    usageLimit: 100,
    description: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
      ...(name === "startDate" ? { endDate: null } : {}),
    }));
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.startDate || !formData.endDate) {
      setError("Please fill in all required fields (Code, Start Date, End Date).");
      return;
    }
    if (formData.percentage < 0 || formData.percentage > 100) {
      setError("Percentage must be between 0 and 100.");
      return;
    }
    setError("");
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Promo Code</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Promo Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g. ZEROFEE"
            required
            size="small"
          />

          <TextField
            fullWidth
            label="Percentage Discount"
            name="percentage"
            type="number"
            value={formData.percentage}
            onChange={handleChange}
            required
            size="small"
            InputProps={{ inputProps: { min: 0, max: 100 } }}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(val) => handleDateChange("startDate", val)}
                minDate={new Date()}
                slotProps={{ textField: { fullWidth: true, size: "small", required: true } }}
              />
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(val) => handleDateChange("endDate", val)}
                minDate={formData.startDate ? addDays(formData.startDate, 1) : new Date()}
                slotProps={{ textField: { fullWidth: true, size: "small", required: true } }}
              />
            </Stack>
          </LocalizationProvider>

          <TextField
            fullWidth
            label="Usage Limit"
            name="usageLimit"
            type="number"
            value={formData.usageLimit}
            onChange={handleChange}
            size="small"
            placeholder="Optional (Unlimited if empty)"
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? "Saving..." : "Save Promo Code"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PromoCodeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

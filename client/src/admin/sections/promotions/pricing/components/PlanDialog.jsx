import PropTypes from "prop-types";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useState, useEffect } from "react";

export function PlanDialog({ open, onClose, onSave, planToEdit, title }) {
  const [formData, setFormData] = useState({
    durationMonths: 1,
    price: 0,
    description: [""],
  });

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        durationMonths: planToEdit.durationMonths || 1,
        price: planToEdit.price || 0,
        description: Array.isArray(planToEdit.description) && planToEdit.description.length > 0
          ? planToEdit.description
          : [""],
      });
    } else {
      setFormData({
        durationMonths: 1,
        price: 0,
        description: [""],
      });
    }
  }, [planToEdit, open]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: field === "description" ? value : (parseFloat(value) || 0),
    }));
  };

  const handleDescChange = (index, value) => {
    const newDesc = [...formData.description];
    newDesc[index] = value;
    setFormData((prev) => ({ ...prev, description: newDesc }));
  };

  const addDescField = () => {
    setFormData((prev) => ({ ...prev, description: [...prev.description, ""] }));
  };

  const removeDescField = (index) => {
    const newDesc = formData.description.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, description: newDesc }));
  };

  const handleSave = () => {
    // Filter out empty lines before saving
    const cleanedData = {
      ...formData,
      description: formData.description.filter((d) => d.trim() !== ""),
    };
    onSave(cleanedData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>{title || (planToEdit ? "Edit Plan" : "Add New Plan")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Duration (Months)"
            type="number"
            value={formData.durationMonths}
            onChange={handleChange("durationMonths")}
            fullWidth
            size="small"
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Price ($)"
            type="number"
            value={formData.price}
            onChange={handleChange("price")}
            fullWidth
            size="small"
            inputProps={{ min: 0, step: 0.01 }}
          />
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <IconButton size="small" onClick={addDescField} color="primary">
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Stack spacing={1.5}>
              {formData.description.map((desc, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    placeholder="e.g. Best value for startups"
                    value={desc}
                    onChange={(e) => handleDescChange(index, e.target.value)}
                    fullWidth
                    size="small"
                  />
                  {formData.description.length > 1 && (
                    <IconButton size="small" onClick={() => removeDescField(index)} color="error">
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {planToEdit ? "Update Plan" : "Add Plan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PlanDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  planToEdit: PropTypes.object,
  title: PropTypes.string,
};

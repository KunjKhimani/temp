/* eslint-disable react/prop-types */
// src/components/ServiceRequest/RequestTypeChoiceModal.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText, // For listing features
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; // Icon for features
import StarBorderIcon from "@mui/icons-material/StarBorder"; // Icon for standard
import StarIcon from "@mui/icons-material/Star"; // Icon for promoted
import { DEFAULT_REQUEST_TYPE_OPTIONS } from "../../constants/promotions";

const RequestTypeChoiceModal = ({ open, onClose, onConfirm, options }) => {
  const requestTypeOptions = React.useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options;
    }
    return DEFAULT_REQUEST_TYPE_OPTIONS;
  }, [options]);

  const [selectedValue, setSelectedValue] = React.useState(
    requestTypeOptions[0]?.value || ""
  );

  React.useEffect(() => {
    setSelectedValue(requestTypeOptions[0]?.value || "");
  }, [open, requestTypeOptions]);

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  const handleConfirm = () => {
    onConfirm(selectedValue);
    onClose();
  };

  const selectedOption =
    requestTypeOptions.find((option) => option.value === selectedValue) ||
    requestTypeOptions[0] ||
    {};

  const isSelectedPromoted = selectedOption.requestType === "promoted";

  const renderFeature = (text) => (
    <ListItem disablePadding sx={{ py: 0.25 }}>
      <ListItemIcon sx={{ minWidth: "30px" }}>
        <CheckCircleOutlineIcon fontSize="small" color="success" />
      </ListItemIcon>
      <ListItemText
        primary={text}
        primaryTypographyProps={{ variant: "caption" }}
      />
    </ListItem>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="request-type-dialog-title"
      maxWidth="md"
      fullWidth
    >
      {" "}
      {/* Changed to md for more space */}
      <DialogTitle
        id="request-type-dialog-title"
        sx={{ textAlign: "center", pb: 1 }}
      >
        Choose Your Service Request Post Type
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Select the best option to find the right talent for your needs.
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <RadioGroup
          aria-label="request-type"
          name="requestTypeDialog"
          value={selectedValue}
          onChange={handleChange}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {requestTypeOptions.map((option) => {
            const isSelected = selectedValue === option.value;
            const isPromoted = option.requestType === "promoted";

            return (
              <Paper
                key={option.value}
                variant="outlined"
                sx={{
                  p: 2.5,
                  cursor: "pointer",
                  borderColor: isSelected
                    ? isPromoted
                      ? "secondary.main"
                      : "primary.main"
                    : "divider",
                  borderWidth: isSelected ? 2.5 : 1,
                  boxShadow: isSelected ? (isPromoted ? 5 : 3) : 0,
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={() => setSelectedValue(option.value)}
              >
                <FormControlLabel
                  value={option.value}
                  control={
                    <Radio
                      checked={isSelected}
                      sx={{ alignSelf: "flex-start", p: 0, mr: 1 }}
                      color={isPromoted ? "secondary" : "primary"}
                    />
                  }
                  label={
                    <Box sx={{ width: "100%" }}>
                      <Box
                        display="flex"
                        alignItems="center"
                        mb={1}
                        gap={0.75}
                        flexWrap="wrap"
                      >
                        {isPromoted ? (
                          <StarIcon sx={{ color: "secondary.main" }} />
                        ) : (
                          <StarBorderIcon sx={{ color: "grey.700" }} />
                        )}
                        <Typography
                          variant="h6"
                          component="span"
                          sx={{ fontWeight: "bold" }}
                        >
                          {option.title}
                        </Typography>
                        {option.durationLabel && (
                          <Chip
                            label={option.durationLabel}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {option.feeLabel && (
                          <Chip
                            label={option.feeLabel}
                            size="small"
                            color="secondary"
                            variant="filled"
                            sx={{ fontWeight: "bold" }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        display="block"
                        color="text.secondary"
                        sx={{ mb: 1.5, minHeight: "3.5em" }}
                      >
                        {option.description}
                      </Typography>
                      <List dense disablePadding>
                        {option.features.map((feature) => (
                          <React.Fragment key={feature}>
                            {renderFeature(feature)}
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  }
                  sx={{ width: "100%", m: 0, alignItems: "flex-start" }}
                />
              </Paper>
            );
          })}
        </RadioGroup>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={isSelectedPromoted ? "secondary" : "primary"}
          size="large"
        >
          Continue with
          {isSelectedPromoted
            ? ` Promoted${selectedOption.durationLabel
              ? ` (${selectedOption.durationLabel})`
              : ""
            }`
            : " Standard"}{" "}
          Post
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestTypeChoiceModal;

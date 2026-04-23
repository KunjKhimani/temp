/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  Avatar,
} from "@mui/material";

// Import react-icons for media types (simplified)
import { FaRegFileImage, FaPlayCircle, FaRegFileAlt } from "react-icons/fa";

// Redux imports (if any service-specific actions are needed in modal, e.g., status change)
// import { updateServiceStatus } from "../../../store/adminServiceThunk";

const BASE_IMAGE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getMediaIcon = (url) => {
  const lowerUrl = url?.toLowerCase() || "";
  if (
    lowerUrl.includes(".jpg") ||
    lowerUrl.includes(".jpeg") ||
    lowerUrl.includes(".png") ||
    lowerUrl.includes(".gif")
  )
    return <FaRegFileImage />;
  if (
    lowerUrl.includes(".mp4") ||
    lowerUrl.includes(".mov") ||
    lowerUrl.includes(".avi")
  )
    return <FaPlayCircle />;
  return <FaRegFileAlt />; // Default icon
};

// ------------------------------------------------------

export function ServiceDetailsModal({ open, onClose, service }) {
  // const dispatch = useDispatch(); // Uncomment if dispatching actions from here
  // const { isLoading, isError, message } = useSelector((state) => state.adminServices); // Example selectors

  if (!service) {
    return null;
  }

  const getServiceStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "paused":
        return "warning";
      case "pending_verification":
        return "info";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          pb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          Service Details: {service.title}
        </Typography>
        <Chip
          label={service.status.replace(/_/g, " ")}
          color={getServiceStatusColor(service.status)}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        {/* Example of showing loading/error if actions were dispatched */}
        {/* {isLoading && <CircularProgress size={24} sx={{ mb: 2 }} />}
        {isError && message && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )} */}

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Basic Information</Typography>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  ID:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                >
                  {service._id}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Description:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {service.description}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Category:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                >
                  {service.category}
                  {service.subcategory ? ` / ${service.subcategory}` : ""}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Type:{" "}
                </Typography>
                <Chip
                  label={service.type}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Price:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                >
                  ${service.price.toFixed(2)} ({service.priceType})
                </Typography>
              </Box>
              {service.travelFee !== undefined && (
                <Box>
                  <Typography
                    variant="body2"
                    component="span"
                    fontWeight="fontWeightMedium"
                  >
                    Travel Fee:{" "}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    color="text.secondary"
                  >
                    ${service.travelFee.toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Created At:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                >
                  {service.createdAt
                    ? format(new Date(service.createdAt), "dd MMM yyyy")
                    : "N/A"}
                </Typography>
              </Box>
            </Stack>

            <Stack
              spacing={1.5}
              pt={2}
              mt={2}
              borderTop={1}
              borderColor="divider"
            >
              <Typography variant="h6">Provider Information</Typography>
              {service.createdBy ? (
                <>
                  <Box>
                    <Typography
                      variant="body2"
                      component="span"
                      fontWeight="fontWeightMedium"
                    >
                      Name:{" "}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      color="text.secondary"
                    >
                      {service.createdBy.name ||
                        service.createdBy.companyName ||
                        service.createdBy.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      component="span"
                      fontWeight="fontWeightMedium"
                    >
                      Email:{" "}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      color="text.secondary"
                    >
                      {service.createdBy.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      component="span"
                      fontWeight="fontWeightMedium"
                    >
                      Account Type:{" "}
                    </Typography>
                    <Chip
                      label={service.createdBy.accountType}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      component="span"
                      fontWeight="fontWeightMedium"
                    >
                      Verified:{" "}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      color={
                        service.createdBy.isVerified
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {service.createdBy.isVerified ? "Yes" : "No"}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Provider information not available.
                </Typography>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2.5}>
              <Typography variant="h6">Additional Details</Typography>
              {service.coreSkills && service.coreSkills.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Core Skills:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {service.coreSkills.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
              {service.keyDeliverables &&
                service.keyDeliverables.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Key Deliverables:
                    </Typography>
                    <List dense>
                      {service.keyDeliverables.map((item, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemText primary={`- ${item}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              {service.experienceLevel && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Experience Level:
                  </Typography>
                  <Chip
                    label={service.experienceLevel}
                    size="small"
                    sx={{ textTransform: "capitalize" }}
                  />
                </Box>
              )}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Availability:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type:{" "}
                  <Chip
                    label={service.availabilityType.replace(/_/g, " ")}
                    size="small"
                    sx={{ textTransform: "capitalize" }}
                  />
                </Typography>
                {service.availabilityInfo && (
                  <Typography variant="body2" color="text.secondary">
                    Info: {service.availabilityInfo}
                  </Typography>
                )}
                {service.availableTimeSlots &&
                  service.availableTimeSlots.length > 0 && (
                    <List dense>
                      <Typography variant="body2" fontWeight="medium" mt={1}>
                        Scheduled Slots:
                      </Typography>
                      {service.availableTimeSlots.map((slot, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemText
                            primary={`Day ${slot.dayOfWeek}: ${slot.startTime} - ${slot.endTime}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
              </Box>
              {service.locations && service.locations.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Locations (On-site):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {service.locations.map((loc, index) => (
                      <Chip key={index} label={loc} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
              {service.tags && service.tags.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Tags:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {service.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Media:
                </Typography>
                {service.media && service.media.length > 0 ? (
                  <List
                    dense
                    sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}
                  >
                    {service.media.map((mediaUrl, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.75 }}>
                        <ListItemIcon
                          sx={{
                            minWidth: 35,
                            mr: 1,
                            fontSize: "1.2rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {getMediaIcon(mediaUrl)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Link
                              href={`${BASE_IMAGE_URL}/${mediaUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                              variant="body2"
                            >
                              {mediaUrl.split("/").pop()} {/* Show filename */}
                            </Link>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontStyle: "italic",
                      pt: 1,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    No media uploaded.
                  </Typography>
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: 1,
          borderColor: "divider",
          p: 2,
          "& > :not(:first-of-type)": { ml: 1 },
        }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          size="medium"
        >
          Close
        </Button>
        {/* Add other admin actions here if needed, e.g., Change Status */}
      </DialogActions>
    </Dialog>
  );
}

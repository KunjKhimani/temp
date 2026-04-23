/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/ServiceRequestImageDisplay.jsx
/* eslint-disable react/prop-types */
import { Paper, CardMedia, Typography, Box } from "@mui/material";

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_PLACEHOLDER_IMAGE =
  "https://placehold.co/800x500/EEE/31343C?text=Request+Image";
const ERROR_PLACEHOLDER_IMAGE =
  "https://placehold.co/800x500/FFCDD2/B71C1C?text=Image+Error";

const ServiceRequestImageDisplay = ({ attachments, title }) => {
  let imageUrl = DEFAULT_PLACEHOLDER_IMAGE;

  if (
    attachments?.length > 0 &&
    typeof attachments[0] === "string" &&
    attachments[0].trim() !== ""
  ) {
    let imagePath = attachments[0].trim();
    // Paths in attachments array are often 'serviceRequest/filename.jpg' or just 'filename.jpg'
    // We assume they are relative to an 'uploads' directory on the server.
    imagePath = imagePath.replace(/^uploads\//i, ""); // Remove uploads/ if present
    imageUrl = `${API_DOMAIN_FOR_IMAGES}/uploads/${imagePath}`;
  }

  const handleImageError = (e) => {
    console.warn(
      `Failed to load image: ${e.target.src}. Falling back to error placeholder.`
    );
    e.target.src = ERROR_PLACEHOLDER_IMAGE;
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.default",
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardMedia
        component="img"
        image={imageUrl}
        alt={title || "Service request main image"}
        sx={{
          width: "100%",
          height: { xs: 200, sm: 250, md: 300, lg: 350 }, // Adjusted for potentially more detail
          objectFit: "contain", // 'contain' is good for attachments to see full image
          borderRadius: 1.5,
          bgcolor: "grey.200",
          display: "block",
        }}
        onError={handleImageError}
      />
    </Paper>
  );
};

export default ServiceRequestImageDisplay;

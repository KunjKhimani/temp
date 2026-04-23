/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Paper, CardMedia, Typography, Box } from "@mui/material"; // Added Typography, Box for error

// Helper to get the base domain for constructing image URLs
const getApiDomainForImages = () => {
  let domain = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  if (domain.endsWith("/api")) {
    domain = domain.substring(0, domain.lastIndexOf("/api"));
  } else if (domain.endsWith("/api/")) {
    domain = domain.substring(0, domain.lastIndexOf("/api/"));
  }
  return domain;
};

const API_DOMAIN_FOR_IMAGES = getApiDomainForImages();
const DEFAULT_PLACEHOLDER_IMAGE =
  "https://placehold.co/800x500/EEE/31343C?text=Service+Image";
const ERROR_PLACEHOLDER_IMAGE =
  "https://placehold.co/800x500/FFCDD2/B71C1C?text=Image+Error";

const ServiceImageDisplay = ({ media, title }) => {
  let imageUrl = DEFAULT_PLACEHOLDER_IMAGE;
  let imageLoadError = false;

  if (
    media?.length > 0 &&
    typeof media[0] === "string" &&
    media[0].trim() !== ""
  ) {
    let imagePath = media[0].trim();
    // Normalize path by removing leading slash if present, as it will be added later
    imagePath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;

    if (imagePath.toLowerCase().startsWith("uploads/")) {
      // Handles paths like "uploads/services/filename.jpg" or "uploads/others/filename.jpg"
      // Prepends domain and /api/
      imageUrl = `${API_DOMAIN_FOR_IMAGES}/api/${imagePath}`;
    } else if (imagePath.includes("/")) {
      // Handles paths like "services/filename.jpg" or "others/filename.jpg"
      // Prepends domain and /api/uploads/
      imageUrl = `${API_DOMAIN_FOR_IMAGES}/api/uploads/${imagePath}`;
    } else if (imagePath) {
      // Handles just "filename.jpg" - assumes it's for a service and belongs in 'services' subfolder
      imageUrl = `${API_DOMAIN_FOR_IMAGES}/api/uploads/services/${imagePath}`;
    }
    // console.log(`ServiceImageDisplay: Original Path='${media[0]}', Constructed URL='${imageUrl}'`);
  }

  const handleImageError = (e) => {
    console.warn(
      `Failed to load image: ${e.target.src}. Falling back to error placeholder.`
    );
    e.target.src = ERROR_PLACEHOLDER_IMAGE; // Fallback image on error
    imageLoadError = true; // You could use this to show an error message
  };

  // console.log(imageUrl);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.default", // Use theme background
        border: (theme) => `1px solid ${theme.palette.divider}`, // Subtle border
      }}
    >
      <CardMedia
        component="img"
        image={imageUrl}
        alt={title || "Service main image"}
        sx={{
          width: "100%",
          height: { xs: 125, sm: 175, md: 225, lg: 250 }, // Adjusted heights
          objectFit: "contain", //fill, cover,  scale-down
          borderRadius: 1.5, // Consistent with Paper's inner content
          bgcolor: "grey.200", // Background for loading or if image fails
          display: "block", // Ensure it's a block element
        }}
        onError={handleImageError}
      />
      {/* You could conditionally render an error message based on a state variable if needed */}
    </Paper>
  );
};

export default ServiceImageDisplay;

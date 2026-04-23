// src/components/Services/ServiceCard.jsx
/* eslint-disable react/prop-types */
import {
  CardContent,
  CardMedia,
  Card,
  // Grid,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
  Tooltip,
  Divider,
  Avatar,
} from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { IconHeart } from "@tabler/icons-react";
import BusinessIcon from "@mui/icons-material/Business";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LocalOfferIcon from "@mui/icons-material/LocalOffer"; // For special offer badge
import PeopleIcon from "@mui/icons-material/People"; // For community badge

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
const DEFAULT_CARD_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/EEE/31343C?text=Service";
const ERROR_CARD_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/FFCDD2/B71C1C?text=Image+Error";

// --- Sub-component for Provider Info ---
const ProviderSnippet = ({ provider }) => {
  if (!provider || !provider._id) {
    return null;
  }

  const isAgency = provider.accountType === "agency";
  const displayName = isAgency
    ? provider.companyName || provider.representativeName || "Service Provider"
    : provider.name || "Service Provider";

  let avatarSrc;
  if (provider.profilePicture && typeof provider.profilePicture === "string") {
    let path = provider.profilePicture.trim();
    path = path.startsWith("/") ? path.substring(1) : path;

    if (path.toLowerCase().startsWith("uploads/")) {
      avatarSrc = `${API_DOMAIN_FOR_IMAGES}/api/${path}`;
    } else if (path.includes("/")) {
      avatarSrc = `${API_DOMAIN_FOR_IMAGES}/api/uploads/${path}`;
    } else if (path) {
      avatarSrc = `${API_DOMAIN_FOR_IMAGES}/api/uploads/profile_pictures/${path}`;
    }
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={0.75}
      sx={{ mb: 1.5, mt: 0.5 }}
    >
      <Avatar
        src={avatarSrc}
        alt={`${displayName} avatar`}
        sx={{
          width: 32,
          height: 32,
          fontSize: "1rem",
          bgcolor: "action.selected",
        }}
      >
        {!avatarSrc &&
          (isAgency ? (
            <BusinessIcon sx={{ fontSize: "1.25rem" }} />
          ) : (
            <AccountCircleIcon sx={{ fontSize: "1.25rem" }} />
          ))}
      </Avatar>
      <Typography
        variant="body2"
        color="text.secondary"
        component={RouterLink}
        to={`/provider/profile/${provider._id}`}
        sx={{
          textDecoration: "none",
          "&:hover": { textDecoration: "underline", color: "primary.dark" },
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          fontSize: "0.875rem", // Explicitly set font size for clarity
        }}
        title={displayName}
      >
        {displayName}
        {provider.isVerified && (
          <Tooltip title="Verified Provider" arrow placement="top">
            <VerifiedUserIcon color="success" sx={{ fontSize: 14, ml: 0.5 }} />
          </Tooltip>
        )}
      </Typography>
    </Box>
  );
};

const ServiceCard = ({ service, category, subcategory, isSpecial: isSpecialProp, specialOffer: specialOfferProp }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isSpecial = isSpecialProp || service?.isSpecial;
  const specialOffer = specialOfferProp || (service?.specialOffer && typeof service.specialOffer === 'object' ? service.specialOffer : null);

  // --- URL Construction Logic ---
  let detailUrl = "/service-not-found"; // Ultimate fallback if critical info is missing

  // Determine effective category and subcategory for URL construction
  // Prioritize props, then data from the service object itself.
  const effectiveCategory = category || service?.category;
  const effectiveSubcategory = subcategory || service?.subcategory;

  if (service?._id) {
    // Ensure category and subcategory always have a value for URL construction
    const finalCategory = effectiveCategory || "N/A";
    const finalSubcategory = effectiveSubcategory || "N/A";

    detailUrl = `/${encodeURIComponent(finalCategory)}/${encodeURIComponent(
      finalSubcategory
    )}/${service._id}`;
  }
  // --- End URL Construction ---

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const formatPriceRate = (priceType) => {
    if (!priceType) return "";
    if (priceType.toLowerCase() === "per hour") return "/hr";
    if (priceType.toLowerCase() === "per project") return "/project";
    return `/${priceType.toLowerCase().replace("_", " ")}`;
  };

  const getServiceDeliveryText = (type) => {
    if (!type) return null;
    switch (type.toLowerCase()) {
      case "on-site":
        return "On-Site";
      case "remote":
        return "Remote";
      case "other":
        return "Flexible";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const deliveryText = getServiceDeliveryText(service?.type);

  let cardImageUrl = DEFAULT_CARD_PLACEHOLDER_IMAGE;
  if (
    service?.media?.length > 0 &&
    service.media[0] &&
    typeof service.media[0] === "string"
  ) {
    let imagePath = service.media[0].trim();
    imagePath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;

    if (imagePath.toLowerCase().startsWith("uploads/")) {
      cardImageUrl = `${API_DOMAIN_FOR_IMAGES}/api/${imagePath}`;
    } else if (imagePath.includes("/")) {
      cardImageUrl = `${API_DOMAIN_FOR_IMAGES}/api/uploads/${imagePath}`;
    } else if (imagePath) {
      cardImageUrl = `${API_DOMAIN_FOR_IMAGES}/api/uploads/services/${imagePath}`;
    }
  }

  const handleImageError = (e) => {
    console.warn(
      `Failed to load card image: ${e.target.src}. Using placeholder.`
    );
    e.target.src = ERROR_CARD_PLACEHOLDER_IMAGE;
  };

  if (!service || !service._id) {
    return null;
  }

  return (
    // <Grid item xs={12} sm={6} md={4} lg={4} xl={3}>
    <Card
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        borderRadius: "12px",
        transition: "all 0.25s ease-in-out",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        // width: "100%",
        transform: isHovered ? "translateY(-5px) scale(1.01)" : "none",
        boxShadow: isHovered
          ? (theme) => theme.shadows[10]
          : (theme) => theme.shadows[2],
      }}
    >
      {(isSpecial || service?.isCommunity) && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 0.5,
            pointerEvents: "none",
          }}
        >
          {service?.isCommunity && (
            <Chip
              label="Community Offer"
              size="small"
              icon={<PeopleIcon sx={{ fontSize: "0.9rem !important", color: "white !important" }} />}
              sx={{
                backgroundColor: "#009688", // Teal
                color: "white",
                fontWeight: 700,
                fontSize: "0.65rem",
                textTransform: "uppercase",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                height: "22px",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          )}
          {isSpecial && (
            <Chip
              label="Special Deal Offer"
              size="small"
              icon={<LocalOfferIcon sx={{ fontSize: "0.9rem !important", color: "white !important" }} />}
              sx={{
                backgroundColor: "#9c27b0", // Purple
                color: "white",
                fontWeight: 700,
                fontSize: "0.65rem",
                textTransform: "uppercase",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                height: "22px",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          )}
        </Box>
      )}

      <Box
        component={RouterLink}
        to={detailUrl}
        sx={{
          overflow: "hidden",
          height: 140,
          flexShrink: 0,
          display: "block",
        }}
      >
        <CardMedia
          component="img"
          image={cardImageUrl}
          alt={service?.title || "Service Image"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease-in-out",
            transform: isHovered ? "scale(1.08)" : "scale(1)",
          }}
          onError={handleImageError}
        />
      </Box>

      <CardContent
        sx={{
          pt: 1.5,
          pb: "12px !important",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="subtitle1"
          component={RouterLink}
          to={detailUrl}
          fontWeight={600}
          title={service?.title}
          noWrap // Re-add noWrap for title
          sx={{
            color: "text.primary",
            textDecoration: "none",
            "&:hover": { color: "primary.main" },
            mb: 0.5, // Margin below title
          }}
        >
          {service?.title || "Untitled Service"}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 0.5, // Margin below chips
            alignItems: "center", // Align chips vertically
            flexWrap: "wrap", // Allow chips to wrap to the next line
          }}
        >
          {deliveryText && (
            <Chip
              label={deliveryText}
              size="small"
              variant="outlined"
              color={
                deliveryText === "On-Site"
                  ? "info"
                  : deliveryText === "Remote"
                    ? "success"
                    : "default"
              }
              sx={{
                fontWeight: 500,
                fontSize: "0.7rem",
              }}
            />
          )}
          {service?.category && (
            <Chip
              label={service.category}
              size="small"
              variant="outlined"
              color="primary"
              sx={{
                fontWeight: 500,
                fontSize: "0.7rem",
              }}
            />
          )}
          {service?.subcategory && (
            <Chip
              label={service.subcategory}
              size="small"
              variant="outlined"
              color="primary"
              sx={{
                fontWeight: 500,
                fontSize: "0.7rem",
              }}
            />
          )}
        </Box>

        {service?.createdBy && <ProviderSnippet provider={service.createdBy} />}

        <Typography
          variant="body2"
          color="text.secondary"
          title={service?.description}
          sx={{
            minHeight: "20px", // Adjusted for single line
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 1, // Changed to 1 for single line
            WebkitBoxOrient: "vertical",
            mb: 1.5,
          }}
        >
          {service?.description || "No description available."}
        </Typography>

        <Box sx={{ mt: "auto", mb: 1.5 }}>
          <Button
            component={RouterLink}
            to={detailUrl}
            variant="outlined"
            color="primary"
            size="small"
            fullWidth
          >
            View Details
          </Button>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Box
          display={"flex"}
          justifyContent={"space-between"}
          alignItems="center"
        >
          <Box display="flex" flexDirection="column">
            {isSpecial && specialOffer ? (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    textDecoration: "line-through",
                    lineHeight: 1,
                  }}
                >
                  ${Number(specialOffer.actualPrice || service?.price).toFixed(2)}
                </Typography>
                <Typography variant="h6" color="error.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  ${Number(specialOffer.sellingPrice).toFixed(2)}
                  {specialOffer.discountPercentage && (
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 1,
                        backgroundColor: "error.main",
                        color: "white",
                        px: 0.6,
                        py: 0.2,
                        borderRadius: "4px",
                        fontWeight: 800,
                        fontSize: "0.65rem",
                        lineHeight: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {specialOffer.discountPercentage}% OFF
                    </Typography>
                  )}
                  {service?.priceType && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                    >
                      {formatPriceRate(service.priceType)}
                    </Typography>
                  )}
                </Typography>
              </>
            ) : (
              <Box display="flex" alignItems="baseline">
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  From $
                  {service?.price !== undefined
                    ? Number(service.price).toFixed(2)
                    : "N/A"}
                </Typography>
                {service?.priceType && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    {formatPriceRate(service.priceType)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <Tooltip title="Add to favorites">
            <IconButton
              aria-label="add to favorites"
              size="small"
              sx={{ color: "grey.500", "&:hover": { color: "error.light" } }}
            >
              <IconHeart size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
    // </Grid>
  );
};

export default ServiceCard;

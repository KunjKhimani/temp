/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/ServiceRequestCard.jsx
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar,
  Link as MuiLink,
  Stack,
  Button,
  Divider,
  CardMedia,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CategoryIcon from "@mui/icons-material/Category";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
// import StarIcon from '@mui/icons-material/Star'; // No longer using MUI StarIcon for promoted
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People"; // For community badge
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // For completed status
import CancelIcon from "@mui/icons-material/Cancel"; // For closed/cancelled status
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"; // For open/in-progress
import LocalOfferIcon from "@mui/icons-material/LocalOffer"; // For special offer badge

import PromotedIcon from "../../assets/SpareWorkPremium2.png";
import { formatTimeAgo } from "../../utils/stringUtils"; // Import the new utility

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_CARD_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/EEE/31343C?text=Request";
const ERROR_CARD_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/FFCDD2/B71C1C?text=Image+Error";

const formatExperienceLevel = (level) => {
  if (!level || level.toLowerCase() === "any") return null;
  switch (level.toLowerCase()) {
    case "entry":
      return "Entry";
    case "intermediate":
      return "Intermediate";
    case "expert":
      return "Expert";
    case "lead":
      return "Lead";
    default:
      return level.charAt(0).toUpperCase() + level.slice(1);
  }
};

const ServiceRequestCard = ({
  request,
  isSellerView = false,
  isLoggedIn,
  isSpecial: isSpecialProp,
  specialOffer: specialOfferProp,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isSpecial = isSpecialProp || request?.isSpecial;
  const specialOffer =
    specialOfferProp ||
    (request?.specialOffer && typeof request.specialOffer === "object"
      ? request.specialOffer
      : null);

  // console.log(request.createdBy);

  if (!request) return null;

  const detailUrl = `/service-request/${request._id}`;
  const profileUrl = request.createdBy?._id
    ? `/provider/profile/${request.createdBy._id}`
    : "#";

  let cardImageUrl = DEFAULT_CARD_PLACEHOLDER_IMAGE;
  if (
    request.attachments &&
    request.attachments.length > 0 &&
    typeof request.attachments[0] === "string"
  ) {
    let firstAttachmentPath = request.attachments[0];
    firstAttachmentPath = firstAttachmentPath.replace(/^uploads\//i, "");
    cardImageUrl = `${API_DOMAIN_FOR_IMAGES}/uploads/${firstAttachmentPath}`;
  }

  const handleImageError = (e) => {
    e.target.src = ERROR_CARD_PLACEHOLDER_IMAGE;
  };
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const getBudgetText = (budget) => {
    if (!budget || budget.type === "open_to_offers") return "Open to Offers";
    if (budget.type === "fixed" && budget.max) return `$${budget.max} (Fixed)`;
    if (budget.type === "fixed" && budget.min) return `$${budget.min} (Fixed)`;
    if (budget.type === "hourly_range" && budget.min && budget.max)
      return `$${budget.min}-$${budget.max}/hr`;
    if (budget.type === "hourly_range" && budget.min)
      return `From $${budget.min}/hr`;
    if (budget.type === "hourly_range" && budget.max)
      return `Up to $${budget.max}/hr`;
    return "Offer";
  };

  const primaryOnSiteAddress =
    request.locationPreference === "on-site" &&
    request.onSiteAddresses?.length > 0
      ? request.onSiteAddresses.find((addr) => addr.isPrimary) ||
        request.onSiteAddresses[0]
      : null;

  const fullLocationText = primaryOnSiteAddress
    ? `${primaryOnSiteAddress.city}, ${primaryOnSiteAddress.country}`
    : request.locationPreference?.charAt(0).toUpperCase() +
      request.locationPreference?.slice(1);

  const locationText =
    fullLocationText && fullLocationText.length > 7
      ? `${fullLocationText.substring(0, 7)}...`
      : fullLocationText;

  const experienceText = formatExperienceLevel(request.experienceLevel);

  const fullDeliveryTimeText = request.desiredDeliveryTime;
  const deliveryTimeText =
    fullDeliveryTimeText && fullDeliveryTimeText.length > 7
      ? `${fullDeliveryTimeText.substring(0, 7)}...`
      : fullDeliveryTimeText;

  const infoItems = [
    request.budget,
    locationText,
    deliveryTimeText,
    experienceText,
  ].filter(Boolean); // Filter out null/undefined values
  const stackDirection = infoItems.length > 2 ? "column" : "row";
  const stackFlexWrap = infoItems.length > 2 ? "nowrap" : "wrap";

  const getStatusChipProps = (status) => {
    let label = status
      .replace(/_/g, " ")
      .replace(/^\w|(\s\w)/g, (c) => c.toUpperCase());
    let color = "default";
    let icon = null;

    switch (status) {
      case "open":
        color = "primary";
        icon = <HourglassEmptyIcon />;
        break;
      case "in-discussion":
      case "offer_accepted":
      case "scheduled":
      case "in_progress":
      case "pending_completion_approval":
        color = "info";
        icon = <HourglassEmptyIcon />;
        break;
      case "completed":
        color = "success";
        icon = <CheckCircleIcon />;
        break;
      case "closed":
      case "expired":
      case "cancelled_by_buyer":
      case "cancelled_by_system":
        color = "error";
        icon = <CancelIcon />;
        break;
      default:
        color = "default";
        break;
    }
    return { label, color, icon };
  };

  const statusChipProps = getStatusChipProps(request.status);
  return (
    <Card
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        borderRadius: "12px",
        transition: "all 0.25s ease-in-out",
        position: "relative",
        overflow: "visible", // Changed back to visible to allow some overlap if needed
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        transform: isHovered ? "translateY(-5px) scale(1.01)" : "none",
        boxShadow: isHovered
          ? (theme) => theme.shadows[4]
          : (theme) => theme.shadows[1],
        border: isHovered ? "1px solid #ddd" : "1px solid transparent",
      }}
    >
      {(request.isCommunity || isSpecial) && (
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
          {request.isCommunity && (
            <Chip
              label="Community Offer"
              size="small"
              icon={
                <PeopleIcon
                  sx={{ fontSize: "0.9rem !important", color: "white !important" }}
                />
              }
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
              label="Special Deal Request"
              size="small"
              icon={
                <LocalOfferIcon
                  sx={{ fontSize: "0.9rem !important", color: "white !important" }}
                />
              }
              sx={{
                backgroundColor: "#ff5722", // Deep Orange
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
          height: 160,
          flexShrink: 0,
          display: "block",
          textDecoration: "none",
        }}
      >
        <CardMedia
          component="img"
          image={cardImageUrl}
          alt={request.title || "Service Request Image"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease-in-out",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
            borderBottom: "1px solid #eee",
          }}
          onError={handleImageError}
        />
      </Box>

      <CardContent
        sx={{
          pt: 1,
          pb: "10px !important",
          px: 1.5,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start", // Changed to flex-start for better alignment with multi-line titles
            mb: 0.5,
            gap: 0.5,
          }}
        >
          {" "}
          {/* Added gap */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minHeight: "2.4em",
              lineHeight: "1.2em", // Ensures consistent height for title area
              flexGrow: 1, // Allow title to take available space
            }}
            title={request.title}
          >
            <MuiLink
              component={RouterLink}
              to={detailUrl}
              underline="hover"
              color="inherit"
            >
              {request.title}
            </MuiLink>
          </Typography>
          {request.promotionDetails?.isPromoted && (
            <Tooltip title="Promoted Request" placement="top" arrow>
              {/* Use the imported SVG component */}
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  mt: "2px" /* Align with first line of title */,
                }}
              >
                {/* <PromotedIcon style={{ width: "20px", height: "20px" }} /> */}
                <img
                  src={PromotedIcon}
                  alt="Promoted"
                  style={{ width: "40px", height: "40px" }}
                />
                {/* If using an <img> tag because import gives URL:
                 */}
              </Box>
            </Tooltip>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          mb={1}
          flexWrap="wrap"
        >
          {/* Display Status Chip - Moved to first position and changed to contained variant */}
          <Chip
            icon={statusChipProps.icon}
            label={statusChipProps.label}
            color={statusChipProps.color}
            size="small"
            variant="contained"
            sx={{ mr: 0.5, mb: 0.5, fontSize: "0.7rem" }}
          />
          {request.category && (
            <Chip
              icon={<CategoryIcon sx={{ fontSize: "1rem" }} />}
              label={request.category}
              size="small"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5, fontSize: "0.7rem" }}
            />
          )}
        </Stack>

        {request.createdBy && (
          <Box sx={{ mb: 1 }}>
            {" "}
            {/* Added Box for spacing */}
            <MuiLink
              component={RouterLink}
              to={profileUrl}
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
                flexShrink: 1,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Avatar
                src={
                  request.createdBy.profilePicture
                    ? `${API_DOMAIN_FOR_IMAGES}/uploads/${request.createdBy.profilePicture.replace(
                        /^uploads\//i,
                        ""
                      )}`
                    : undefined
                }
                alt={request.createdBy.name || "User"}
                sx={{ width: 32, height: 32, mr: 1, flexShrink: 0 }}
              >
                {!request.createdBy.profilePicture && (
                  <PersonIcon fontSize="medium" />
                )}
              </Avatar>
              <Stack direction="column" sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      flexGrow: 1,
                      textOverflow: "ellipsis",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {request.createdBy.accountType === "agency"
                      ? request.createdBy.companyName || "Business"
                      : request.createdBy.name || "Individual"}
                  </Typography>
                  {request.createdBy.isVerified && (
                    <Tooltip title="Verified User" placement="top" arrow>
                      <CheckCircleIcon
                        sx={{ fontSize: 16, color: "info.main" }}
                      />
                    </Tooltip>
                  )}
                  {request.createdBy.accountType && (
                    <Chip
                      label={
                        request.createdBy.accountType === "agency"
                          ? "Agency"
                          : "Individual"
                      }
                      size="small"
                      sx={{
                        fontSize: "0.6rem",
                        height: "18px",
                        ml: 0.5,
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                        color: "text.secondary",
                      }}
                    />
                  )}
                </Box>
                {request.createdAt && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: -0.5 }}
                  >
                    Posted {formatTimeAgo(request.createdAt)}
                  </Typography>
                )}
              </Stack>
            </MuiLink>
          </Box>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap", // single-line description
            mb: 1,
            fontSize: "0.85rem",
          }}
          title={request.description}
        >
          {request.description}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }} // Stack vertically on small screens, horizontally on larger ones
          spacing={2} // Adjust spacing between the two columns
          mb={1}
          mt={0.5}
          flexWrap="wrap"
        >
          {/* First Column */}
          <Stack spacing={0.25}>
            {(request.budget || (isSpecial && specialOffer)) && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.25}
                title={isSpecial && specialOffer ? `Special Price: $${specialOffer.sellingPrice}` : `Budget: ${getBudgetText(request.budget)}`}
              >
                <AttachMoneyIcon
                  fontSize="inherit"
                  sx={{ fontSize: 16 }}
                  color="action"
                />
                {isSpecial && specialOffer ? (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "error.main",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Now: ${Number(specialOffer.sellingPrice || 0).toFixed(2)}
                      {specialOffer.discountPercentage && (
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 0.5,
                            backgroundColor: "error.main",
                            color: "white",
                            px: 0.5,
                            py: 0.1,
                            borderRadius: "3px",
                            fontWeight: 800,
                            fontSize: "0.65rem",
                            lineHeight: 1,
                            textTransform: "uppercase",
                          }}
                        >
                          {specialOffer.discountPercentage}% OFF
                        </Typography>
                      )}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        textDecoration: "line-through",
                        ml: 0.5,
                        fontSize: "0.65rem",
                      }}
                    >
                      ${Number(specialOffer.actualPrice || (request.budget?.max || request.budget?.min)).toFixed(2)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {getBudgetText(request.budget)}
                  </Typography>
                )}
              </Stack>
            )}
            {request.desiredDeliveryTime && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.25}
                title={`Delivery: ${fullDeliveryTimeText}`}
              >
                <AccessTimeIcon
                  fontSize="inherit"
                  sx={{ fontSize: 16 }}
                  color="action"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {deliveryTimeText}
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Second Column */}
          <Stack spacing={0.25}>
            {locationText && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.25}
                title={`Location: ${fullLocationText}`}
              >
                <LocationOnIcon
                  fontSize="inherit"
                  sx={{ fontSize: 16 }}
                  color="action"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {locationText}
                </Typography>
              </Stack>
            )}
            {experienceText && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.25}
                title={`Experience: ${experienceText}`}
              >
                <SchoolIcon
                  fontSize="inherit"
                  sx={{ fontSize: 16 }}
                  color="action"
                />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {experienceText}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>

        <Box>
          <Divider sx={{ my: 1 }} />
          <Stack
            direction="row"
            justifyContent="flex-end" /* Changed to flex-end as owner is moved */
            alignItems="center"
          >
            <Button
              component={RouterLink}
              to={detailUrl}
              variant="contained"
              size="small"
              sx={{ flexShrink: 0, ml: 1, fontSize: "0.7rem", py: 0.3, px: 1 }}
            >
              {isLoggedIn && isSellerView ? "View & Offer" : "View Details"}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ServiceRequestCard;

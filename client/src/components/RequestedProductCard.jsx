/* eslint-disable no-unused-vars */
// src/components/RequestedProductCard.jsx
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  Tooltip,
  Avatar,
  Link as MuiLink,
  Divider,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import InfoIcon from "@mui/icons-material/Info"; // Changed icon
import PersonIcon from "@mui/icons-material/Person"; // For requester
import CategoryIcon from "@mui/icons-material/Category";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PeopleIcon from "@mui/icons-material/People"; // For community badge
import LocalOfferIcon from "@mui/icons-material/LocalOffer"; // For special offer badge

const getApiDomainForImages = () => {
  let domain = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  if (domain.endsWith("/api"))
    domain = domain.substring(0, domain.lastIndexOf("/api"));
  else if (domain.endsWith("/api/"))
    domain = domain.substring(0, domain.lastIndexOf("/api/"));
  return domain;
};
const API_DOMAIN_FOR_IMAGES = getApiDomainForImages();
const DEFAULT_REQUESTED_PRODUCT_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/E0E0E0/757575?text=Requested+Product";
const ERROR_REQUESTED_PRODUCT_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/FFCDD2/B71C1C?text=No+Image";

const RequesterSnippet = ({ requester }) => {
  if (!requester || !requester._id) return null;

  const isAgency = requester.accountType === "agency";
  const displayName = isAgency
    ? requester.companyName || requester.representativeName || "Requester"
    : requester.name || "Requester";

  let avatarSrc;
  if (requester.profilePicture) {
    let path = requester.profilePicture.trim();
    path = path.startsWith("/") ? path.substring(1) : path;
    if (path.toLowerCase().startsWith("uploads/"))
      avatarSrc = `${API_DOMAIN_FOR_IMAGES}/api/${path}`;
    else if (path.includes("/"))
      avatarSrc = `${API_DOMAIN_FOR_IMAGES}/api/uploads/${path}`;
    else
      avatarSrc = `${API_DOMAIN_FOR_IMAGES}/api/uploads/profile_pictures/${path}`;
  }

  return (
    <MuiLink
      component={RouterLink}
      to={`/user/profile/${requester._id}`} // Assuming a user profile page
      underline="hover"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        mb: 1.5,
        mt: 0.5,
        color: "text.secondary",
      }}
    >
      <Avatar
        src={avatarSrc}
        sx={{ width: 20, height: 20, fontSize: "0.7rem" }}
      >
        {!avatarSrc && <PersonIcon sx={{ fontSize: "0.9rem" }} />}
      </Avatar>
      <Typography variant="caption" noWrap title={displayName}>
        {displayName}
        {requester.isVerified && (
          <Tooltip title="Verified User" arrow placement="top">
            <VerifiedUserIcon
              color="success"
              sx={{ fontSize: 14, ml: 0.5, verticalAlign: "middle" }}
            />
          </Tooltip>
        )}
      </Typography>
    </MuiLink>
  );
};

const RequestedProductCard = ({
  requestedProduct,
  isSpecial: isSpecialProp,
  specialOffer: specialOfferProp,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isSpecial = isSpecialProp || requestedProduct?.isSpecial;
  const specialOffer =
    specialOfferProp ||
    (requestedProduct?.specialOffer &&
    typeof requestedProduct.specialOffer === "object"
      ? requestedProduct.specialOffer
      : null);

  if (!requestedProduct || !requestedProduct._id) {
    return null;
  }

  const detailUrl = `/requested-products/${requestedProduct._id}`;

  let cardImageUrl = DEFAULT_REQUESTED_PRODUCT_PLACEHOLDER_IMAGE;
  if (
    requestedProduct.images &&
    requestedProduct.images.length > 0 &&
    typeof requestedProduct.images[0] === "string"
  ) {
    let imagePath = requestedProduct.images[0].trim();
    imagePath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
    cardImageUrl = `${API_DOMAIN_FOR_IMAGES}/api/uploads/${imagePath}`;
  }

  const handleImageError = (e) => {
    e.target.src = ERROR_REQUESTED_PRODUCT_PLACEHOLDER_IMAGE;
  };

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        transition: "all 0.25s ease-in-out",
        boxShadow: isHovered
          ? (theme) => theme.shadows[6]
          : (theme) => theme.shadows[1],
        transform: isHovered ? "translateY(-4px)" : "none",
        minWidth: "270px",
        m: 0.5, // Added margin for explicit spacing
        position: "relative", // Ensure coordinate system for absolute child
      }}
    >
      {(requestedProduct.isCommunity || isSpecial) && (
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
          {requestedProduct.isCommunity && (
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
      <CardActionArea
        component={RouterLink}
        to={detailUrl}
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            paddingTop: "75%",
          }}
        >
          <CardMedia
            component="img"
            image={cardImageUrl}
            alt={requestedProduct.name}
            onError={handleImageError}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease-in-out",
              transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
          />
        </Box>

        <CardContent
          sx={{
            pt: 1.5,
            pb: 1.5,
            px: 2,
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {requestedProduct.category && (
            <Chip
              icon={<CategoryIcon fontSize="small" />}
              label={requestedProduct.category}
              size="small"
              variant="outlined"
              color="secondary"
              sx={{
                mb: 1,
                fontSize: "0.7rem",
                textTransform: "capitalize",
                alignSelf: "flex-start",
              }}
            />
          )}
          <Typography
            gutterBottom
            variant="h6"
            component="h2"
            fontWeight={600}
            title={requestedProduct.name}
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              minHeight: "2.5em",
              lineHeight: "1.25em",
            }}
          >
            {requestedProduct.name}
          </Typography>

          {requestedProduct.requestedBy && (
            <RequesterSnippet requester={requestedProduct.requestedBy} />
          )}

          <Box sx={{ marginTop: "auto" }}>
            <Divider sx={{ my: 1 }} />
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                {isSpecial && specialOffer ? (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "error.main",
                        fontWeight: "bold",
                        fontSize: "0.95rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Now: ${Number(specialOffer.sellingPrice || 0).toFixed(2)}{" "}
                      {requestedProduct.priceUnit && `/ ${requestedProduct.priceUnit}`}
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
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        textDecoration: "line-through",
                      }}
                    >
                      Target: ${Number(specialOffer.actualPrice || requestedProduct.targetPrice).toFixed(2)}
                    </Typography>
                  </Box>
                ) : (
                  requestedProduct.targetPrice && (
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Target: ${Number(requestedProduct.targetPrice).toFixed(2)}{" "}
                      {requestedProduct.priceUnit &&
                        `/ ${requestedProduct.priceUnit}`}
                    </Typography>
                  )
                )}
                <Typography variant="subtitle2" color="text.secondary">
                  Qty: {requestedProduct.quantityRequested}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Status:{" "}
                  <Chip
                    label={requestedProduct.status}
                    size="small"
                    color={
                      requestedProduct.status === "pending"
                        ? "warning"
                        : requestedProduct.status === "fulfilled"
                        ? "success"
                        : "info"
                    }
                    sx={{ textTransform: "capitalize", height: "auto" }}
                  />
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<InfoIcon />}
                sx={{ textTransform: "none" }}
              >
                Details
              </Button>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default RequestedProductCard;

/* eslint-disable no-unused-vars */
// src/components/Product/ProductCard.jsx
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
  // Grid, // Assuming Grid item is handled by parent
  Divider,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CategoryIcon from "@mui/icons-material/Category";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LocalOfferIcon from "@mui/icons-material/LocalOffer"; // For special offer badge
import PeopleIcon from "@mui/icons-material/People"; // For community badge

// ... (getApiDomainForImages and other constants remain the same)
const getApiDomainForImages = () => {
  let domain = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  if (domain.endsWith("/api"))
    domain = domain.substring(0, domain.lastIndexOf("/api"));
  else if (domain.endsWith("/api/"))
    domain = domain.substring(0, domain.lastIndexOf("/api/"));
  return domain;
};
const API_DOMAIN_FOR_IMAGES = getApiDomainForImages();
const DEFAULT_PRODUCT_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/E0E0E0/757575?text=Product";
const ERROR_PRODUCT_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/FFCDD2/B71C1C?text=No+Image";

const SellerSnippet = ({ seller }) => {
  if (!seller || !seller._id) return null;

  const isAgency = seller.accountType === "agency";
  const displayName = isAgency
    ? seller.companyName || seller.representativeName || "Seller"
    : seller.name || "Seller";

  let avatarSrc;
  if (seller.profilePicture) {
    let path = seller.profilePicture.trim();
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
      to={`/provider/profile/${seller._id}`}
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
        {!avatarSrc && <StorefrontIcon sx={{ fontSize: "0.9rem" }} />}
      </Avatar>
      <Typography variant="caption" noWrap title={displayName}>
        {displayName}
        {seller.isVerified && (
          <Tooltip title="Verified Seller" arrow placement="top">
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

const ProductCard = ({ product, isSpecial: isSpecialProp, specialOffer: specialOfferProp }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isSpecial = isSpecialProp || product?.isSpecial;
  const specialOffer = specialOfferProp || (product?.specialOffer && typeof product.specialOffer === 'object' ? product.specialOffer : null);

  if (!product || !product._id) {
    return null;
  }

  const detailUrl = `/product/${product._id}`;

  let cardImageUrl = DEFAULT_PRODUCT_PLACEHOLDER_IMAGE;
  if (
    product.images &&
    product.images.length > 0 &&
    typeof product.images[0] === "string"
  ) {
    let imagePath = product.images[0].trim();
    imagePath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
    cardImageUrl = `${API_DOMAIN_FOR_IMAGES}/api/uploads/${imagePath}`;
  }

  const handleImageError = (e) => {
    e.target.src = ERROR_PRODUCT_PLACEHOLDER_IMAGE;
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
        position: "relative",
        boxShadow: isHovered
          ? (theme) => theme.shadows[6]
          : (theme) => theme.shadows[1],
        transform: isHovered ? "translateY(-4px)" : "none",
        width: "270px",
        m: 0.5, // Added margin for explicit spacing
      }}
    >
      {(isSpecial || product?.isCommunity) && (
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
          {product?.isCommunity && (
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

      <CardActionArea
        component={RouterLink}
        to={detailUrl}
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          textDecoration: "none",
          color: "inherit",
          // Approach 1: Add horizontal padding to CardActionArea
          // This will affect all direct children (Image Box and CardContent)
          // The image Box might need its width adjusted or negative margins
          // if you don't want the image to be padded.
          // For simplicity, often Approach 2 is preferred for CardContent.
          // Let's comment this out and use Approach 2.
          // px: 2, // Example: 16px horizontal padding
        }}
      >
        {/* Image Box - no horizontal padding from CardActionArea if you want it full width */}
        <Box
          sx={{
            position: "relative",
            width: "100%", // Takes full width of CardActionArea
            paddingTop: "75%",
          }}
        >
          <CardMedia
            component="img"
            image={cardImageUrl}
            alt={product.name}
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

        {/* CardContent will have its own padding */}
        <CardContent
          sx={{
            pt: 1.5, // 12px top padding
            pb: 1.5, // 12px bottom padding
            px: 2, // <<<--- THIS IS YOUR HORIZONTAL PADDING (16px left/right)
            // It will now work as expected because CardContent is a block
            // within the CardActionArea flow.

            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            width: "100%", // Takes full width of CardActionArea
            boxSizing: "border-box", // Ensures padding is included in width calculation
          }}
        >
          {product.category && (
            <Chip
              icon={<CategoryIcon fontSize="small" />}
              label={product.category}
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
            title={product.name}
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
            {product.name}
          </Typography>

          {product.createdBy && <SellerSnippet seller={product.createdBy} />}

          <Box sx={{ marginTop: "auto" }}>
            {" "}
            {/* Pushes to bottom */}
            <Divider sx={{ my: 1 }} />
            <Box
              display="flex"
              justifyContent="space-between"
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
                      ${Number(specialOffer.actualPrice || product?.price).toFixed(2)}
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
                    </Typography>
                  </>
                ) : (
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    ${Number(product.price).toFixed(2)}
                  </Typography>
                )}
              </Box>
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<ShoppingCartIcon />}
                sx={{ textTransform: "none" }}
              >
                {isSpecial ? "View Deal" : "View"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProductCard;

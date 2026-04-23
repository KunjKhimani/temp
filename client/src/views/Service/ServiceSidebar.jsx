/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Chip,
  Stack,
  Card,
  Avatar,
  Tooltip,
  Link as MuiLink,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import WifiIcon from "@mui/icons-material/Wifi";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import BusinessIcon from "@mui/icons-material/Business"; // Import Business icon for Agency fallback
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import EditIcon from "@mui/icons-material/Edit";
import { IconStarFilled, IconTrash } from "@tabler/icons-react";
import ServiceDescription from "./ServiceDescription";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ServiceSpecificDealModal from "../ServiceRequest/DetailPage/ServiceSpecificDealModal";
import SpecialDealPaymentModal from "../../components/SpecialDealPaymentModal";
import { showSnackbar } from "../../store/slice/snackbarSlice";
import { fetchPromotionSettings } from "../../store/thunks/adminPromotionThunk";
import { getSpecialDealActivationFee } from "../../constants/promotions";
import { specialOfferApi } from "../../services/specialOfferApi";
import { fetchServiceById } from "../../store/thunks/serviceThunks";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // Use VITE_API_BASE_URL for consistency

// Helper functions for parsing and formatting
const parseStringifiedArray = (arr) => {
  if (!arr || arr.length === 0) return [];
  try {
    return arr
      .flatMap((item) => {
        try {
          const parsed = JSON.parse(item);
          return Array.isArray(parsed) ? parsed : [item];
        } catch (e) {
          return [item];
        }
      })
      .filter(Boolean);
  } catch (e) {
    console.error("Failed to parse stringified array:", arr, e);
    return [];
  }
};

const formatExperienceLevel = (level) => {
  if (!level) return "Not specified";
  return level.charAt(0).toUpperCase() + level.slice(1).replace(/_/g, " ");
};

const formatAvailability = (type) => {
  if (!type) return "Not specified";
  switch (type) {
    case "scheduled_slots":
      return "Available by scheduled appointments";
    case "flexible":
      return "Flexible scheduling";
    case "date_range":
      return "Available within a date range";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
  }
};

// --- Internal Provider Info Snippet (Modified for Agency) ---
const ProviderInfoSnippetInternal = ({ provider }) => {
  if (!provider) return null;

  // --- Determine Display Name and Avatar details based on accountType ---
  const isAgency = provider.accountType === "agency";
  const displayName = isAgency
    ? provider.companyName || provider.representativeName || "Unnamed Agency"
    : provider.name || "Unnamed Provider";

  const avatarAlt = `${displayName} Profile`; // Use determined name for alt text

  const avatarFallbackIcon = isAgency ? (
    <BusinessIcon />
  ) : (
    <AccountCircleIcon />
  ); // Different fallback icon

  const profileLink = `/provider/profile/${provider._id}`; // Link remains the same

  // Construct Image Source URL (use BASE_URL consistently)
  const imageSrc = provider.profilePicture
    ? `${BASE_URL}/${provider.profilePicture.startsWith("uploads/") ? "" : "uploads/"
    }${provider.profilePicture}` // Handle potential leading slash differences
    : undefined;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "transparent", // Keep background transparent
        border: "none", // Keep borderless
      }}
    >
      {/* --- Avatar --- */}
      <Avatar
        src={imageSrc} // Use constructed URL
        alt={avatarAlt} // Use determined alt text
        sx={{ width: 40, height: 40, bgcolor: "grey.300" }}
      >
        {/* Fallback Icon only shows if src is invalid/missing */}
        {avatarFallbackIcon}
      </Avatar>

      {/* --- Provider Info Text --- */}
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.2 }}
        >
          Provided by
        </Typography>
        <MuiLink
          component={RouterLink}
          to={profileLink} // Use variable for link
          underline="hover"
          color="text.primary"
        >
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            noWrap // Prevent long names from breaking layout
          >
            {displayName} {/* Use determined display name */}
            <Chip
              label={isAgency ? "Agency" : "Individual"}
              size="small"
              variant="outlined"
              color={isAgency ? "info" : "default"}
              sx={{
                ml: 0.5,
                fontSize: "0.65rem",
                height: "auto",
                "& .MuiChip-label": {
                  py: "2px",
                  px: "6px",
                },
              }}
            />
            {provider.isVerified && ( // Check for verification remains the same
              <Tooltip title="Verified Provider" arrow>
                <VerifiedUserIcon color="primary" sx={{ fontSize: 16 }} />
              </Tooltip>
            )}
          </Typography>
        </MuiLink>
      </Box>
    </Card>
  );
};

// --- Main Sidebar Component ---
const ServiceSidebar = ({
  service,
  average_rating,
  review_count,
  user,
  stickyTopOffset,
  onBookOrHireClick,
  onDeleteClick,
  onLoginClick,
  onChatWithSellerClick,
  isCreator,
  isDeleting,
  isSellerVerified,
  onListServiceSpecificDealPay,
  navigate,
}) => {
  const {
    price,
    priceType,
    createdBy,
    type,
    locations,
    coreSkills,
    keyDeliverables,
    experienceLevel,
    availabilityType,
    availableTimeSlots, // Include for availability display logic
  } = service;

  const isUserSellerOfThisService =
    user?.isSeller && user?._id === createdBy?._id;
  const canUserChat = user && !isUserSellerOfThisService; // User logged in AND is NOT the seller
  const dispatch = useDispatch();
  const promotionSettings = useSelector((state) => state.adminPromotion.settings);
  const [isSpecificDealModalOpen, setIsSpecificDealModalOpen] = useState(false);
  const [isSpecificDealPaymentModalOpen, setIsSpecificDealPaymentModalOpen] =
    useState(false);
  const [pendingSpecificDealPayload, setPendingSpecificDealPayload] =
    useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleToggleSpecialStatus = async (event) => {
    if (!service?.specialOffer?._id) return;
    const newStatus = event.target.checked ? "active" : "inactive";
    setIsTogglingStatus(true);
    try {
      await specialOfferApi.toggleSpecialOfferStatus(
        service.specialOffer._id,
        newStatus
      );
      await dispatch(fetchServiceById(service._id));
      dispatch(
        showSnackbar({
          message: `Special deal set to ${newStatus} successfully.`,
          severity: "success",
        })
      );
    } catch (error) {
      console.error("Failed to toggle special offer status:", error);
      dispatch(
        showSnackbar({
          message: error?.response?.data?.message || "Failed to toggle status.",
          severity: "error",
        })
      );
    } finally {
      setIsTogglingStatus(false);
    }
  };

  useEffect(() => {
    if (!promotionSettings) {
      dispatch(fetchPromotionSettings());
    }
  }, [dispatch, promotionSettings]);

  const specialDealActivationFee = getSpecialDealActivationFee(promotionSettings);
  const resolvedSpecialDealActualPrice =
    Number(price) > 0 ? Number(price).toString() : "";

  const parsedCoreSkills = parseStringifiedArray(coreSkills);
  const parsedKeyDeliverables = parseStringifiedArray(keyDeliverables);

  const handleOpenSpecificDealModal = () => {
    setIsSpecificDealModalOpen(true);
  };

  const handleCloseSpecificDealModal = () => {
    setIsSpecificDealModalOpen(false);
  };

  const handleCloseSpecificDealPaymentModal = useCallback(() => {
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);
  }, []);

  const handleListServiceSpecificDealPay = useCallback(async (dealPayload) => {
    setPendingSpecificDealPayload(dealPayload);
    // Open payment modal after the deal form closes to prevent modal overlap race.
    setTimeout(() => {
      setIsSpecificDealPaymentModalOpen(true);
    }, 0);
  }, []);

  const handleSpecificDealPaymentConfirm = useCallback(
    async ({ paymentData, dealPayload }) => {
      const normalizedSpecialDescription = String(
        dealPayload?.specialDescription ?? dealPayload?.description ?? ""
      ).trim();

      const finalPayload = {
        isSpecial: true,
        actualPrice: Number(dealPayload?.actualPrice),
        sellingPrice: Number(dealPayload?.sellingPrice),
        specialDescription: normalizedSpecialDescription,
        specialOfferSourceId: paymentData?.sourceId,
        paymentData,
        serviceId: service?._id,
      };

      if (onListServiceSpecificDealPay) {
        await Promise.resolve(onListServiceSpecificDealPay(finalPayload));
        return;
      }

      console.log("Service special deal payment payload:", finalPayload);
      dispatch(
        showSnackbar({
          message: "Special deal payment submitted successfully.",
          severity: "success",
        })
      );
    },
    [dispatch, onListServiceSpecificDealPay, service?._id]
  );

  return (
    <Box sx={{ position: { md: "sticky" }, top: { md: stickyTopOffset } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          bgcolor: "transparent",
          border: "none",
        }}
      >
        <Stack spacing={2.5}>
          {/* Price */}
          <Box>
            {service.isSpecial && service.specialOffer ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.disabled",
                    textDecoration: "line-through",
                    lineHeight: 1,
                  }}
                >
                  ${Number(service.specialOffer.actualPrice || price).toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="h4"
                    component="p"
                    fontWeight="bold"
                    color="error.main"
                  >
                    ${Number(service.specialOffer.sellingPrice).toFixed(2)}
                  </Typography>
                  {service.specialOffer.discountPercentage && (
                    <Chip
                      label={`${service.specialOffer.discountPercentage}% OFF`}
                      size="small"
                      sx={{
                        backgroundColor: "error.main",
                        color: "white",
                        fontWeight: 800,
                        fontSize: "0.7rem",
                        borderRadius: "4px",
                        height: "22px",
                      }}
                    />
                  )}
                </Box>
              </Box>
            ) : (
              <Typography
                variant="h4"
                component="p"
                fontWeight="bold"
                color="primary.main"
              >
                ${price?.toFixed(2)}
              </Typography>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textTransform: "capitalize", mt: 0.5 }}
            >
              {priceType ? priceType.replace("_", " ") : "Per Unit"}
            </Typography>
          </Box>

          {/* Rating */}
          {average_rating !== undefined && average_rating !== null && (
            <Box display="flex" alignItems="center" gap={1}>
              <IconStarFilled style={{ color: "#ffb400" }} size={20} />
              <Typography variant="body1" fontWeight="500">
                {average_rating.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({review_count} review{review_count !== 1 ? "s" : ""})
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Provider */}
          <ProviderInfoSnippetInternal provider={createdBy} />

          {/* Type & Locations */}
          <Stack spacing={1.5}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              color="text.secondary"
            >
              {type === "on-site" ? (
                <EventSeatIcon fontSize="small" />
              ) : (
                <WifiIcon fontSize="small" />
              )}
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {type === "on-site" ? "On-site service" : "Remote service"}
              </Typography>
            </Box>
            {type === "on-site" && locations?.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight="500" gutterBottom>
                  Available Location(s):
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {locations.map((loc) => (
                    <Chip key={loc} label={loc} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
          <Divider />

          {/* New Sections */}
          {parsedCoreSkills.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Core Skills
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {parsedCoreSkills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}

          {parsedKeyDeliverables.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Key Deliverables
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {parsedKeyDeliverables.map((deliverable, index) => (
                  <Chip
                    key={index}
                    label={deliverable}
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                ))}
              </Box>
            </Box>
          )}

          {experienceLevel && (
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Experience Level
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatExperienceLevel(experienceLevel)}
              </Typography>
            </Box>
          )}

          {availabilityType && (
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Availability
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatAvailability(availabilityType)}
              </Typography>
              {availabilityType === "scheduled_slots" &&
                availableTimeSlots &&
                availableTimeSlots.length > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    (Specific time slots are available for booking.)
                  </Typography>
                )}
            </Box>
          )}
          <Divider />

          {/* Actions */}
          <Stack spacing={1.5}>
            {user && !user?.isSeller && (
              <>
                {!isSellerVerified ? (
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    size="large"
                    disabled
                    sx={{ cursor: "not-allowed" }}
                  >
                    Pending Account Verification
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={onBookOrHireClick}
                  >
                    {type === "on-site" ? "Book Now" : "Hire Now"}
                  </Button>
                )}
              </>
            )}

            {/* {canUserChat && (
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                startIcon={<ChatBubbleOutlineIcon />}
                onClick={onChatWithSellerClick}
              >
                Chat with Seller
              </Button>
            )} */}
            {isUserSellerOfThisService && (
              <>
                {service?.specialOffer && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Special Deal Status:
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={service.specialOffer.status === "active"}
                          onChange={handleToggleSpecialStatus}
                          disabled={isTogglingStatus}
                          size="small"
                          color="secondary"
                        />
                      }
                      label={service.specialOffer.status === "active" ? "ON" : "OFF"}
                      labelPlacement="start"
                      sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 700, mr: 1, color: service.specialOffer.status === "active" ? "secondary.main" : "text.secondary" } }}
                    />
                  </Box>
                )}

                {!service?.isSpecial && !service?.specialOffer && (
                  <Button
                    variant="highlighted"
                    color="secondary"
                    fullWidth
                    startIcon={<LocalOfferIcon />}
                    onClick={handleOpenSpecificDealModal}
                  >
                    Special Deals
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<IconTrash size={18} />}
                  onClick={onDeleteClick}
                >
                  Delete Service
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                  onClick={() => navigate(`/service/${service?._id}/edit`)}
                >
                  Edit Service
                </Button>
              </>
            )}
            {!user && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={onLoginClick}
              >
                Login to Book or Hire
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <ServiceSpecificDealModal
        open={isSpecificDealModalOpen}
        onClose={handleCloseSpecificDealModal}
        actionStatus={isDeleting ? "loading" : "idle"}
        onPay={handleListServiceSpecificDealPay}
        initialActualPrice={resolvedSpecialDealActualPrice}
      />

      <SpecialDealPaymentModal
        open={isSpecificDealPaymentModalOpen}
        onClose={handleCloseSpecificDealPaymentModal}
        entityId={service?._id}
        idempotencyPrefix="service-special-deal"
        dealPayload={pendingSpecificDealPayload}
        amount={specialDealActivationFee}
        onConfirmPayment={handleSpecificDealPaymentConfirm}
      />
    </Box>
  );
};

export default ServiceSidebar;

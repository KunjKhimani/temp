/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import {
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Paper,
  Stack,
  alpha, // Keep if using gradient background
} from "@mui/material";
import {
  IconEdit,
  IconTrash,
  IconUser,
  IconBuilding,
  IconRosetteDiscountCheckFilled,
  IconBriefcase, // Icon for Agency type
  IconShoppingCart, // Icon for Seller type
  IconUserCircle, // Icon for Representative
} from "@tabler/icons-react";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom"; // Import RouterLink

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const ProfileHeader = ({
  profile,
  isUserProfile,
  // onEditClick, // No longer needed as it will navigate directly
  onDeleteClick,
}) => {
  const theme = useTheme();

  // --- Determine Display Name and Avatar ---
  const isAgency = profile?.accountType === "agency";
  const isSeller = profile?.isSeller; // Check if user is a seller
  const displayName = isAgency ? profile?.companyName : profile?.name;
  const fallbackName = isAgency ? profile?.companyName : profile?.name;
  const avatarInitial = fallbackName
    ? fallbackName[0]?.toUpperCase()
    : isAgency
    ? "A"
    : "U";
  const fallbackIcon = isAgency ? (
    <IconBuilding size={50} />
  ) : (
    <IconUser size={50} />
  );

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        mb: 3,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        gap: { xs: 2, sm: 3 },
        bgcolor: "grey.50",
      }}
    >
      {/* Avatar */}
      <Avatar
        src={
          profile?.profilePicture ? `${BASE_URL}/${profile.profilePicture}` : ""
        }
        alt={fallbackName || (isAgency ? "Company Logo" : "Profile Picture")}
        sx={{
          width: { xs: 80, sm: 120 },
          height: { xs: 80, sm: 120 },
          border: `3px solid ${theme.palette.primary.main}`,
          bgcolor: "grey.300",
          fontSize: { xs: "2rem", sm: "3rem" },
        }}
      >
        {!profile?.profilePicture && (avatarInitial || fallbackIcon)}
      </Avatar>

      {/* Info & Actions */}
      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        {/* Main Name and Verification */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent={{ xs: "center", sm: "flex-start" }}
          mb={0.5} // Reduced margin bottom
        >
          <Typography variant="h5" component="h1" fontWeight="bold" noWrap>
            {displayName || (isAgency ? "Agency Profile" : "User Profile")}
          </Typography>
          {profile?.isVerified && (
            <Tooltip title="Verified Account" arrow>
              <IconRosetteDiscountCheckFilled
                size={24}
                color={theme.palette.primary.main}
              />
            </Tooltip>
          )}
          {isSeller && (
            <Chip
              // icon={<IconShoppingCart size={16} />} // Optional icon
              label="Seller"
              color="success"
              size="small"
              variant="filled" // Use filled variant
              sx={{ fontWeight: 500, padding: 0.5 }}
            />
          )}
        </Stack>

        {/* Representative Name (Styled differently) - Show only for Agency */}
        {isAgency && profile?.representativeName && (
          <Stack
            direction="row"
            spacing={0.5} // Reduced spacing
            alignItems="center"
            justifyContent={{ xs: "center", sm: "flex-start" }}
            mb={1.5} // Margin below representative name
            sx={{ color: theme.palette.text.secondary }} // Use secondary text color
          >
            <IconUserCircle size={18} /> {/* Add icon */}
            <Typography variant="body1" component="span" fontWeight={500}>
              {" "}
              {/* Slightly bolder */}
              {profile.representativeName}
            </Typography>
            <Typography variant="caption" component="span">
              {" "}
              {/* Smaller label */}
              (Representative)
            </Typography>
          </Stack>
        )}

        {/* Chips and Contact Info */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1} // Consistent spacing
          alignItems={{ xs: "center", sm: "center" }}
          justifyContent={{ xs: "center", sm: "flex-start" }}
          mb={{ xs: 2, sm: 1 }}
          flexWrap="wrap"
        >
          {/* --- Separate Chips --- */}
          {isAgency && (
            <Chip
              icon={<IconBriefcase size={16} />} // Optional icon
              label="Agency"
              color="secondary" // Use a different color for Agency type
              size="small"
              variant="outlined" // Use outlined variant
              sx={{ fontWeight: 500, padding: 0.5 }}
            />
          )}

          {!isAgency &&
            !isSeller && ( // Show 'User' chip only if not Agency and not Seller
              <Chip
                icon={<IconUser size={16} />} // Optional icon
                label="Buyer"
                color="info"
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500, padding: 0.5 }}
              />
            )}
          {/* --- End Separate Chips --- */}

          {/* Contact Info */}
          {profile?.email && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {profile.email}
            </Typography>
          )}
          {profile?.telephone && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {profile.telephone}
            </Typography>
          )}
        </Stack>

        {/* Action Buttons */}
        {isUserProfile && (
          <Stack
            direction="row"
            spacing={1}
            justifyContent={{ xs: "center", sm: "flex-start" }}
            mt={1} // Add margin top if needed
          >
            <Button
              component={RouterLink} // Use RouterLink for navigation
              to="/user/profile/edit" // Navigate to the new edit profile page
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<IconEdit size={16} />}
              sx={{ textTransform: "none" }}
            >
              Edit Profile
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<IconTrash size={16} />}
              onClick={onDeleteClick}
              sx={{ textTransform: "none" }}
            >
              Delete Account
            </Button>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default ProfileHeader;

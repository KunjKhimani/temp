import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Button,
  Chip,
  Divider,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import { Work, Verified, Star, Info } from "@mui/icons-material"; // Added Info icon for bio

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper function to get initials for Avatar
const getInitials = (name) => {
  if (!name) return "N/A";
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

function SellerUserCard({ seller }) {
  const theme = useTheme();

  if (!seller) {
    return null;
  }

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        background: "linear-gradient(to bottom, #ffffff, #f9f9ff)",
        border: "1px solid rgba(0,0,0,0.05)",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 12px 30px rgba(63, 81, 181, 0.15)",
          borderColor: theme.palette.primary.light,
        },
      }}
    >
      <Box
        sx={{
          height: 140, // Set fixed height for consistency
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #3f51b5, #7986cb)",
        }}
      >
        {seller.profilePicture ? (
          <CardMedia
            component="img"
            height="140" // Set fixed height for consistency
            image={`${API_DOMAIN_FOR_IMAGES}/uploads/${seller.profilePicture.replace(
              /^uploads\//i,
              ""
            )}`}
            alt={seller.name || seller.companyName || "Seller"}
            sx={{
              objectFit: "cover",
              width: "100%",
              transition: "transform 0.5s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
            onError={(e) => {
              e.target.src =
                "https://placehold.co/600x400/FFCDD2/B71C1C?text=Image+Error"; // Fallback image on error
            }}
          />
        ) : (
          <Box
            sx={{
              height: 140, // Set fixed height for consistency
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: "2rem",
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              {getInitials(seller.name || seller.companyName)}
            </Avatar>
          </Box>
        )}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 1,
          }}
        >
          <Chip
            label={seller.accountType}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(5px)",
              color: "white",
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          />
        </Box>
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          p: 3,
          "&:last-child": {
            pb: 3,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography
            gutterBottom
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
              gap: 0.5, // Space between name and tick
            }}
          >
            <span>{seller.name || seller.companyName || "N/A"}</span>
            {seller.isVerified && (
              <Verified
                fontSize="small"
                sx={{ color: theme.palette.info.main }} // Blue tick
              />
            )}
          </Typography>
          {seller.rating && (
            <Chip
              icon={<Star fontSize="small" />}
              label={seller.rating}
              size="small"
              sx={{
                bgcolor: theme.palette.warning.light,
                color: theme.palette.warning.contrastText,
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        {seller.bio && (
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1.5 }}>
            <Info
              fontSize="small"
              sx={{ color: theme.palette.text.secondary, mr: 1, mt: 0.2 }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flexGrow: 1 }}
            >
              {seller.bio}
            </Typography>
          </Box>
        )}

        {seller.experience && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
            <Work
              fontSize="small"
              sx={{ color: theme.palette.text.secondary, mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {seller.experience}
            </Typography>
          </Box>
        )}

        {seller.skills?.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              SKILLS
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {seller.skills.slice(0, 1).map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  sx={{
                    borderRadius: 1,
                    bgcolor: theme.palette.grey[100],
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.05)" }} />

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            component={Link}
            to={`/providers/${seller._id}`}
            variant="outlined"
            color="primary"
            size="small"
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              letterSpacing: "0.5px",
              borderWidth: 2,
              "&:hover": {
                borderWidth: 2,
                bgcolor: theme.palette.primary.light,
                color: "white",
              },
            }}
          >
            View Profile
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

SellerUserCard.propTypes = {
  seller: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    name: PropTypes.string,
    companyName: PropTypes.string,
    email: PropTypes.string,
    profilePicture: PropTypes.string,
    accountType: PropTypes.string,
    bio: PropTypes.string, // Added bio to propTypes
    experience: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    generalAreaOfService: PropTypes.string,
    isVerified: PropTypes.bool,
    rating: PropTypes.number,
  }).isRequired,
};

export default SellerUserCard;

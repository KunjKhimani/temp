import { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Stack,
  Chip,
  Divider,
  Avatar,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import WorkIcon from "@mui/icons-material/Work";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { getUserById } from "../../services/userService";
import { createConversation } from "../../services/apis"; // Import createConversation
import CardMedia from "@mui/material/CardMedia"; // Explicitly import CardMedia

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ERROR_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400/FFCDD2/B71C1C?text=Image+Error";

const SellerUserDescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatLoading, setChatLoading] = useState(false); // New state for chat button loading
  const [chatError, setChatError] = useState(null); // New state for chat button error

  useEffect(() => {
    const fetchSellerDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getUserById(id);
        setSeller(response.data.user);
      } catch (err) {
        console.error("Error fetching seller details:", err);
        setError(
          err.response?.data?.message || "Failed to fetch seller details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSellerDetails();
  }, [id]);

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

  const handleChatWithProvider = async () => {
    if (!seller || !seller._id) {
      setChatError("Seller data not available to start chat.");
      return;
    }

    setChatLoading(true);
    setChatError(null);
    try {
      const response = await createConversation({ to: seller._id });
      const conversationId = response.data.conversation._id;
      navigate(`/messages?conversationId=${conversationId}`);
    } catch (err) {
      console.error("Error creating/fetching conversation:", err);
      setChatError(
        err.response?.data?.message || "Failed to start chat with provider."
      );
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress /> <Typography ml={2}>Loading seller...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load seller: {error}.
          <Button onClick={() => navigate(-1)} sx={{ ml: 1 }}>
            Back
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!seller) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 3 }}>
          Provider not found.
          <Button onClick={() => navigate(-1)} sx={{ ml: 1 }}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <MuiLink component={RouterLink} to="/providers" color="inherit">
          Providers
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          {seller.name || seller.companyName}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Left: Profile Picture/Avatar */}
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, overflow: "hidden" }}
          >
            {seller.profilePicture ? (
              <CardMedia
                component="img"
                height="400" // Adjusted height for better display
                image={`${API_DOMAIN_FOR_IMAGES}/uploads/${seller.profilePicture.replace(
                  /^uploads\//i,
                  ""
                )}`}
                alt={seller.name || seller.companyName || "Seller Profile"}
                sx={{ objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = ERROR_PLACEHOLDER_IMAGE;
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 400, // Adjusted height
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  bgcolor: "primary.main",
                }}
              >
                <Avatar
                  sx={{
                    width: 200,
                    height: 200,
                    fontSize: "4rem",
                    bgcolor: "primary.main",
                  }}
                >
                  {getInitials(seller.name || seller.companyName)}
                </Avatar>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right: Seller Info, Services, Products */}
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {seller.name || seller.companyName || "N/A"}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {seller.accountType === "individual"
                ? "Individual Seller"
                : "Agency Seller"}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<VerifiedUserIcon fontSize="small" />}
                label={seller.isVerified ? "Verified" : "Not Verified"}
                size="small"
                color={seller.isVerified ? "success" : "error"}
                variant="outlined"
              />
              <Chip
                icon={<AccountCircleIcon fontSize="small" />}
                label={seller.isSeller ? "Seller Account" : "Buyer Account"}
                size="small"
                variant="outlined"
              />
            </Box>

            <Divider />

            {seller.bio && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  About
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {seller.bio}
                </Typography>
              </Box>
            )}

            {seller.experience && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Experience
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {seller.experience}
                </Typography>
              </Box>
            )}

            {seller.skills && seller.skills.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Skills
                </Typography>
                <Stack direction="row" flexWrap="wrap" spacing={1}>
                  {seller.skills.map((skill, index) => (
                    <Chip key={index} label={skill} variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}

            {seller.generalAreaOfService && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Area of Service
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {seller.generalAreaOfService}
                </Typography>
              </Box>
            )}

            <Divider />

            <Box>
              {chatError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {chatError}
                </Alert>
              )}
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleChatWithProvider}
                disabled={chatLoading || !seller} // Disable if seller data is not loaded
                sx={{ mt: 2 }}
              >
                {chatLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Chat with Provider"
                )}
              </Button>
            </Box>

            {/* Services Offered Section */}
            {seller.isSeller &&
              seller.services &&
              seller.services.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <WorkIcon sx={{ mr: 1 }} /> Services Offered
                  </Typography>
                  <Grid container spacing={2}>
                    {seller.services.map((service) => (
                      <Grid item xs={12} key={service._id}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="60"
                            width="60"
                            image={
                              service.image
                                ? `${API_DOMAIN_FOR_IMAGES}/uploads/${service.image.replace(
                                    /^uploads\//i,
                                    ""
                                  )}`
                                : "/src/assets/logo.png"
                            }
                            alt={service.title}
                            sx={{ objectFit: "cover", borderRadius: 1 }}
                            onError={(e) => {
                              e.target.src = ERROR_PLACEHOLDER_IMAGE;
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" component="div">
                              {service.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Category: {service.category} | Price: $
                              {service.price}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            component={RouterLink}
                            to={`/service/${service._id}`}
                          >
                            View
                          </Button>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

            {/* Products Offered Section */}
            {seller.isSeller &&
              seller.products &&
              seller.products.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <ShoppingBagIcon sx={{ mr: 1 }} /> Products Offered
                  </Typography>
                  <Grid container spacing={2}>
                    {seller.products.map((product) => (
                      <Grid item xs={12} key={product._id}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="60"
                            width="60"
                            image={
                              product.image
                                ? `${API_DOMAIN_FOR_IMAGES}/uploads/${product.image.replace(
                                    /^uploads\//i,
                                    ""
                                  )}`
                                : "/src/assets/logo.png"
                            }
                            alt={product.name}
                            sx={{ objectFit: "cover", borderRadius: 1 }}
                            onError={(e) => {
                              e.target.src = ERROR_PLACEHOLDER_IMAGE;
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" component="div">
                              {product.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Category: {product.category} | Price: $
                              {product.price}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            component={RouterLink}
                            to={`/product/${product._id}`}
                          >
                            View
                          </Button>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SellerUserDescription;

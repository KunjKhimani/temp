import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon from "@mui/icons-material/Business";
import WebIcon from "@mui/icons-material/Web";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import { getUserById } from "../../services/userService";
import { useSelector } from "react-redux";

const SellerUserDescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError("You are not authorized to view this page.");
      setLoading(false);
      return;
    }
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
  }, [id, user]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} variant="contained" sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!seller) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Alert severity="info">Seller not found.</Alert>
        <Button onClick={() => navigate(-1)} variant="contained" sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Button onClick={() => navigate(-1)} variant="outlined" sx={{ mb: 3 }}>
        Back to Seller List
      </Button>
      <Card sx={{ boxShadow: 5 }}>
        <CardMedia
          component="img"
          height="300"
          image={seller.profilePicture || "https://via.placeholder.com/300"}
          alt={seller.name || seller.companyName || "Seller Profile"}
          sx={{ objectFit: "cover" }}
        />
        <CardContent>
          <Typography variant="h4" component="div" gutterBottom>
            {seller.name || seller.companyName || "N/A"}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {seller.accountType === "individual"
              ? "Individual Seller"
              : "Agency Seller"}
          </Typography>
          <Divider sx={{ my: 2 }} />

          <List>
            <ListItem>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText primary="Email" secondary={seller.email} />
            </ListItem>
            {seller.telephone && (
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Telephone"
                  secondary={seller.telephone}
                />
              </ListItem>
            )}
            {seller.location && (
              <ListItem>
                <ListItemIcon>
                  <LocationOnIcon />
                </ListItemIcon>
                <ListItemText primary="Location" secondary={seller.location} />
              </ListItem>
            )}
            {seller.bio && (
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary="Bio" secondary={seller.bio} />
              </ListItem>
            )}
            {seller.accountType === "agency" && seller.representativeName && (
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Representative Name"
                  secondary={seller.representativeName}
                />
              </ListItem>
            )}
            {seller.accountType === "agency" && seller.website && (
              <ListItem>
                <ListItemIcon>
                  <WebIcon />
                </ListItemIcon>
                <ListItemText primary="Website" secondary={seller.website} />
              </ListItem>
            )}
            <ListItem>
              <ListItemIcon>
                <VerifiedUserIcon
                  color={seller.isVerified ? "success" : "error"}
                />
              </ListItemIcon>
              <ListItemText
                primary="Verified Status"
                secondary={seller.isVerified ? "Verified" : "Not Verified"}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText
                primary="Is Seller"
                secondary={seller.isSeller ? "Yes" : "No"}
              />
            </ListItem>
            {seller.address &&
              (seller.address.street ||
                seller.address.city ||
                seller.address.state ||
                seller.address.zip ||
                seller.address.country) && (
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Address"
                    secondary={`${
                      seller.address.street ? seller.address.street + ", " : ""
                    }${seller.address.city ? seller.address.city + ", " : ""}${
                      seller.address.state ? seller.address.state + " " : ""
                    }${seller.address.zip ? seller.address.zip + ", " : ""}${
                      seller.address.country || ""
                    }`}
                  />
                </ListItem>
              )}
          </List>

          {seller.documents && seller.documents.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Documents
              </Typography>
              <List dense>
                {seller.documents.map((doc, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <Button
                        variant="outlined"
                        size="small"
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.type}
                      secondary={`Uploaded: ${new Date(
                        doc.uploadedAt
                      ).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SellerUserDescription;

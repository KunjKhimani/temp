import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Pagination,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  getVerifiedSellerUsersAdmin,
  getUnverifiedSellersAdmin,
} from "../../services/userService";
import { useSelector } from "react-redux";

const SellerUsersPage = () => {
  const [verifiedSellers, setVerifiedSellers] = useState([]);
  const [unverifiedSellers, setUnverifiedSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0 for Verified, 1 for Unverified

  const [verifiedPagination, setVerifiedPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [unverifiedPagination, setUnverifiedPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError("You are not authorized to view this page.");
      setLoading(false);
      return;
    }
    fetchSellers(tabValue);
  }, [tabValue, verifiedPagination.page, unverifiedPagination.page, user]);

  const fetchSellers = async (currentTabValue) => {
    setLoading(true);
    setError(null);
    try {
      if (currentTabValue === 0) {
        const response = await getVerifiedSellerUsersAdmin({
          page: verifiedPagination.page,
          limit: verifiedPagination.limit,
        });
        setVerifiedSellers(response.data.data);
        setVerifiedPagination(response.data.pagination);
      } else {
        const response = await getUnverifiedSellersAdmin({
          page: unverifiedPagination.page,
          limit: unverifiedPagination.limit,
        });
        setUnverifiedSellers(response.data.data);
        setUnverifiedPagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching seller users:", err);
      setError(err.response?.data?.message || "Failed to fetch seller users.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleVerifiedPageChange = (event, value) => {
    setVerifiedPagination((prev) => ({ ...prev, page: value }));
  };

  const handleUnverifiedPageChange = (event, value) => {
    setUnverifiedPagination((prev) => ({ ...prev, page: value }));
  };

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
      </Box>
    );
  }

  const currentSellers = tabValue === 0 ? verifiedSellers : unverifiedSellers;
  const currentPagination =
    tabValue === 0 ? verifiedPagination : unverifiedPagination;
  const handlePageChange =
    tabValue === 0 ? handleVerifiedPageChange : handleUnverifiedPageChange;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Seller Users
      </Typography>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="seller user tabs"
        sx={{ mb: 3 }}
      >
        <Tab label={`Verified Sellers (${verifiedPagination.totalItems})`} />
        <Tab
          label={`Unverified Sellers (${unverifiedPagination.totalItems})`}
        />
      </Tabs>

      {currentSellers.length === 0 ? (
        <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
          No {tabValue === 0 ? "verified" : "unverified"} seller users found.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {currentSellers.map((seller) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={seller._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: 3,
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={
                    seller.profilePicture || "https://via.placeholder.com/150"
                  }
                  alt={seller.name || seller.companyName || "Seller"}
                  sx={{ objectFit: "cover" }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {seller.name || seller.companyName || "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {seller.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Account Type: {seller.accountType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Location: {seller.location || "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified: {seller.isVerified ? "Yes" : "No"}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      component={Link}
                      to={`/admin/seller-users/${seller._id}`}
                      variant="contained"
                      color="primary"
                      size="small"
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {currentPagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={currentPagination.totalPages}
            page={currentPagination.currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default SellerUsersPage;

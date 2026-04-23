/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Pagination,
} from "@mui/material";
import {
  getVerifiedSellerUsersAdmin,
  getUnverifiedSellersAdmin,
} from "../../services/userService";
import SellerUserCard from "../../components/SellerUserCard"; // Import the new SellerUserCard component

const SellerUsersPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both verified and unverified sellers
      const verifiedResponse = await getVerifiedSellerUsersAdmin({
        page: pagination.page,
        limit: pagination.limit,
      });
      const unverifiedResponse = await getUnverifiedSellersAdmin({
        page: pagination.page,
        limit: pagination.limit,
      });

      // Combine and deduplicate sellers if necessary (assuming _id is unique)
      const combinedSellers = [
        ...verifiedResponse.data.data,
        ...unverifiedResponse.data.data,
      ].filter(
        (seller, index, self) =>
          index === self.findIndex((s) => s._id === seller._id)
      );

      // For simplicity, let's assume pagination should reflect the total of both
      // This might need adjustment based on backend API capabilities for combined fetching
      const totalItems =
        verifiedResponse.data.pagination.totalItems +
        unverifiedResponse.data.pagination.totalItems;
      const totalPages = Math.ceil(totalItems / pagination.limit);

      setSellers(combinedSellers);
      setPagination((prev) => ({
        ...prev,
        totalItems,
        totalPages,
        currentPage: pagination.page, // Ensure currentPage is set
      }));
    } catch (err) {
      console.error("Error fetching seller users:", err);
      setError(err.response?.data?.message || "Failed to fetch seller users.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchSellers();
  }, [pagination.page, fetchSellers]);

  const handlePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, page: value }));
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        All Seller Users
      </Typography>

      {sellers.length === 0 ? (
        <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
          No Providers found.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {sellers.map((seller) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={seller._id}>
              <SellerUserCard seller={seller} />
            </Grid>
          ))}
        </Grid>
      )}

      {pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
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

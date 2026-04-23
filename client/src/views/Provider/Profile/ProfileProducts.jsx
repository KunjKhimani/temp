/* eslint-disable no-unused-vars */
// src/views/Provider/Profile/ProfileProducts.jsx
/* eslint-disable react/prop-types */
import React from "react";
import { Box, Typography, Paper, Grid, Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { IconPlus, IconBuildingStore } from "@tabler/icons-react"; // Changed icon
import ProductCard from "../../Product/ProductCard";

const ProfileProducts = ({
  products = [],
  isUserProfile,
  headerTitle = "My Products", // Default title
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        bgcolor: "background.paper",
        overflow: "hidden",
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: { xs: 2, sm: 2.5 },
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconBuildingStore
            size={24}
            color="var(--mui-palette-primary-main)"
          />{" "}
          {/* Product Icon */}
          <Typography variant="h6" component="h3" fontWeight={600}>
            {headerTitle}
          </Typography>
        </Stack>
        {isUserProfile && (
          <Button
            variant="contained"
            color="primary"
            size="medium"
            startIcon={<IconPlus size={18} />}
            component={RouterLink}
            to="/seller/products/add" // Adjust if your "add product" route is different
            sx={{
              textTransform: "none",
              whiteSpace: "nowrap",
              fontWeight: 500,
              px: 2.5,
              py: 0.75,
            }}
          >
            Add New Product
          </Button>
        )}
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {products.length > 0 ? (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                {" "}
                {/* Adjust lg for 4 per row for products */}
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            fontStyle="italic"
            sx={{ py: { xs: 3, sm: 5 }, display: "block" }}
          >
            {isUserProfile
              ? "You haven't added any products yet."
              : "No products are currently listed."}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ProfileProducts;

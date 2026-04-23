/* eslint-disable react/prop-types */
import { Box, Typography, Paper, Grid, Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { IconPlus, IconTool } from "@tabler/icons-react";
import ServiceCard from "../../Service/ServiceCard";

const ProfileServices = ({
  services = [],
  isUserProfile,
  headerTitle = "Services",
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        bgcolor: "background.paper", // Use theme background
        overflow: "hidden",
        border: (theme) => `1px solid ${theme.palette.divider}`, // Softer border
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: { xs: 2, sm: 2.5 }, // Adjusted padding
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconTool size={24} color="var(--mui-palette-primary-main)" />
          <Typography variant="h6" component="h3" fontWeight={600}>
            {headerTitle}
          </Typography>
        </Stack>
        {isUserProfile && (
          <Button
            variant="contained"
            color="primary"
            size="medium" // Slightly larger for better clickability
            startIcon={<IconPlus size={18} />}
            component={RouterLink}
            to="/provider/services/add" // Ensure this route exists for adding services
            sx={{
              textTransform: "none",
              whiteSpace: "nowrap",
              fontWeight: 500,
              px: 2.5,
              py: 0.75,
            }}
          >
            Add New Service
          </Button>
        )}
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {services.length > 0 ? (
          <Grid container spacing={1.5}>
            {services.map((service) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={4}
                key={service._id}
                // sx={{ minWidth: "860px" }}
              >
                {" "}
                {/* Adjusted lg for 3 per row */}
                <ServiceCard
                  service={service}
                  // Ensure ServiceCard can handle potentially missing category/subcategory names
                  category={service.category?.name || service.category || "N/A"}
                  subcategory={
                    service.subcategory?.name || service.subcategory || "N/A"
                  }
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            fontStyle="italic"
            sx={{ py: { xs: 3, sm: 5 }, display: "block" }} // More padding for empty state
          >
            {isUserProfile
              ? "You haven't added any services yet."
              : "No services are currently listed."}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ProfileServices;

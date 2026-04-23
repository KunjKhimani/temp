/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material"; // Use CardActionArea for link effect
import { Link as RouterLink } from "react-router-dom"; // Use alias
// Remove direct CSS import if possible: import "./popularCategories.css";

// Import category data (ensure path is correct)
import { categories } from "../../data/categoryData";

// --- Category Card Component ---
const CategoryCard = ({ icon: Icon, title, linkTo }) => {
  const primaryColor = "#4caf50"; // Example color, ideally use theme.palette.primary.main
  const hoverColor = "#2e7d32"; // Example darker color

  return (
    <Card
      elevation={2} // Start with subtle elevation
      sx={{
        borderRadius: 2,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)", // Slightly less lift
          boxShadow: 4, // Increase shadow on hover
        },
        height: "100%", // Ensure cards in a row have same height
        display: "flex", // Use flex for vertical alignment
        flexDirection: "column",
      }}
    >
      {/* Make the whole card clickable */}
      <CardActionArea
        component={RouterLink} // Use RouterLink for navigation
        to={linkTo}
        sx={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1, // Allow CardActionArea to grow
          justifyContent: "center", // Center content vertically within the action area
          p: 2, // Add padding to the action area
        }}
      >
        {/* Icon Area */}
        <Box sx={{ textAlign: "center", mb: 1.5, color: primaryColor }}>
          <Icon size={45} /> {/* Slightly smaller icon */}
        </Box>

        {/* Title Area */}
        <CardContent
          sx={{
            textAlign: "center",
            p: 0,
            pt: 1,
            borderTop: `1px solid ${primaryColor}`,
          }}
        >
          <Typography
            variant="body1" // Use body1 for slightly larger text
            sx={{
              fontWeight: 500,
              color: "text.primary", // Use theme text color
              transition: "color 0.2s ease",
              // Hover effect handled by CardActionArea, text color change might be redundant/distracting
              // "&:hover": { color: hoverColor },
              lineHeight: 1.3, // Adjust line height if titles wrap
            }}
          >
            {title}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

// --- Main Popular Categories Component ---
export default function PopularCategories() {
  return (
    <Box>
      {" "}
      {/* Removed extra Box wrapper and padding, handled by parent Container */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 500, // Slightly less bold
          color: "text.primary",
          mb: 4, // Margin bottom
          // textAlign: 'center' // Center title if desired
        }}
      >
        Explore Popular Categories
      </Typography>
      <Grid container spacing={3}>
        {" "}
        {/* Consistent spacing */}
        {/* Define the specific categories to display */}
        {(() => {
          const desiredCategories = [
            "Graphics & Design",
            "Furniture/Equipment Assembly",
            "Cleaning",
            "Programming & Tech",
            "Installation & Mounting", // Updated category name
            "Handyman",
            "Personal Development & Growth",
          ];
          return categories
            .filter((category) => desiredCategories.includes(category.name))
            .map((category) => (
              <Grid item xs={6} sm={4} md={3} key={category.name}>
                {" "}
                {/* Adjusted grid points for better responsiveness */}
                {/* Removed Link wrapper, CardActionArea handles it */}
                <CategoryCard
                  icon={category.icon}
                  title={category.name}
                  linkTo={`/category/${encodeURIComponent(category.name)}`} // Encode category name for URL
                />
              </Grid>
            ));
        })()}
      </Grid>
    </Box>
  );
}

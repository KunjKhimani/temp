/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

const CategoryIntro = ({ name, description, image, sx }) => {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "150px",
        height: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        textAlign: "center",
        backgroundImage: image ? `url(${image})` : "none",
        backgroundColor: !image ? "grey.700" : "transparent",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        borderRadius: 2,
        ...sx,
      }}
    >
      {image && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 0,
          }}
        />
      )}
      <Box sx={{ position: "relative", zIndex: 1, padding: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", mb: 1, textTransform: "capitalize" }}
        >
          {name ? name.replace("-", " ") : "Category"}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, maxWidth: "600px", mx: "auto" }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

export default CategoryIntro;

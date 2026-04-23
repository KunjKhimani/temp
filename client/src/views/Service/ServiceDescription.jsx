/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { Paper, Typography, Divider } from "@mui/material";

const ServiceDescription = ({ description }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        bgcolor: "transparent",
        border: "none",
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight="600">
        About this service
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ whiteSpace: "pre-wrap" }}
      >
        {description || "No description provided."}
      </Typography>
    </Paper>
  );
};

export default ServiceDescription;

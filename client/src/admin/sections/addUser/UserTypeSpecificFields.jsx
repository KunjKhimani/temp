/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { TextField, Grid } from "@mui/material";

const UserTypeSpecificFields = ({ accountType, formData, handleChange }) => {
  if (accountType === "individual") {
    return (
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          id="name"
          label="Full Name"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          autoComplete="name"
        />
      </Grid>
    );
  }

  if (accountType === "agency") {
    return (
      <>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="companyName"
            label="Company Name"
            name="companyName"
            value={formData.companyName || ""}
            onChange={handleChange}
            autoComplete="organization"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            // Make representativeName optional or required based on your needs
            // required
            fullWidth
            id="representativeName"
            label="Representative Name"
            name="representativeName"
            value={formData.representativeName || ""}
            onChange={handleChange}
            autoComplete="name"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="website"
            label="Website (Optional)"
            name="website"
            value={formData.website || ""}
            onChange={handleChange}
            autoComplete="url"
          />
        </Grid>
      </>
    );
  }

  return null; // No specific fields if type isn't selected or matched
};

export default UserTypeSpecificFields;

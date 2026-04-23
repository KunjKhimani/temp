/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from "react";
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Switch, // Using Switch can look nicer than Checkbox for flags
} from "@mui/material";
import UserTypeSpecificFields from "./UserTypeSpecificFields";

const UserCreationForm = ({
  formData,
  handleChange,
  handleSubmit,
  loading,
  error,
  success,
  isEdit = false, // Added isEdit prop
}) => {
  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
      {/* <Typography variant="h6" gutterBottom>
        Create New User Account
      </Typography> */}

      {/* Feedback Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} key={`err-${error}`}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} key={`succ-${success}`}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Account Type */}
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel id="account-type-label">Account Type</InputLabel>
            <Select
              labelId="account-type-label"
              id="accountType"
              name="accountType"
              value={formData.accountType || "individual"}
              label="Account Type"
              onChange={handleChange}
            >
              <MenuItem value="individual">Individual</MenuItem>
              <MenuItem value="agency">Agency</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Common Fields - Hidden in Edit Mode */}
        {!isEdit && (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                autoComplete="email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={formData.password || ""}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </Grid>
          </>
        )}

        {/* User Type Specific Fields */}
        <UserTypeSpecificFields
          accountType={formData.accountType}
          formData={formData}
          handleChange={handleChange}
        />

        {/* Boolean Flags */}
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch
                checked={!!formData.isSeller} // Ensure boolean value
                onChange={handleChange}
                name="isSeller"
                id="isSeller"
              />
            }
            label="Is Seller?"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch
                checked={!!formData.isVerified}
                onChange={handleChange}
                name="isVerified"
                id="isVerified"
              />
            }
            label="Is Verified?"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch
                checked={!!formData.isAdmin}
                onChange={handleChange}
                name="isAdmin"
                id="isAdmin"
              />
            }
            label="Is Admin?"
          />
        </Grid>
        {/* Add other optional fields here if needed (Bio, Phone, Address etc.) */}
        {/* Example:
          <Grid item xs={12}>
            <TextField name="bio" label="Bio (Optional)" fullWidth multiline rows={3} value={formData.bio || ''} onChange={handleChange} />
          </Grid>
          */}
      </Grid>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, height: 40 }} // Fixed height for button
        disabled={loading}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : isEdit ? (
          "Update User"
        ) : (
          "Create User"
        )}
      </Button>
    </Box>
  );
};

export default UserCreationForm;

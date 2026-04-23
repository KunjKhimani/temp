/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  TextField,
  Grid,
  Typography,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Stack,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
// Using a more complete icon helper would be ideal here, like from ProfileDocuments
// For now, keeping the existing one from the snippet
import {
  FaRegFilePdf,
  FaRegFileImage,
  FaRegFileAlt,
  FaIdCard,
  FaAddressCard,
  FaCertificate,
  FaBuilding,
  FaFileInvoiceDollar,
  FaShieldAlt,
} from "react-icons/fa";

// --- Redux Imports ---
import {
  updateProfile,
  deleteDocument,
  selectUpdateLoading,
  selectDeleteDocLoading,
  selectUpdateError,
  selectDeleteDocError,
  clearProfileErrors, // Action to clear errors
} from "../../../store/slice/profileSlice"; // Adjust path

// --- Helper function for document icons (Should be consistent with other files) ---
const getDocumentIcon = (type) => {
  const lowerType = type?.toLowerCase() || "";
  if (lowerType.includes("pdf")) return <FaRegFilePdf />;
  if (
    lowerType.includes("image") ||
    lowerType.includes("jpg") ||
    lowerType.includes("png") ||
    lowerType.includes("jpeg")
  )
    return <FaRegFileImage />;
  if (
    lowerType.includes("passport") ||
    lowerType.includes("id") ||
    lowerType.includes("driving")
  )
    return <FaIdCard />;
  if (lowerType.includes("address")) return <FaAddressCard />;
  if (
    lowerType.includes("degree") ||
    lowerType.includes("certifica") ||
    lowerType.includes("qualification")
  )
    return <FaCertificate />;
  if (lowerType.includes("licence") || lowerType.includes("license"))
    return <FaBuilding />;
  if (lowerType.includes("tax")) return <FaFileInvoiceDollar />;
  if (lowerType.includes("insurance")) return <FaShieldAlt />;
  return <FaRegFileAlt />; // Default icon
};

// --- Initial State Function ---
const createInitialState = (profile = null) => ({
  name: profile?.name ?? "",
  companyName: profile?.companyName ?? "",
  representativeName: profile?.representativeName ?? "",
  website: profile?.website ?? "",
  bio: profile?.bio ?? "",
  email: profile?.email ?? "",
  telephone: profile?.telephone ?? "",
  address: {
    street: profile?.address?.street ?? "",
    city: profile?.address?.city ?? "",
    state: profile?.address?.state ?? "",
    zip: profile?.address?.zip ?? "",
    country: profile?.address?.country ?? "",
  },
});

// --- EditProfile Component ---
const EditProfile = ({ profile, isOpen, handleClose }) => {
  const dispatch = useDispatch();
  const updateLoading = useSelector(selectUpdateLoading);
  const deleteLoading = useSelector(selectDeleteDocLoading);
  const updateApiError = useSelector(selectUpdateError);
  const deleteApiError = useSelector(selectDeleteDocError);

  const isLoading = updateLoading || deleteLoading;
  const isAgency = profile?.accountType === "agency";

  const [profileData, setProfileData] = useState(() =>
    createInitialState(profile)
  );
  const [profilePicture, setProfilePicture] = useState(null);
  const [documents, setDocuments] = useState([]); // For NEW documents
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      setProfileData(createInitialState(profile));
      setProfilePicture(null);
      setDocuments([]);
      setSnackbarOpen(false);
      dispatch(clearProfileErrors()); // Clear previous errors
    }
  }, [profile, isOpen, dispatch]);

  // --- Handlers ---
  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setProfileData((prevData) => ({ ...prevData, [name]: value ?? "" }));
  }, []);

  const handleAddressChange = useCallback((event) => {
    const { name, value } = event.target;
    setProfileData((prevData) => ({
      ...prevData,
      address: { ...prevData.address, [name]: value ?? "" },
    }));
  }, []);

  const handleProfilePictureChange = useCallback((event) => {
    setProfilePicture(event.target.files?.[0] || null);
  }, []);

  const handleAddDocument = useCallback((event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const newDocuments = files.map((file) => ({ file, type: "" }));
    setDocuments((prev) => [...prev, ...newDocuments]);
    if (event.target) event.target.value = null;
  }, []);

  const handleDocumentTypeChange = useCallback((index, type) => {
    setDocuments((prev) =>
      prev.map((doc, idx) =>
        idx === index ? { ...doc, type: type ?? "" } : doc
      )
    );
  }, []);

  const handleRemoveDocument = useCallback((index) => {
    // Removes STAGED documents
    setDocuments((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleDeleteExistingDocument = useCallback(
    async (docId) => {
      if (!profile?._id || !docId) return;
      if (
        window.confirm(
          "Are you sure you want to permanently delete this document?"
        )
      ) {
        try {
          setSnackbarMessage("");
          setSnackbarOpen(false);
          await dispatch(
            deleteDocument({ userId: profile._id, docId })
          ).unwrap();
          setSnackbarMessage("Document deleted successfully!");
          setSnackbarSeverity("success");
        } catch (err) {
          setSnackbarMessage(err?.message || "Failed to delete document.");
          setSnackbarSeverity("error");
        } finally {
          setSnackbarOpen(true);
        }
      }
    },
    [dispatch, profile?._id]
  );

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleInternalClose = useCallback(() => {
    setProfilePicture(null);
    setDocuments([]);
    setSnackbarOpen(false);
    handleClose();
  }, [handleClose]);

  // Form Submission
  const handleUpdateProfile = useCallback(async () => {
    // Validation
    if (
      isAgency &&
      (!profileData.companyName || !profileData.representativeName)
    ) {
      setSnackbarMessage("Company Name and Representative Name required.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (!isAgency && !profileData.name) {
      setSnackbarMessage("Full Name is required.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (!profileData.email) {
      setSnackbarMessage("Email is required.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    const invalidNewDoc = documents.find((doc) => !doc.type);
    if (invalidNewDoc) {
      setSnackbarMessage("Please select a type for all newly added documents.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const formData = new FormData();
    // Append Text Fields
    formData.append("name", profileData.name ?? "");
    formData.append("companyName", profileData.companyName ?? "");
    formData.append("representativeName", profileData.representativeName ?? "");
    formData.append("website", profileData.website ?? "");
    formData.append("bio", profileData.bio ?? "");
    formData.append("email", profileData.email ?? "");
    formData.append("telephone", profileData.telephone ?? "");
    Object.keys(profileData.address).forEach((key) =>
      formData.append(`address[${key}]`, profileData.address[key] ?? "")
    );
    // Append Profile Picture (if changed)
    if (profilePicture) formData.append("profilePicture", profilePicture);
    // Append NEW Documents
    if (documents.length > 0) {
      documents.forEach((doc) => {
        formData.append(`documents`, doc.file);
        formData.append(`documentTypes`, doc.type); // Send types as array
      });
    }

    try {
      setSnackbarMessage("");
      setSnackbarOpen(false);
      await dispatch(
        updateProfile({ id: profile._id, data: formData })
      ).unwrap();
      setSnackbarMessage("Profile updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      handleInternalClose();
    } catch (rejectedValueOrSerializedError) {
      const errorMessage =
        rejectedValueOrSerializedError?.message || "Update failed.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  }, [
    dispatch,
    profileData,
    profilePicture,
    documents,
    profile?._id,
    isAgency,
    handleInternalClose,
  ]);

  // --- Render Logic ---
  if (!isOpen) return null;
  if (!profile && isOpen) {
    return (
      <Dialog open={isOpen} onClose={handleInternalClose}>
        <DialogContent sx={{ display: "flex", p: 4, justifyContent: "center" }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleInternalClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            textAlign: "center",
            fontWeight: "bold",
            bgcolor: "grey.50",
          }}
        >
          {isAgency ? "Edit Company Profile" : "Edit Profile"}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ p: { xs: 2, sm: 3 }, bgcolor: "grey.50" }}
        >
          {(updateApiError || deleteApiError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateApiError?.message ||
                deleteApiError?.message ||
                "An API error occurred."}
            </Alert>
          )}
          <Grid container spacing={2}>
            {" "}
            {/* Consistent Spacing */}
            {/* --- General Profile Fields --- */}
            {isAgency ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    label="Company Name"
                    name="companyName"
                    fullWidth
                    required
                    value={profileData.companyName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    label="Representative Name"
                    name="representativeName"
                    fullWidth
                    required
                    value={profileData.representativeName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    label="Company Website"
                    name="website"
                    fullWidth
                    value={profileData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    required
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    label="Full Name"
                    name="name"
                    fullWidth
                    required
                    value={profileData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    required
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                InputLabelProps={{ shrink: true }}
                label="Telephone"
                name="telephone"
                fullWidth
                value={profileData.telephone}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                size="small"
                InputLabelProps={{ shrink: true }}
                label={isAgency ? "Company Description" : "Bio"}
                name="bio"
                fullWidth
                multiline
                rows={3}
                value={profileData.bio}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </Grid>
            {/* Address Fields */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" mt={1}>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                InputLabelProps={{ shrink: true }}
                name="street"
                label="Street"
                fullWidth
                value={profileData.address.street}
                onChange={handleAddressChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                InputLabelProps={{ shrink: true }}
                name="city"
                label="City"
                fullWidth
                value={profileData.address.city}
                onChange={handleAddressChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                InputLabelProps={{ shrink: true }}
                name="state"
                label="State/Province"
                fullWidth
                value={profileData.address.state}
                onChange={handleAddressChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                InputLabelProps={{ shrink: true }}
                name="zip"
                label="Zip/Postal Code"
                fullWidth
                value={profileData.address.zip}
                onChange={handleAddressChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth disabled={isLoading} size="small">
                <InputLabel id="country-select-label">Country</InputLabel>
                <Select
                  labelId="country-select-label"
                  name="country"
                  label="Country"
                  value={profileData.address.country}
                  onChange={handleAddressChange}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value="USA">USA</MenuItem>
                  <MenuItem value="Canada">Canada</MenuItem>
                  <MenuItem value="UK">UK</MenuItem>
                  <MenuItem value="Germany">Germany</MenuItem>
                  <MenuItem value="France">France</MenuItem>
                  <MenuItem value="Australia">Australia</MenuItem>
                  <MenuItem value="Japan">Japan</MenuItem>
                  <MenuItem value="Brazil">Brazil</MenuItem>
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="South Africa">South Africa</MenuItem>
                  <MenuItem value="Nigeria">Nigeria</MenuItem>
                  <MenuItem value="Ethiopia">Ethiopia</MenuItem>
                  {/* Add more */}
                </Select>
              </FormControl>
            </Grid>
            {/* Profile Picture */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" mt={1}>
                Profile Picture
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                disabled={isLoading}
                size="small"
              >
                {profilePicture
                  ? `Selected: ${profilePicture.name}`
                  : "Change Picture"}
                <input
                  id="profile-picture-input"
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                />
              </Button>
            </Grid>
            {/* Existing Documents Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">
                Manage Existing Documents
              </Typography>
            </Grid>
            <Grid item xs={12}>
              {profile?.documents && profile.documents.length > 0 ? (
                <List
                  dense
                  sx={{
                    width: "100%",
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    mt: 1,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  {profile.documents.map((doc) => (
                    <ListItem
                      key={doc._id}
                      disablePadding
                      sx={{
                        "&:not(:last-child)": {
                          borderBottom: 1,
                          borderColor: "divider",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 35,
                          ml: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {getDocumentIcon(doc.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.type || "Document"}
                        secondary={doc.url?.split("/").pop()}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteExistingDocument(doc._id)}
                          disabled={isLoading}
                        >
                          <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, fontStyle: "italic" }}
                >
                  No existing documents found.
                </Typography>
              )}
            </Grid>
            {/* Upload New Documents Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Upload New Documents</Typography>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                disabled={isLoading}
                size="small"
              >
                Select Documents to Add
                <input
                  id="documents-input"
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleAddDocument}
                />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Max 5MB each. PDF, DOC(X), JPG, PNG.
              </Typography>
            </Grid>
            {/* Display STAGED documents */}
            {documents.map((doc, index) => (
              <Grid item xs={12} key={`new-${index}`}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    sx={{
                      flexGrow: 1,
                      wordBreak: "break-all",
                      fontSize: "0.9rem",
                    }}
                  >
                    {doc.file.name}
                  </Typography>
                  <FormControl sx={{ minWidth: 150 }} size="small" required>
                    <InputLabel id={`doc-type-label-${index}`}>
                      Type *
                    </InputLabel>
                    <Select
                      labelId={`doc-type-label-${index}`}
                      value={doc.type}
                      label="Type *"
                      onChange={(e) =>
                        handleDocumentTypeChange(index, e.target.value)
                      }
                    >
                      <MenuItem value="" disabled>
                        <em>Select Type...</em>
                      </MenuItem>
                      <MenuItem value="ID Card">ID Card</MenuItem>
                      <MenuItem value="Passport">Passport</MenuItem>
                      <MenuItem value="Driving License">
                        Driving License
                      </MenuItem>
                      <MenuItem value="Business License">
                        Business License
                      </MenuItem>
                      <MenuItem value="Tax ID">Tax ID</MenuItem>
                      <MenuItem value="Insurance">Insurance</MenuItem>
                      <MenuItem value="Degree">Degree</MenuItem>
                      <MenuItem value="Certificate">Certificate</MenuItem>
                      <MenuItem value="Qualification">Qualification</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    color="error"
                    size="small"
                    variant="text"
                    onClick={() => handleRemoveDocument(index)}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Button
            onClick={handleInternalClose}
            color="inherit"
            variant="outlined"
            disabled={isLoading}
            size="medium"
          >
            {" "}
            Cancel{" "}
          </Button>{" "}
          {/* Changed color */}
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={isLoading}
            startIcon={
              updateLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
            size="medium"
          >
            {updateLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditProfile;

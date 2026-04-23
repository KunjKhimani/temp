/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Grid,
  Snackbar,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Fade,
  Slide,
  Tooltip, // Added Tooltip for experience descriptions
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  useUpdateUserProfileMutation,
  useGetUserProfileQuery,
  useRemoveUserDocumentMutation,
} from "../../services/userApi";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import InfoIcon from "@mui/icons-material/Info"; // Added InfoIcon for tooltips
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
import { createTheme, ThemeProvider } from "@mui/material/styles";
import countries from "../../data/countries"; // Import countries data

// Custom theme with vibrant colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      paper: "#f9faff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          padding: "8px 20px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          "&:hover": {
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            "&:hover fieldset": {
              borderColor: "#3f51b5",
            },
          },
        },
      },
    },
  },
});

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

// Experience categories and their descriptions
const experienceCategories = [
  {
    value: "Entry-Level / Trainee (0-1 yrs)",
    // description: "Less than 2 years of professional experience.",
  },
  {
    value: "Junior / Associate (1-3 yrs)",
    // description: "2-5 years of professional experience.",
  },
  {
    value: "Mid-Level / Skilled (3-5 yrs)",
    // description: "5-10 years of professional experience.",
  },
  {
    value: "Senior / Supervisor (5-8 yrs)",
    // description:
    // "10-15 years of professional experience, often in a leadership role.",
  },
  {
    value: "Manager / Expert (8-12 yrs)",
    // description:
    // "15+ years of extensive experience, typically in senior leadership or executive positions.",
  },
  {
    value: "Director / Executive (12+ yrs)",
  },
];

const createInitialState = (profile = null) => ({
  name: profile?.name ?? "",
  companyName: profile?.companyName ?? "",
  representativeName: profile?.representativeName ?? "",
  stripeAccountId: profile?.stripeAccountId ?? "", // Initialize stripeAccountId
  website: profile?.website ?? "",
  bio: profile?.bio ?? "",
  email: profile?.email ?? "",
  telephone: profile?.telephone ?? "",
  experience: profile?.experience ?? "",
  skills: profile?.skills ?? [],
  generalAreaOfService: profile?.generalAreaOfService ?? "",
  address: {
    street: profile?.address?.street ?? "",
    city: profile?.address?.city ?? "",
    state: profile?.address?.state ?? "",
    zip: profile?.address?.zip ?? "",
    country: profile?.address?.country ?? "",
  },
});

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  // console.log("Redux User Object:", user);

  const {
    data: userData,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetUserProfileQuery(user?._id);

  const isAgency = userData?.user?.accountType === "agency";

  const [updateProfile, { isLoading: isUpdating, isError: updateError }] =
    useUpdateUserProfileMutation();
  const [
    removeUserDocument,
    { isLoading: isDeletingDocument, error: deleteDocumentError },
  ] = useRemoveUserDocumentMutation();

  const isLoading = isUpdating || isDeletingDocument;

  const [formData, setFormData] = useState(() =>
    createInitialState(userData?.user)
  );
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [shouldClearProfilePicture, setShouldClearProfilePicture] =
    useState(false);
  const [newDocuments, setNewDocuments] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    if (userData?.user) {
      setFormData(createInitialState(userData.user));
    }
  }, [userData]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      if (name.startsWith("address.")) {
        const addressField = name.split(".")[1];
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            [addressField]: value,
          },
        }));
      } else {
        setFormData({ ...formData, [name]: value });
      }
    },
    [formData]
  );

  const handleSkillInputChange = useCallback((event) => {
    setSkillInput(event.target.value);
  }, []);

  const handleAddSkill = useCallback(
    (event) => {
      if (event.key === "Enter" && skillInput.trim() !== "") {
        event.preventDefault();
        const newSkill = skillInput.trim();
        if (newSkill && !formData.skills.includes(newSkill)) {
          setFormData((prev) => ({
            ...prev,
            skills: [...prev.skills, newSkill],
          }));
          setSkillInput("");
        }
      }
    },
    [skillInput, formData.skills]
  );

  const handleDeleteSkill = useCallback(
    (skillToDelete) => () => {
      setFormData((prev) => ({
        ...prev,
        skills: prev.skills.filter((skill) => skill !== skillToDelete),
      }));
    },
    []
  );

  const handleProfilePictureChange = useCallback((event) => {
    setProfilePictureFile(event.target.files?.[0] || null);
    setShouldClearProfilePicture(false);
  }, []);

  const handleRemoveProfilePicture = useCallback(() => {
    if (
      window.confirm("Are you sure you want to remove your profile picture?")
    ) {
      setProfilePictureFile(null);
      setShouldClearProfilePicture(true);
    }
  }, []);

  const handleAddDocument = useCallback((event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const newDocs = files.map((file) => ({ file, type: "" }));
    setNewDocuments((prev) => [...prev, ...newDocs]);
    if (event.target) event.target.value = null;
  }, []);

  const handleDocumentTypeChange = useCallback((index, type) => {
    setNewDocuments((prev) =>
      prev.map((doc, idx) =>
        idx === index ? { ...doc, type: type ?? "" } : doc
      )
    );
  }, []);

  const handleRemoveDocument = useCallback((index) => {
    setNewDocuments((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleDeleteExistingDocument = useCallback(
    async (docId) => {
      if (!user?._id || !docId) return;
      if (
        window.confirm(
          "Are you sure you want to permanently delete this document?"
        )
      ) {
        try {
          setSnackbarMessage("");
          setSnackbarOpen(false);
          await removeUserDocument({ userId: user._id, docId }).unwrap();
          setSnackbarMessage("Document deleted successfully!");
          setSnackbarSeverity("success");
          refetchProfile();
        } catch (err) {
          setSnackbarMessage(
            err?.data?.message || err?.message || "Failed to delete document."
          );
          setSnackbarSeverity("error");
        } finally {
          setSnackbarOpen(true);
        }
      }
    },
    [user?._id, removeUserDocument, refetchProfile]
  );

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isAgency && (!formData.companyName || !formData.representativeName)) {
      setSnackbarMessage("Company Name and Representative Name required.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (!isAgency && !formData.name) {
      setSnackbarMessage("Full Name is required.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (!formData.email) {
      setSnackbarMessage("Email is required.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    const invalidNewDoc = newDocuments.find((doc) => !doc.type);
    if (invalidNewDoc) {
      setSnackbarMessage("Please select a type for all newly added documents.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const dataToUpdate = new FormData();
    dataToUpdate.append("name", formData.name);
    dataToUpdate.append("companyName", formData.companyName);
    dataToUpdate.append("representativeName", formData.representativeName);
    dataToUpdate.append("website", formData.website);
    dataToUpdate.append("bio", formData.bio);
    // dataToUpdate.append("email", formData.email);
    dataToUpdate.append("telephone", formData.telephone);
    dataToUpdate.append("experience", formData.experience);
    dataToUpdate.append("generalAreaOfService", formData.generalAreaOfService);
    if (userData?.user?.isSeller) {
      dataToUpdate.append("stripeAccountId", formData.stripeAccountId);
    }

    formData.skills.forEach((skill) => {
      dataToUpdate.append("skills[]", skill);
    });

    Object.keys(formData.address).forEach((key) => {
      dataToUpdate.append(`address[${key}]`, formData.address[key]);
    });

    if (profilePictureFile) {
      dataToUpdate.append("profilePicture", profilePictureFile);
    } else if (shouldClearProfilePicture) {
      dataToUpdate.append("profilePicture", "");
    }

    if (newDocuments.length > 0) {
      newDocuments.forEach((doc) => {
        dataToUpdate.append(`documents`, doc.file);
        dataToUpdate.append(`documentTypes`, doc.type);
      });
    }

    try {
      setSnackbarMessage("");
      setSnackbarOpen(false);
      await updateProfile({ id: user._id, data: dataToUpdate }).unwrap();
      setSnackbarMessage("Profile updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setProfilePictureFile(null);
      setNewDocuments([]);
      setShouldClearProfilePicture(false); // Reset after successful update
      refetchProfile();
    } catch (err) {
      const errorMessage =
        err?.data?.message || err?.message || "Update failed.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  if (isProfileLoading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (profileError) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading profile:{" "}
          {profileError.message || "An unknown error occurred"}
        </Alert>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Slide in direction="up" timeout={500}>
          <Paper
            sx={{
              p: { xs: 2, md: 4 },
              background: "linear-gradient(to bottom right, #f9faff, #ffffff)",
              border: "1px solid #e0e0ff",
            }}
          >
            <Box
              sx={{
                textAlign: "center",
                mb: 4,
                background: "linear-gradient(45deg, #3f51b5, #5c6bc0)",
                color: "white",
                py: 3,
                borderRadius: "12px 12px 0 0",
                mx: -4,
                mt: -4,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: "linear-gradient(90deg, #ff4081, #3f51b5)",
                },
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  letterSpacing: "0.5px",
                }}
              >
                {isAgency ? "Edit Agency Profile" : "Edit Your Profile"}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Complete your professional profile to stand out
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Profile Picture Section */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      border: "2px dashed #e0e0ff",
                      backgroundColor: "rgba(63, 81, 181, 0.03)",
                      textAlign: "center",
                      py: 3,
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{ position: "relative", display: "inline-block" }}
                      >
                        {userData?.user?.profilePicture &&
                          !profilePictureFile && (
                            <Avatar
                              src={`${
                                import.meta.env.VITE_API_BASE_URL ||
                                "http://localhost:5000/api"
                                }/${userData.user.profilePicture}`}
                              alt="Profile"
                              sx={{
                                width: 120,
                                height: 120,
                                mx: "auto",
                                boxShadow: "0 4px 10px rgba(63, 81, 181, 0.3)",
                                border: "3px solid white",
                              }}
                            />
                          )}
                        {!userData?.user?.profilePicture &&
                          !profilePictureFile && (
                            <Avatar
                              sx={{
                                width: 120,
                                height: 120,
                                mx: "auto",
                                bgcolor: "primary.main",
                                fontSize: "3rem",
                              }}
                            >
                              {formData.name.charAt(0)}
                            </Avatar>
                          )}
                        {profilePictureFile && (
                          <CardMedia
                            component="img"
                            image={URL.createObjectURL(profilePictureFile)}
                            alt="Preview"
                            sx={{
                              width: 120,
                              height: 120,
                              mx: "auto",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "3px solid white",
                              boxShadow: "0 4px 10px rgba(63, 81, 181, 0.3)",
                            }}
                          />
                        )}
                        <IconButton
                          color="primary"
                          component="label"
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            bgcolor: "white",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                            "&:hover": {
                              bgcolor: "primary.light",
                              color: "white",
                            },
                          }}
                        >
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                          />
                          <AddIcon />
                        </IconButton>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          Profile Photo
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ mb: 2 }}
                        >
                          Recommended size: 500x500px
                        </Typography>
                        {profilePictureFile && (
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => setProfilePictureFile(null)}
                            sx={{ mr: 1 }}
                          >
                            Cancel
                          </Button>
                        )}
                        {(userData?.user?.profilePicture ||
                          profilePictureFile) && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={handleRemoveProfilePicture}
                            >
                              Remove
                            </Button>
                          )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Personal Information Section */}
                <Grid item xs={12}>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 2,
                      fontWeight: 700,
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      "&::after": {
                        content: '""',
                        flex: 1,
                        ml: 2,
                        height: "1px",
                        backgroundColor: "#e0e0ff",
                      },
                    }}
                  >
                    <span>Personal Information</span>
                  </Typography>
                </Grid>

                {/* ... existing form fields with updated styling ... */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={isAgency ? "Company Name" : "Full Name"}
                    name={isAgency ? "companyName" : "name"}
                    value={isAgency ? formData.companyName : formData.name}
                    onChange={handleChange}
                    margin="normal"
                    required
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>

                {isAgency && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Representative Name"
                        name="representativeName"
                        value={formData.representativeName}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={isLoading}
                        variant="outlined"
                        InputProps={{
                          style: {
                            borderRadius: "8px",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        margin="normal"
                        disabled={isLoading}
                        variant="outlined"
                        InputProps={{
                          style: {
                            borderRadius: "8px",
                          },
                        }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    required
                    disabled={true} // Email is not updateable
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    margin="normal"
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={4}
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>

                {/* Payout Information Section (for sellers) */}
                {user?.isSeller && (
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 2,
                        mt: 4,
                        fontWeight: 700,
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        "&::after": {
                          content: '""',
                          flex: 1,
                          ml: 2,
                          height: "1px",
                          backgroundColor: "#e0e0ff",
                        },
                      }}
                    >
                      <span>Payout Information</span>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 3 }}
                    >
                      Set up your payout account to receive payouts for your
                      services.
                    </Typography>
                    <TextField
                      fullWidth
                      label="Payout Account ID"
                      name="stripeAccountId"
                      value={formData.stripeAccountId}
                      onChange={handleChange}
                      margin="normal"
                      disabled={isLoading}
                      variant="outlined"
                      helperText="This ID is provided after you complete payout onboarding."
                      InputProps={{
                        style: {
                          borderRadius: "8px",
                        },
                      }}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      mt: 2,
                      fontWeight: 600,
                      color: "primary.main",
                    }}
                  >
                    Address Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    margin="normal"
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    margin="normal"
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    margin="normal"
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Zip/Postal Code"
                    name="address.zip"
                    value={formData.address.zip}
                    onChange={handleChange}
                    margin="normal"
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    disabled={isLoading}
                  >
                    <InputLabel id="country-label">Country</InputLabel>
                    <Select
                      labelId="country-label"
                      id="country-select"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      label="Country"
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="">
                        <em>Select Country</em>
                      </MenuItem>
                      {countries.map((country) => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Skills Section */}
                <Grid item xs={12}>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 2,
                      mt: 4,
                      fontWeight: 700,
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      "&::after": {
                        content: '""',
                        flex: 1,
                        ml: 2,
                        height: "1px",
                        backgroundColor: "#e0e0ff",
                      },
                    }}
                  >
                    <span>Skills & Expertise</span>
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    disabled={isLoading}
                  >
                    <InputLabel id="experience-label">Experience</InputLabel>
                    <Select
                      labelId="experience-label"
                      id="experience-select"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      label="Experience"
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="">
                        <em>Select Experience Level</em>
                      </MenuItem>
                      {experienceCategories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <ListItemText primary={category.value} />
                            {/* <Tooltip title={category.description} arrow>
                              <InfoIcon
                                fontSize="small"
                                sx={{ ml: 1, color: "text.secondary" }}
                              />
                            </Tooltip> */}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="General Area of Service (e.g., 'Software Development')"
                    name="generalAreaOfService"
                    value={formData.generalAreaOfService}
                    onChange={handleChange}
                    margin="normal"
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Add Skills"
                    placeholder="Type a skill and press Enter"
                    value={skillInput}
                    onChange={handleSkillInputChange}
                    onKeyDown={handleAddSkill}
                    margin="normal"
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => {
                            if (skillInput.trim()) {
                              handleAddSkill({
                                key: "Enter",
                                preventDefault: () => {},
                              });
                            }
                          }}
                          sx={{ ml: 1 }}
                        >
                          Add
                        </Button>
                      ),
                      style: {
                        borderRadius: "8px",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      mt: 2,
                      minHeight: "48px",
                      p: 2,
                      backgroundColor: "#f8f9ff",
                      borderRadius: "8px",
                      border: "1px solid #e0e0ff",
                    }}
                  >
                    {formData.skills.length > 0 ? (
                      formData.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          onDelete={
                            isLoading ? undefined : handleDeleteSkill(skill)
                          }
                          color="primary"
                          variant="outlined"
                          sx={{
                            borderRadius: "6px",
                            fontWeight: 500,
                            backgroundColor: "rgba(63, 81, 181, 0.1)",
                            "&:hover": {
                              backgroundColor: "rgba(63, 81, 181, 0.15)",
                            },
                          }}
                        />
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        Add your skills to showcase your expertise
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Documents Section */}
                <Grid item xs={12}>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 2,
                      mt: 4,
                      fontWeight: 700,
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      "&::after": {
                        content: '""',
                        flex: 1,
                        ml: 2,
                        height: "1px",
                        backgroundColor: "#e0e0ff",
                      },
                    }}
                  >
                    <span>Documents & Verification</span>
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 3 }}
                  >
                    Upload documents to verify your identity and qualifications
                  </Typography>
                </Grid>

                {/* Existing Documents */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Your Documents
                  </Typography>

                  {userData?.user?.documents?.length > 0 ? (
                    <Card
                      variant="outlined"
                      sx={{ borderRadius: "8px", mb: 3 }}
                    >
                      <List dense>
                        {userData.user.documents.map((doc) => (
                          <ListItem key={doc._id} divider>
                            <ListItemIcon sx={{ color: "primary.main" }}>
                              {getDocumentIcon(doc.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={doc.type || "Document"}
                              secondary={doc.url?.split("/").pop()}
                              primaryTypographyProps={{ fontWeight: 500 }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() =>
                                  handleDeleteExistingDocument(doc._id)
                                }
                                disabled={isLoading}
                                sx={{
                                  "&:hover": {
                                    backgroundColor: "rgba(244, 67, 54, 0.1)",
                                  },
                                }}
                              >
                                <DeleteIcon color="error" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  ) : (
                    <Card
                      sx={{
                        p: 3,
                        textAlign: "center",
                        backgroundColor: "#f9f9ff",
                        border: "1px dashed #e0e0ff",
                      }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        No documents uploaded yet
                      </Typography>
                    </Card>
                  )}
                </Grid>

                {/* New Documents Upload */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Add New Documents
                  </Typography>

                  <Button
                    variant="outlined"
                    component="label"
                    disabled={isLoading}
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      borderStyle: "dashed",
                      borderWidth: "2px",
                      py: 2,
                      backgroundColor: "rgba(63, 81, 181, 0.03)",
                      "&:hover": {
                        backgroundColor: "rgba(63, 81, 181, 0.08)",
                      },
                    }}
                    fullWidth
                  >
                    Drag & drop files or click to browse
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleAddDocument}
                    />
                  </Button>

                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ mt: 1, textAlign: "center" }}
                  >
                    Supported formats: PDF, DOC, JPG, PNG (Max 5MB each)
                  </Typography>

                  <Box sx={{ mt: 3 }}>
                    {newDocuments.map((doc, index) => (
                      <Fade in key={`new-${index}`}>
                        <Card
                          sx={{
                            mb: 2,
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            backgroundColor: "#f8f9ff",
                          }}
                        >
                          <Box sx={{ mr: 2, color: "primary.main" }}>
                            {getDocumentIcon(doc.type)}
                          </Box>
                          <Typography sx={{ flexGrow: 1 }}>
                            {doc.file.name}
                          </Typography>
                          {/* // Corrected Section */}
                          <FormControl
                            sx={{ minWidth: 180, mr: 2 }} // Increased width slightly for the label
                            size="small"
                            required
                          >
                            {/* 1. Add the InputLabel */}
                            <InputLabel id={`doc-type-label-${index}`}>
                              Doc Type
                            </InputLabel>

                            <Select
                              // 2. Add the labelId and label props
                              labelId={`doc-type-label-${index}`}
                              label="Doc Type"
                              value={doc.type}
                              displayEmpty
                              onChange={(e) =>
                                handleDocumentTypeChange(index, e.target.value)
                              }
                              sx={{ borderRadius: "6px" }}
                              disabled={isLoading} // It's safe to re-enable this now
                            >
                              {/* <MenuItem value="" disabled>
                                <em>Select Type</em>
                              </MenuItem> */}
                              {isAgency
                                ? [
                                  // Using an array is slightly cleaner than a Fragment here
                                  <MenuItem
                                    key="licence"
                                    value="Business Licence"
                                  >
                                    Business Licence
                                  </MenuItem>,
                                  <MenuItem key="tax" value="Tax ID Document">
                                    Tax ID Document
                                  </MenuItem>,
                                  <MenuItem
                                    key="insurance"
                                    value="Business Insurance"
                                  >
                                    Business Insurance
                                  </MenuItem>,
                                ]
                                : [
                                  <MenuItem key="nid" value="National ID">
                                    National ID
                                  </MenuItem>,
                                  <MenuItem key="passport" value="Passport">
                                    Passport
                                  </MenuItem>,
                                  <MenuItem key="dl" value="Driver's License">
                                    Driver's License
                                  </MenuItem>,
                                  <MenuItem
                                    key="bc"
                                    value="Birth Certificate"
                                  >
                                    Birth Certificate
                                  </MenuItem>,
                                  <MenuItem
                                    key="ub"
                                    value="Utility Bill (Address Proof)"
                                  >
                                    Utility Bill (Address Proof)
                                  </MenuItem>,
                                  <MenuItem
                                    key="bs"
                                    value="Bank Statement (Address Proof)"
                                  >
                                    Bank Statement (Address Proof)
                                  </MenuItem>,
                                  <MenuItem
                                    key="ac"
                                    value="Academic Certificate"
                                  >
                                    Academic Certificate
                                  </MenuItem>,
                                  <MenuItem
                                    key="pl"
                                    value="Professional License"
                                  >
                                    Professional License
                                  </MenuItem>,
                                  <MenuItem key="other" value="Other">
                                    Other
                                  </MenuItem>,
                                ]}
                            </Select>
                          </FormControl>
                          <Button
                            color="error"
                            size="small"
                            variant="outlined"
                            onClick={() => handleRemoveDocument(index)}
                          >
                            Remove
                          </Button>
                        </Card>
                      </Fade>
                    ))}
                  </Box>
                </Grid>
              </Grid>

              {/* Submit Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 4,
                  pt: 3,
                  borderTop: "1px solid #f0f0ff",
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    fontSize: "1rem",
                    background: "linear-gradient(45deg, #3f51b5, #5c6bc0)",
                  }}
                >
                  {isUpdating ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Save Profile"
                  )}
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate("/user/profile")}
                  sx={{ flex: 1, py: 1.5 }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        </Slide>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            variant="filled"
            sx={{
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default ProfileUpdate;

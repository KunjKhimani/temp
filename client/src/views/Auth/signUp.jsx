/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CssBaseline,
  Divider,
  FormControlLabel,
  FormLabel,
  FormControl,
  Link,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  IconButton,
  Snackbar,
  Switch,
  InputAdornment,
  Card,
  useMediaQuery,
  Toolbar,
  AppBar,
  RadioGroup,
  Radio,
  FormHelperText,
  Checkbox,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
// import { validateSignUp } from "../../utils/validation";

import { useDispatch, useSelector } from "react-redux";
import Lottie from "lottie-react";
import MovingCar from "../../assets/Moving_car.json";
import Coding from "../../assets/Coding.json";
import { Link as RouterLink } from "react-router-dom";
import { register } from "../../store/thunks/userThunks";
import LogoImage from "../../assets/logospare.png"; // Import your logo image

// --- Styled Components (Keep as they are) ---
const Container = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
}));

const MainContent = styled(Box)({
  flexGrow: 1,
  display: "flex",
  width: "100%",
});

const LeftPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  background: "linear-gradient(135deg, #007bff, #0056b3)",
  color: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  padding: theme.spacing(4),
  [theme.breakpoints.down("md")]: {
    height: "auto",
    padding: theme.spacing(2),
    minHeight: "200px",
  },
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1.25,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(4),
  overflowY: "auto",
  [theme.breakpoints.down("md")]: {
    flex: "1 1 auto",
    padding: theme.spacing(2),
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: "450px",
  padding: theme.spacing(3),
  boxShadow: theme.shadows[5],
  border: "none",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flexGrow: 1,
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));
// --- End Styled Components ---

export default function SignUp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(""); // Can be used for brief messages if needed

  // --- State for Form Fields (Keep as is) ---
  const [accountType, setAccountType] = useState("individual");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false); // New state for consent

  // --- Removed useEffect watching isLoggedIn for navigation ---
  // The navigation logic is now fully inside handleSubmit

  const handleAccountTypeChange = (event) => {
    const newType = event.target.value;
    setAccountType(newType);
    // Clear fields and errors logic (Keep as is)
    if (newType === "individual") {
      setCompanyName("");
      setRepresentativeName("");
      setErrors((prev) => ({
        ...prev,
        companyName: "",
        representativeName: "",
      }));
    } else {
      setFullName("");
      setErrors((prev) => ({ ...prev, fullName: "" }));
    }
  };

  const handleErrorClose = () => {
    setShowError(false);
    setError(null);
  };

  // --- Mock Validation Function (Keep as is) ---
  const validateSignUp = (values, type) => {
    const errors = {};
    // Common fields validation
    if (!values.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = "Email address is invalid";
    }
    if (!values.password) {
      errors.password = "Password is required";
    } else if (values.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    // Type-Specific Validation
    if (type === "individual") {
      if (!values.fullName?.trim()) errors.fullName = "Full Name is required";
    } else if (type === "agency") {
      if (!values.companyName?.trim())
        errors.companyName = "Company Name is required";
      if (!values.representativeName?.trim())
        errors.representativeName = "Representative Name is required";
    }
    // Add validation for terms agreement
    if (!values.agreedToTerms) {
      errors.agreedToTerms =
        "You must agree to the Privacy Policy and Terms of Use.";
    }
    return errors;
  };
  // --- End Mock Validation ---

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setError(null);
    setSuccessMessage(""); // Clear previous messages

    // --- Prepare form values ---
    let baseFormValues = { email, password, accountType };
    let specificValues = {};
    let validationValues = {};
    if (accountType === "individual") {
      specificValues = { username: fullName };
      validationValues = { fullName };
    } else {
      specificValues = { companyName, representativeName };
      validationValues = { companyName, representativeName };
    }

    const formValuesForSubmission = { ...baseFormValues, ...specificValues };
    const formValuesForValidation = {
      ...baseFormValues,
      ...validationValues,
      agreedToTerms, // Include the new state for validation
    };

    // --- Validation ---
    const validationErrors = validateSignUp(
      formValuesForValidation,
      accountType
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // --- Dispatch Actions ---
    try {
      console.log("Attempting registration:", formValuesForSubmission);
      const resultAction = await dispatch(register(formValuesForSubmission));

      // --- Handle Registration Result ---
      if (register.fulfilled.match(resultAction)) {
        console.log("Registration successful. Attempting automatic login...");
        console.log("Registration successful. Handling redirection...");
        // Check accountType from the payload to determine next step
        const registeredAccountType = resultAction.payload?.accountType;

        // All users should go to email verification first
        navigate("/auth/verify-email");
      } else {
        // Registration failed
        console.error("Registration failed:", resultAction);
        const errorMessage =
          resultAction.payload?.message ||
          resultAction.error?.message ||
          "Registration failed.";
        setError(errorMessage);
        setShowError(true);
      }
    } catch (error) {
      // Catch unexpected errors during dispatch/network
      console.error("Submit Error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred."
      );
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />
      <Container>
        {/* AppBar */}
        <AppBar
          position="static"
          sx={{
            backgroundColor: theme.palette.background.paper, // Or theme.palette.background.default
            borderBottom: 1, // Or "1px solid rgb(193, 189, 189)"
            borderColor: "divider",
          }}
          elevation={0} // Or 1 if you prefer a slight shadow
        >
          <Toolbar>
            <RouterLink
              to="/"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mr: 2,
              }}
            >
              <Box
                component="img"
                src={LogoImage}
                alt="SpareWork Logo"
                sx={{ height: 38, mb: 0.5 }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "light",
                  color: "primary.main",
                  mt: -1,
                  fontStyle: "italic",
                }}
              >
                Community MarketPlace!
              </Typography>
            </RouterLink>
            {/* Optional Title Text
                    <Typography variant="h6" sx={{ ml: 2, color: 'text.primary', fontWeight: 'bold' }}>
                      SpareWork
                    </Typography> */}
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <SignUpContainer>
          <LeftPanel>
            <Typography variant="h3" fontWeight={600} gutterBottom>
              Welcome to Sparework
            </Typography>
            <Typography variant="body1" maxWidth="80%">
              Connect with professionals and get the job done efficiently.
              Whether it&apos;s a service or a gig, Sparework is your go-to
              platform.
            </Typography>
            {!isMobile && (
              <Box display="flex" justifyContent="center" mt={4}>
                <div style={{ maxWidth: "350px" }}>
                  <Lottie animationData={MovingCar} loop={true} />
                </div>
                <div style={{ maxWidth: "350px" }}>
                  <Lottie animationData={Coding} loop={true} />
                </div>
              </Box>
            )}
          </LeftPanel>
          {/* Right Panel (Form) */}
          <RightPanel>
            <StyledCard variant="outlined">
              <Typography
                component="h1"
                variant="h4"
                textAlign="center"
                gutterBottom
              >
                Sign Up
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                {/* Account Type Selection */}
                <FormControl component="fieldset" error={!!errors.accountType}>
                  <FormLabel component="legend">Account Type</FormLabel>
                  <RadioGroup
                    row
                    name="accountType"
                    value={accountType}
                    onChange={handleAccountTypeChange}
                  >
                    <FormControlLabel
                      value="individual"
                      control={<Radio />}
                      label="Individual"
                      disabled={loading}
                    />
                    <FormControlLabel
                      value="agency"
                      control={<Radio />}
                      label="Agency"
                      disabled={loading}
                    />
                  </RadioGroup>
                </FormControl>
                {/* Conditional Fields */}
                {accountType === "individual" && (
                  <TextField
                    name="fullName"
                    required
                    fullWidth
                    id="fullName"
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={!!errors.fullName}
                    helperText={errors.fullName || ""}
                    disabled={loading}
                    autoComplete="name"
                    autoFocus
                  />
                )}
                {accountType === "agency" && (
                  <>
                    {" "}
                    <TextField
                      name="companyName"
                      required
                      fullWidth
                      id="companyName"
                      label="Company Name"
                      placeholder="Stark Industries"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      error={!!errors.companyName}
                      helperText={errors.companyName || ""}
                      disabled={loading}
                      autoFocus
                    />{" "}
                    <TextField
                      name="representativeName"
                      required
                      fullWidth
                      id="representativeName"
                      label="Name of Representative"
                      placeholder="Tony Stark"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                      error={!!errors.representativeName}
                      helperText={errors.representativeName || ""}
                      disabled={loading}
                    />{" "}
                  </>
                )}
                {/* Common Fields */}
                <TextField
                  name="email"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email || ""}
                  disabled={loading}
                  autoComplete="email"
                />
                <TextField
                  name="password"
                  required
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  id="password"
                  label="Password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password || ""}
                  disabled={loading}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {" "}
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          disabled={loading}
                        >
                          {" "}
                          {showPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}{" "}
                        </IconButton>{" "}
                      </InputAdornment>
                    ),
                  }}
                />
                {/* Optional Seller Switch */}
                {/* Consent Checkbox */}
                <FormControl
                  required
                  error={!!errors.agreedToTerms}
                  component="fieldset"
                  variant="standard"
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        name="agreedToTerms"
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the{" "}
                        <Link
                          component={RouterLink}
                          to="/privacy"
                          target="_blank"
                          rel="noopener"
                          sx={{ fontWeight: "bold" }}
                        >
                          Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link
                          component={RouterLink}
                          to="/terms"
                          target="_blank"
                          rel="noopener"
                          sx={{ fontWeight: "bold" }}
                        >
                          Terms of Use
                        </Link>
                      </Typography>
                    }
                  />
                  {errors.agreedToTerms && (
                    <FormHelperText error>
                      {errors.agreedToTerms}
                    </FormHelperText>
                  )}
                </FormControl>
                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 2, mb: 1 }}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  {" "}
                  {loading ? "Processing..." : "Sign Up"}{" "}
                </Button>{" "}
                {/* Changed loading text */}
                {/* Divider & Sign In Link */}
                <Divider sx={{ my: 1 }}>
                  {" "}
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {" "}
                    or{" "}
                  </Typography>{" "}
                </Divider>
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  {" "}
                  Already have an account?{" "}
                  <Link
                    component={RouterLink}
                    to="/auth/signin"
                    variant="body2"
                  >
                    {" "}
                    Sign in{" "}
                  </Link>{" "}
                </Typography>
              </Box>

              {/* Snackbars (Keep as is) */}
              <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={handleErrorClose}
                message={error}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                action={
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={handleErrorClose}
                  >
                    {" "}
                    <CloseIcon fontSize="small" />{" "}
                  </IconButton>
                }
              />
              <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage("")}
                message={successMessage}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              />
            </StyledCard>
          </RightPanel>
        </SignUpContainer>
      </Container>
    </>
  );
}

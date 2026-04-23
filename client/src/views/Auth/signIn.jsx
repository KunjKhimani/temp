/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { styled, useTheme } from "@mui/material/styles";
import ForgotPassword from "../../components/forgotPassword"; // Adjust path if needed
import Lottie from "lottie-react";
import {
  IconButton,
  Snackbar,
  InputAdornment,
  Card,
  useMediaQuery,
  CssBaseline,
  AppBar,
  Toolbar,
  // Alert, // Not directly used if navigation is immediate
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
// import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead"; // Not used in this version
import ResetPassword from "../../components/resetPassword"; // Adjust path if needed
import { useSelector, useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import MovingCar from "../../assets/Moving_car.json"; // Adjust path
import Coding from "../../assets/Coding.json"; // Adjust path
import LogoImage from "../../assets/logospare.png"; // Import your logo image
import {
  clearAuthError,
  selectAuthError,
  selectAuthLoading,
} from "../../store/slice/userSlice";
import { login, forgot } from "../../store/thunks/userThunks";

// --- Styled Components ---
const PageContainer = styled(Box)(({ theme }) => ({
  // Renamed from Container to avoid conflict
  minHeight: "100vh", // Ensure it takes at least full viewport height
  display: "flex",
  flexDirection: "column", // Stack AppBar and SignInContainer vertically
  overflow: "hidden", // Prevent scrolling on the main container
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  background: "linear-gradient(135deg, #007bff, #0056b3)", // Example gradient
  color: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  padding: theme.spacing(4),
  [theme.breakpoints.down("md")]: {
    flex: "none",
    height: "auto", // Let content dictate height
    minHeight: "30vh", // Ensure some minimum height
    padding: theme.spacing(3),
  },
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1.25,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(4),
  overflowY: "auto", // Allow scrolling for form content if needed
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down("md")]: {
    flex: "none",
    width: "100%",
    padding: theme.spacing(3),
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: "450px", // Consistent with previous working version
  padding: theme.spacing(3, 4), // Consistent padding
  boxShadow: theme.shadows[5],
  borderRadius: theme.shape.borderRadius * 2,
  overflow: "visible",
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flexGrow: 1, // Allow this container to grow and fill space below AppBar
  // height: "calc(100vh - 64px)", // Assuming AppBar height is 64px. Adjust if different.
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    height: "auto", // Let content dictate height on mobile
  },
}));
// --- End Styled Components ---

function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use specific selectors from your userSlice
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError); // This can be a string or an object

  const isMobile = useMediaQuery("(max-width:600px)"); // For Lottie and other responsive UI

  // Local state for form validation and UI
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Local state for modals
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Local state for Snackbar error display
  const [showSnackbarError, setShowSnackbarError] = useState(false);
  const [snackbarErrorMessage, setSnackbarErrorMessage] = useState("");

  const theme = useTheme();

  // Clear auth error from Redux store and local snackbar on component mount
  useEffect(() => {
    dispatch(clearAuthError());
    setShowSnackbarError(false);
    setSnackbarErrorMessage("");
  }, [dispatch]);

  // Effect to show Snackbar when authError from Redux changes
  useEffect(() => {
    if (authError) {
      // If authError is an object with a message, use that, otherwise use the string itself
      const message =
        typeof authError === "object" && authError.message
          ? authError.message
          : typeof authError === "string"
          ? authError
          : "An error occurred.";
      // Do not show snackbar if the error is specifically about email verification,
      // as we'll navigate instead.
      if (!(typeof authError === "object" && authError.emailNotVerified)) {
        setSnackbarErrorMessage(message);
        setShowSnackbarError(true);
      }
    }
  }, [authError]);

  const validateInputs = useCallback(() => {
    const emailInput = document.getElementById("email")?.value;
    const passwordInput = document.getElementById("password")?.value;
    let isValid = true;

    if (!emailInput || !/\S+@\S+\.\S+/.test(emailInput)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!passwordInput || passwordInput.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }
    return isValid;
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      dispatch(clearAuthError()); // Clear previous Redux error before new attempt
      setShowSnackbarError(false); // Clear local snackbar display

      if (validateInputs()) {
        const data = new FormData(event.currentTarget);
        const email = data.get("email");
        const password = data.get("password");
        const credentials = { email, password };

        try {
          const resultAction = await dispatch(login(credentials));

          if (login.fulfilled.match(resultAction)) {
            const responsePayload = resultAction.payload;

            if (
              typeof responsePayload !== "object" ||
              responsePayload === null
            ) {
              console.error(
                "SignIn: Fulfilled login but invalid payload:",
                responsePayload
              );
              setSnackbarErrorMessage(
                "Login failed: Unexpected server response."
              );
              setShowSnackbarError(true);
              return;
            }

            const user = responsePayload.user;
            const emailNotVerifiedByPayload = responsePayload.emailNotVerified;

            if (
              emailNotVerifiedByPayload === true ||
              (user && !user.isAdmin && !user.isEmailVerified)
            ) {
              console.log(
                "SignIn: Email verification needed. Navigating to /auth/verify-email"
              );
              navigate("/auth/verify-email");
            } else if (user) {
              console.log("SignIn: Login successful and verified.");
              if (user.isAdmin) {
                navigate("/admin"); // Or your admin route
              } else {
                navigate("/"); // General user dashboard/profile (including subscribed agencies and agency users who are not subscribed)
              }
            } else {
              console.warn(
                "SignIn: Login fulfilled, but unclear next step. Payload:",
                responsePayload
              );
              setSnackbarErrorMessage(
                "Login successful, but couldn't determine next step."
              );
              setShowSnackbarError(true);
            }
          } else if (login.rejected.match(resultAction)) {
            const errorPayload = resultAction.payload;
            console.error("SignIn: Login rejected. Payload:", errorPayload);

            if (
              typeof errorPayload === "object" &&
              errorPayload !== null &&
              errorPayload.emailNotVerified === true
            ) {
              console.log(
                "SignIn: Login rejected due to unverified email. Navigating to /auth/verify-email"
              );
              navigate("/auth/verify-email");
            } else {
              // The useEffect for authError will handle displaying this in the snackbar.
              // No need to set local snackbar state here if Redux state is updated.
            }
          }
        } catch (err) {
          // This catch block is for unexpected errors during the dispatch process itself,
          // not for rejected thunks (which are handled by login.rejected.match).
          console.error(
            "SignIn: Unexpected JavaScript error during login dispatch:",
            err
          );
          setSnackbarErrorMessage("An unexpected client-side error occurred.");
          setShowSnackbarError(true);
        }
      }
    },
    [dispatch, navigate, validateInputs]
  );

  const handleForgotPassword = useCallback(() => {
    setShowForgotPassword(true);
  }, []);

  const handleResetPassword = useCallback((emailForReset) => {
    // Renamed param to avoid conflict
    setResetEmail(emailForReset);
    setShowForgotPassword(false);
    setResetPasswordModalOpen(true);
  }, []);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <CssBaseline />
      <PageContainer>
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

        {/* Main Content Area */}
        <SignInContainer>
          {/* Left Panel */}
          <LeftPanel>
            <Typography
              variant="h3"
              component="h1" // Good for SEO
              fontWeight={600}
              gutterBottom
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="body1"
              sx={{ maxWidth: { xs: "90%", md: "80%" }, mb: 4 }}
            >
              Sign in to access your dashboard, manage services, and connect
              with clients or providers seamlessly.
            </Typography>
            {!isMobile && (
              <Box
                display="flex"
                justifyContent="center"
                mt={2} // Reduced margin from 4 to 2
                gap={2} // Added gap for spacing if multiple Lotties
                sx={{ width: "100%", maxWidth: "700px" }} // Max width for Lottie container
              >
                <Box sx={{ flex: 1, maxWidth: "300px" }}>
                  {" "}
                  {/* MaxWidth for individual Lottie */}
                  <Lottie animationData={MovingCar} loop={true} />
                </Box>
                <Box sx={{ flex: 1, maxWidth: "300px" }}>
                  <Lottie animationData={Coding} loop={true} />
                </Box>
              </Box>
            )}
          </LeftPanel>

          {/* Right Panel */}
          <RightPanel>
            <StyledCard variant="outlined">
              <Typography
                component="h2" // Use h2 if h1 is in LeftPanel
                variant="h4"
                textAlign={"center"}
                mb={3} // Added margin bottom
              >
                Sign In
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ display: "flex", flexDirection: "column", gap: 2 }} // Consistent gap
              >
                <FormControl fullWidth required>
                  {" "}
                  {/* Added fullWidth and required */}
                  <FormLabel htmlFor="email" sx={{ mb: 0.5 }}>
                    Email
                  </FormLabel>{" "}
                  {/* Added margin bottom to label */}
                  <TextField
                    error={emailError}
                    helperText={emailErrorMessage}
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    variant="outlined" // Explicitly set variant
                    size="small" // Use small size for denser form
                    InputProps={{ sx: { borderRadius: 2 } }} // Consistent rounded corners
                  />
                </FormControl>
                <FormControl fullWidth required>
                  {" "}
                  {/* Added fullWidth and required */}
                  <FormLabel htmlFor="password" sx={{ mb: 0.5 }}>
                    Password
                  </FormLabel>
                  <TextField
                    error={passwordError}
                    helperText={passwordErrorMessage}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password" // More descriptive placeholder
                    autoComplete="current-password"
                    variant="outlined"
                    size="small"
                    InputProps={{
                      sx: { borderRadius: 2 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                            size="small" // Make icon button smaller
                          >
                            {showPassword ? (
                              <Visibility fontSize="small" />
                            ) : (
                              <VisibilityOff fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  startIcon={
                    loading && <CircularProgress size={20} color="inherit" />
                  }
                  sx={{
                    mt: 2,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                  }} // Consistent styling
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
                <Link
                  component="button"
                  type="button" // Important for accessibility and preventing form submission
                  onClick={handleForgotPassword}
                  variant="body2"
                  sx={{ alignSelf: "center", mt: 1, cursor: "pointer" }} // Consistent styling
                  disabled={loading}
                >
                  Forgot your password?
                </Link>
              </Box>
              <Divider sx={{ my: 2.5 }}>OR</Divider> {/* Consistent styling */}
              <Typography textAlign="center" variant="body2">
                {" "}
                {/* Consistent styling */}
                Don&apos;t have an account?{" "}
                <Link
                  component={RouterLink} // Use RouterLink for internal navigation
                  to="/auth/signup"
                  variant="body2"
                  fontWeight="medium" // Make link stand out
                >
                  Sign Up
                </Link>
              </Typography>
            </StyledCard>

            {/* Modals */}
            <ForgotPassword
              open={showForgotPassword}
              handleClose={() => setShowForgotPassword(false)}
              onResetPassword={handleResetPassword}
            />
            <ResetPassword
              open={isResetPasswordModalOpen}
              handleClose={() => setResetPasswordModalOpen(false)}
              email={resetEmail}
            />

            {/* Snackbar for errors */}
            <Snackbar
              open={showSnackbarError}
              autoHideDuration={6000}
              onClose={() => {
                setShowSnackbarError(false);
                // Optionally clear Redux error when snackbar is closed by user
                // if (authError) dispatch(clearAuthError());
              }}
              message={snackbarErrorMessage}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              action={
                <IconButton
                  size="small"
                  color="inherit" // Make close icon white if background is dark
                  onClick={() => setShowSnackbarError(false)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
              ContentProps={{
                sx: {
                  backgroundColor: theme.palette.error.main, // Use theme error color
                  color: theme.palette.error.contrastText, // Ensure text is readable
                },
              }}
            />
          </RightPanel>
        </SignInContainer>
      </PageContainer>
    </>
  );
}

export default React.memo(SignIn);

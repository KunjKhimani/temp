/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link as MuiLink,
  Paper, // Keep for potential inner styling if needed, but StyledCard is primary
  CssBaseline,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Card, // Import Card for StyledCard
  Stack, // Import Stack
} from "@mui/material";
import { styled } from "@mui/material/styles"; // Import styled
import EmailIcon from "@mui/icons-material/Email";
import LogoImage from "../../assets/logospare.png"; // Adjust path
import Lottie from "lottie-react"; // For Lottie animation
// import MailSentAnimation from "../../assets/mail_sent_animation.json"; // Replace with your actual Lottie JSON file for email

import { RouterLink } from "../../admin/routes/components"; // Adjust path
import {
  clearResendStatus,
  clearVerificationError,
  resetVerificationSuccess,
  selectResendError,
  selectResendLoading,
  selectResendSuccessMessage,
  selectUser,
  selectVerificationError,
  selectVerificationLoading,
  selectVerificationSuccess,
  selectIsLoggedIn, // Import selectIsLoggedIn
} from "../../store/slice/userSlice";
import { resendCode, verifyCode } from "../../store/thunks/userThunks";

// --- Styled Components (adapted from SignIn/SignUp) ---
const PageContainer = styled(Box)(({ theme }) => ({
  // Renamed from Container to avoid conflict with MUI Container
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
}));

const ContentContainer = styled(Stack)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flexGrow: 1, // Take remaining height
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    height: "auto",
  },
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
    height: "auto",
    minHeight: "30vh",
    padding: theme.spacing(3),
  },
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1.25,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(4),
  overflowY: "auto",
  backgroundColor: theme.palette.background.default, // Match sign-in right panel
  [theme.breakpoints.down("md")]: {
    flex: "none",
    width: "100%",
    padding: theme.spacing(3),
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: "450px",
  padding: theme.spacing(3, 4),
  boxShadow: theme.shadows[5],
  borderRadius: theme.shape.borderRadius * 2,
  overflow: "visible",
}));
// --- End Styled Components ---

const VerifyEmailPage = () => {
  const [code, setCode] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const userFromRedux = useSelector(selectUser);
  const isLoggedIn = useSelector(selectIsLoggedIn); // Get isLoggedIn state
  const isLoading = useSelector(selectVerificationLoading);
  const verificationError = useSelector(selectVerificationError);
  const verificationSuccess = useSelector(selectVerificationSuccess);
  const isResending = useSelector(selectResendLoading);
  const resendError = useSelector(selectResendError);
  const resendSuccessMessage = useSelector(selectResendSuccessMessage);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const emailToVerify = userFromRedux?.email || "your email";

  useEffect(() => {
    dispatch(clearVerificationError());
    dispatch(clearResendStatus());
    // If no email is found in redux, redirect to sign-in,
    // as verification is impossible without it.
    if (!userFromRedux?.email) {
      console.warn(
        "VerifyEmailPage: No email found in Redux state. Redirecting to signin."
      );
      navigate("/auth/signin"); // Redirect to signin if no email context
    }
  }, [dispatch, userFromRedux, navigate]);

  useEffect(() => {
    let timer;
    if (verificationSuccess) {
      timer = setTimeout(() => {
        dispatch(resetVerificationSuccess());
        // Check if user is logged in and email is verified before navigating to homepage
        if (isLoggedIn && userFromRedux?.isEmailVerified) {
          navigate("/"); // Navigate to homepage
        } else {
          // Fallback, if auto-login somehow failed, redirect to signin
          console.warn(
            "VerifyEmailPage: Auto-login failed after verification. Redirecting to signin."
          );
          navigate("/auth/signin");
        }
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [verificationSuccess, navigate, dispatch, userFromRedux, isLoggedIn]); // Add isLoggedIn to dependencies

  const handleCodeChange = (event) => {
    const value = event.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      setCode(value);
      if (verificationError) dispatch(clearVerificationError());
      if (resendError) dispatch(clearResendStatus());
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (
      !emailToVerify ||
      code.length !== 6 ||
      isLoading ||
      isResending ||
      verificationSuccess
    ) {
      return;
    }
    dispatch(verifyCode({ email: emailToVerify, code: code }));
  };

  const handleResendCode = () => {
    if (!emailToVerify || isLoading || isResending || verificationSuccess) {
      return;
    }
    dispatch(clearVerificationError());
    dispatch(clearResendStatus());
    dispatch(resendCode({ email: emailToVerify }));
  };

  const displayError = verificationError || resendError;

  return (
    <>
      <CssBaseline />
      <PageContainer>
        <AppBar
          position="static"
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottom: 1,
            borderColor: "divider",
          }}
          elevation={0}
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
          </Toolbar>
        </AppBar>

        <ContentContainer>
          {/* --- Left Panel --- */}
          <LeftPanel>
            <Typography
              variant="h3"
              component="h1"
              fontWeight={600}
              gutterBottom
            >
              Almost There!
            </Typography>
            <Typography
              variant="body1"
              sx={{ maxWidth: { xs: "90%", md: "80%" }, mb: 4 }}
            >
              We've sent a verification code to your email. Please check your
              inbox (and spam folder) and enter the code to activate your
              account.
            </Typography>
            {/* {!isMobile &&
              MailSentAnimation && ( // Conditionally render Lottie
                <Box sx={{ width: "100%", maxWidth: "300px", mt: 2 }}>
                  <Lottie animationData={MailSentAnimation} loop={true} />
                </Box>
              )} */}
          </LeftPanel>

          {/* --- Right Panel --- */}
          <RightPanel>
            <StyledCard variant="outlined">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <EmailIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography
                  component="h1"
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: "medium" }}
                >
                  Enter Verification Code
                </Typography>

                <Typography variant="body2" sx={{ mb: 2, textAlign: "center" }}>
                  A 6-digit code has been sent to{" "}
                  <strong>{emailToVerify}</strong>.
                </Typography>

                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  noValidate
                  sx={{ width: "100%", mt: 1 }}
                >
                  <TextField
                    fullWidth
                    margin="normal"
                    name="code"
                    label="6-digit Code"
                    value={code}
                    onChange={handleCodeChange}
                    error={Boolean(displayError)}
                    disabled={isLoading || isResending || verificationSuccess}
                    inputProps={{
                      maxLength: 6,
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      style: {
                        textAlign: "center",
                        letterSpacing: "0.5em",
                        fontSize: "1.2rem",
                      },
                    }}
                    helperText={displayError || " "}
                    sx={{ mb: 1 }}
                  />

                  {verificationSuccess && (
                    <Alert severity="success" sx={{ mt: 1, mb: 1 }}>
                      Verified! Redirecting...
                    </Alert>
                  )}
                  {resendSuccessMessage && !displayError && (
                    <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                      {resendSuccessMessage}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, py: 1.2, borderRadius: 2, fontSize: "1rem" }}
                    disabled={
                      code.length !== 6 ||
                      isLoading ||
                      isResending ||
                      verificationSuccess
                    }
                  >
                    {isLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Verify Account"
                    )}
                  </Button>

                  <Box sx={{ textAlign: "center", mt: 2.5 }}>
                    <Typography variant="body2">
                      Didn't receive the code?{" "}
                      <MuiLink
                        component="button"
                        type="button" // Important for forms
                        onClick={handleResendCode}
                        disabled={
                          isResending || isLoading || verificationSuccess
                        }
                        sx={{ fontWeight: "medium" }}
                      >
                        {isResending ? "Resending..." : "Resend Code"}
                      </MuiLink>
                      {isResending && (
                        <CircularProgress
                          size={14}
                          sx={{ ml: 1, verticalAlign: "middle" }}
                          color="inherit"
                        />
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Typography variant="body2">
                      Entered the wrong email?{" "}
                      <MuiLink
                        component={RouterLink}
                        to="/auth/signup" // Or wherever they can change email/re-register
                        variant="body2"
                        sx={{ fontWeight: "medium" }}
                      >
                        Sign Up Again
                      </MuiLink>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </StyledCard>
          </RightPanel>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default VerifyEmailPage;

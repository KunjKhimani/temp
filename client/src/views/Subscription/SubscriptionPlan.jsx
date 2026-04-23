import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  CssBaseline,
  AppBar,
  Toolbar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import LogoImage from "../../assets/logospare.png";
import { motion } from "framer-motion";
import { CheckCircle, Users, Building, User } from "lucide-react";
import { createSubscriptionCheckoutSession } from "../../services/subscriptionApi"; // Use createSubscriptionCheckoutSession
import { Alert, CircularProgress } from "@mui/material"; // Import Alert and CircularProgress
import { useDispatch, useSelector } from "react-redux"; // Import useDispatch and useSelector
import { fetchCurrentUser } from "../../store/thunks/userThunks"; // Import fetchCurrentUser thunk
import FirstRequestOfferModal from "../../components/FirstRequestOfferModal"; // Import FirstRequestOfferModal
import { setFormSubmissionRequired } from "../../store/slice/navigationSlice"; // Import the action

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  elevation: 0,
}));

const plans = [
  {
    id: "basic_account", // Use backend ID
    icon: <User style={{ color: "#3b82f6", width: 32, height: 32 }} />,
    title: "Basic Account",
    price: "Free Plan",
    bestFor: "Beginners or part-time providers",
    // description:
    //   "For individuals or small vendors testing the waters or making a few offers.",
    // audience: "Freelancers, casual service providers, new creators.",
    features: [
      "Up to 5 active listings (services, products, or talent)",
      "Apply to a limited jobs or requests monthly",
      "Basic public profile",
      "Basic messaging",
      "Get notified when a buyer is interested in your listing",
    ],
  },
  {
    id: "growth_account", // Use backend ID
    icon: <Users style={{ color: "#f97316", width: 32, height: 32 }} />,
    title: "Growth Account",
    price: "$19.90/month", // This will be the displayed price if no discount
    originalPrice: "$40/month", // Original price for strikethrough
    discountedPrice: "$19.90/month", // Discounted price
    bestFor: "Active providers and growing service teams",
    // description:
    //   "For serious professionals and teams aiming to scale their offers and visibility.",
    // audience: "Full-time freelancers, verified providers, small agencies.",
    features: [
      "Unlimited listings (services, products, or talent)",
      "Apply to unlimited jobs or service requests",
      "Featured profile placement",
      "Access to analytics dashboard",
      "Priority placement in search results",
      "Scheduling + real-time chat/call",
    ],
  },
  {
    id: "business_account", // Use backend ID
    icon: <Building style={{ color: "#ca8a04", width: 32, height: 32 }} />,
    title: "Business Account",
    price: "$39.90/month", // This will be the displayed price if no discount
    originalPrice: "$80/month", // Original price for strikethrough
    discountedPrice: "$39.90/month", // Discounted price
    bestFor: "Agencies, recruiters, and service companies",
    // description:
    //   "For agencies or hiring organizations managing larger teams and projects.",
    // audience:
    //   "Companies, multi-provider vendors, recruiters, and training hubs.",
    features: [
      "All Growth features, plus",
      "Dedicated account manager",
      "Advanced candidate filtering and recruiting tools",
      "Branded company Profile page",
      "Tailored Recruitment Services",
      "Get Notified in SMS and Email",
    ],
  },
];

import { useState } from "react"; // Import useState

export default function SubscriptionPlan() {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Initialize useDispatch
  const { currentUser } = useSelector((state) => state.user); // Get currentUser from Redux store
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFirstRequestOfferModal, setShowFirstRequestOfferModal] =
    useState(false);
  const hasCompletedInitialSubmission = useSelector(
    (state) => state.navigation.hasCompletedInitialSubmission
  );

  console.log(currentUser);

  const userCategories = currentUser?.userCategories || []; // Safely get userCategories

  const handleChoosePlan = async (planId) => {
    console.log(`Proceeding with plan: ${planId}`);
    setIsLoading(true);
    setError(null);

    if (planId === "basic_account") {
      try {
        const response = await createSubscriptionCheckoutSession(planId);
        if (response.clientSecret === "basic_account_activated") {
          await dispatch(fetchCurrentUser()); // Dispatch to refresh user data
          if (!hasCompletedInitialSubmission) {
            setShowFirstRequestOfferModal(true); // Show the modal only if not completed
          } else {
            // If already completed, just navigate to a default page or home
            navigate("/");
          }
        } else {
          setError("Unexpected response for free subscription activation.");
        }
      } catch (err) {
        setError("Failed to activate free subscription. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // For paid subscriptions, navigate to the payment page
      navigate(`/auth/payment/subscription/${planId}`);
      setIsLoading(false); // No API call here, so set loading to false immediately
    }
  };

  const handleCloseFirstRequestOfferModal = () => {
    setShowFirstRequestOfferModal(false);
    // navigate("/user/profile/edit"); // Navigate after closing the modal
  };

  const handleModalSelect = (route) => {
    dispatch(setFormSubmissionRequired(route));
    navigate(route);
    setShowFirstRequestOfferModal(false); // Close the modal after selection
  };

  return (
    <>
      <CssBaseline />
      <StyledAppBar position="static">
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
      </StyledAppBar>

      <Container maxWidth="lg" sx={{ px: 3, py: 6 }}>
        <Typography variant="h3" component="h1" textAlign="center" gutterBottom>
          Choose Your Subscription Plan
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          mb={6}
        >
          Unlock the full potential of Sparework for your agency.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {plans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div whileHover={{ scale: 1.03 }}>
                <Card
                  elevation={3}
                  sx={{
                    borderTop: "4px solid #60a5fa",
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {plan.icon}
                      <Typography variant="h6">{plan.title}</Typography>
                    </Box>
                    <Box display="flex" alignItems="baseline" gap={1}>
                      {plan.originalPrice && (
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          sx={{ textDecoration: "line-through" }}
                        >
                          {plan.originalPrice}
                        </Typography>
                      )}
                      <Typography
                        variant="h5"
                        color="primary.main"
                        fontWeight="bold"
                      >
                        {plan.discountedPrice || plan.price}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="primary"
                      fontWeight="bold"
                      mt={1}
                    >
                      💼 Best for: {plan.bestFor}
                    </Typography>
                    {/* <Typography variant="body2" color="text.secondary" mb={1}>
                      {plan.description}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      fontWeight="medium"
                      mb={1}
                    >
                      <em>Who it’s for:</em> {plan.audience}
                    </Typography> */}
                    <List dense>
                      {plan.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckCircle
                              style={{
                                color: "#22c55e",
                                width: 16,
                                height: 16,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2">{feature}</Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => handleChoosePlan(plan.id)}
                      disabled={isLoading} // Disable button when loading
                      startIcon={
                        isLoading && plan.id === "basic_account" ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : null
                      }
                    >
                      {isLoading && plan.id === "basic_account"
                        ? "Activating..."
                        : `Choose ${plan.title}`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {showFirstRequestOfferModal && !hasCompletedInitialSubmission && (
        <FirstRequestOfferModal
          open={showFirstRequestOfferModal}
          userCategories={userCategories} // Pass userCategories
          onClose={handleCloseFirstRequestOfferModal} // Correct prop name
          onSelect={handleModalSelect} // Pass the new onSelect callback
          currentUser={currentUser}
        />
      )}
    </>
  );
}

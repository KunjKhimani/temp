// src/views/HowItWorks/HowItWorksPage.jsx
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  useTheme,
  Stack,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Lottie from "lottie-react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  IconSearch,
  IconShoppingCart,
  IconUsers,
  IconUserStar,
  IconBuildingCommunity,
  IconTag,
} from "@tabler/icons-react";

const mainAnimationUrl =
  "https://assets10.lottiefiles.com/packages/lf20_touohxv0.json";

const ICON_SIZE = 48;

const featureData = [
  {
    title: "For Sellers",
    description:
      "Offer services & skills globally. Create listings, set prices, manage projects.",
    icon: <IconUserStar size={ICON_SIZE} />,
  },
  {
    title: "For Buyers",
    description:
      "Find experts or post requests. Compare, review, collaborate effectively.",
    icon: <IconSearch size={ICON_SIZE} />,
  },
  {
    title: "For Products",
    description:
      "Sell goods internationally. Manage inventory, process orders, grow e-commerce.",
    icon: <IconShoppingCart size={ICON_SIZE} />,
  },
  {
    title: "For Agents",
    description:
      "Manage teams, access all platform features, streamline business operations.",
    icon: <IconUsers size={ICON_SIZE} />,
  },
  {
    title: "Community Offers",
    description:
      "Discover peer-to-peer services and support within your local community.",
    icon: <IconBuildingCommunity size={ICON_SIZE} />,
  },
  {
    title: "Special Deals",
    description:
      "Exclusive discounts and unique bundles on premium services and products.",
    icon: <IconTag size={ICON_SIZE} />,
  },
];

const HowItWorksPage = () => {
  const theme = useTheme();
  const navbarHeight = 64; // IMPORTANT: Adjust if your Navbar height is different

  return (
    <Container
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        py: 4,
      }}
    >
      {/* Welcome Section */}
      <Box textAlign="center" sx={{}}>
        {" "}
        {/* Small top margin for Welcome content from container edge */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "1.6rem", sm: "2rem", md: "2.2rem" },
          }}
        >
          Welcome to{" "}
          <span style={{ color: theme.palette.primary.main }}>SpareWork</span>
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            fontSize: { xs: "0.85rem", sm: "1rem", md: "1.1rem" },
          }}
        >
          Your All-in-One Marketplace for Services, Products, & Talent.
        </Typography>
        {/* <Box // Box for the main Lottie
          sx={{
            maxWidth: { xs: 120, sm: 150, md: 180 },
            height: { xs: 80, sm: 100, md: 110 },
            margin: "0 auto",
            mb: { xs: 1, sm: 1.5 }, // This margin creates space BELOW the Welcome Lottie
          }}
        >
          <Lottie
            animationData={
              typeof mainAnimationUrl === "string" ? null : mainAnimationUrl
            }
            loop={true}
            autoplay={true}
            path={
              typeof mainAnimationUrl === "string" ? mainAnimationUrl : null
            }
            style={{ width: "100%", height: "100%" }}
          />
        </Box> */}
      </Box>

      {/* Features Grid */}
      <Box 
        sx={{
          my: 4,
        }}
      >
        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          rowSpacing={6}
          justifyContent="center"
          alignItems="stretch"
        >
          {featureData.map((feature, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              key={index}
              sx={{ display: "flex" }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 1, sm: 1.5 },
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                  minHeight: { xs: 160, md: 190 }, // Standardized height for all cards
                  borderRadius: "16px",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 50, sm: 60, md: 70 },
                    height: { xs: 50, sm: 60, md: 70 },
                    // mb: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.palette.primary.main,
                  }}
                >
                  {feature.lottieUrl ? (
                    <Lottie
                      animationData={
                        typeof feature.lottieUrl === "string"
                          ? null
                          : feature.lottieUrl
                      }
                      loop={true}
                      autoplay={true}
                      path={
                        typeof feature.lottieUrl === "string"
                          ? feature.lottieUrl
                          : null
                      }
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : feature.icon ? (
                    feature.icon
                  ) : null}
                </Box>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                    mb: 1,
                    lineHeight: 1.2,
                    color: "text.primary",
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
                    lineHeight: 1.5,
                    color: "text.secondary",
                    px: 1,
                  }}
                >
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Call to Action Section */}
      <Box
        textAlign="center"
        my={{ xs: 1, sm: 1.5 }} // This margin creates space ABOVE the CTA
        p={{ xs: 1, sm: 1.5 }} // Internal padding for CTA
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "1rem", sm: "1.2rem", md: "1.25rem" },
            mb: 1,
          }}
        >
          Ready to Get Started?
        </Typography>
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 1.5 }}
          justifyContent="center"
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            component={RouterLink}
            to="/auth/signup"
            endIcon={
              <ArrowForwardIcon
                sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
              />
            }
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.5, sm: 0.8 },
              fontSize: { xs: "0.7rem", sm: "0.8rem" },
            }}
          >
            Register
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            component={RouterLink}
            to="/auth/signin"
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.5, sm: 0.8 },
              fontSize: { xs: "0.7rem", sm: "0.8rem" },
            }}
          >
            Login
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default HowItWorksPage;

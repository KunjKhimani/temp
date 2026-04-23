/* eslint-disable react/prop-types */
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import Paper from "@mui/material/Paper";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import ServiceImage from "../../assets/images/services.webp";

const FeatureCard = ({ title, description }) => {
  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        maxWidth: 300,
        padding: 2,
        borderRadius: 2,
        textAlign: "center",
        alignItems: "center",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      }}
      elevation={0}
    >
      <IconCircleCheckFilled size={28} color="black" />
      <Typography
        variant="h6"
        sx={{ fontSize: { xs: "1rem", md: "1.2rem" }, fontWeight: 700 }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          fontSize: { xs: "0.85rem", md: "1rem" },
        }}
      >
        {description}
      </Typography>
    </Paper>
  );
};

const features = [
  {
    title: "Best for every budget",
    description:
      "Quality services at every price point: , powered by your community",
  },
  {
    title: "Quality work",
    description:
      "Find the right freelancer to begin working on your project within minutes.",
  },
  {
    title: "Protected payments",
    description:
      "Always know what you will pay upfront. Your payment is not released until you approve the work.",
  },
  {
    title: "24/7 support",
    description:
      "Get help anytime with round-the-clock support from SpareWork.",
  },
];

const Features = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: { xs: 3, md: 6 },
        backgroundColor: "#E6F1FC",
        // backgroundColor: theme.palette.primary.light,
      }}
    >
      {/* Service Descriptions */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 3,
          flex: 1.5,
          justifyContent: "center",
        }}
      >
        {features.map((service, index) => (
          <FeatureCard key={index} {...service} />
        ))}
      </Box>
      {/* Image Section */}
      {!isMobile && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src={ServiceImage}
            alt="Our Services"
            sx={{
              width: "100%",
              maxWidth: 400,
              height: "auto",
              borderRadius: 4,
              boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.2)",
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Features;

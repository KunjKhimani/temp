import { Box, Typography } from "@mui/material";

const TrustedBy = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 1.5, // Adjust gap between images
        flexWrap: "wrap",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
        }}
      >
        Trusted By:
      </Typography>
      {[
        "https://fiverr-res.cloudinary.com/npm-assets/@fiverr/logged_out_homepage_perseus/apps/facebook2x.188a797.png",
        "https://fiverr-res.cloudinary.com/npm-assets/@fiverr/logged_out_homepage_perseus/apps/google2x.06d74c8.png",
        "https://fiverr-res.cloudinary.com/npm-assets/@fiverr/logged_out_homepage_perseus/apps/netflix2x.887e47e.png",
        "https://fiverr-res.cloudinary.com/npm-assets/@fiverr/logged_out_homepage_perseus/apps/pandg2x.6dc32e4.png",
        "https://fiverr-res.cloudinary.com/npm-assets/@fiverr/logged_out_homepage_perseus/apps/paypal2x.22728be.png",
      ].map((src, index) => (
        <Box
          component="img"
          key={index}
          src={src}
          alt={`Trusted by logo ${index + 1}`}
          sx={{
            width: 70, // Set a smaller width for images
            height: "auto", // Maintain aspect ratio
          }}
        />
      ))}
    </Box>
  );
};

export default TrustedBy;

import { Container, Typography, Box, Grid, Paper } from "@mui/material";
import Image from "../../assets/images/category/business.jpg";

const AboutUs = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{ p: 4, borderRadius: 2, backgroundColor: "transparent" }}
      >
        <Typography variant="h4" gutterBottom textAlign="center">
          About Sparework
        </Typography>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="body1" sx={{ textAlign: "justify" }}>
              Sparework is a platform that connects service providers with
              customers seamlessly. Whether you're looking for property
              services, ride-sharing, moving assistance, or freelance digital
              services like graphic design and programming, Sparework brings
              everything together in one place.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, textAlign: "justify" }}>
              Our mission is to create a reliable and efficient service
              marketplace, ensuring quality, trust, and convenience for both
              customers and service providers.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                width: "100%",
                height: "auto",
                bgcolor: "grey.300",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <img
                src={Image}
                alt="About Sparework"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AboutUs;

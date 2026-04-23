import { Container, Typography, Box, Grid, Paper, Button } from "@mui/material";
import Image from "../../assets/images/partnership.jpg";
import ContactUs from "../LandingPage/components/ContactUs";

const Partnership = () => {
  return (
    <Container maxWidth="lg" sx={{ paddingTop: 4 }}>
      <Paper
        elevation={1}
        sx={{
          p: 4,
          borderRadius: 1,
          elevation: 3,
          textAlign: "center",
          backgroundColor: "transparent",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Partner with Sparework
        </Typography>
        <Typography variant="body1" paragraph>
          Join forces with Sparework to connect with customers, expand your
          reach, and grow your business. We provide a seamless platform for
          businesses and individuals to offer their services to a wider
          audience.
        </Typography>
        <Grid container spacing={4} alignItems="center" sx={{ mt: 2 }}>
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
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Why Partner With Us?
            </Typography>
            <Typography variant="body1" paragraph>
              - Access a large customer base looking for trusted services.
            </Typography>
            <Typography variant="body1" paragraph>
              - Increase your revenue and brand visibility.
            </Typography>
            <Typography variant="body1" paragraph>
              - Get dedicated support and resources to help your business
              thrive.
            </Typography>
            <Typography variant="body1" paragraph>
              - Join a community of service providers committed to quality and
              excellence.
            </Typography>
            <Typography variant="body1" paragraph>
              Contact us to learn more about partnership opportunities.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      <ContactUs />
    </Container>
  );
};

export default Partnership;

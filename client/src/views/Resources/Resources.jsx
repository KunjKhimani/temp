/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { Work, ShoppingCart, Info, CheckCircle } from "@mui/icons-material";

export default function Resources() {
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Page Title */}
      <Box textAlign="center" sx={{ mb: 5 }}>
        <Typography variant="h3" fontWeight={600} gutterBottom>
          SpareWork <span style={{ color: "#1976D2" }}>Resources</span>
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: "auto" }}
        >
          Whether you're a service provider looking to grow your business or a
          buyer searching for trusted professionals, we have the right resources
          for you.
        </Typography>
      </Box>

      {/* Two Sections */}
      <Grid container spacing={4}>
        {/* Service Providers Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Box sx={{ fontSize: 50, color: "#1976D2", textAlign: "center" }}>
              <Work fontSize="inherit" />
            </Box>
            <CardContent>
              <Typography
                variant="h5"
                fontWeight={600}
                textAlign="center"
                gutterBottom
              >
                For Service Providers
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mb: 2, textAlign: "center" }}
              >
                Learn how to list your services, attract clients, and grow your
                business on SpareWork.
              </Typography>

              {/* Links for Service Providers */}
              {providerResources.map((resource, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "center", mb: 1 }}
                >
                  <CheckCircle sx={{ color: "#1976D2", mr: 1 }} />
                  <Link
                    to={resource.link}
                    style={{ textDecoration: "none", color: "#1976D2" }}
                  >
                    <Typography variant="body1">{resource.label}</Typography>
                  </Link>
                </Box>
              ))}

              <Box textAlign="center" sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/user/profile"
                >
                  Start Listing Your Services
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Buyers Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Box sx={{ fontSize: 50, color: "#1976D2", textAlign: "center" }}>
              <ShoppingCart fontSize="inherit" />
            </Box>
            <CardContent>
              <Typography
                variant="h5"
                fontWeight={600}
                textAlign="center"
                gutterBottom
              >
                For Buyers
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mb: 2, textAlign: "center" }}
              >
                Find trusted professionals, book services, and ensure secure
                transactions on SpareWork.
              </Typography>

              {/* Links for Buyers */}
              {buyerResources.map((resource, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "center", mb: 1 }}
                >
                  <CheckCircle sx={{ color: "#1976D2", mr: 1 }} />
                  <Link
                    to={resource.link}
                    style={{ textDecoration: "none", color: "#1976D2" }}
                  >
                    <Typography variant="body1">{resource.label}</Typography>
                  </Link>
                </Box>
              ))}

              <Box textAlign="center" sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/services"
                >
                  Find a Service
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

// Links for Service Providers
const providerResources = [
  //   { label: "How to List Your Services", link: "/how-to-list" },
  { label: "Why SpareWork?", link: "/why-sparework" },
  //   { label: "Pricing & Fees", link: "/pricing" },
  //   { label: "Tips for Getting More Clients", link: "/tips" },
];

// Links for Buyers
const buyerResources = [
  { label: "Why SpareWork?", link: "/why-sparework" },
  //   { label: "How to Book a Service", link: "/how-to-book" },
  //   { label: "Secure Payments & Escrow", link: "/payments" },
  //   { label: "Finding Trusted Professionals", link: "/trust-safety" },
];

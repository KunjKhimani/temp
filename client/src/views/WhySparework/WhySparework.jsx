import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { Work, People, Star, CheckCircle } from "@mui/icons-material";
import { selectIsLoggedIn } from "../../store/slice/userSlice";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function WhySpareWork() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();

    if (isLoggedIn) {
      navigate("/");
    } else {
      navigate("/auth/signup");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Hero Section */}
      <Box textAlign="center" sx={{ mb: 5 }}>
        <Typography variant="h3" fontWeight={600} gutterBottom>
          Why Choose <span style={{ color: "#1976D2" }}>SpareWork?</span>
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: "auto" }}
        >
          SpareWork connects clients with skilled service providers, making it
          easy to find and offer services like cleaning, rides, and more.
        </Typography>
      </Box>

      {/* Benefits Section */}
      <Grid container spacing={4}>
        {benefits.map((benefit, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{ textAlign: "center", p: 2, borderRadius: 3, boxShadow: 3 }}
            >
              <Box sx={{ fontSize: 50, color: "#1976D2" }}>{benefit.icon}</Box>
              <CardContent>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {benefit.title}
                </Typography>
                <Typography color="text.secondary">
                  {benefit.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* CTA Section */}
      <Box textAlign="center" sx={{ mt: 6 }}>
        <Typography variant="h5" fontWeight={500} gutterBottom>
          Ready to get started?
        </Typography>
        <Button
          variant="contained"
          size="large"
          color="primary"
          sx={{ borderRadius: 3 }}
          onClick={handleJoin}
        >
          Join SpareWork Today
        </Button>
      </Box>
    </Container>
  );
}

const benefits = [
  {
    title: "Find Trusted Professionals",
    description:
      "Easily connect with experienced service providers in your area.",
    icon: <People fontSize="inherit" />,
  },
  {
    title: "Flexible Work Opportunities",
    description:
      "Service providers can offer their skills and earn on their own terms.",
    icon: <Work fontSize="inherit" />,
  },
  {
    title: "Quality & Reliability",
    description:
      "We ensure high standards with verified professionals and trusted reviews.",
    icon: <Star fontSize="inherit" />,
  },
  {
    title: "Seamless Booking",
    description: "Book services quickly with our user-friendly platform.",
    icon: <CheckCircle fontSize="inherit" />,
  },
  {
    title: "Secure Payments",
    description: "Transactions are safe and secure with our escrow system.",
    icon: <CheckCircle fontSize="inherit" />,
  },
  {
    title: "Wide Range of Services",
    description: "From cleaning to rides, find or offer the services you need.",
    icon: <CheckCircle fontSize="inherit" />,
  },
];

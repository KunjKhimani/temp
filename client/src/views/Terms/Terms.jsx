import { Container, Typography, Box, Paper } from "@mui/material";

const TermsOfService = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{ p: 4, borderRadius: 1, backgroundColor: "transparent" }}
      >
        <Typography variant="h4" gutterBottom textAlign="center">
          Terms of Service
        </Typography>
        <Box sx={{ textAlign: "justify" }}>
          <Typography variant="body1" paragraph>
            Welcome to Sparework! By using our platform, you agree to the
            following terms and conditions. Please read them carefully before
            accessing or using our services.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            1. Use of the Platform
          </Typography>
          <Typography variant="body1" paragraph>
            Users must comply with all applicable laws and regulations when
            using Sparework. Any unauthorized or fraudulent activities are
            strictly prohibited.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            2. Account Responsibilities
          </Typography>
          <Typography variant="body1" paragraph>
            Users are responsible for maintaining the confidentiality of their
            account information and for all activities that occur under their
            account.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            3. Service Transactions
          </Typography>
          <Typography variant="body1" paragraph>
            Sparework acts as a marketplace connecting service providers with
            customers. We are not responsible for the quality or fulfillment of
            services provided by users.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            4. Modifications and Termination
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to update or modify these terms at any time.
            Continued use of the platform constitutes acceptance of the revised
            terms.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfService;

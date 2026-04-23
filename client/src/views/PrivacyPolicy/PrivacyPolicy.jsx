import { Container, Typography, Box, Paper } from "@mui/material";

const PrivacyPolicy = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{ p: 4, borderRadius: 1, backgroundColor: "transparent" }}
      >
        <Typography variant="h4" gutterBottom textAlign="center">
          Privacy Policy
        </Typography>
        <Box sx={{ textAlign: "justify" }}>
          <Typography variant="body1" paragraph>
            At Sparework, we are committed to protecting your privacy. This
            policy outlines how we collect, use, and safeguard your personal
            information.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            1. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We collect personal information such as your name, email address,
            and contact details when you register on our platform. Additional
            data may be collected for transactions and service fulfillment.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            Your information is used to improve our services, facilitate
            transactions, and ensure platform security. We do not sell or share
            your personal data with third parties without your consent.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            3. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement security measures to protect your personal information.
            However, we cannot guarantee absolute security and encourage users
            to take necessary precautions.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            4. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            Sparework reserves the right to update this Privacy Policy.
            Continued use of our platform constitutes acceptance of the revised
            policy.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;

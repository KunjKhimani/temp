/* eslint-disable react/no-unescaped-entities */
import { Container, Box, Typography, Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import WifiOffIcon from "@mui/icons-material/WifiOff";

const OfflinePage = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: "background.paper",
        }}
      >
        <WifiOffIcon sx={{ fontSize: 80, color: "error.main", mb: 3 }} />
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          You Are Offline
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          It looks like you're currently offline. Please check your internet
          connection.
        </Typography>
        <Stack
          direction="column"
          spacing={2}
          sx={{ width: "100%", maxWidth: 300 }}
        >
          <Button
            variant="contained"
            component={RouterLink}
            to="/"
            size="large"
          >
            Go to Homepage
          </Button>
        </Stack>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 4 }}>
          Once you're back online, the application will automatically reconnect.
        </Typography>
      </Box>
    </Container>
  );
};

export default OfflinePage;

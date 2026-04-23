import { Box } from "@mui/material";
import PrimaryLogo from "../../assets/logo-svg/Primary-Logo.svg";

const BottomNav = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      sx={{ mb: 10 }}
    >
      <Box
        width="50%"
        margin="0 auto" // Center the 50% width
      >
        <Box
          component="img"
          src={PrimaryLogo}
          sx={{
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </Box>
    </Box>
  );
};

export default BottomNav;

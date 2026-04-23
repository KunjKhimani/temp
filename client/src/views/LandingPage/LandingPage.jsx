import Hero from "./Hero";
import theme from "../../theme/theme";
import { Box, Container } from "@mui/material";
import Features from "./Features";
import PopularCategories from "./PopularCatagories";
import ContactUs from "./components/ContactUs";

const LandingPage = () => {
  return (
    <>
      <Box sx={{}}>
        <Hero theme={theme} />

        <Features />
        <Container sx={{ py: 15 }}>
          <PopularCategories />
        </Container>
      </Box>
      <ContactUs />
    </>
  );
};

export default LandingPage;

import { Helmet } from "react-helmet-async";
import { Typography, Container } from "@mui/material";

const ProductRequestsPage = () => {
  return (
    <>
      <Helmet>
        <title> Product Requests | SpareWork </title>
      </Helmet>

      <Container>
        <Typography variant="h4" sx={{ mb: 5 }}>
          Product Requests
        </Typography>
        {/* Add your content for Product Requests here */}
        <Typography variant="body1">
          This is the Product Requests page.
        </Typography>
      </Container>
    </>
  );
};

export default ProductRequestsPage;

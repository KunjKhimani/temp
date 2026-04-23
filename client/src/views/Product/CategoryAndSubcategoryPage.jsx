import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Box,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import {
  ArrowOutward as ArrowOutwardIcon,
  Storefront as StorefrontIcon,
} from "@mui/icons-material";
import { productCategories } from "../../data/productCategory"; // Your import path

const CategoryAndSubcategoryPage = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleSubcategoryClick = (categoryName, subcategoryName) => {
    navigate(
      `/products?category=${encodeURIComponent(
        categoryName
      )}&subcategory=${encodeURIComponent(subcategoryName)}`
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        gutterBottom
        textAlign="center"
        mb={5}
      >
        Explore Our Product Categories
      </Typography>

      <Grid container spacing={3} alignItems="flex-start">
        {productCategories.map((cat) => {
          const IconComponent = cat.icon;

          return (
            <Grid item xs={12} md={6} key={cat.name}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  transition: "box-shadow 0.3s ease-in-out, transform 0.25s ease-in-out",
                  "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-4px)",
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: "0 0 auto 0",
                    height: "4px",
                    background: (theme) =>
                      `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  },
                }}
              >
                <CardHeader
                  avatar={
                    <Box
                      sx={{
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        bgcolor: "primary.50",
                      }}
                    >
                      {IconComponent && (
                        <IconComponent size={24} stroke={1.5} />
                      )}
                    </Box>
                  }
                  title={
                    <Typography variant="subtitle1" component="h2" fontWeight={700}>
                      {cat.name}
                    </Typography>
                  }
                  sx={{
                    pb: 0.5,
                  }}
                />

                {cat.subcategories && cat.subcategories.length > 0 && (
                  <CardContent sx={{ pt: 0, pb: 1.5 }}>
                    <Typography
                      variant="overline"
                      sx={{ letterSpacing: 0.5, color: "text.secondary", fontSize: "0.65rem", lineHeight: 1 }}
                    >
                      Available options
                    </Typography>
                    <Stack
                      direction="row"
                      flexWrap="wrap"
                      useFlexGap
                      spacing={0.75}
                      mt={0.75}
                    >
                      {cat.subcategories.map((sub, i) => (
                        <Button
                          key={i}
                          variant="text"
                          onClick={() =>
                            handleSubcategoryClick(cat.name, sub)
                          }
                          endIcon={<ArrowOutwardIcon sx={{ fontSize: "0.8rem" }} />}
                          sx={{
                            textTransform: "none",
                            justifyContent: "space-between",
                            borderRadius: "999px",
                            px: 1,
                            py: 0.25,
                            fontSize: "0.75rem",
                            color: "text.primary",
                            bgcolor: "action.hover",
                            border: "1px solid",
                            borderColor: "divider",
                            fontWeight: 500,
                            "&:hover": {
                              bgcolor: "primary.light",
                              borderColor: "primary.main",
                              color: "primary.contrastText",
                            },
                          }}
                        >
                          {sub}
                        </Button>
                      ))}
                    </Stack>
                  </CardContent>
                )}

                <Box sx={{ flexGrow: 1 }} />
                <Divider sx={{ mt: "auto" }} />
                <CardContent sx={{ pt: 1.5, pb: "12px !important" }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => handleCategoryClick(cat.name)}
                    startIcon={<StorefrontIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "10px",
                    }}
                  >
                    View All in {cat.name}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default CategoryAndSubcategoryPage;

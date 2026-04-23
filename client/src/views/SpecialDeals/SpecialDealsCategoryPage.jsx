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
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import {
  Storefront as StorefrontIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { specialDealsCategories } from "../../data/specialDealsData";

const SpecialDealsCategoryPage = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    navigate(`/special-deals?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3, color: "text.secondary", fontSize: "0.9rem" }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <MuiLink
            component={RouterLink}
            to="/special-deals"
            color="inherit"
            sx={{
              textDecoration: "none",
            }}
          >
            Special Deals
          </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          Categories
        </Typography>
      </Breadcrumbs>

      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        gutterBottom
        textAlign="left"
        mb={5}
      >
        Explore Special Deals Categories
      </Typography>

      <Grid container spacing={3} alignItems="flex-start">
        {specialDealsCategories.map((cat) => {
          const IconComponent = cat.icon;

          return (
            <Grid item xs={12} sm={6} md={4} key={cat.name}>
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
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        bgcolor: "primary.50",
                      }}
                    >
                      {IconComponent && (
                        <IconComponent size={32} stroke={1.5} />
                      )}
                    </Box>
                  }
                  title={
                    <Typography variant="h6" component="h2" fontWeight={700}>
                      {cat.name}
                    </Typography>
                  }
                  sx={{
                    pb: 1,
                  }}
                />

                <Box sx={{ flexGrow: 1 }} />
                <Divider sx={{ mt: 2 }} />
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
                    View Deals in {cat.name}
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

export default SpecialDealsCategoryPage;

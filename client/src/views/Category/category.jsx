/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import {
  Breadcrumbs,
  Container,
  Link as MuiLink,
  Box,
  Typography,
  Card,
  Grid,
  CardActionArea,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import { categories } from "../../data/categoryData";
import { categoryExplanations } from "../../data/categoryDescription";
import CategoryIntro from "./CategoryIntro";

import { Link as RouterLink, useParams } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";

function SubCategoryCard({
  subCategory,
  category, // This is the original category name (e.g., "Companion Care")
  categoryIcon: CategoryIcon,
}) {
  const theme = useTheme();
  // When creating links, you might need to ensure the category part of the URL
  // matches how your router expects it (e.g., if it uses hyphens or specific casing).
  // For now, assuming direct name usage based on your current links.
  const categoryUrlSegment = category; // Or a normalized version if your routes are built that way

  return (
    <CardActionArea
      component={RouterLink}
      to={`/category/${encodeURIComponent(
        categoryUrlSegment
      )}/${encodeURIComponent(subCategory)}`} // Ensure URL segments are encoded
      sx={{
        display: "block",
        height: "100%",
        borderRadius: 2,
        textDecoration: "none",
        color: "inherit",
        width: 250,
      }}
    >
      <Card
        elevation={3}
        sx={{
          height: "75%", // Consider setting minHeight or making height: '100%' if CardActionArea controls overall height
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.light,
            0.08
          )} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: theme.shadows[8],
            borderColor: theme.palette.primary.main,
            ".subcat-arrow-icon": {
              opacity: 1,
              transform: "translateX(0)",
            },
          },
        }}
      >
        <Stack spacing={2} alignItems="flex-start">
          {CategoryIcon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CategoryIcon
                size={26}
                stroke={1.5}
                color={theme.palette.primary.main}
              />
            </Box>
          )}
          <Typography
            variant="h6"
            fontWeight={600}
            lineHeight={1.4}
            color="text.primary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {subCategory}
          </Typography>
        </Stack>
        <Box sx={{ alignSelf: "flex-end", mt: 3 }}>
          <ArrowForwardIcon
            className="subcat-arrow-icon"
            sx={{
              color: theme.palette.primary.main,
              fontSize: "1.25rem",
              opacity: 0,
              transform: "translateX(-5px)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          />
        </Box>
      </Card>
    </CardActionArea>
  );
}

export default function Category() {
  const { category: categoryFromUrl } = useParams(); // Renamed to avoid confusion

  // --- MODIFIED LOOKUP ---
  // 1. Decode the URL parameter in case it has %20 etc.
  // 2. Compare in lowercase.
  const decodedCategoryFromUrl = categoryFromUrl
    ? decodeURIComponent(categoryFromUrl)
    : "";
  const categoryUrlLower = decodedCategoryFromUrl.toLowerCase();

  const categoryData = categories.find(
    (cat) => cat.name.toLowerCase() === categoryUrlLower
  );

  // For categoryInfo (description), also use the decoded and lowercased name
  const categoryInfo = categoryData // Use categoryData.name if found, for consistency with its casing
    ? categoryExplanations.find(
        (desc) => desc.name.toLowerCase() === categoryData.name.toLowerCase()
      ) ||
      categoryExplanations.find(
        (desc) => desc.name === "Default Category Description"
      )
    : categoryExplanations.find(
        (desc) => desc.name === "Default Category Description"
      );

  if (!categoryData) {
    return (
      <Container maxWidth="md" sx={{ py: 5, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Category "{decodedCategoryFromUrl || "Unknown"}" not found.
        </Typography>
        <MuiLink
          component={RouterLink}
          to="/"
          sx={{ mt: 2, display: "inline-block" }}
        >
          Go back home
        </MuiLink>
      </Container>
    );
  }

  // Use categoryData.name for display to retain original casing from your data file
  const displayCategoryName = categoryData.name;

  return (
    <Container maxWidth="lg" sx={{ py: 1, pb: 4 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3, color: "text.secondary", fontSize: "0.9rem" }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </MuiLink>
        <Typography
          color="text.primary"
          sx={{ fontWeight: 500, textTransform: "capitalize" }}
        >
          {displayCategoryName} {/* Use the name from found categoryData */}
        </Typography>
      </Breadcrumbs>
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        sx={{ mb: 2, textTransform: "capitalize" }}
      >
        {displayCategoryName}
      </Typography>
      {categoryInfo && <CategoryIntro {...categoryInfo} sx={{ mb: 4 }} />}
      <Typography variant="h5" component="h2" fontWeight={500} sx={{ my: 5 }}>
        Explore {displayCategoryName} Services
      </Typography>
      <Grid container spacing={3} mb={10}>
        {categoryData.subcategories.map((subCategory) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={subCategory}>
            <SubCategoryCard
              subCategory={subCategory}
              category={categoryData.name} // Pass the original cased name for link construction
              categoryIcon={categoryData.icon}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

import React, { useState } from "react";
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
    Breadcrumbs,
    Link as MuiLink,
    Tabs,
    Tab,
    Paper,
} from "@mui/material";
import {
    ArrowOutward as ArrowOutwardIcon,
    Storefront as StorefrontIcon,
    Home as HomeIcon,
    ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { communityCategories } from "../../data/communityMenuData";
import { productCategories } from "../../data/productCategory";

const CommunityCategoryPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleCategoryClick = (categoryName) => {
        const type = activeTab === 0 ? "Service" : "Product";
        const mode = activeTab === 0 ? "Service" : "Product";
        navigate(`/community-offers?category=${encodeURIComponent(categoryName)}&type=${type}&mode=${mode}`);
    };

    const handleSubcategoryClick = (categoryName, subcategoryName) => {
        const type = activeTab === 0 ? "Service" : "Product";
        const mode = activeTab === 0 ? "Service" : "Product";
        navigate(
            `/community-offers?category=${encodeURIComponent(
                categoryName
            )}&subcategory=${encodeURIComponent(subcategoryName)}&type=${type}&mode=${mode}`
        );
    };

    const renderCategories = (categories) => (
        <Grid container spacing={3} alignItems="flex-start">
            {categories.map((cat) => {
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
                                                    color: "#000",
                                                    bgcolor: "action.hover",
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    fontWeight: 500,
                                                    "&:hover": {
                                                        bgcolor: "#82d7f7",
                                                        borderColor: "primary.main",
                                                        color: "#000",
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
    );

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
                    to="/community-offers"
                    color="inherit"
                    sx={{
                        textDecoration: "none",
                    }}
                >
                    Community Offers
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
                mb={3}
            >
                Explore Community Categories
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    mb: 4,
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "transparent",
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="standard"
                    sx={{
                        minHeight: 40,
                        "& .MuiTab-root": {
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            px: 3,
                            py: 1,
                            minHeight: 40,
                            color: "#000",
                            transition: "background-color 0.2s ease, border-radius 0.2s ease",
                            "&.Mui-selected": {
                                backgroundColor: "#82d7f7",
                                borderTopLeftRadius: "8px",
                                borderTopRightRadius: "8px",
                                color: "#000",
                            },
                            "&:hover": {
                                backgroundColor: "rgba(130, 215, 247, 0.4)",
                                borderTopLeftRadius: "8px",
                                borderTopRightRadius: "8px",
                                color: "#000",
                            }
                        },
                        "& .MuiTabs-indicator": {
                            height: 3,
                            borderRadius: "3px 3px 0 0",
                        }
                    }}
                >
                    <Tab label="Community Services" />
                    <Tab label="Community Products" />
                </Tabs>
            </Paper>

            {activeTab === 0 ? renderCategories(communityCategories) : renderCategories(productCategories)}

        </Container>
    );
};

export default CommunityCategoryPage;

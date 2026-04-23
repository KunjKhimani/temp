/* eslint-disable react/prop-types */

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Typography,
  useTheme,
  useMediaQuery,
  Popover,
  IconButton as MuiIconButton, // Renamed to avoid conflict if you use IconButton from Tabler
  Tooltip, // Import Tooltip
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { categories } from "../data/categoryData";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const HOVER_DELAY_MS = 150;
const SCROLL_AMOUNT = 250; // Pixels to scroll by for arrow buttons

// Helper to render subcategory MenuItems consistently
const SubcategoryMenuItem = ({ itemText, categoryName, onNavigate, theme }) => {
  const cleanItemText = itemText.replace(/`new`/g, "").trim();
  const isNew = itemText.includes("`new`");

  return (
    <Tooltip title={cleanItemText} placement="top-start" enterDelay={500}>
      <MenuItem
        onClick={() =>
          onNavigate(
            `/category/${encodeURIComponent(categoryName)}/${encodeURIComponent(
              cleanItemText
            )}`
          )
        }
        sx={{
          width: "100%",
          borderRadius: 0.75,
          fontSize: "1rem",
          py: 0.75,
          px: 1,
          color: "text.primary",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          overflow: "hidden",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.primary.main,
          },
        }}
      >
        <Box
          component="span"
          sx={{
            flexGrow: 1,
            pr: isNew ? 1 : 0.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {cleanItemText}
        </Box>
        {isNew && (
          <Box
            component="span"
            sx={{
              ml: 0.5,
              px: 0.75,
              py: 0.25,
              backgroundColor: theme.palette.secondary.main,
              color: theme.palette.secondary.contrastText,
              borderRadius: "4px",
              fontSize: "0.65rem",
              fontWeight: "bold",
              lineHeight: 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            NEW
          </Box>
        )}
      </MenuItem>
    </Tooltip>
  );
};

const ServiceMenu = () => {
  const [anchorElMegaMenu, setAnchorElMegaMenu] = useState(null);
  const [activeMegaMenuCategoryLabel, setActiveMegaMenuCategoryLabel] =
    useState(null);
  const timeoutRef = useRef(null);
  const scrollContainerRef = useRef(null); // For the scrollable menu items

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const isOverflowing = el.scrollWidth > el.clientWidth + 1;
    if (!isOverflowing) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return undefined;

    checkScrollability();
    const observer = new ResizeObserver(checkScrollability);
    observer.observe(el);
    window.addEventListener("resize", checkScrollability);

    return () => {
      observer.unobserve(el);
      window.removeEventListener("resize", checkScrollability);
    };
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  if (isMobile) return null;

  const scrollMenu = (direction) => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    });
  };

  const handleNavigation = (link) => {
    navigate(link);
    setActiveMegaMenuCategoryLabel(null);
    setAnchorElMegaMenu(null);
  };

  const getCategoryDataByLabel = (categoryLabel) => {
    return categories.find((cat) => cat.name === categoryLabel);
  };

  const handleCloseMegaMenu = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMegaMenuCategoryLabel(null);
      setAnchorElMegaMenu(null); // Clear mega menu anchor
    }, HOVER_DELAY_MS);
  };

  const categoryDataForMegaMenu = activeMegaMenuCategoryLabel
    ? getCategoryDataByLabel(activeMegaMenuCategoryLabel)
    : null;

  const hasSubgroupsInMegaMenu = categoryDataForMegaMenu?.subgroups?.length > 0;
  const hasDirectSubcategoriesInMegaMenu =
    categoryDataForMegaMenu?.subcategories?.length > 0;

  const openMegaMenu =
    Boolean(activeMegaMenuCategoryLabel) &&
    categoryDataForMegaMenu &&
    (hasSubgroupsInMegaMenu ||
      (!hasSubgroupsInMegaMenu && hasDirectSubcategoriesInMegaMenu));

  const menuHorizontalPagePadding = {
    xs: theme.spacing(1),
    sm: theme.spacing(1),
    md: theme.spacing(3),
  };

  const displayedMenuItems = categories.map((category) => ({
    label: category.name,
    link: `/category/${encodeURIComponent(category.name)}/${encodeURIComponent(
      category.name
    )}`,
  }));

  const menuItemStyles = {
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    px: { xs: 1.25, sm: 1.5, md: 1 },
    py: theme.spacing(1.5),
    fontSize: theme.typography.pxToRem(13),
    minWidth: "auto",
    position: "relative",
    overflow: "visible",
    transition: theme.transitions.create(["color", "background-color"], {
      duration: theme.transitions.duration.shortest,
    }),
    "&::after": {
      content: '""',
      position: "absolute",
      left: "15%",
      right: "15%",
      bottom: theme.spacing(0.5),
      height: "2px",
      backgroundColor: theme.palette.primary.main,
      transformOrigin: "bottom center",
      transition: theme.transitions.create("transform", {
        duration: theme.transitions.duration.short,
        easing: theme.transitions.easing.easeInOut,
      }),
    },
    "&:hover": {
      backgroundColor: "transparent",
      color: theme.palette.primary.main,
      "&::after": { transform: "scaleX(1)" },
    },
  };

  return (
    <Box // Outermost container
      sx={{
        width: "95vw",
        borderBottom: 1,
        borderColor: "divider",
        backgroundColor: theme.palette.background.default,
        boxSizing: "border-box",
        position: "relative",
        zIndex: theme.zIndex.appBar,
        
      }}
    >
      <Box // Inner container for layout (scroll buttons + scrollable area)
        sx={{
          display: "flex",
          alignItems: "center",
          maxWidth: theme.breakpoints.values.xl, // Content within the bar is still constrained
          width: "100%",
          margin: "0 auto", // Center the content within the 97vw bar
          px: menuHorizontalPagePadding, // Horizontal padding for the content area
          
        }}
      >
        <MuiIconButton
          onClick={() => scrollMenu("left")}
          disabled={!canScrollLeft}
          size="small"
          sx={{
            visibility: canScrollLeft ? "visible" : "hidden",
            color: "text.secondary",
            mr: 0, // Small margin from scrollable content
            "&:hover": { backgroundColor: "action.hover" },
          }}
          aria-label="Scroll menu left"
        >
          <IconChevronLeft size={20} />
        </MuiIconButton>

        <Box // Masking container (hides scrollbar)
          sx={{
            flexGrow: 1,
            overflow: "hidden",
            minWidth: 0, // Crucial for flex item shrinking
          }}
        >
          <Box // The actual scrollable div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: {
                xs: theme.spacing(1.25),
                sm: theme.spacing(1.75),
                md: theme.spacing(2.25),
              },
              overflowX: "auto",
              scrollBehavior: "smooth",
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {displayedMenuItems.map((item) => {
              const categoryData = getCategoryDataByLabel(item.label);
              const hasSubgroups = categoryData?.subgroups?.length > 0;
              const hasDirectSubcategories = categoryData?.subcategories?.length > 0;
              const canOpenMegaMenu =
                hasSubgroups || (!hasSubgroups && hasDirectSubcategories);
              const isCurrentlyActive =
                activeMegaMenuCategoryLabel === item.label;

              return (
                <Box
                  key={item.link}
                  sx={{
                    position: "relative",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(event) => {
                    // Added event parameter
                    clearTimeout(timeoutRef.current);
                    if (canOpenMegaMenu) {
                      setActiveMegaMenuCategoryLabel(item.label);
                      setAnchorElMegaMenu(event.currentTarget);
                    } else if (activeMegaMenuCategoryLabel) {
                      handleCloseMegaMenu();
                    }
                  }}
                  onMouseLeave={handleCloseMegaMenu}
                >
                  <Button
                    component={Link}
                    to={item.link}
                    sx={{
                      ...menuItemStyles,
                      color:
                        isCurrentlyActive && openMegaMenu
                          ? theme.palette.primary.main
                          : "text.primary",
                      "&::after": {
                        ...menuItemStyles["&::after"],
                        transform:
                          isCurrentlyActive && openMegaMenu
                            ? "scaleX(1)"
                            : "scaleX(0)",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                </Box>
              );
            })}
          </Box>
        </Box>

        <MuiIconButton
          onClick={() => scrollMenu("right")}
          disabled={!canScrollRight}
          size="small"
          sx={{
            visibility: canScrollRight ? "visible" : "hidden",
            color: "text.secondary",
            ml: 0.5,
            "&:hover": { backgroundColor: "action.hover" },
          }}
          aria-label="Scroll menu right"
        >
          <IconChevronRight size={20} />
        </MuiIconButton>
      </Box>

      {/* Mega Menu Popover Panel for Main Categories */}
      <Popover
        open={openMegaMenu}
        anchorEl={anchorElMegaMenu}
        onClose={() => {
          clearTimeout(timeoutRef.current);
          setActiveMegaMenuCategoryLabel(null);
          setAnchorElMegaMenu(null); // Clear mega menu anchor
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          pointerEvents: "none",
          "& .MuiPopover-paper": {
            pointerEvents: "auto",
            maxWidth: "80vw", // Ensure it's not too narrow
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            mt: 0.5,
            boxShadow: theme.shadows[3],
            boxSizing: "border-box",
          },
        }}
        disableRestoreFocus
        PaperProps={{
          onMouseEnter: () => clearTimeout(timeoutRef.current),
          onMouseLeave: handleCloseMegaMenu,
        }}
      >
        <Box
          sx={{
            margin: "0 auto",
            px: menuHorizontalPagePadding,
            py: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {categoryDataForMegaMenu && activeMegaMenuCategoryLabel && (
            <>
              {hasSubgroupsInMegaMenu ? (
                <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                  {categoryDataForMegaMenu.subgroups.map((subgroup) => (
                    <Grid item key={subgroup.title}>
                      <Typography
                        variant="subtitle1"
                        component="h3"
                        sx={{
                          fontWeight: "600",
                          mb: 1,
                          fontSize: "1.15rem",
                          color: "primary.main",
                        }}
                      >
                        {subgroup.title}
                      </Typography>
                      {subgroup.subcategories.map((subcat) => (
                        <SubcategoryMenuItem
                          key={subcat}
                          itemText={subcat}
                          categoryName={activeMegaMenuCategoryLabel}
                          onNavigate={handleNavigation}
                          theme={theme}
                        />
                      ))}
                    </Grid>
                  ))}
                </Grid>
              ) : hasDirectSubcategoriesInMegaMenu ? (
                <Grid container spacing={{ xs: 0.5, sm: 1 }}>
                  {categoryDataForMegaMenu.subcategories.map((subcat) => (
                    <Grid item key={subcat}>
                      <SubcategoryMenuItem
                        itemText={subcat}
                        categoryName={activeMegaMenuCategoryLabel}
                        onNavigate={handleNavigation}
                        theme={theme}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : null}
            </>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default ServiceMenu;

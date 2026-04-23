/* eslint-disable no-unused-vars */
// Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Collapse,
  Badge,
  Menu,
  MenuItem,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Profile from "../layouts/private/profile";
import {
  IconMenu2,
  IconChevronDown,
  IconChevronUp,
  IconChevronRight,
  IconBriefcase,
  IconShoppingCartPlus,
  IconUserSearch,
  IconLayoutCards, // <-- IMPORT THIS ICON
} from "@tabler/icons-react";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ServiceMenu from "./servicesMenu";
import { categories } from "../data/categoryData";
import LogoImage from "../assets/logospare.png";

import { selectIsLoggedIn, selectUser } from "../store/slice/userSlice";
import { selectUnreadCount as selectUnreadChatCount } from "../store/slice/chatSlice";
import { selectUnreadNotificationCount } from "../store/slice/notificationSlice";
import { fetchUnreadCount as fetchNotificationUnreadCount } from "../store/thunks/notificationThunks";
import NotificationsPopover from "./NotificationsPopover";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [anchorElListMenu, setAnchorElListMenu] = useState(null);
  const [anchorElOffersMenu, setAnchorElOffersMenu] = useState(null);
  const [offersMenuType, setOffersMenuType] = useState(null);
  const [anchorElOffersSubmenu, setAnchorElOffersSubmenu] = useState(null);
  const [offersSubmenuAction, setOffersSubmenuAction] = useState(null);
  const [isOffersHovering, setIsOffersHovering] = useState(false);
  const openListMenu = Boolean(anchorElListMenu);
  const openOffersMenu = Boolean(anchorElOffersMenu);
  const openOffersSubmenu = Boolean(anchorElOffersSubmenu);
  const offersMenuCloseTimeoutRef = useRef(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const unreadChatCount = useSelector(selectUnreadChatCount);
  const unreadNotificationCount = useSelector(selectUnreadNotificationCount);

  const isSeller = user?.isSeller;

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchNotificationUnreadCount());
    }
  }, [dispatch, isLoggedIn]);

  useEffect(() => {
    return () => {
      if (offersMenuCloseTimeoutRef.current) {
        clearTimeout(offersMenuCloseTimeoutRef.current);
      }
    };
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCategoriesToggle = () => setCategoriesOpen(!categoriesOpen);

  const handleOpenListMenu = (event) => {
    setAnchorElListMenu(event.currentTarget);
  };
  const handleCloseListMenu = () => {
    setAnchorElListMenu(null);
  };

  const clearOffersMenuCloseTimeout = () => {
    if (offersMenuCloseTimeoutRef.current) {
      clearTimeout(offersMenuCloseTimeoutRef.current);
      offersMenuCloseTimeoutRef.current = null;
    }
  };

  const handleOpenOffersMenu = (event, menuType) => {
    clearOffersMenuCloseTimeout();
    setIsOffersHovering(true);
    setOffersMenuType(menuType);
    setAnchorElOffersMenu(event.currentTarget);
    setAnchorElOffersSubmenu(null);
    setOffersSubmenuAction(null);
  };

  const handleOpenOffersSubmenu = (event, actionType) => {
    clearOffersMenuCloseTimeout();
    setIsOffersHovering(true);
    setOffersSubmenuAction(actionType);
    setAnchorElOffersSubmenu(event.currentTarget);
  };

  const handleCloseOffersMenus = () => {
    clearOffersMenuCloseTimeout();
    setAnchorElOffersSubmenu(null);
    setOffersSubmenuAction(null);
    setAnchorElOffersMenu(null);
    setOffersMenuType(null);
    setIsOffersHovering(false);
  };

  const scheduleOffersMenusClose = () => {
    clearOffersMenuCloseTimeout();
    offersMenuCloseTimeoutRef.current = setTimeout(() => {
      handleCloseOffersMenus();
    }, 150); // Slightly shorter timeout for better responsiveness
  };

  const handleOffersPointerEnter = () => {
    clearOffersMenuCloseTimeout();
    setIsOffersHovering(true);
  };

  const handleOffersPointerLeave = () => {
    setIsOffersHovering(false);
    scheduleOffersMenusClose();
  };

  const handleMenuNavigation = (path, state = {}) => {
    navigate(path, { state });
    handleCloseListMenu();
    handleCloseOffersMenus();
    if (mobileOpen) setMobileOpen(false);
  };

  const getOfferActionLabels = (menuType, isAuthenticated) => {
    if (isAuthenticated) {
      if (menuType === "community") {
        return {
          list: "List Community Offer",
          request: "Request Community Offer",
        };
      }

      return {
        list: "List Special Deals",
        request: "Request Special Deals",
      };
    }

    if (menuType === "community") {
      return {
        request: "Get Community Offers",
        list: "List Community Offers",
      };
    }

    return {
      request: "Get Special Deals",
      list: "List Special Deals",
    };
  };

  const getOfferNavigationTarget = (menuType, actionType, resourceType) => {
    const isCommunity = menuType === "community";
    const isSpecialDeal = menuType === "special";

    if (actionType === "list") {
      if (resourceType === "service") {
        return {
          path: "/provider/services/add",
          state: { fromCommunityOffers: isCommunity, isCommunity: isCommunity, isSpecialDeal: isSpecialDeal },
        };
      }

      return {
        path: "/products/add",
        state: { fromCommunityOffers: isCommunity, isCommunity: isCommunity, isSpecialDeal: isSpecialDeal },
      };
    }

    if (isCommunity) {
      if (resourceType === "service") {
        return {
          path: "/service-requests/create?source=community-offers",
          state: { fromCommunityOffers: true, isCommunity: true, isSpecialDeal: false },
        };
      }

      return {
        path: "/requested-products/create",
        state: { fromCommunityOffers: true, isCommunity: true, isSpecialDeal: false },
      };
    }

    if (resourceType === "service") {
      return { path: "/service-requests/create", state: { isSpecialDeal: true } };
    }

    return { path: "/requested-products/create", state: { isSpecialDeal: true } };
  };

  const getUnauthorizedOfferPath = (menuType, actionType) => {
    if (menuType === "community") {
      return actionType === "request"
        ? "/community-offers/categories"
        : "/how-it-works";
    }

    return actionType === "request" ? "/special-deals" : "/how-it-works";
  };

  // MODIFICATION: "List Services/Products" will have its onClick/link handled dynamically
  const menuItems = [
    { label: "Get Service/Talent", link: "/services" },
    { label: "Products", link: "/products/categories-overview" }, // Added Products link
    {
      label: "List Services/Products",
      // onClick and link behavior for this item will be handled conditionally in the JSX
      id: "list-actions-button",
    },
    {
      label: "Community Offers",
      link: "/community-offers/categories",
      id: "community-offers-button",
    },
    {
      label: "Special Deals",
      link: "/special-deals",
      id: "special-deals",
    },
    { label: "Why Sparework", link: "/why-sparework" },
    { label: "Resources", link: "/resources" },
  ];

  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Menu
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {isLoggedIn && (
          <>
            {" "}
            {/* Messages & Notifications for logged-in users */}
            {/* ... (existing messages & notifications items) ... */}
            <ListItem key="messages-mobile" disablePadding>
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/messages");
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={unreadChatCount === 0}
                    overlap="circular"
                  >
                    <MailOutlineIcon fontSize="small" />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Messages" />
              </ListItemButton>
            </ListItem>
            <ListItem key="notifications-mobile" disablePadding>
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/notifications");
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                  <Badge
                    badgeContent={unreadNotificationCount}
                    color="error"
                    max={9}
                  >
                    <NotificationsPopover isMobileIconOnly={true} />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Notifications" />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1 }} />
          </>
        )}

        <ListItem key="find-talent-mobile" disablePadding>
          <ListItemButton onClick={() => handleMenuNavigation("/services")}>
            <ListItemText primary="Find Talent/Services" />
          </ListItemButton>
        </ListItem>
        <ListItem key="products-mobile" disablePadding>
          <ListItemButton
            onClick={() =>
              handleMenuNavigation("/products/categories-overview")
            }
          >
            <ListItemText primary="Products" />
          </ListItemButton>
        </ListItem>

        {/* --- Logged-in User Options for Listing/Requesting --- */}
        {isLoggedIn && (
          <>
            {isSeller && (
              <>
                <ListItem key="list-service-mobile" disablePadding>
                  <ListItemButton
                    onClick={() =>
                      handleMenuNavigation("/provider/services/add")
                    }
                  >
                    <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                      <IconBriefcase size={18} />
                    </ListItemIcon>
                    <ListItemText primary="List a Service" />
                  </ListItemButton>
                </ListItem>
                <ListItem key="list-product-all-users-mobile" disablePadding>
                  <ListItemButton
                    onClick={() => handleMenuNavigation("/products/add")}
                  >
                    <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                      <IconShoppingCartPlus size={18} />
                    </ListItemIcon>
                    <ListItemText primary="List a Product" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
            {!isSeller && (
              <>
                <ListItem key="request-service-mobile" disablePadding>
                  <ListItemButton
                    onClick={() =>
                      handleMenuNavigation("/service-requests/create")
                    }
                  >
                    <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                      <IconUserSearch size={18} />
                    </ListItemIcon>
                    <ListItemText primary="Request a Service" />
                  </ListItemButton>
                </ListItem>
                <ListItem key="request-product-mobile" disablePadding>
                  <ListItemButton
                    onClick={() =>
                      handleMenuNavigation("/requested-products/create")
                    }
                  >
                    <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                      <IconUserSearch size={18} />
                    </ListItemIcon>
                    <ListItemText primary="Request a product" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </>
        )}

        {/* MODIFICATION: For Logged-out Users - Link to How It Works page */}
        {!isLoggedIn && (
          <ListItem key="how-it-works-mobile" disablePadding>
            <ListItemButton
              onClick={() => handleMenuNavigation("/how-it-works")}
            >
              <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                <IconLayoutCards size={18} />
              </ListItemIcon>
              <ListItemText primary="How SpareWork Works" />
            </ListItemButton>
          </ListItem>
        )}

        {menuItems
          .filter(
            (item) =>
              // Keep filtering out "List Services/Products" as it's handled above based on login state
              item.label !== "List Services/Products" &&
              item.label !== "Get Service/Talent", // "Get Service/Talent" is "Find Talent/Services" above
          )
          .map((item) => (
            <ListItem key={item.label + "-mobile-other"} disablePadding>
              <ListItemButton
                onClick={() => {
                  if (item.link) handleMenuNavigation(item.link);
                  // if item.onClick and no link, it would be handled here too if needed
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        <Divider sx={{ my: 1 }} />
        <ListItemButton onClick={handleCategoriesToggle}>
          <ListItemText primary="Service Categories" />
          {categoriesOpen ? (
            <IconChevronUp size={18} />
          ) : (
            <IconChevronDown size={18} />
          )}
        </ListItemButton>
        <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
          {/* ... (existing categories list) ... */}
          <List component="div" disablePadding>
            {categories.map((category, index) => (
              <Box key={`${category.name}-${index}-mobile`} sx={{ pl: 2 }}>
                <ListItem disablePadding sx={{ mt: 1 }}>
                  <ListItemText
                    primary={category.name}
                    primaryTypographyProps={{ fontWeight: "bold" }}
                  />
                </ListItem>
                {category.subcategories.map((subcategory) => (
                  <ListItem
                    key={subcategory + "-mobile-sub"}
                    disablePadding
                    sx={{ pl: 2 }}
                  >
                    <ListItemButton
                      sx={{ py: 0.5 }}
                      onClick={() =>
                        handleMenuNavigation(
                          `/category/${category.name}/${subcategory}`,
                        )
                      }
                    >
                      <ListItemText primary={subcategory} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </Box>
            ))}
          </List>
        </Collapse>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        // ... (AppBar props)
        top={0}
        sx={{
          backgroundColor: theme.palette.background.default,
          zIndex: theme.zIndex.drawer + 1,
        }}
        elevation={1}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* ... (Logo) ... */}
          <Box
            component={Link}
            to="/"
            sx={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mr: 0.5,
            }}
          >
            <Box
              component="img"
              src={LogoImage}
              alt="SpareWork Logo"
              sx={{ height: 38, mb: 0.5 }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: "light",
                color: "primary.main",
                mt: -1,
                fontStyle: "italic",
              }}
            >
              Community MarketPlace!
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: { xs: 1, md: 1.15 },
              alignItems: "center",
            }}
          >
            {/* MODIFICATION: Dynamic rendering for menu items */}
            {menuItems.map((item, index) => {
              const commonButtonProps = {
                id: item.id,
                sx: {
                  color: "primary.main",
                  textTransform: "none",
                  typography: "body1",
                  "&:hover": { backgroundColor: "action.hover" },
                  fontSize: { xs: "14px", xl: "1rem" },
                  fontWeight: "700",
                },
              };

              if (item.label === "List Services/Products") {
                return (
                  <Button
                    key={index}
                    {...commonButtonProps}
                    onClick={
                      isLoggedIn
                        ? handleOpenListMenu
                        : () => navigate("/how-it-works")
                    }
                  >
                    {item.label}
                  </Button>
                );
              }

              if (
                item.label === "Community Offers" ||
                item.label === "Special Deals"
              ) {
                const menuType =
                  item.label === "Community Offers" ? "community" : "special";

                return (
                  <Button
                    key={index}
                    {...commonButtonProps}
                    component={Link}
                    to={item.link}
                    onPointerEnter={(event) => {
                      handleOpenOffersMenu(event, menuType);
                    }}
                    onPointerLeave={handleOffersPointerLeave}
                    onClick={() => {
                      handleCloseOffersMenus();
                    }}
                  >
                    {item.label}
                  </Button>
                );
              }

              return (
                <Button
                  key={index}
                  {...commonButtonProps}
                  component={item.link ? Link : "button"}
                  to={item.link}
                  onClick={item.onClick} // For items that are pure buttons with onClick
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1, md: 1.15 },
            }}
          >
            {/* ... (Message, Notification Icons, Profile/Auth Buttons, Mobile Menu Icon) ... */}
            {isLoggedIn /* Message & Notification Icons */ && (
              <>
                <IconButton
                  component={Link}
                  to="/messages"
                  color="inherit"
                  aria-label="show new messages"
                  sx={{
                    padding: { xs: "6px", md: "8px" },
                    color: "text.primary",
                  }}
                >
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={unreadChatCount === 0}
                  >
                    <MailOutlineIcon />
                  </Badge>
                </IconButton>
                <NotificationsPopover />
              </>
            )}
            {isLoggedIn ? (
              <Profile /> /* Auth Buttons */
            ) : (
              <>
                <Button
                  component={Link}
                  to={"/auth/signin"}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    fontSize: "13px",
                    paddingRight: "10px",
                    paddingLeft: "10px",
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={Link}
                  to={"/auth/signup"}
                  variant="contained"
                  disableElevation
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    backgroundColor: "common.black",
                    "&:hover": { backgroundColor: "grey.800" },
                    fontSize: "13px",
                    paddingRight: "10px",
                    paddingLeft: "10px",
                  }}
                >
                  JOIN
                </Button>
              </>
            )}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{
                display: { xs: "flex", md: "none" },
                color: "text.primary",
                p: { xs: "6px", sm: "8px" },
              }}
            >
              <IconMenu2 />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorElListMenu}
        // MODIFICATION: Only open this menu if the user is logged in
        open={openListMenu && isLoggedIn}
        onClose={handleCloseListMenu}
        MenuListProps={{
          "aria-labelledby": anchorElListMenu?.id || "list-actions-button",
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {/* Content is now only for logged-in users for this specific menu */}
        {/* The `isLoggedIn` check here is technically redundant due to the `open` prop, but good for clarity */}
        {isLoggedIn && (
          <>
            {isSeller && (
              <>
                <MenuItem
                  onClick={() => handleMenuNavigation("/provider/services/add")}
                >
                  <ListItemIcon>
                    <IconBriefcase size={18} />
                  </ListItemIcon>
                  List a Service
                </MenuItem>
                <MenuItem onClick={() => handleMenuNavigation("/products/add")}>
                  <ListItemIcon>
                    <IconShoppingCartPlus size={18} />
                  </ListItemIcon>
                  List a Product
                </MenuItem>
              </>
            )}
            {!isSeller && (
              <>
                <MenuItem
                  onClick={() =>
                    handleMenuNavigation("/service-requests/create")
                  }
                >
                  <ListItemIcon>
                    <IconUserSearch size={18} />
                  </ListItemIcon>
                  Request a Service
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    handleMenuNavigation("/requested-products/create")
                  }
                >
                  <ListItemIcon>
                    <IconUserSearch size={18} />
                  </ListItemIcon>
                  Request a product
                </MenuItem>
              </>
            )}
          </>
        )}
        {/* Logged-out options previously here are now removed as the main button navigates to /how-it-works */}
      </Menu>

      <Menu
        anchorEl={anchorElOffersMenu}
        open={openOffersMenu}
        onClose={handleCloseOffersMenus}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableRestoreFocus
        sx={{ pointerEvents: "none" }}
        slotProps={{
          paper: {
            onMouseEnter: handleOffersPointerEnter,
            onMouseLeave: handleOffersPointerLeave,
            sx: { pointerEvents: "auto", mt: 0.5 },
          },
        }}
      >
        {offersMenuType && (
          <>
            {isLoggedIn ? (
              <>
                <MenuItem
                  onPointerEnter={(event) =>
                    handleOpenOffersSubmenu(event, "list")
                  }
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    minWidth: 230,
                  }}
                >
                  {getOfferActionLabels(offersMenuType, true).list}
                  <IconChevronRight size={16} />
                </MenuItem>
                <MenuItem
                  onPointerEnter={(event) =>
                    handleOpenOffersSubmenu(event, "request")
                  }
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    minWidth: 230,
                  }}
                >
                  {getOfferActionLabels(offersMenuType, true).request}
                  <IconChevronRight size={16} />
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem
                  onClick={() =>
                    handleMenuNavigation(
                      getUnauthorizedOfferPath(offersMenuType, "request"),
                    )
                  }
                  sx={{ minWidth: 230 }}
                >
                  {getOfferActionLabels(offersMenuType, false).request}
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    handleMenuNavigation(
                      getUnauthorizedOfferPath(offersMenuType, "list"),
                    )
                  }
                  sx={{ minWidth: 230 }}
                >
                  {getOfferActionLabels(offersMenuType, false).list}
                </MenuItem>
              </>
            )}
          </>
        )}
      </Menu>

      <Menu
        anchorEl={anchorElOffersSubmenu}
        open={isLoggedIn && openOffersMenu && openOffersSubmenu}
        onClose={() => {
          setAnchorElOffersSubmenu(null);
          setOffersSubmenuAction(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableRestoreFocus
        sx={{ pointerEvents: "none" }}
        slotProps={{
          paper: {
            onMouseEnter: handleOffersPointerEnter,
            onMouseLeave: handleOffersPointerLeave,
            sx: { pointerEvents: "auto", ml: 0.5 },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const target = getOfferNavigationTarget(
              offersMenuType,
              offersSubmenuAction,
              "service",
            );
            handleMenuNavigation(target.path, target.state);
          }}
        >
          Service
        </MenuItem>
        <MenuItem
          onClick={() => {
            const target = getOfferNavigationTarget(
              offersMenuType,
              offersSubmenuAction,
              "product",
            );
            handleMenuNavigation(target.path, target.state);
          }}
        >
          Product
        </MenuItem>
      </Menu>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        // ... (Drawer props)
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 250 },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <ServiceMenu />
      </Box>
    </>
  );
};

export default Navbar;

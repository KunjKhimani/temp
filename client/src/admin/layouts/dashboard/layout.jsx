/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

// --- Import necessary components and data ---
import { _langs, _notifications } from "../../_mock"; // Adjust path if needed

// --- Import react-icons ---
import { IoHomeOutline, IoSettingsOutline } from "react-icons/io5"; // Example icons for Home and Settings
import { RiShieldKeyholeLine } from "react-icons/ri"; // Example icon for Profile (Shield Keyhole)

// --- Keep other necessary imports ---
import { Main } from "./main";
import { layoutClasses } from "../classes";
import { NavMobile, NavDesktop } from "./nav";
import { navData } from "../configNavDashboard"; // Ensure this uses react-icons now
import { Searchbar } from "../components/searchbar";
import { MenuButton } from "../components/menuButton";
import { LayoutSection } from "../core/layoutSection";
import { HeaderSection } from "../core/headerSection";
import { AccountPopover } from "../components/accountPopover";
import { LanguagePopover } from "../components/languagePopover";
import { NotificationsPopover } from "../components/notificationsPopover";

// Remove Iconify import if no longer used elsewhere in this file
// import { Iconify } from "../../components/iconify";

// ----------------------------------------------------------------------

export function DashboardLayout({ sx, children, header }) {
  const theme = useTheme();

  const [navOpen, setNavOpen] = useState(false);
  // --- Alert state and logic (keep as is) ---
  const [alertMessage, setAlertMessage] = useState("This is an info Alert.");
  const [openAlert, setOpenAlert] = useState(true);

  const handleClose = () => {
    setOpenAlert(false);
  };

  // Automatically close the alert after 8 seconds
  useEffect(() => {
    let closeTimer;
    if (openAlert) {
      // Only set timeout if alert is open
      closeTimer = setTimeout(handleClose, 8000);
    }
    return () => clearTimeout(closeTimer); // Clear timeout on unmount or if alert closes early
  }, [openAlert]); // Re-run effect if openAlert changes

  const layoutQuery = "lg";

  // --- Example useEffect (keep as is) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setAlertMessage("Welcome to the Dashboard!");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LayoutSection
      /** **************************************
       * Header
       *************************************** */
      headerSection={
        <HeaderSection
          layoutQuery={layoutQuery}
          slotProps={{
            container: {
              maxWidth: false,
              sx: { px: { [layoutQuery]: 5 } },
            },
          }}
          sx={header?.sx}
          slots={{
            topArea: (
              <>
                {openAlert && (
                  <Alert
                    severity="info"
                    sx={{ borderRadius: 0 }}
                    onClose={handleClose}
                  >
                    {alertMessage}
                  </Alert>
                )}
              </>
            ),
            leftArea: (
              <>
                <MenuButton
                  onClick={() => setNavOpen(true)}
                  sx={{
                    ml: -1,
                    [theme.breakpoints.up(layoutQuery)]: { display: "none" },
                  }}
                />
                <NavMobile // Ensure NavMobile uses react-icons internally if needed
                  data={navData}
                  open={navOpen}
                  onClose={() => setNavOpen(false)}
                />
              </>
            ),
            rightArea: (
              <Box gap={1} display="flex" alignItems="center">
                <Searchbar />
                <LanguagePopover data={_langs} />
                <NotificationsPopover data={_notifications} />

                <AccountPopover
                  data={[
                    {
                      label: "Home",
                      href: "/",
                      // Use react-icons component
                      icon: <IoHomeOutline size={20} />, // Adjust size as needed
                    },
                    {
                      label: "Profile",
                      href: "#",
                      // Use react-icons component
                      icon: <RiShieldKeyholeLine size={20} />, // Adjust size as needed
                    },
                    {
                      label: "Settings",
                      href: "#",
                      // Use react-icons component
                      icon: <IoSettingsOutline size={20} />, // Adjust size as needed
                    },
                  ]}
                />
              </Box>
            ),
          }}
        />
      }
      /** **************************************
       * Sidebar
       *************************************** */
      sidebarSection={
        <NavDesktop // Ensure NavDesktop uses react-icons internally
          data={navData}
          layoutQuery={layoutQuery}
        />
      }
      /** **************************************
       * Footer
       *************************************** */
      footerSection={null}
      /** **************************************
       * Style
       *************************************** */
      cssVars={{
        "--layout-nav-vertical-width": "250px",
        "--layout-dashboard-content-pt": theme.spacing(1),
        "--layout-dashboard-content-pb": theme.spacing(8),
        "--layout-dashboard-content-px": theme.spacing(5),
      }}
      sx={{
        [`& .${layoutClasses.hasSidebar}`]: {
          [theme.breakpoints.up(layoutQuery)]: {
            pl: "var(--layout-nav-vertical-width)",
          },
        },
        ...sx,
      }}
    >
      <Main>{children}</Main>
    </LayoutSection>
  );
}

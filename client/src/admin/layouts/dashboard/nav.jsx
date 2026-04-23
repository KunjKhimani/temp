/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */

import { useEffect } from "react";

import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import { alpha, useTheme } from "@mui/material/styles";
import ListItemButton from "@mui/material/ListItemButton";
import Drawer, { drawerClasses } from "@mui/material/Drawer";

import { usePathname } from "../../routes/hooks";
import { RouterLink } from "../../routes/components";

// import { Logo } from "src/components/logo";
import { Scrollbar } from "../../components/scrollbar";

// import { NavUpgrade } from "../components/navUpgrade";
import { varAlpha } from "../../theme/styles";
import { Typography } from "@mui/material";
// import { Logo } from "../../components/logo";
// import BottomNav from "../../components/logo/bottomNav";
// import { WorkspacesPopover } from '../components/workspaces-popover';
import LogoImage from "../../../assets/logospare.png"; // Import your logo image

// ----------------------------------------------------------------------

export function NavDesktop({ sx, data, slots, workspaces, layoutQuery }) {
  const theme = useTheme();
  const fallbackBorderColor = alpha(theme.palette.grey[500], 0.12);

  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: "none",
        position: "fixed",
        flexDirection: "column",
        bgcolor: "var(--layout-nav-bg)",
        zIndex: "var(--layout-nav-zIndex)",
        width: "var(--layout-nav-vertical-width)",
        borderRight: `1px solid var(--layout-nav-border-color, ${fallbackBorderColor})`,
        [theme.breakpoints.up(layoutQuery)]: {
          display: "flex",
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({ sx, data, open, slots, onClose, workspaces }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: "unset",
          bgcolor: "var(--layout-nav-bg)",
          width: "var(--layout-nav-mobile-width)",
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, slots, workspaces, sx }) {
  const pathname = usePathname();

  return (
    <>
      <RouterLink
        to="/"
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mr: 2,
        }}
      >
        <Box
          component="img"
          src={LogoImage}
          alt="SpareWork Logo"
          sx={{ height: 45, mb: 1 }}
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
      </RouterLink>

      {slots?.topArea}

      {/* <WorkspacesPopover data={workspaces} sx={{ my: 2 }} /> */}

      <Scrollbar fillContent>
        <Box
          component="nav"
          display="flex"
          flex="1 1 auto"
          flexDirection="column"
          sx={sx}
        >
          <Box component="ul" gap={0.5} display="flex" flexDirection="column">
            {data.map((item) => {
              const isActived = item.path === pathname;

              return (
                <ListItem disableGutters disablePadding key={item.title}>
                  <ListItemButton
                    disableGutters
                    component={RouterLink}
                    href={item.path}
                    sx={{
                      pl: 2,
                      py: 1,
                      gap: 2,
                      pr: 1.5,
                      borderRadius: 0.75,
                      typography: "body2",
                      fontWeight: "fontWeightMedium",
                      color: "var(--layout-nav-item-color)",
                      minHeight: "var(--layout-nav-item-height)",
                      ...(isActived && {
                        fontWeight: "fontWeightSemiBold",
                        bgcolor: "var(--layout-nav-item-active-bg)",
                        color: "var(--layout-nav-item-active-color)",
                        "&:hover": {
                          bgcolor: "var(--layout-nav-item-hover-bg)",
                        },
                      }),
                    }}
                  >
                    <Box component="span" sx={{ width: 24, height: 24 }}>
                      {item.icon}
                    </Box>

                    <Box component="span" flexGrow={1}>
                      {item.title}
                    </Box>

                    {item.info && item.info}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        </Box>
      </Scrollbar>

      {slots?.bottomArea}
      {/* <BottomNav /> */}

      {/* <NavUpgrade /> */}
    </>
  );
}

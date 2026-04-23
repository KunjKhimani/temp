/* eslint-disable react/prop-types */
import { forwardRef } from "react";
import { Icon, disableCache } from "@iconify/react";
import Box from "@mui/material/Box";
import { iconifyClasses } from "./classes";

// ----------------------------------------------------------------------

export const Iconify = forwardRef(
  ({ className, width = 20, sx, ...other }, ref) => (
    <Box
      ref={ref}
      component={Icon}
      className={iconifyClasses.root.concat(className ? ` ${className}` : "")}
      sx={{
        width,
        height: width,
        flexShrink: 0,
        display: "inline-flex",
        ...sx,
      }}
      {...other}
    />
  )
);

// Set display name for the Iconify component
Iconify.displayName = "Iconify";

// Disable local cache for icons
disableCache("local");

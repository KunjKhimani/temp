/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useId, forwardRef } from "react";

import Box from "@mui/material/Box";

import { RouterLink } from "../../routes/components";

import { logoClasses } from "./classes";

import PrimaryLogo from "../../assets/logo-svg/Primary-Logo.svg";
import LogoAlt from "../../assets/logo-svg/Logo-Alt.svg";

export const Logo = forwardRef(
  (
    {
      width,
      href = "/",
      height,
      isSingle = true,
      disableLink = false,
      className,
      sx,
      ...other
    },
    ref
  ) => {
    const singleLogo = (
      <Box
        alt="Single logo"
        component="img"
        src={PrimaryLogo}
        width="100%"
        height="100%"
      />
    );
    const fullLogo = (
      <Box
        alt="Full logo"
        component="img"
        src={LogoAlt}
        width="100%"
        height="100%"
      />
    );
    const baseSize = {
      width: width ?? 40,
      height: height ?? 40,
      ...(!isSingle && {
        width: width ?? 102,
        height: height ?? 36,
      }),
    };

    return (
      <Box
        ref={ref}
        component={RouterLink}
        href={href}
        className={logoClasses.root.concat(className ? ` ${className}` : "")}
        aria-label="Logo"
        sx={{
          ...baseSize,
          flexShrink: 0,
          display: "inline-flex",
          verticalAlign: "middle",

          ...(disableLink && { pointerEvents: "none" }),
          ...sx,
        }}
        {...other}
      >
        {isSingle ? singleLogo : fullLogo}
      </Box>
    );
  }
);

Logo.displayName = "Logo";

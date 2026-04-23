/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import { svgColorClasses } from "./svgColorClasses"; // Updated import
import { forwardRef } from "react";

// ----------------------------------------------------------------------

const SvgColor = forwardRef(
  ({ src, width = 24, height, className = "", sx, ...other }, ref) => (
    <Box
      ref={ref}
      component="span"
      className={svgColorClasses.root.concat(className ? ` ${className}` : "")}
      sx={{
        width,
        flexShrink: 0,
        height: height ?? width,
        display: "inline-flex",
        bgcolor: "currentColor",
        mask: `url(${src}) no-repeat center / contain`,
        WebkitMask: `url(${src}) no-repeat center / contain`,
        ...sx,
      }}
      {...other}
    />
  )
);

SvgColor.displayName = "SvgColor";

export default SvgColor;

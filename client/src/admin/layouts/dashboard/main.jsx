/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Container from "@mui/material/Container";

import { layoutClasses } from "../classes";

// ----------------------------------------------------------------------

export function Main({ children, sx, ...other }) {
  const theme = useTheme();

  return (
    <Box
      component="main"
      className={layoutClasses.main}
      sx={{
        display: "flex",
        flex: "1 1 auto",
        flexDirection: "column",

        // ✅ Proper balanced padding
        ml: 5,
        px: 2,
        pt: 2,
        pb: 2,

        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function DashboardContent({
  sx,
  children,
  disablePadding,
  maxWidth = "xl",
  ...other
}) {
  return (
    <Container
      className={layoutClasses.content}
      maxWidth={maxWidth || false}
      sx={{
        display: "flex",
        flex: "1 1 auto",
        flexDirection: "column",

        // ✅ Clean spacing
        px: 3,
        pt: 2,
        pb: 2,

        ...(disablePadding && {
          p: 0,
        }),

        ...sx,
      }}
      {...other}
    >
      {children}
    </Container>
  );
}
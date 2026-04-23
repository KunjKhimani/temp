/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import GlobalStyles from "@mui/material/GlobalStyles";

import { baseVars } from "../configVars";
import { layoutClasses } from "../classes";

// ----------------------------------------------------------------------

export function LayoutSection({
  sx,
  cssVars,
  children,
  footerSection,
  headerSection,
  sidebarSection,
}) {
  const theme = useTheme();

  const inputGlobalStyles = (
    <GlobalStyles
      styles={{
        body: {
          ...baseVars(theme),
          ...cssVars,
        },
      }}
    />
  );

  return (
    <>
      {inputGlobalStyles}

      <Box id="root__layout" className={layoutClasses.root} sx={sx}>
        {sidebarSection}
        <Box
          display="flex"
          flex="1 1 auto"
          flexDirection="column"
          className={layoutClasses.hasSidebar}
        >
          {headerSection}
          {children}
          {footerSection}
        </Box>
      </Box>
    </>
  );
}

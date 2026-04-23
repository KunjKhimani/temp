/* eslint-disable no-unused-vars */
import { createTheme } from "@mui/material/styles";
import { experimental_extendTheme as extendTheme } from "@mui/material/styles";

const theme = extendTheme({
  palette: {
    primary: {
      main: "#1976d2", // Primary color
      light: "#63a4ff", // Light shade of primary
      dark: "#004ba0", // Dark shade of primary
      contrastText: "#ffffff", // Text color for primary buttons
    },
    secondary: {
      main: "#82EEFD", // Secondary color
      light: "#82EEFD", // Light shade of secondary
      dark: "#53C2D3", // Dark shade of secondary
      contrastText: "#000000", // Text color for secondary buttons
    },
    background: {
      default: "#f4f6f8", // Background color
      paper: "#e6f1fc", // Card or container background
    },
    text: {
      primary: "#333333", // Default text color
      secondary: "#666666", // Secondary text color
      disabled: "#9e9e9e", // Disabled text color
    },
  },
  typography: {
    fontFamily: "'Poppins', 'Arial', sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: "highlighted" },
          style: {
            backgroundColor: "#8e24aa",
            color: "#ffffff",
            border: "1px solid #7b1fa2",
            fontWeight: 700,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#7b1fa2",
              boxShadow: "0 7px 13px rgba(123, 31, 162, 0.4)",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(142, 36, 170, 0.35)",
              color: "rgba(255, 255, 255, 0.8)",
              borderColor: "rgba(123, 31, 162, 0.35)",
            },
          },
        },
      ],
      styleOverrides: {
        root: {},
        containedPrimary: {
          backgroundColor: "#1971d2",
          "&:hover": {
            backgroundColor: "#004ba0",
          },
        },
        containedSecondary: {
          backgroundColor: "#82EEFD",
          "&:hover": {
            backgroundColor: "#53C2D3",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: "16px",
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#f9f9f9",
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          backgroundColor: "#ffffff",
        },
      },
    },
  },
  customShadows: {
    // Define your custom shadows object
    z8: "0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)", // Example for z8, adjust as needed
    // Add other custom shadows like z1, z12, z16, z20, z24 etc. if needed
  },
});

export default theme;

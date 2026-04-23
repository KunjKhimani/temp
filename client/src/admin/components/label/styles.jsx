import COLORS from "./colors.json";
import { alpha } from "@mui/material/styles";

// Grey
export const grey = COLORS.grey;

// Primary
export const primary = COLORS.primary;

// Secondary
export const secondary = COLORS.secondary;

// Info
export const info = COLORS.info;

// Success
export const success = COLORS.success;

// Warning
export const warning = COLORS.warning;

// Error
export const error = COLORS.error;

// Common
export const common = COLORS.common;

// Text
export const text = {
  light: {
    primary: grey[800],
    secondary: grey[600],
    disabled: grey[500],
  },
};

// Background
export const background = {
  light: {
    paper: "#FFFFFF",
    default: grey[100],
    neutral: grey[200],
  },
};

// Action
export const baseAction = {
  hover: alpha(grey[500], 0.08),
  selected: alpha(grey[500], 0.16),
  focus: alpha(grey[500], 0.24),
  disabled: alpha(grey[500], 0.8),
  disabledBackground: alpha(grey[500], 0.24),
  hoverOpacity: 0.08,
  disabledOpacity: 0.48,
};

export const action = {
  light: { ...baseAction, active: grey[600] },
};

/*
 * Base palette
 */
export const basePalette = {
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  grey,
  common,
  divider: alpha(grey[500], 0.2),
  action,
};

export const lightPalette = {
  ...basePalette,
  text: text.light,
  background: background.light,
  action: action.light,
};

// ----------------------------------------------------------------------

export const colorSchemes = {
  light: { palette: lightPalette },
};

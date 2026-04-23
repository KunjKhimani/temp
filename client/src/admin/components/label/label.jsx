/* eslint-disable react/prop-types */
import { styled, alpha } from "@mui/material/styles";
import { Typography } from "@mui/material";
// import { useTheme } from "@mui/material/styles";

const StyledLabel = styled(Typography)(({ theme, color = "default" }) => {
  const isDefault = color === "default";
  const isError = color === "error";
  const isSuccess = color === "success";
  const isInfo = color === "info"; // Add isInfo
  const isWarning = color === "warning"; // Add isWarning

  let backgroundColor = theme.palette.grey[500];
  let colorValue = theme.palette.text.primary;

  if (isDefault) {
    backgroundColor = theme.palette.grey[500];
    colorValue = theme.palette.text.primary;
  }

  if (isError) {
    const errorRgb = theme.palette.error.main.match(
      /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
    );
    if (errorRgb) {
      const r = parseInt(errorRgb[1], 16);
      const g = parseInt(errorRgb[2], 16);
      const b = parseInt(errorRgb[3], 16);

      backgroundColor = alpha(`rgb(${r}, ${g}, ${b})`, 0.16);
      colorValue = theme.palette.error.main;
    }
  }

  if (isSuccess) {
    const successRgb = theme.palette.success.main.match(
      /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
    );
    if (successRgb) {
      const r = parseInt(successRgb[1], 16);
      const g = parseInt(successRgb[2], 16);
      const b = parseInt(successRgb[3], 16);

      backgroundColor = alpha(`rgb(${r}, ${g}, ${b})`, 0.16);
      colorValue = theme.palette.success.main;
    }
  }
  //Info
  if (isInfo) {
    const infoRgb = theme.palette.info.main.match(
      /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
    );
    if (infoRgb) {
      const r = parseInt(infoRgb[1], 16);
      const g = parseInt(infoRgb[2], 16);
      const b = parseInt(infoRgb[3], 16);

      backgroundColor = alpha(`rgb(${r}, ${g}, ${b})`, 0.16);
      colorValue = theme.palette.info.main;
    }
  }
  //Warning
  if (isWarning) {
    const warningRgb = theme.palette.warning.main.match(
      /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
    );
    if (warningRgb) {
      const r = parseInt(warningRgb[1], 16);
      const g = parseInt(warningRgb[2], 16);
      const b = parseInt(warningRgb[3], 16);

      backgroundColor = alpha(`rgb(${r}, ${g}, ${b})`, 0.16);
      colorValue = theme.palette.warning.main;
    }
  }

  return {
    backgroundColor,
    color: colorValue,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontWeight: theme.typography.fontWeightMedium,
  };
});

export default function Label({ color, children, ...other }) {
  return (
    <StyledLabel color={color} component="span" variant="body2" {...other}>
      {children}
    </StyledLabel>
  );
}

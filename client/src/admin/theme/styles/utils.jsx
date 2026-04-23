export const stylesMode = {
  light: '[data-mui-color-scheme="light"] &',
  dark: '[data-mui-color-scheme="dark"] &',
};

export const mediaQueries = {
  upXs: "@media (min-width:0px)",
  upSm: "@media (min-width:600px)",
  upMd: "@media (min-width:900px)",
  upLg: "@media (min-width:1200px)",
  upXl: "@media (min-width:1536px)",
};

/**
 * Set font family
 */
export function setFont(fontName) {
  return `"${fontName}",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"`;
}

/**
 * Converts rem to px
 */
export function remToPx(value) {
  return Math.round(parseFloat(value) * 16);
}

/**
 * Converts px to rem
 */
export function pxToRem(value) {
  return `${value / 16}rem`;
}

/**
 * Responsive font sizes
 */
export function responsiveFontSizes({ sm, md, lg }) {
  return {
    [mediaQueries.upSm]: { fontSize: pxToRem(sm) },
    [mediaQueries.upMd]: { fontSize: pxToRem(md) },
    [mediaQueries.upLg]: { fontSize: pxToRem(lg) },
  };
}

/**
 * Converts a hex color to RGB channels
 */
export function hexToRgbChannel(hex) {
  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return `${r} ${g} ${b}`;
}

/**
 * Converts a hex color to RGB channels
 */
export function createPaletteChannel(hexPalette) {
  const channelPalette = {};

  Object.entries(hexPalette).forEach(([key, value]) => {
    channelPalette[`${key}Channel`] = hexToRgbChannel(value);
  });

  return { ...hexPalette, ...channelPalette };
}

/**
 * Color with alpha channel
 */
export function varAlpha(color, opacity = 1) {
  if (!color || typeof color !== "string") {
    throw new Error(
      `[Alpha]: Invalid color value "${color}". Expected a non-empty string.`
    );
  }

  // Convert hex to RGB channels
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    color = hexToRgbChannel(color);
  }

  const unsupported = color.startsWith("rgb") || color.startsWith("rgba");

  if (unsupported) {
    throw new Error(
      `[Alpha]: Unsupported color format "${color}".
         Supported formats are:
         - Hex: "#RRGGBB"
         - RGB channels: "0 184 217"
         - CSS variables with "Channel" prefix: "var(--palette-common-blackChannel)"
         `
    );
  }

  return `rgba(${color} / ${opacity})`;
}

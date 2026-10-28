// WCAG 2.x contrast helpers for colors that arrive at runtime (macrotheme
// colors from the CMS), where a fixed Tailwind token cannot guarantee contrast.

export const MIN_CONTRAST_NORMAL_TEXT = 4.5;

// Text at least 24px, or 18.66px bold, only needs 3:1 (WCAG 1.4.3).
export const MIN_CONTRAST_LARGE_TEXT = 3;

const WHITE = "#ffffff";
const BLACK = "#000000";

// Same value as --color-grey-1100 in globals.css.
const DARK_TEXT = "#292829";

const DARKEN_STEP = 0.05;

type Rgb = [number, number, number];

const HEX_COLOR = /^#?([0-9a-f]{6})$/i;

const parseHex = (hex: string): Rgb | null => {
  const match = HEX_COLOR.exec(hex.trim());
  if (!match) return null;

  const value = parseInt(match[1], 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toHex = (rgb: Rgb): string =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

const channelLuminance = (channel: number): number => {
  const c = channel / 255;

  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = ([r, g, b]: Rgb): number =>
  0.2126 * channelLuminance(r) +
  0.7152 * channelLuminance(g) +
  0.0722 * channelLuminance(b);

const ratioBetween = (a: Rgb, b: Rgb): number => {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );

  return (light + 0.05) / (dark + 0.05);
};

/**
 * WCAG contrast ratio between two `#rrggbb` colors, or null if either is
 * not a 6-digit hex.
 *
 * @example getContrastRatio("#017f35", "#ffffff"); // ≈ 5.14
 */
export const getContrastRatio = (a: string, b: string): number | null => {
  const rgbA = parseHex(a);
  const rgbB = parseHex(b);
  if (!rgbA || !rgbB) return null;

  return ratioBetween(rgbA, rgbB);
};

/**
 * Text color for a label painted on `background`: white while it reaches
 * 4.5:1, else the portal's dark grey, else black. Black always passes when
 * white fails (the better of the two is at least 4.58:1). Unparseable colors
 * keep white, the previous behavior.
 *
 * @example <span style={{ backgroundColor: c, color: getReadableTextColor(c) }} />
 */
export const getReadableTextColor = (background: string): string => {
  const whiteRatio = getContrastRatio(background, WHITE);
  if (whiteRatio === null || whiteRatio >= MIN_CONTRAST_NORMAL_TEXT) {
    return WHITE;
  }

  const darkRatio = getContrastRatio(background, DARK_TEXT) ?? 0;

  return darkRatio >= MIN_CONTRAST_NORMAL_TEXT ? DARK_TEXT : BLACK;
};

/**
 * Darkens `color` just enough to reach `minRatio` against white, keeping its
 * hue. Unparseable colors are returned unchanged.
 *
 * @example darkenForWhiteBackground("#35b2db", MIN_CONTRAST_LARGE_TEXT);
 */
export const darkenForWhiteBackground = (
  color: string,
  minRatio: number = MIN_CONTRAST_NORMAL_TEXT,
): string => {
  const rgb = parseHex(color);
  if (!rgb) return color;

  const white: Rgb = [255, 255, 255];
  let factor = 1;
  let candidate = rgb;

  while (ratioBetween(candidate, white) < minRatio && factor > 0) {
    factor = Math.max(0, factor - DARKEN_STEP);
    candidate = rgb.map((c) => c * factor) as Rgb;
  }

  return candidate === rgb ? color : toHex(candidate);
};

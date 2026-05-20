import {
  contrastRatio,
  hexToRgb,
  normalizeHexColor,
  pickPrimaryForeground,
  relativeLuminance,
} from "@/lib/branding/portal-brand-tokens";

/**
 * @param {string | null | undefined} brandColor
 * @returns {{ valid: boolean; ratio: number | null; passesAa: boolean }}
 */
export function getPortalBrandContrastMeta(brandColor) {
  const rgb = hexToRgb(brandColor ?? "");
  if (!rgb) {
    return { valid: false, ratio: null, passesAa: false };
  }

  const bgL = relativeLuminance(rgb);
  const fg = pickPrimaryForeground(rgb);
  const fgL =
    fg === "rgb(250 250 250)"
      ? relativeLuminance({ r: 250, g: 250, b: 250 })
      : relativeLuminance({ r: 15, g: 23, b: 42 });
  const ratio = contrastRatio(bgL, fgL);

  return {
    valid: true,
    ratio,
    passesAa: ratio >= 4.5,
  };
}

export { normalizeHexColor };

/** Default Mably primary orange — picker default; stored as null (webp + global theme). */
export const MABLY_DEFAULT_BRAND_HEX = "#f97316";

/** Legacy picker default (orange-400) — treat like Mably primary for storage and wallpapers. */
export const MABLY_LEGACY_DEFAULT_BRAND_HEX = "#fb923c";

const MABLY_DEFAULT_BRAND_HEXES = new Set([
  MABLY_DEFAULT_BRAND_HEX,
  MABLY_LEGACY_DEFAULT_BRAND_HEX,
]);

/** Default Mably orange — used when no project brand is set. */
export const PORTAL_BRAND_DEFAULT_RGB = "249 115 22";

/**
 * @param {string | null | undefined} input
 */
export function isMablyDefaultBrandColor(input) {
  const normalized = normalizeHexColor(input ?? "");
  return Boolean(normalized && MABLY_DEFAULT_BRAND_HEXES.has(normalized));
}

/** Custom brand wallpaper (not dashboard-bg / chat-bg webp). */
export function usesCustomPortalWallpaper(brandColor) {
  return Boolean(resolvePortalBrandColor(brandColor));
}

/**
 * Custom portal brand only when set and not Mably default.
 * @param {string | null | undefined} brandColor
 * @returns {string | null}
 */
export function resolvePortalBrandColor(brandColor) {
  if (!brandColor || typeof brandColor !== "string") return null;
  const trimmed = brandColor.trim();
  if (!trimmed) return null;
  const normalized = normalizeHexColor(trimmed);
  if (!normalized || isMablyDefaultBrandColor(normalized)) return null;
  return normalized;
}

/**
 * Persisted value for `brand_color` — null when empty or Mably default.
 * @param {string | null | undefined} brandColor
 * @returns {string | null}
 */
export function normalizePortalBrandColorForStorage(brandColor) {
  return resolvePortalBrandColor(brandColor);
}

/**
 * Hex for color pickers — custom brand or Mably default when unset.
 * @param {string | null | undefined} stored
 */
export function getDisplayBrandColor(stored) {
  return resolvePortalBrandColor(stored) ?? MABLY_DEFAULT_BRAND_HEX;
}

const FOREGROUND_LIGHT = "rgb(250 250 250)";
const FOREGROUND_DARK = "rgb(15 23 42)";

/** WCAG AA for UI components / large text on buttons */
const MIN_BUTTON_CONTRAST = 3;

const LIGHT_FG_L = relativeLuminance({ r: 250, g: 250, b: 250 });
const DARK_FG_L = relativeLuminance({ r: 15, g: 23, b: 42 });

/**
 * @param {string} input
 * @returns {string | null}
 */
export function normalizeHexColor(input) {
  if (!input || typeof input !== "string") return null;
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    hex = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex.toLowerCase();
}

/**
 * @param {string} hex
 * @returns {{ r: number; g: number; b: number } | null}
 */
export function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

/**
 * WCAG relative luminance (sRGB).
 * @param {{ r: number; g: number; b: number }} rgb
 */
export function relativeLuminance(rgb) {
  const channels = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * @param {number} l1
 * @param {number} l2
 */
export function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * HSV-style saturation in 0–1 (how chromatic the brand color is).
 * @param {{ r: number; g: number; b: number }} rgb
 */
export function colorSaturation(rgb) {
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/**
 * Hue in degrees 0–360 (sRGB).
 * @param {{ r: number; g: number; b: number }} rgb
 */
export function colorHueDegrees(rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return ((h * 60) % 360 + 360) % 360;
}

/**
 * Pick light or dark text for filled brand surfaces (buttons, badges).
 *
 * Pure WCAG “higher contrast wins” picks dark text on oranges like #f97316.
 * Brand UIs use white on those — we combine contrast floors with hue/saturation
 * rules so defaults match Mably while pastels and yellows stay readable.
 *
 * @param {{ r: number; g: number; b: number }} rgb
 */
export function pickPrimaryForeground(rgb) {
  const bgL = relativeLuminance(rgb);
  const sat = colorSaturation(rgb);
  const hue = colorHueDegrees(rgb);
  const onLight = contrastRatio(bgL, LIGHT_FG_L);
  const onDark = contrastRatio(bgL, DARK_FG_L);

  // Light pastels / tints — dark text
  if (bgL >= 0.62) {
    return onDark >= MIN_BUTTON_CONTRAST ? FOREGROUND_DARK : FOREGROUND_LIGHT;
  }

  // Deep shades — light text
  if (bgL <= 0.18) {
    return FOREGROUND_LIGHT;
  }

  // Yellow / gold (white text fails perceptually) — dark text
  if (hue >= 42 && hue <= 78 && bgL >= 0.35) {
    return onDark >= MIN_BUTTON_CONTRAST ? FOREGROUND_DARK : FOREGROUND_LIGHT;
  }

  // Mably-style oranges + vivid reds / magentas / blues / greens
  const isOrangeRed = hue >= 8 && hue < 42;
  const isVividBrandHue =
    isOrangeRed ||
    (hue >= 78 && hue < 300 && sat >= 0.45 && bgL < 0.58);

  if (isVividBrandHue && sat >= 0.45 && bgL < 0.58) {
    if (onLight >= 2.15) return FOREGROUND_LIGHT;
    if (onDark >= MIN_BUTTON_CONTRAST) return FOREGROUND_DARK;
  }

  // Both pass button contrast — prefer light on chromatic colors, dark on muted
  if (onLight >= MIN_BUTTON_CONTRAST && onDark >= MIN_BUTTON_CONTRAST) {
    return sat >= 0.28 ? FOREGROUND_LIGHT : FOREGROUND_DARK;
  }

  if (onLight >= MIN_BUTTON_CONTRAST) return FOREGROUND_LIGHT;
  if (onDark >= MIN_BUTTON_CONTRAST) return FOREGROUND_DARK;

  return onLight >= onDark ? FOREGROUND_LIGHT : FOREGROUND_DARK;
}

/**
 * CSS custom properties for portal-scoped branding (buttons, links, gradients).
 * Returns null when brand color is missing or invalid — portal keeps Mably defaults.
 *
 * @param {string | null | undefined} brandColor
 * @returns {Record<string, string> | null}
 */
export function getPortalBrandCssProperties(brandColor) {
  const resolved = resolvePortalBrandColor(brandColor);
  if (!resolved) return null;
  const rgb = hexToRgb(resolved);
  if (!rgb) return null;

  const primary = `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
  const primaryForeground = pickPrimaryForeground(rgb);

  return {
    "--portal-primary": primary,
    "--primary": primary,
    "--primary-foreground": primaryForeground,
    "--ring": primary,
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": primaryForeground,
  };
}

/**
 * Gradient tint strengths — very light brand swatches need slightly more mix to show.
 * @param {{ r: number; g: number; b: number }} rgb
 */
function getPortalBrandGradientMixes(rgb) {
  const L = relativeLuminance(rgb);
  if (L >= 0.62) {
    return { gradientStart: 20, gradientEnd: 11, border: 32, glow: 22 };
  }
  if (L <= 0.22) {
    return { gradientStart: 16, gradientEnd: 9, border: 30, glow: 16 };
  }
  return { gradientStart: 14, gradientEnd: 8, border: 28, glow: 18 };
}

/**
 * Inline surface + glow styles for brand-tinted headers (portaled dialogs included).
 *
 * @param {string | null | undefined} brandColor
 * @param {{ dark?: boolean }} [options]
 * @returns {{ surface: import("react").CSSProperties; glow: import("react").CSSProperties } | null}
 */
export function getPortalBrandSurfaceStyles(brandColor, options = {}) {
  const resolved = resolvePortalBrandColor(brandColor);
  if (!resolved) return null;
  const rgb = hexToRgb(resolved);
  if (!rgb) return null;

  const primary = `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
  const mix = getPortalBrandGradientMixes(rgb);
  const dark = Boolean(options.dark);

  const gradientStart = dark
    ? Math.min(28, Math.round(mix.gradientStart * 1.45))
    : mix.gradientStart;
  const gradientEnd = dark
    ? Math.min(16, Math.round(mix.gradientEnd * 1.25))
    : mix.gradientEnd;
  const border = dark ? Math.min(40, Math.round(mix.border * 1.12)) : mix.border;
  const glow = dark ? Math.min(26, Math.round(mix.glow * 1.12)) : mix.glow;

  return {
    surface: {
      borderBottomWidth: "1px",
      borderColor: `color-mix(in srgb, ${primary} ${border}%, transparent)`,
      background: `linear-gradient(to bottom right, color-mix(in srgb, ${primary} ${gradientStart}%, var(--background)), var(--background), color-mix(in srgb, ${primary} ${gradientEnd}%, var(--background)))`,
    },
    glow: {
      backgroundColor: `color-mix(in srgb, ${primary} ${glow}%, transparent)`,
    },
  };
}

/** Dashboard / chat wallpaper tints — scaled down for a softer wash (see BACKGROUND_WALLPAPER_LIGHTEN). */
const BACKGROUND_WALLPAPER_LIGHTEN = 0.7;

function scaleBackgroundMix(pct) {
  return Math.max(4, Math.round(pct * BACKGROUND_WALLPAPER_LIGHTEN));
}

/**
 * Ambient wallpaper mixes — tuned to feel closer to dashboard-bg / chat-bg.webp.
 * (Custom CSS gradients need higher % than you'd use for UI chrome.)
 */
function getPortalBrandBackgroundMixes(rgb) {
  const L = relativeLuminance(rgb);
  let base;
  if (L >= 0.62) base = { a: 40, b: 28, c: 18 };
  else if (L <= 0.22) base = { a: 32, b: 22, c: 14 };
  else base = { a: 38, b: 26, c: 16 };
  return {
    a: scaleBackgroundMix(base.a),
    b: scaleBackgroundMix(base.b),
    c: scaleBackgroundMix(base.c),
  };
}

/**
 * Soft multi-stop gradient replacing dashboard-bg.webp / chat-bg.webp for custom brands.
 *
 * @param {string | null | undefined} brandColor
 * @param {{ dark?: boolean; variant?: "dashboard" | "chat" }} [options]
 * @returns {import("react").CSSProperties | null}
 */
export function getPortalBrandBackgroundStyle(brandColor, options = {}) {
  const resolved = resolvePortalBrandColor(brandColor);
  if (!resolved) return null;
  const rgb = hexToRgb(resolved);
  if (!rgb) return null;

  const primary = `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
  const mix = getPortalBrandBackgroundMixes(rgb);
  const dark = Boolean(options.dark);
  const variant = options.variant === "chat" ? "chat" : "dashboard";
  const scale = dark ? 1.15 : 1;
  const a = Math.min(48, Math.round(mix.a * scale));
  const b = Math.min(34, Math.round(mix.b * scale));
  const c = Math.min(24, Math.round(mix.c * scale));
  const tint = (pct) => `color-mix(in srgb, ${primary} ${pct}%, transparent)`;
  const mid = (pct) =>
    tint(Math.max(6, Math.round(pct * 0.55 * BACKGROUND_WALLPAPER_LIGHTEN)));

  if (variant === "chat") {
    return {
      backgroundColor: "var(--background)",
      backgroundImage: [
        `radial-gradient(ellipse 140% 100% at 92% -8%, ${tint(a)} 0%, ${mid(a)} 36%, transparent 76%)`,
        `radial-gradient(ellipse 115% 90% at 0% 102%, ${tint(b)} 0%, ${mid(b)} 32%, transparent 72%)`,
        `linear-gradient(165deg, ${tint(c)} 0%, color-mix(in srgb, ${primary} ${Math.round(c * 0.45 * BACKGROUND_WALLPAPER_LIGHTEN)}%, var(--background)) 32%, var(--background) 58%)`,
      ].join(", "),
    };
  }

  return {
    backgroundColor: "var(--background)",
    backgroundImage: [
      `radial-gradient(ellipse 120% 95% at 50% -12%, ${tint(a)} 0%, ${mid(a)} 40%, transparent 78%)`,
      `radial-gradient(ellipse 95% 85% at 102% 38%, ${tint(b)} 0%, ${mid(b)} 34%, transparent 70%)`,
      `radial-gradient(ellipse 85% 75% at -8% 88%, ${tint(c)} 0%, ${mid(c)} 30%, transparent 68%)`,
      `linear-gradient(to bottom, color-mix(in srgb, ${primary} ${Math.round(c * 0.35 * BACKGROUND_WALLPAPER_LIGHTEN)}%, var(--background)) 0%, var(--background) 42%)`,
    ].join(", "),
  };
}

export const PORTAL_DASHBOARD_BG_IMAGE = "/images/dashboard-bg.webp";
export const PORTAL_CHAT_BG_IMAGE = "/images/chat-bg.webp";

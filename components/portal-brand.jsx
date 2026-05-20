"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getPortalBrandBackgroundStyle,
  getPortalBrandCssProperties,
  getPortalBrandSurfaceStyles,
  resolvePortalBrandColor,
} from "@/lib/branding/portal-brand-tokens";

const PortalBrandContext = createContext({
  brandCss: null,
  brandColor: null,
  hasBrand: false,
});

function useDocumentDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

/**
 * Radix dialogs/menus portal to `document.body`, outside the React brand wrapper.
 * Mirror tokens on `<html>` so portaled primary buttons and rings match the project brand.
 */
function usePortalBrandDocumentTheme(brandCss) {
  useEffect(() => {
    if (!brandCss) return;

    const root = document.documentElement;
    const previous = new Map();

    for (const [key, value] of Object.entries(brandCss)) {
      previous.set(key, root.style.getPropertyValue(key));
      root.style.setProperty(key, value);
    }
    root.setAttribute("data-portal-brand-active", "");

    return () => {
      for (const [key, prev] of previous) {
        if (prev) root.style.setProperty(key, prev);
        else root.style.removeProperty(key);
      }
      root.removeAttribute("data-portal-brand-active");
    };
  }, [brandCss]);
}

/**
 * Scopes project brand color to the client portal (primary buttons, links, gradients).
 * Does not alter global app theme when `brandColor` is null.
 */
export function PortalBrandProvider({ brandColor, children }) {
  const effectiveBrandColor = useMemo(
    () => resolvePortalBrandColor(brandColor),
    [brandColor]
  );

  const brandCss = useMemo(
    () => getPortalBrandCssProperties(effectiveBrandColor),
    [effectiveBrandColor]
  );

  usePortalBrandDocumentTheme(brandCss);

  const value = useMemo(
    () => ({
      brandCss,
      brandColor: effectiveBrandColor,
      hasBrand: Boolean(brandCss),
    }),
    [brandCss, effectiveBrandColor]
  );

  return (
    <PortalBrandContext.Provider value={value}>
      <div
        data-portal-brand={brandCss ? "" : undefined}
        style={brandCss ?? undefined}
        className="contents"
      >
        {children}
      </div>
    </PortalBrandContext.Provider>
  );
}

export function usePortalBrand() {
  return useContext(PortalBrandContext);
}

/** Brand-tinted header gradient for portaled dialogs (inline styles). */
export function usePortalBrandSurfaceStyles() {
  const { brandColor } = usePortalBrand();
  const isDark = useDocumentDarkMode();

  return useMemo(
    () => getPortalBrandSurfaceStyles(brandColor, { dark: isDark }),
    [brandColor, isDark]
  );
}

/**
 * @param {"dashboard" | "chat"} [variant]
 */
export function usePortalBrandBackgroundStyle(variant = "dashboard") {
  const { brandColor } = usePortalBrand();
  const isDark = useDocumentDarkMode();

  return useMemo(
    () => getPortalBrandBackgroundStyle(brandColor, { dark: isDark, variant }),
    [brandColor, isDark, variant]
  );
}

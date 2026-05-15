/** @typedef {"dark" | "light"} EarlyOfferTheme */

/** @type {Record<EarlyOfferTheme, object>} */
export const EARLY_OFFER_THEME = {
  dark: {
    overlay: "bg-black/85 backdrop-blur-md",
    shell:
      "rounded-[1.75rem] bg-[#050508] text-white shadow-[0_0_100px_rgba(59,130,246,0.18),0_32px_96px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.06]",
    shellPortrait:
      "rounded-[1.75rem] bg-[#050508] text-white shadow-[0_0_80px_rgba(59,130,246,0.15),0_24px_80px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]",
    divider: "border-white/[0.06]",
    headline: "text-white/90",
    body: "text-white/55",
    muted: "text-white/50",
    mutedFaint: "text-white/35",
    priceStrike: "text-white/45 line-through decoration-white/35",
    priceMain: "text-white",
    priceSub: "text-white/70",
    priceList: "text-white/50",
    priceListValue: "text-white/80",
    priceListStrike: "text-white/35",
    sparkle: "text-white/90",
    sparkleMid: "text-white",
    discountCard:
      "bg-white shadow-[0_0_40px_rgba(255,255,255,0.22)] text-black",
    discountForever: "text-black/80",
    planBar: "from-[#f5d9b8] via-[#fde8d4] to-[#b8d4f5] text-black/85",
    planPickerShell:
      "ring-1 ring-white/[0.12] bg-[#0e0e16]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_12px_40px_rgba(0,0,0,0.45)]",
    planWell: "border-t border-white/[0.08] bg-[#14141f]",
    planBorderActive:
      "bg-gradient-to-r from-[#e8c9a0] via-[#f5e6d3] to-[#a8c8f0] shadow-[0_0_24px_rgba(251,191,36,0.15)]",
    planBorderIdle: "bg-white/10 hover:bg-white/15",
    planInner: "bg-[#0a0a0f]",
    planInnerIdle: "bg-[#0a0a0f]/90",
    planTitle: "text-white",
    planDesc: "text-white/45",
    planPrice: "text-white",
    planPriceStrike: "text-white/35",
    planBadge: "bg-amber-400/15 text-amber-200/90",
    indicatorActive: "bg-white text-black",
    indicatorIdle: "border-white/20",
    close: "text-white/70 hover:bg-white/10 hover:text-white",
    ctaBorder:
      "shadow-[0_0_16px_rgba(251,191,36,0.1)] hover:shadow-[0_0_20px_rgba(251,191,36,0.16)]",
    ctaInner:
      "bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.08)] hover:bg-white/95",
    footer: "text-white/40",
    footerLink: "text-white/35 hover:text-white/55",
    stickyFabBorder:
      "shadow-[0_0_16px_rgba(251,191,36,0.12),0_8px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(251,191,36,0.16),0_10px_28px_rgba(0,0,0,0.36)]",
    stickyFabInner: "bg-[#0a0a0f] text-white",
    stickyFabAccent: "bg-gradient-to-r from-[#f5d9b8] via-[#fde8d4] to-[#b8d4f5] text-black/90",
    stickyFabSub: "text-white/55",
  },
  light: {
    overlay: "bg-zinc-900/40 backdrop-blur-sm",
    shell:
      "rounded-[1.75rem] bg-gradient-to-br from-orange-50 via-white to-violet-50/80 text-zinc-900 shadow-[0_24px_80px_rgba(249,115,22,0.12),0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-orange-200/60",
    shellPortrait:
      "rounded-[1.75rem] bg-gradient-to-b from-orange-50 via-white to-violet-50/70 text-zinc-900 shadow-[0_24px_64px_rgba(249,115,22,0.14)] ring-1 ring-orange-200/60",
    divider: "border-orange-200/40",
    headline: "text-orange-600",
    body: "text-zinc-600",
    muted: "text-zinc-500",
    mutedFaint: "text-zinc-400",
    priceStrike: "text-zinc-400 line-through decoration-zinc-300",
    priceMain: "text-zinc-900",
    priceSub: "text-zinc-500",
    priceList: "text-zinc-500",
    priceListValue: "text-zinc-800",
    priceListStrike: "text-zinc-400",
    sparkle: "text-orange-400/80",
    sparkleMid: "text-orange-500",
    discountCard:
      "bg-gradient-to-br from-orange-500 to-orange-600 shadow-[0_12px_40px_rgba(249,115,22,0.35)] text-white",
    discountForever: "text-white/90",
    planBar: "from-orange-400 via-orange-300 to-violet-300 text-white",
    planPickerShell:
      "ring-1 ring-orange-200/80 bg-white shadow-[0_4px_24px_rgba(249,115,22,0.08)]",
    planWell: "border-t border-orange-100/80 bg-gradient-to-b from-orange-50/90 to-white",
    planBorderActive:
      "bg-gradient-to-r from-orange-400 via-orange-300 to-violet-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]",
    planBorderIdle: "bg-orange-100/60 hover:bg-orange-100",
    planInner: "bg-white",
    planInnerIdle: "bg-white/95",
    planTitle: "text-zinc-900",
    planDesc: "text-zinc-500",
    planPrice: "text-zinc-900",
    planPriceStrike: "text-zinc-400",
    planBadge: "bg-orange-100 text-orange-700",
    indicatorActive: "bg-orange-500 text-white",
    indicatorIdle: "border-zinc-300",
    close: "text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-800",
    ctaBorder:
      "shadow-[0_0_14px_rgba(249,115,22,0.18)] hover:shadow-[0_0_18px_rgba(249,115,22,0.24)]",
    ctaInner:
      "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_2px_10px_rgba(249,115,22,0.14)] hover:from-orange-600 hover:to-orange-700",
    footer: "text-zinc-500",
    footerLink: "text-zinc-400 hover:text-zinc-600",
    stickyFabBorder:
      "shadow-[0_6px_20px_rgba(249,115,22,0.18),0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(249,115,22,0.22)]",
    stickyFabInner: "bg-white text-zinc-900",
    stickyFabAccent: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
    stickyFabSub: "text-orange-600/80",
  },
};

/**
 * @param {EarlyOfferTheme} [theme]
 */
export function getEarlyOfferTheme(theme = "dark") {
  return EARLY_OFFER_THEME[theme] ?? EARLY_OFFER_THEME.dark;
}

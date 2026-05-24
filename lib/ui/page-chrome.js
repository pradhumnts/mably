/** Shared layout classes for authenticated app pages (mobile-friendly headers). */

/** Fade-in-up enter animation (matches portal / project dashboard). @param {100 | 150 | 200 | 300} [delayMs] */
export function fadeInUpClass(delayMs) {
  const base =
    "max-md:animate-none max-md:opacity-100 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700";
  const delay =
    delayMs === 100
      ? "delay-100"
      : delayMs === 150
        ? "delay-150"
        : delayMs === 200
          ? "delay-200"
          : delayMs === 300
            ? "delay-300"
            : "";
  return delay ? `${base} ${delay}` : base;
}

export const stickyPageHeaderClass =
  "sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60";

export const stickyPageHeaderInnerClass =
  "mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:h-16 sm:px-6 lg:px-8";

/** Vertical rule between sidebar trigger and breadcrumbs. */
export const pageHeaderNavDividerClass = "mr-2 h-4 self-center";

export const pageContentWrapClass =
  "mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8";

/** Dashboard: full main-column width (no centered max-width cap). */
export const dashboardContentWrapClass =
  "w-full px-4 py-6 sm:px-5 sm:py-8 lg:px-6";

export const dashboardHeaderInnerClass =
  "flex h-14 w-full items-center gap-2 px-4 sm:h-16 sm:px-5 lg:px-6";

export const pageContentNarrowClass =
  "mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:max-w-4xl lg:px-8";

/** Portal dashboard: menu trigger + title on small screens (desktop uses sidebar rail). */
export const portalMobileNavBarClass =
  "sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-black/5 bg-background/80 px-4 backdrop-blur-md md:hidden";

export const libraryToolbarClass =
  "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

export const libraryFiltersClass =
  "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2";

export const libraryFilterSelectTriggerClass = "h-10 w-full sm:w-[180px]";

/** Activity: filter pills in a horizontal row on small screens */
export const activityFilterRowClass =
  "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export const activityToolbarClass =
  "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

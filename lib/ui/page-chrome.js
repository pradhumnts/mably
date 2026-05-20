/** Shared layout classes for authenticated app pages (mobile-friendly headers). */

export const stickyPageHeaderClass =
  "sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60";

export const stickyPageHeaderInnerClass =
  "mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:h-16 sm:px-6 lg:px-8";

export const pageContentWrapClass =
  "mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8";

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

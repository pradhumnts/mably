"use client";

import { usePathname } from "next/navigation";
import { isPathAllowedOnMobile } from "@/lib/mobile/path-access";
import { MobileComingSoon } from "@/components/mobile-coming-soon";
import { cn } from "@/lib/utils";

/**
 * On viewports below md, only whitelisted paths render the app; others show a coming-soon shell.
 * Desktop (md+) is always unrestricted.
 */
export function MobileAccessGate({ children }) {
  const pathname = usePathname();
  const allowed = isPathAllowedOnMobile(pathname);

  return (
    <>
      {!allowed ? (
        <div className="fixed inset-0 z-[9999] flex md:hidden flex-col bg-background">
          <MobileComingSoon />
        </div>
      ) : null}
      <div className={cn(!allowed && "max-md:hidden")}>{children}</div>
    </>
  );
}

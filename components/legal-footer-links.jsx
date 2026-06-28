import { cn } from "@/lib/utils";
import { LEGAL_LINKS } from "@/lib/constants/legal-links";

const linkClass =
  "text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * Minimal Terms · Privacy · Refund row for app host legal links.
 */
export function LegalFooterLinks({ className }) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-end gap-x-4 pr-4 gap-y-1 text-[11px] leading-snug",
        className
      )}
      aria-label="Legal"
    >
      <a href={LEGAL_LINKS.terms} className={linkClass}>
        Terms
      </a>
      <span className="text-border select-none" aria-hidden>
        ·
      </span>
      <a href={LEGAL_LINKS.privacy} className={linkClass}>
        Privacy
      </a>
      <span className="text-border select-none" aria-hidden>
        ·
      </span>
      <a href={LEGAL_LINKS.refund} className={linkClass}>
        Refund
      </a>
    </nav>
  );
}
